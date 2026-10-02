"use client";

import type { SectionDocuments, ValidationIssue } from "./api";
import { RowIssues, TextField, withItem } from "./fields";

type Contact = SectionDocuments["contact"];

/** Contact → MIDS: the email row, then three label/value rows (≤ 46 together). */
export function ContactForm({
  contact,
  onChange,
  issues,
}: {
  contact: Contact;
  onChange(contact: Contact): void;
  issues: readonly ValidationIssue[];
}): React.JSX.Element {
  return (
    <>
      <TextField
        label="Email"
        type="email"
        value={contact.email}
        onChange={(email) => onChange({ ...contact, email })}
        issues={issues}
        path={["email"]}
      />
      <fieldset>
        <legend>Rows</legend>
        {contact.rows.map((row, index) => (
          <div key={index} className="admin-row">
            <TextField
              label={`Row ${index + 1} label`}
              value={row.label}
              onChange={(label) =>
                onChange({
                  ...contact,
                  rows: withItem(contact.rows, index, { ...row, label }),
                })
              }
              issues={issues}
              path={["rows", index, "label"]}
            />
            <TextField
              label={`Row ${index + 1} value`}
              value={row.value}
              onChange={(value) =>
                onChange({
                  ...contact,
                  rows: withItem(contact.rows, index, { ...row, value }),
                })
              }
              issues={issues}
              path={["rows", index, "value"]}
            />
            <RowIssues issues={issues} path={["rows", index]} />
          </div>
        ))}
      </fieldset>
    </>
  );
}
