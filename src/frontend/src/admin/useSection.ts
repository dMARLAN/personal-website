"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getSection,
  putSection,
  type Revalidation,
  type SectionDocuments,
  type SectionId,
  type ValidationIssue,
} from "./api";

/** Where an editor is, for the status line under its Save button. */
export type EditorStatus =
  | { kind: "loading" }
  | { kind: "editing" }
  | { kind: "saving" }
  | { kind: "saved"; revalidation: Revalidation; updatedAt: string }
  | { kind: "conflict" }
  | { kind: "invalid"; issues: ValidationIssue[] }
  | { kind: "failed"; message: string };

export interface Session {
  csrfToken: string;
  /** Called on a 401: the session is gone, so the app shows the login form. */
  onSignedOut(): void;
}

export interface SectionEditing<D> {
  /** The document as last loaded or saved, then as edited; null while loading. */
  draft: D | null;
  /** Counts the times `draft` was replaced by the API's copy (load, reload, save). */
  version: number;
  setDraft(draft: D): void;
  status: EditorStatus;
  /** Saves `document` with the ETag it was loaded with. */
  save(document: unknown): Promise<void>;
  /** Loads the stored document again, dropping unsaved edits. */
  reload(): Promise<void>;
  /** Shows a problem found before sending, such as JSON that does not parse. */
  fail(message: string): void;
}

/** Loads one section and saves it whole, refusing to overwrite a newer save (If-Match → 412). */
export function useSection<S extends SectionId>(
  section: S,
  { csrfToken, onSignedOut }: Session,
): SectionEditing<SectionDocuments[S]> {
  const [draft, setDraft] = useState<SectionDocuments[S] | null>(null);
  const [etag, setEtag] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState<EditorStatus>({ kind: "loading" });

  const reload = useCallback(async () => {
    setStatus({ kind: "loading" });
    const result = await getSection(section);
    switch (result.kind) {
      case "ok":
        setDraft(result.data.document);
        setEtag(result.data.etag);
        setVersion((current) => current + 1);
        setStatus({ kind: "editing" });
        return;
      case "signed-out":
        onSignedOut();
        return;
      case "conflict":
      case "invalid":
        throw new Error(`GET ${section} answered ${result.kind}`);
      case "failed":
        setStatus({ kind: "failed", message: result.message });
        return;
    }
  }, [section, onSignedOut]);

  useEffect(() => {
    // Loading the section is synchronising with the API: the effect starts it, and the state updates arrive later.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  async function save(document: unknown): Promise<void> {
    if (etag === null) {
      throw new Error(`saving ${section} before it loaded`);
    }
    setStatus({ kind: "saving" });
    const result = await putSection(section, document, etag, csrfToken);
    switch (result.kind) {
      case "ok":
        setDraft(result.data.document);
        setEtag(result.data.etag);
        setVersion((current) => current + 1);
        setStatus({
          kind: "saved",
          revalidation: result.data.revalidation,
          updatedAt: result.data.updatedAt,
        });
        return;
      case "signed-out":
        onSignedOut();
        return;
      case "conflict":
        setStatus({ kind: "conflict" });
        return;
      case "invalid":
        setStatus({ kind: "invalid", issues: result.issues });
        return;
      case "failed":
        setStatus({ kind: "failed", message: result.message });
        return;
    }
  }

  return {
    draft,
    version,
    setDraft,
    status,
    save,
    reload,
    fail: (message) => setStatus({ kind: "failed", message }),
  };
}
