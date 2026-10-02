"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  getSection,
  putSection,
  type SectionId,
  type ValidationIssue,
} from "./api";
import {
  consoleReducer,
  isDirty,
  type LiveCopy,
  type SectionEdit,
  type Sections,
} from "./consoleState";
import { deleteDraft, listDrafts, putDraft } from "./drafts";
import type { JsonValue } from "./schema/jsonSchema";
import { jsonEqual, type Pointer } from "./schema/pointer";
import { locToPointer } from "./schema/serverIssues";
import { sectionModel } from "./schema/sectionModel";
import { SECTIONS, livePath, sectionInfo } from "./sections";
import { readStash, writeStash, type Stash } from "./stash";

export interface Session {
  csrfToken: string;
  /** Called on a 401: the session is gone, so the app shows the sign-in form. Unsaved edits stay stashed. */
  onSignedOut(): void;
}

export type LoadState =
  { kind: "loading" } | { kind: "ready" } | { kind: "failed"; message: string };

export interface ConsoleApi {
  load: LoadState;
  sections: Sections;
  /** Replaces the whole document (the JSON editor). Stable across renders. */
  edit(section: SectionId, value: JsonValue): void;
  /** Replaces one field (the form). Stable across renders. */
  editField(section: SectionId, pointer: Pointer, value: JsonValue): void;
  saveDraft(section: SectionId): Promise<void>;
  /** Publishes with the loaded ETag; `overwrite` uses the conflicting copy's, to replace what someone else published. */
  publish(section: SectionId, options?: { overwrite: boolean }): Promise<void>;
  discardChanges(section: SectionId): void;
  discardDraft(section: SectionId): Promise<void>;
  dismissConflict(section: SectionId): void;
  takeTheirs(section: SectionId): void;
  /** Shows the sign-in form, as a 401 does: the preview found the session gone. */
  showSignIn(): void;
}

/** The API's documents as JSON: its response models are the schema the editor's model is built from. */
function asJson(document: unknown): JsonValue {
  return document as JsonValue;
}

function toLive(state: {
  document: unknown;
  etag: string;
  updatedAt: string;
}): LiveCopy {
  return {
    document: asJson(state.document),
    etag: state.etag,
    updatedAt: state.updatedAt,
  };
}

/** The console's sections: loads every one, then saves drafts and publishes them (docs/design.md section 13.8). */
export function useConsole(session: Session): ConsoleApi {
  const [sections, dispatch] = useReducer(consoleReducer, {});
  const [load, setLoad] = useState<LoadState>({ kind: "loading" });
  const latest = useRef(sections);
  useEffect(() => {
    latest.current = sections;
  }, [sections]);
  const { csrfToken, onSignedOut } = session;

  useEffect(() => {
    let cancelled = false;
    async function loadAll(): Promise<void> {
      const [drafts, ...states] = await Promise.all([
        listDrafts(),
        ...SECTIONS.map(({ id }) => getSection(id)),
      ]);
      if (cancelled) {
        return;
      }
      const results = [drafts, ...states];
      if (results.some((result) => result.kind === "signed-out")) {
        onSignedOut();
        return;
      }
      const failure = results.find((result) => result.kind !== "ok");
      if (failure !== undefined || drafts.kind !== "ok") {
        setLoad({
          kind: "failed",
          message:
            failure?.kind === "failed"
              ? failure.message
              : `the API answered ${failure?.kind}.`,
        });
        return;
      }
      const stash: Stash = readStash();
      const restored: string[] = [];
      SECTIONS.forEach(({ id, label }, index) => {
        const state = states[index];
        if (state.kind !== "ok") {
          throw new Error(`GET ${id} answered ${state.kind}`);
        }
        const stored = drafts.data[id];
        const draft =
          stored === undefined
            ? null
            : { content: asJson(stored.content), updatedAt: stored.updatedAt };
        const stashed = stash[id] ?? null;
        if (
          stashed !== null &&
          !jsonEqual(stashed, draft?.content ?? asJson(state.data.document))
        ) {
          restored.push(label);
        }
        dispatch({
          type: "loaded",
          section: id,
          live: toLive(state.data),
          draft,
          stashed,
        });
      });
      setLoad({ kind: "ready" });
      if (restored.length > 0) {
        toast.info(`Restored unsaved edits: ${restored.join(", ")}.`);
      }
    }
    void loadAll();
    return () => {
      cancelled = true;
    };
  }, [onSignedOut]);

  // Mirror unsaved edits to localStorage once loaded, so no stash is overwritten before it was restored.
  useEffect(() => {
    if (load.kind !== "ready") {
      return;
    }
    const stash: Stash = {};
    for (const { id } of SECTIONS) {
      const edit = sections[id];
      if (edit !== undefined && isDirty(edit)) {
        stash[id] = edit.value;
      }
    }
    writeStash(stash);
  }, [sections, load.kind]);

  const current = useCallback((section: SectionId): SectionEdit => {
    const edit = latest.current[section];
    if (edit === undefined) {
      throw new Error(`${section} is not loaded`);
    }
    return edit;
  }, []);

  const refuse = useCallback(
    (
      section: SectionId,
      issues: readonly ValidationIssue[],
      quiet: boolean,
    ) => {
      const fields = sectionModel(section).fields;
      dispatch({
        type: "refused",
        section,
        issues: issues.map((issue) => ({
          pointer: locToPointer(fields, issue.loc),
          message: issue.msg,
        })),
      });
      if (quiet) {
        return;
      }
      const count = `${issues.length} ${issues.length === 1 ? "problem" : "problems"}`;
      toast.error(
        `${sectionInfo(section).label}: not saved, the API found ${count}.`,
      );
    },
    [],
  );

  const fail = useCallback((section: SectionId, message: string) => {
    dispatch({ type: "busy", section, busy: null });
    toast.error(`${sectionInfo(section).label}: ${message}`);
  }, []);

  /** Save draft (`quiet` false) and autosave (`quiet` true): the same PUT, but an autosave reports only in the preview. */
  const storeDraft = useCallback(
    async (section: SectionId, quiet: boolean) => {
      const sent = current(section).value;
      dispatch({ type: "busy", section, busy: quiet ? "autosave" : "draft" });
      const result = await putDraft(section, sent, csrfToken);
      switch (result.kind) {
        case "ok":
          dispatch({
            type: "draft-saved",
            section,
            content: sent,
            updatedAt: result.data.updatedAt,
          });
          if (!quiet) {
            toast.success(`${sectionInfo(section).label}: draft saved.`);
          }
          return;
        case "signed-out":
          onSignedOut();
          return;
        case "invalid":
          refuse(section, result.issues, quiet);
          return;
        case "conflict":
        case "failed": {
          const message =
            result.kind === "failed"
              ? result.message
              : "the API answered 412 to a draft save.";
          if (quiet) {
            dispatch({ type: "autosave-failed", section, message });
          } else {
            fail(section, message);
          }
          return;
        }
      }
    },
    [csrfToken, current, fail, onSignedOut, refuse],
  );

  const saveDraft = useCallback(
    (section: SectionId) => storeDraft(section, false),
    [storeDraft],
  );

  useAutosave(load.kind === "ready" ? sections : null, current, storeDraft);

  const publish = useCallback(
    async (section: SectionId, options?: { overwrite: boolean }) => {
      const edit = current(section);
      const etag =
        options?.overwrite === true && edit.conflict !== null
          ? edit.conflict.etag
          : edit.live.etag;
      const sent = edit.value;
      dispatch({ type: "busy", section, busy: "publish" });
      const result = await putSection(section, sent, etag, csrfToken);
      const label = sectionInfo(section).label;
      switch (result.kind) {
        case "ok":
          dispatch({
            type: "published",
            section,
            sent,
            live: toLive(result.data),
            revalidation: result.data.revalidation,
          });
          if (result.data.revalidation === "done") {
            toast.success(
              `${label} published. ${livePath(sectionInfo(section))} shows it.`,
            );
          } else {
            toast.warning(
              `${label} published, but revalidation failed: publish again to retry.`,
            );
          }
          return;
        case "signed-out":
          onSignedOut();
          return;
        case "invalid":
          refuse(section, result.issues, false);
          return;
        case "conflict": {
          const theirs = await getSection(section);
          if (theirs.kind !== "ok") {
            fail(
              section,
              "this section changed since you loaded it, and loading the new version failed.",
            );
            return;
          }
          dispatch({ type: "conflict", section, theirs: toLive(theirs.data) });
          return;
        }
        case "failed":
          fail(section, result.message);
          return;
      }
    },
    [csrfToken, current, fail, onSignedOut, refuse],
  );

  const discardDraft = useCallback(
    async (section: SectionId) => {
      dispatch({ type: "busy", section, busy: "discard-draft" });
      const result = await deleteDraft(section, csrfToken);
      switch (result.kind) {
        case "ok":
          dispatch({ type: "draft-discarded", section });
          toast.success(`${sectionInfo(section).label}: draft discarded.`);
          return;
        case "signed-out":
          onSignedOut();
          return;
        case "failed":
          fail(section, result.message);
          return;
        case "conflict":
        case "invalid":
          fail(section, `the API answered ${result.kind}.`);
          return;
      }
    },
    [csrfToken, fail, onSignedOut],
  );

  const edit = useCallback(
    (section: SectionId, value: JsonValue) =>
      dispatch({ type: "edited", section, value }),
    [],
  );
  const editField = useCallback(
    (section: SectionId, pointer: Pointer, value: JsonValue) =>
      dispatch({ type: "field-edited", section, pointer, value }),
    [],
  );
  const discardChanges = useCallback(
    (section: SectionId) => dispatch({ type: "changes-discarded", section }),
    [],
  );
  const dismissConflict = useCallback(
    (section: SectionId) => dispatch({ type: "conflict-dismissed", section }),
    [],
  );
  const takeTheirs = useCallback(
    (section: SectionId) => dispatch({ type: "took-theirs", section }),
    [],
  );

  return useMemo(
    () => ({
      load,
      sections,
      edit,
      editField,
      saveDraft,
      publish,
      discardChanges,
      discardDraft,
      dismissConflict,
      takeTheirs,
      showSignIn: onSignedOut,
    }),
    [
      onSignedOut,
      load,
      sections,
      edit,
      editField,
      saveDraft,
      publish,
      discardChanges,
      discardDraft,
      dismissConflict,
      takeTheirs,
    ],
  );
}

/** How long the editor waits after the last edit before it saves the draft the preview shows. */
const AUTOSAVE_DELAY_MS = 600;

/**
 * Autosave (docs/design.md section 13.8): each edit restarts a section's timer; when it fires, a document that differs
 * from the stored one and passes the client check is saved as the draft, quietly. The value a section loaded with, a
 * restored stash included, is not an edit: it waits for the next one. A section busy with another request is tried
 * again after the delay; one with an open conflict is left alone. A refused or failed autosave is not retried until the
 * next edit.
 */
function useAutosave(
  sections: Sections | null,
  current: (section: SectionId) => SectionEdit,
  storeDraft: (section: SectionId, quiet: boolean) => Promise<void>,
): void {
  const seen = useRef(new Map<SectionId, JsonValue>());
  const timers = useRef(new Map<SectionId, number>());

  const arm = useCallback(
    (section: SectionId) => {
      function schedule(): void {
        window.clearTimeout(timers.current.get(section));
        timers.current.set(section, window.setTimeout(fire, AUTOSAVE_DELAY_MS));
      }
      function fire(): void {
        timers.current.delete(section);
        const edit = current(section);
        if (!isDirty(edit) || edit.conflict !== null) {
          return;
        }
        if (edit.busy !== null) {
          schedule();
          return;
        }
        if (sectionModel(section).validate(edit.value).length > 0) {
          return;
        }
        void storeDraft(section, true);
      }
      schedule();
    },
    [current, storeDraft],
  );

  useEffect(() => {
    if (sections === null) {
      return;
    }
    for (const { id } of SECTIONS) {
      const edit = sections[id];
      if (edit === undefined) {
        continue;
      }
      const previous = seen.current.get(id);
      seen.current.set(id, edit.value);
      if (previous !== undefined && previous !== edit.value) {
        arm(id);
      }
    }
  }, [sections, arm]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) {
        window.clearTimeout(timer);
      }
    };
  }, []);
}
