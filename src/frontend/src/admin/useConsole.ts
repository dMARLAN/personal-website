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
    (section: SectionId, issues: readonly ValidationIssue[]) => {
      const fields = sectionModel(section).fields;
      dispatch({
        type: "refused",
        section,
        issues: issues.map((issue) => ({
          pointer: locToPointer(fields, issue.loc),
          message: issue.msg,
        })),
      });
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

  const saveDraft = useCallback(
    async (section: SectionId) => {
      const sent = current(section).value;
      dispatch({ type: "busy", section, busy: "draft" });
      const result = await putDraft(section, sent, csrfToken);
      switch (result.kind) {
        case "ok":
          dispatch({
            type: "draft-saved",
            section,
            content: sent,
            updatedAt: result.data.updatedAt,
          });
          toast.success(`${sectionInfo(section).label}: draft saved.`);
          return;
        case "signed-out":
          onSignedOut();
          return;
        case "invalid":
          refuse(section, result.issues);
          return;
        case "conflict":
          fail(section, "the API answered 412 to a draft save.");
          return;
        case "failed":
          fail(section, result.message);
          return;
      }
    },
    [csrfToken, current, fail, onSignedOut, refuse],
  );

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
          refuse(section, result.issues);
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
    }),
    [
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
