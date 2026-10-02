"use client";

import { useId } from "react";
import type { ValidationIssue } from "./api";
import { issuesAt, type FieldPath } from "./issues";

/** A labelled text input or textarea with the API's messages for its field. */
export function TextField({
  label,
  value,
  onChange,
  issues,
  path,
  multiline = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  issues: readonly ValidationIssue[];
  path: FieldPath;
  multiline?: boolean;
  type?: "text" | "email" | "url";
}): React.JSX.Element {
  const id = useId();
  const messages = issuesAt(issues, path);
  const invalid = messages.length > 0;
  const control = {
    id,
    value,
    "aria-invalid": invalid,
    "aria-describedby": invalid ? `${id}-error` : undefined,
  };
  return (
    <div className="admin-field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea
          {...control}
          rows={5}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          {...control}
          type={type}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {invalid ? (
        <span id={`${id}-error`} className="admin-field-error">
          {messages.join(" ")}
        </span>
      ) : null}
    </div>
  );
}

/** Messages for a whole row, such as a label and value that together are too long. */
export function RowIssues({
  issues,
  path,
}: {
  issues: readonly ValidationIssue[];
  path: FieldPath;
}): React.JSX.Element | null {
  const messages = issuesAt(issues, path);
  return messages.length === 0 ? null : (
    <p className="admin-field-error">{messages.join(" ")}</p>
  );
}

/** A copy of `items` with `item` at `index`. Unlike `map`, it keeps a fixed-length tuple's type. */
export function withItem<T extends unknown[]>(
  items: T,
  index: number,
  item: T[number],
): T {
  const copy = structuredClone(items);
  copy[index] = item;
  return copy;
}
