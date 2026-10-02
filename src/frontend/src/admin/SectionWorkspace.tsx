"use client";

import type { EditorView } from "@codemirror/view";
import {
  AlertCircleIcon,
  ExternalLinkIcon,
  Loader2Icon,
  WandSparklesIcon,
} from "lucide-react";
import { useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ConflictDialog } from "./ConflictDialog";
import { isDirty, visibleServerIssues, type SectionEdit } from "./consoleState";
import { fieldId } from "./form/FormContext";
import { SchemaForm } from "./form/SchemaForm";
import { formatEditor, JsonEditor } from "./json/JsonEditor";
import { PreviewPanel } from "./preview/PreviewPanel";
import type { JsonValue } from "./schema/jsonSchema";
import { jsonEqual, type Pointer } from "./schema/pointer";
import { sectionModel } from "./schema/sectionModel";
import { describePointer } from "./schema/serverIssues";
import type { FieldIssue } from "./schema/validate";
import { livePath, type SectionInfo } from "./sections";
import type { ConsoleApi } from "./useConsole";

export type EditorMode = "form" | "json";

const MAX_LISTED_ISSUES = 8;

function time(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** "⌘" on Apple platforms, "Ctrl" elsewhere, for the shortcut hints. */
function modifierKey(): string {
  return typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform)
    ? "⌘"
    : "Ctrl";
}

/** What the editor knows about one section's document right now. */
export interface SectionStatus {
  dirty: boolean;
  canSaveDraft: boolean;
  canPublish: boolean;
}

export function sectionStatus(edit: SectionEdit): SectionStatus {
  const dirty = isDirty(edit);
  return {
    dirty,
    canSaveDraft: dirty && edit.busy === null,
    canPublish:
      !jsonEqual(edit.value, edit.live.document) && edit.busy === null,
  };
}

/** One section: the sticky action bar, the form (or the JSON editor) and the preview slot, side by side. */
export function SectionWorkspace({
  section,
  edit,
  console: api,
  mode,
  onMode,
  autoUppercase,
}: {
  section: SectionInfo;
  edit: SectionEdit;
  console: ConsoleApi;
  mode: EditorMode;
  onMode(mode: EditorMode): void;
  autoUppercase: boolean;
}): React.JSX.Element {
  const model = sectionModel(section.id);
  const path = livePath(section);
  const idPrefix = `field-${section.id}`;
  const status = sectionStatus(edit);
  const jsonView = useRef<EditorView | null>(null);

  const clientIssues = useMemo(
    () => model.validate(edit.value),
    [model, edit.value],
  );
  const issues: FieldIssue[] = useMemo(() => {
    const clientPointers = new Set(clientIssues.map((issue) => issue.pointer));
    return [...clientIssues, ...visibleServerIssues(edit, clientPointers)];
  }, [clientIssues, edit]);

  const { edit: setDocument, editField } = api;
  const onFieldChange = useCallback(
    (pointer: Pointer, next: JsonValue) => editField(section.id, pointer, next),
    [editField, section.id],
  );
  const onJsonChange = useCallback(
    (next: JsonValue) => setDocument(section.id, next),
    [setDocument, section.id],
  );

  const focusIssue = (pointer: Pointer): void => {
    const target = document.getElementById(fieldId(idPrefix, pointer));
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
    target?.focus({ preventScroll: true });
  };

  const mod = modifierKey();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="sticky top-0 z-20 flex min-h-14 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b bg-background/95 px-5 py-2 backdrop-blur">
        <div className="mr-auto flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">
              {section.label}
            </h2>
            {edit.draftSavedAt === null ? null : (
              <Badge
                variant="outline"
                className="border-sky-600/40 text-sky-700 dark:border-sky-400/40 dark:text-sky-300"
              >
                Draft — not published
              </Badge>
            )}
            {status.dirty ? (
              <Badge
                variant="outline"
                className="border-amber-600/40 text-amber-700 dark:border-amber-400/40 dark:text-amber-300"
              >
                Unsaved changes
              </Badge>
            ) : null}
          </div>
          <StatusLine edit={edit} path={path} />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id={`${idPrefix}-json-mode`}
            size="sm"
            checked={mode === "json"}
            onCheckedChange={(checked) => onMode(checked ? "json" : "form")}
          />
          <Label
            htmlFor={`${idPrefix}-json-mode`}
            className="text-xs text-muted-foreground"
          >
            Advanced: JSON
          </Label>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <a href={path} target="_blank" rel="noreferrer">
            View live
            <ExternalLinkIcon aria-hidden />
            <span className="sr-only">{path} (opens in a new tab)</span>
          </a>
        </Button>
        <div className="flex items-center gap-2 border-l pl-4">
          {edit.draftSavedAt === null ? null : (
            <Button
              variant="ghost"
              size="sm"
              disabled={edit.busy !== null}
              onClick={() => void api.discardDraft(section.id)}
            >
              Discard draft
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={!status.dirty || edit.busy !== null}
            onClick={() => {
              api.discardChanges(section.id);
              toast(`${section.label}: changes discarded.`);
            }}
          >
            Discard changes
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!status.canSaveDraft}
            onClick={() => void api.saveDraft(section.id)}
          >
            {edit.busy === "draft" ? (
              <Loader2Icon aria-hidden className="animate-spin" />
            ) : null}
            Save draft
            <Kbd aria-hidden className="ml-0.5">
              {mod === "⌘" ? "⌘S" : "Ctrl S"}
            </Kbd>
          </Button>
          <Button
            size="sm"
            disabled={!status.canPublish}
            onClick={() => void api.publish(section.id)}
          >
            {edit.busy === "publish" ? (
              <Loader2Icon aria-hidden className="animate-spin" />
            ) : null}
            Publish
            <Kbd
              aria-hidden
              className="ml-0.5 bg-primary-foreground/15 text-primary-foreground"
            >
              {mod === "⌘" ? "⌘↵" : "Ctrl ↵"}
            </Kbd>
          </Button>
        </div>
      </header>
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel id="editor" defaultSize="62" minSize="35">
          <div className="flex h-full min-h-0 flex-col">
            {issues.length === 0 ? null : (
              <IssueSummary
                issues={issues}
                describe={(pointer) => describePointer(model.fields, pointer)}
                onPick={mode === "form" ? focusIssue : null}
              />
            )}
            {mode === "form" ? (
              <div
                className="min-h-0 flex-1 overflow-y-auto"
                data-editor-scroll
              >
                <form
                  aria-label={`${section.label} content`}
                  className="mx-auto flex max-w-4xl flex-col gap-4 p-5 pb-24"
                  noValidate
                  onSubmit={(event) => event.preventDefault()}
                >
                  <SchemaForm
                    idPrefix={idPrefix}
                    fields={model.fields}
                    value={edit.value}
                    issues={issues}
                    autoUppercase={autoUppercase}
                    onChange={onFieldChange}
                  />
                </form>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex h-9 shrink-0 items-center justify-between border-b bg-muted/40 px-3 text-xs text-muted-foreground">
                  <span>
                    The whole document. Valid JSON updates the form; schema
                    problems are marked in the gutter.
                  </span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      if (
                        jsonView.current !== null &&
                        !formatEditor(jsonView.current)
                      ) {
                        toast.error(
                          "The JSON does not parse, so it cannot be formatted.",
                        );
                      }
                    }}
                  >
                    <WandSparklesIcon aria-hidden />
                    Format
                  </Button>
                </div>
                <div className="min-h-0 flex-1">
                  <JsonEditor
                    key={section.id}
                    label={`${section.label} JSON`}
                    value={edit.value}
                    issues={issues}
                    onChange={onJsonChange}
                    onView={(view) => {
                      jsonView.current = view;
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize the preview" />
        <ResizablePanel id="preview" defaultSize="38" minSize="20">
          <PreviewPanel
            section={section.id}
            draft={edit.value}
            valid={clientIssues.length === 0}
            livePath={path}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      {edit.conflict === null ? null : (
        <ConflictDialog
          label={section.label}
          fields={model.fields}
          theirs={edit.conflict}
          mine={edit.value}
          busy={edit.busy !== null}
          onKeepEditing={() => api.dismissConflict(section.id)}
          onTakeTheirs={() => api.takeTheirs(section.id)}
          onOverwrite={() => void api.publish(section.id, { overwrite: true })}
        />
      )}
    </div>
  );
}

function StatusLine({
  edit,
  path,
}: {
  edit: SectionEdit;
  path: string;
}): React.JSX.Element {
  if (edit.lastPublish !== null) {
    const done = edit.lastPublish.revalidation === "done";
    return (
      <p
        role="status"
        className={cn(
          "text-xs",
          done
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-amber-700 dark:text-amber-400",
        )}
      >
        Published {time(edit.lastPublish.updatedAt)} ·{" "}
        {done
          ? `Revalidation: done. ${path} and the homepage show it.`
          : "Revalidation: failed. The site may show the old version; publish again to retry."}
      </p>
    );
  }
  return (
    <p role="status" className="text-xs text-muted-foreground">
      {edit.draftSavedAt === null
        ? `Live since ${time(edit.live.updatedAt)}`
        : `Draft saved ${time(edit.draftSavedAt)} · live since ${time(edit.live.updatedAt)}`}
    </p>
  );
}

function IssueSummary({
  issues,
  describe,
  onPick,
}: {
  issues: readonly FieldIssue[];
  describe(pointer: Pointer): string;
  /** Moves to the field; null in JSON mode, where the gutter marks it. */
  onPick: ((pointer: Pointer) => void) | null;
}): React.JSX.Element {
  return (
    <div
      role="alert"
      className="shrink-0 border-b border-destructive/30 bg-destructive/5 px-5 py-2.5 text-xs"
    >
      <p className="flex items-center gap-1.5 font-medium text-destructive">
        <AlertCircleIcon aria-hidden className="size-3.5" />
        {issues.length} {issues.length === 1 ? "problem" : "problems"}: the
        glass cannot draw this as it stands.
      </p>
      <ul className="mt-1 flex flex-col gap-0.5 pl-5">
        {issues.slice(0, MAX_LISTED_ISSUES).map((issue) => (
          <li key={`${issue.pointer}\n${issue.message}`}>
            {onPick === null ? (
              <span className="font-medium">{describe(issue.pointer)}</span>
            ) : (
              <button
                type="button"
                className="font-medium underline-offset-2 hover:underline"
                onClick={() => onPick(issue.pointer)}
              >
                {describe(issue.pointer)}
              </button>
            )}
            : <span className="text-muted-foreground">{issue.message}</span>
          </li>
        ))}
        {issues.length > MAX_LISTED_ISSUES ? (
          <li className="text-muted-foreground">
            and {issues.length - MAX_LISTED_ISSUES} more.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
