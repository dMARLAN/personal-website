"use client";

import { useMemo } from "react";
import type { FieldNode } from "../schema/fields";
import type { JsonValue } from "../schema/jsonSchema";
import { ROOT, type Pointer } from "../schema/pointer";
import type { FieldIssue } from "../schema/validate";
import { FieldRenderer, ObjectFields } from "./FieldRenderer";
import {
  DocumentContext,
  FormContext,
  type FormContextValue,
} from "./FormContext";

function groupIssues(
  issues: readonly FieldIssue[],
): ReadonlyMap<Pointer, readonly string[]> {
  const grouped = new Map<Pointer, string[]>();
  for (const { pointer, message } of issues) {
    const messages = grouped.get(pointer);
    if (messages === undefined) {
      grouped.set(pointer, [message]);
    } else if (!messages.includes(message)) {
      messages.push(message);
    }
  }
  return grouped;
}

/**
 * The form for one section document, generated from its schema (`fields`). It holds no state: `value` is the
 * document and every edit comes back through `onChange` with the field's pointer.
 */
export function SchemaForm({
  idPrefix,
  fields,
  value,
  issues,
  autoUppercase,
  onChange,
}: {
  idPrefix: string;
  fields: FieldNode;
  value: JsonValue;
  issues: readonly FieldIssue[];
  autoUppercase: boolean;
  /** Stable across renders, so unchanged fields skip re-rendering. */
  onChange(pointer: Pointer, value: JsonValue): void;
}): React.JSX.Element {
  // Keyed by content: the issues are recomputed on every edit, but most edits leave them as they were.
  const issueKey = JSON.stringify(issues);
  const grouped = useMemo(() => {
    const parsed: FieldIssue[] = JSON.parse(issueKey);
    return groupIssues(parsed);
  }, [issueKey]);
  const context = useMemo<FormContextValue>(
    () => ({ idPrefix, issues: grouped, onChange, autoUppercase }),
    [idPrefix, grouped, onChange, autoUppercase],
  );
  return (
    <FormContext.Provider value={context}>
      <DocumentContext.Provider value={value}>
        {fields.kind === "object" ? (
          <ObjectFields node={fields} value={value} pointer={ROOT} depth={0} />
        ) : (
          <FieldRenderer
            node={fields}
            value={value}
            pointer={ROOT}
            label={fields.label}
            required
            depth={0}
          />
        )}
      </DocumentContext.Provider>
    </FormContext.Provider>
  );
}
