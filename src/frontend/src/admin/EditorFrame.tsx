"use client";

import { describeIssue } from "./issues";
import type { SectionInfo } from "./sections";
import { livePath } from "./sections";
import type { EditorStatus } from "./useSection";

/** One section's editor: heading, the form, Save, and what happened to the last save. */
export function EditorFrame({
  section,
  status,
  onSave,
  onReload,
  children,
}: {
  section: SectionInfo;
  status: EditorStatus;
  onSave(): void;
  onReload(): void;
  children: React.ReactNode;
}): React.JSX.Element {
  const path = livePath(section);
  return (
    <section aria-labelledby="editor-heading">
      <h2 id="editor-heading">{section.label}</h2>
      <p>
        <a href={path} target="_blank" rel="noreferrer">
          View live: {path}
        </a>
      </p>
      {status.kind === "loading" ? (
        <p>Loading…</p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          {children}
          <p>
            <button type="submit" disabled={status.kind === "saving"}>
              {status.kind === "saving" ? "Saving…" : "Save"}
            </button>
          </p>
        </form>
      )}
      <StatusMessage status={status} path={path} onReload={onReload} />
    </section>
  );
}

function StatusMessage({
  status,
  path,
  onReload,
}: {
  status: EditorStatus;
  path: string;
  onReload(): void;
}): React.JSX.Element | null {
  switch (status.kind) {
    case "loading":
    case "editing":
    case "saving":
      return null;
    case "saved":
      return (
        <div role="status" className="admin-ok">
          <p>Saved at {new Date(status.updatedAt).toLocaleString()}.</p>
          <p>
            {status.revalidation === "done"
              ? `Revalidation: done. ${path} and the homepage show the new content.`
              : "Revalidation: failed. The content is saved, but the site may still show the old version. Save again to retry."}
          </p>
        </div>
      );
    case "conflict":
      return (
        <div role="alert" className="admin-error">
          <p>
            Not saved: this section changed since you loaded it, for example in
            another tab. Your edits are still in the form. Reload to get the
            latest version, then make your edits again.
          </p>
          <button type="button" onClick={onReload}>
            Reload the latest version
          </button>
        </div>
      );
    case "invalid":
      return (
        <div role="alert" className="admin-error">
          <p>Not saved: the site cannot draw this content.</p>
          <ul>
            {status.issues.map((issue, index) => (
              <li key={index}>{describeIssue(issue)}</li>
            ))}
          </ul>
        </div>
      );
    case "failed":
      return (
        <p role="alert" className="admin-error">
          Not saved: {status.message}
        </p>
      );
  }
}
