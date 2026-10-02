import type { Revalidation, SectionId } from "./api";
import type { JsonValue } from "./schema/jsonSchema";
import { getAt, jsonEqual, setAt, type Pointer } from "./schema/pointer";
import type { FieldIssue } from "./schema/validate";

/** The published copy of a section, with the ETag a publish must send as If-Match. */
export interface LiveCopy {
  document: JsonValue;
  etag: string;
  updatedAt: string;
}

/** A 422 message from the API, shown while the field still holds the value it was about. */
export interface ServerIssue extends FieldIssue {
  valueAt: JsonValue | undefined;
}

export type Busy = "draft" | "publish" | "discard-draft";

export interface SectionEdit {
  live: LiveCopy;
  /** When the stored draft was saved; null when the section has none. */
  draftSavedAt: string | null;
  /** What "unsaved" compares against: the stored draft, else the live copy. */
  baseline: JsonValue;
  /** The document being edited. */
  value: JsonValue;
  serverIssues: readonly ServerIssue[];
  busy: Busy | null;
  lastPublish: { updatedAt: string; revalidation: Revalidation } | null;
  /** A publish was refused (412): the copy someone else published since this one loaded. */
  conflict: LiveCopy | null;
}

export type Sections = Partial<Record<SectionId, SectionEdit>>;

export type ConsoleAction =
  | {
      type: "loaded";
      section: SectionId;
      live: LiveCopy;
      draft: { content: JsonValue; updatedAt: string } | null;
      stashed: JsonValue | null;
    }
  | { type: "edited"; section: SectionId; value: JsonValue }
  | {
      type: "field-edited";
      section: SectionId;
      pointer: Pointer;
      value: JsonValue;
    }
  | { type: "busy"; section: SectionId; busy: Busy | null }
  | {
      type: "draft-saved";
      section: SectionId;
      content: JsonValue;
      updatedAt: string;
    }
  | {
      type: "published";
      section: SectionId;
      sent: JsonValue;
      live: LiveCopy;
      revalidation: Revalidation;
    }
  | { type: "refused"; section: SectionId; issues: readonly FieldIssue[] }
  | { type: "conflict"; section: SectionId; theirs: LiveCopy }
  | { type: "conflict-dismissed"; section: SectionId }
  | { type: "took-theirs"; section: SectionId }
  | { type: "changes-discarded"; section: SectionId }
  | { type: "draft-discarded"; section: SectionId };

export function isDirty(edit: SectionEdit): boolean {
  return !jsonEqual(edit.value, edit.baseline);
}

function update(
  sections: Sections,
  section: SectionId,
  change: (edit: SectionEdit) => SectionEdit,
): Sections {
  const edit = sections[section];
  if (edit === undefined) {
    throw new Error(`${section} changed before it loaded`);
  }
  return { ...sections, [section]: change(edit) };
}

export function consoleReducer(
  sections: Sections,
  action: ConsoleAction,
): Sections {
  switch (action.type) {
    case "loaded": {
      const baseline = action.draft?.content ?? action.live.document;
      return {
        ...sections,
        [action.section]: {
          live: action.live,
          draftSavedAt: action.draft?.updatedAt ?? null,
          baseline,
          value: action.stashed ?? baseline,
          serverIssues: [],
          busy: null,
          lastPublish: null,
          conflict: null,
        },
      };
    }
    case "edited":
      return update(sections, action.section, (edit) => ({
        ...edit,
        value: action.value,
      }));
    case "field-edited":
      return update(sections, action.section, (edit) => ({
        ...edit,
        value: setAt(edit.value, action.pointer, action.value),
      }));
    case "busy":
      return update(sections, action.section, (edit) => ({
        ...edit,
        busy: action.busy,
      }));
    case "draft-saved":
      return update(sections, action.section, (edit) => ({
        ...edit,
        draftSavedAt: action.updatedAt,
        baseline: action.content,
        serverIssues: [],
        busy: null,
      }));
    case "published":
      return update(sections, action.section, (edit) => ({
        ...edit,
        live: action.live,
        draftSavedAt: null,
        baseline: action.live.document,
        // Edits typed while the publish was in flight stay; otherwise the editor shows what the API stored.
        value: jsonEqual(edit.value, action.sent)
          ? action.live.document
          : edit.value,
        serverIssues: [],
        busy: null,
        lastPublish: {
          updatedAt: action.live.updatedAt,
          revalidation: action.revalidation,
        },
        conflict: null,
      }));
    case "refused":
      return update(sections, action.section, (edit) => ({
        ...edit,
        busy: null,
        serverIssues: action.issues.map((issue) => ({
          ...issue,
          valueAt: getAt(edit.value, issue.pointer),
        })),
      }));
    case "conflict":
      return update(sections, action.section, (edit) => ({
        ...edit,
        busy: null,
        conflict: action.theirs,
      }));
    case "conflict-dismissed":
      return update(sections, action.section, (edit) => ({
        ...edit,
        conflict: null,
      }));
    case "took-theirs":
      return update(sections, action.section, (edit) => {
        if (edit.conflict === null) {
          throw new Error(`${action.section} has no conflict to resolve`);
        }
        return {
          ...edit,
          live: edit.conflict,
          baseline: edit.conflict.document,
          value: edit.conflict.document,
          draftSavedAt: null,
          serverIssues: [],
          conflict: null,
        };
      });
    case "changes-discarded":
      return update(sections, action.section, (edit) => ({
        ...edit,
        value: edit.baseline,
        serverIssues: [],
      }));
    case "draft-discarded":
      return update(sections, action.section, (edit) => ({
        ...edit,
        draftSavedAt: null,
        baseline: edit.live.document,
        value: edit.live.document,
        serverIssues: [],
        busy: null,
      }));
  }
}

/** The API's messages that still apply: a field's message goes once its value changes, or the client has one. */
export function visibleServerIssues(
  edit: SectionEdit,
  clientPointers: ReadonlySet<Pointer>,
): FieldIssue[] {
  return edit.serverIssues
    .filter(
      (issue) =>
        !clientPointers.has(issue.pointer) &&
        jsonEqual(getAt(edit.value, issue.pointer), issue.valueAt),
    )
    .map(({ pointer, message }) => ({ pointer, message }));
}
