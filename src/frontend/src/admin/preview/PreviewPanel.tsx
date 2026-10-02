"use client";

import { MonitorIcon } from "lucide-react";
import type { SectionId } from "../api";
import type { JsonValue } from "../schema/jsonSchema";

/**
 * THE PREVIEW SLOT (docs/design.md section 13.8). The editor renders this in the right-hand pane of its resizable
 * split and re-renders it on every edit. It is a placeholder: the live preview replaces this component's body and
 * keeps its props.
 */
export interface PreviewPanelProps {
  /** The section being edited. */
  section: SectionId;
  /**
   * The document as it stands in the editor, saved or not, on every keystroke. It may fail validation (the form shows
   * the messages): typed as JSON, not as `SectionDocuments[section]`, because the JSON editor can produce any shape.
   */
  draft: JsonValue;
  /** True when `draft` passes the client's schema check, so a preview may render it as content. */
  valid: boolean;
  /** The public page that shows the section, such as "/about". */
  livePath: string;
}

export function PreviewPanel({
  livePath,
}: PreviewPanelProps): React.JSX.Element {
  return (
    <section
      aria-labelledby="preview-heading"
      className="flex h-full flex-col bg-muted/40"
      data-preview-slot
    >
      <div className="flex h-11 shrink-0 items-center border-b px-4">
        <h2 id="preview-heading" className="text-sm font-medium">
          Preview
        </h2>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex size-10 items-center justify-center rounded-full border bg-background">
          <MonitorIcon aria-hidden className="size-5 text-muted-foreground" />
        </div>
        <p className="max-w-64 text-sm text-muted-foreground">
          A live preview of{" "}
          <span className="font-mono text-foreground">{livePath}</span> will
          show here as you edit.
        </p>
      </div>
    </section>
  );
}
