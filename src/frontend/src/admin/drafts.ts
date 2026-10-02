import {
  call,
  type AdminResult,
  type SectionDocuments,
  type SectionId,
} from "./api";
import type { components } from "@/lib/api/schema";

/**
 * Drafts (docs/design.md sections 13.3 and 13.9): one per section, global, validated like a publish. Publishing a
 * section deletes its draft in the same transaction.
 */
export type DraftList = components["schemas"]["Drafts"];

export interface StoredDraft<S extends SectionId = SectionId> {
  content: SectionDocuments[S];
  updatedAt: string;
}

export function listDrafts(): Promise<AdminResult<DraftList>> {
  return call({ method: "GET", path: "/api/admin/drafts" });
}

/** Creates or replaces the section's draft. 422 with `loc` like a publish; no If-Match, no revalidation. */
export function putDraft<S extends SectionId>(
  section: S,
  // The editor's document, which may not match the section's type yet: the API validates it.
  content: unknown,
  csrfToken: string,
): Promise<AdminResult<StoredDraft<S>>> {
  return call({
    method: "PUT",
    path: `/api/admin/drafts/${section}`,
    json: content,
    csrfToken,
  });
}

/** Discards the section's draft: 204 whether or not it had one. */
export function deleteDraft(
  section: SectionId,
  csrfToken: string,
): Promise<AdminResult<null>> {
  return call({
    method: "DELETE",
    path: `/api/admin/drafts/${section}`,
    csrfToken,
  });
}
