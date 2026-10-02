"use client";

import { createContext, useContext, useState } from "react";
import type { JsonValue } from "../schema/jsonSchema";
import { isWithin, type Pointer } from "../schema/pointer";

export interface FormContextValue {
  /** Prefixes every control's DOM id, so two forms on one page cannot collide. */
  idPrefix: string;
  /** Messages per field, client- and server-side. */
  issues: ReadonlyMap<Pointer, readonly string[]>;
  /** Replaces the value at `pointer`. Stable, so memoised fields skip re-rendering. */
  onChange(pointer: Pointer, value: JsonValue): void;
  /** Upper-case what is typed into fields limited to the DDI's glyphs. */
  autoUppercase: boolean;
}

export const FormContext = createContext<FormContextValue | null>(null);

export function useForm(): FormContextValue {
  const context = useContext(FormContext);
  if (context === null) {
    throw new Error("a form field rendered outside SchemaForm");
  }
  return context;
}

/**
 * The whole document, for fields whose options come from elsewhere in it (`x-ui-options-from`). A context of its
 * own, as it changes on every edit: only those fields re-render with it.
 */
export const DocumentContext = createContext<JsonValue | null>(null);

export function useDocument(): JsonValue {
  const document = useContext(DocumentContext);
  if (document === null) {
    throw new Error("a form field rendered outside SchemaForm");
  }
  return document;
}

export function fieldId(idPrefix: string, pointer: Pointer): string {
  return `${idPrefix}${pointer.replaceAll("/", ".")}`;
}

/** How many messages sit on or inside `pointer`, for a collapsed group's badge. */
export function issueCountWithin(
  issues: ReadonlyMap<Pointer, readonly string[]>,
  pointer: Pointer,
): number {
  let count = 0;
  for (const [at, messages] of issues) {
    if (isWithin(at, pointer)) {
      count += messages.length;
    }
  }
  return count;
}

/** A collapsible group's open state: it opens itself when a message appears inside it, so no message is hidden. */
export function useOpenOnIssues(
  defaultOpen: boolean,
  issueCount: number,
): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(defaultOpen || issueCount > 0);
  const [hadIssues, setHadIssues] = useState(issueCount > 0);
  if (issueCount > 0 !== hadIssues) {
    setHadIssues(issueCount > 0);
    if (issueCount > 0) {
      setOpen(true);
    }
  }
  return [open, setOpen];
}
