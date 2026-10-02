"use client";

import { useId, useState } from "react";
import { uploadResume, type SavedResume } from "./api";
import type { Session } from "./useSection";

const RESUME_PDF_PATH = "/api/resume.pdf";

type UploadStatus =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "uploaded"; saved: SavedResume }
  | { kind: "failed"; message: string };

/** Replaces the résumé PDF that every PDF link on the site downloads. */
export function ResumeUpload({
  session,
}: {
  session: Session;
}): React.JSX.Element {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>({ kind: "idle" });

  async function upload(chosen: File): Promise<void> {
    setStatus({ kind: "uploading" });
    const result = await uploadResume(chosen, session.csrfToken);
    switch (result.kind) {
      case "ok":
        setStatus({ kind: "uploaded", saved: result.data });
        return;
      case "signed-out":
        session.onSignedOut();
        return;
      case "conflict":
      case "invalid":
        setStatus({
          kind: "failed",
          message: `the API answered ${result.kind}.`,
        });
        return;
      case "failed":
        setStatus({ kind: "failed", message: result.message });
        return;
    }
  }

  return (
    <section aria-labelledby="resume-pdf-heading">
      <h2 id="resume-pdf-heading">Résumé PDF</h2>
      <p>
        <a href={RESUME_PDF_PATH} target="_blank" rel="noreferrer">
          View live: {RESUME_PDF_PATH}
        </a>
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (file !== null) {
            void upload(file);
          }
        }}
      >
        <div className="admin-field">
          <label htmlFor={inputId}>PDF file (at most 10 MB)</label>
          <input
            id={inputId}
            type="file"
            accept="application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </div>
        <p>
          <button
            type="submit"
            disabled={file === null || status.kind === "uploading"}
          >
            {status.kind === "uploading" ? "Uploading…" : "Upload"}
          </button>
        </p>
      </form>
      {status.kind === "uploaded" ? (
        <div role="status" className="admin-ok">
          <p>Uploaded: {status.saved.size.toLocaleString()} bytes.</p>
          <p>
            {status.saved.revalidation === "done"
              ? "Revalidation: done."
              : "Revalidation: failed. The PDF is saved; upload again to retry."}
          </p>
        </div>
      ) : null}
      {status.kind === "failed" ? (
        <p role="alert" className="admin-error">
          Not uploaded: {status.message}
        </p>
      ) : null}
    </section>
  );
}
