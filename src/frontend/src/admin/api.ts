import type { components } from "@/lib/api/schema";

// The admin API, called from the browser at the site's own origin (`/api/admin/*` is rewritten to FastAPI), so the
// session cookie (SameSite=Strict, Path=/) goes with each call. Response bodies are typed by the API's
// response models, the schema these types are generated from; they are asserted here, not validated again.
// (openapi-fetch is not used: its response typing turns the schema's fixed-length tuples into plain arrays.)

type Schemas = components["schemas"];

/** One stored document per section, keyed as `GET /api/content` keys them. */
export type SectionDocuments = Schemas["SiteContent"];
export type SectionId = keyof SectionDocuments;
export type SessionInfo = Schemas["AdminSessionInfo"];
export type SavedResume = Schemas["SavedResume"];
export type Revalidation = Schemas["RevalidationStatus"];
export type ValidationIssue = Schemas["ValidationError"];

export interface SectionState<D> {
  document: D;
  etag: string;
  updatedAt: string;
}

export interface SavedSection<D> extends SectionState<D> {
  revalidation: Revalidation;
}

/** What an admin call can come back with, beyond success, that the UI handles differently. */
export type AdminResult<T> =
  | { kind: "ok"; data: T }
  /** 401 on any call but login: no session, or it expired. */
  | { kind: "signed-out" }
  /** 412: the section changed since its `etag` was read. */
  | { kind: "conflict" }
  /** 422: the document cannot render. */
  | { kind: "invalid"; issues: ValidationIssue[] }
  | { kind: "failed"; status: number; message: string };

interface Call {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  json?: unknown;
  form?: FormData;
  csrfToken?: string;
  ifMatch?: string;
}

export async function call<T>({
  method,
  path,
  json,
  form,
  csrfToken,
  ifMatch,
}: Call): Promise<AdminResult<T>> {
  const headers = new Headers({ Accept: "application/json" });
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (csrfToken !== undefined) {
    headers.set("X-CSRF-Token", csrfToken);
  }
  if (ifMatch !== undefined) {
    headers.set("If-Match", `"${ifMatch}"`);
  }
  const response = await fetch(path, {
    method,
    headers,
    body: json === undefined ? form : JSON.stringify(json),
    cache: "no-store",
  });
  const body: unknown =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (response.ok) {
    return { kind: "ok", data: body as T };
  }
  const detail = errorDetail(body);
  if (response.status === 401 && detail === "NOT_AUTHENTICATED") {
    return { kind: "signed-out" };
  }
  if (response.status === 412) {
    return { kind: "conflict" };
  }
  if (response.status === 422 && Array.isArray(detail)) {
    return { kind: "invalid", issues: detail };
  }
  return {
    kind: "failed",
    status: response.status,
    message: failureMessage(response, detail),
  };
}

function errorDetail(body: unknown): unknown {
  return typeof body === "object" && body !== null && "detail" in body
    ? body.detail
    : null;
}

/** The API's error codes (`{"detail": "<CODE>"}`), in words. */
const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  INVALID_PASSWORD: "Wrong password.",
  LOGIN_DISABLED:
    "Admin login is disabled: the API has no ADMIN_AUTH_PASSWORD_HASH.",
  CSRF_TOKEN_INVALID:
    "The request was refused (CSRF token). Reload the page and try again.",
  NOT_A_PDF: "That file is not a PDF.",
  FILE_TOO_LARGE: "That file is larger than 10 MB.",
};

function failureMessage(response: Response, detail: unknown): string {
  if (detail === "TOO_MANY_ATTEMPTS") {
    const wait = response.headers.get("Retry-After");
    return `Too many failed logins. Try again in ${wait ?? "a few"} seconds.`;
  }
  if (typeof detail === "string" && detail in ERROR_MESSAGES) {
    return ERROR_MESSAGES[detail];
  }
  return `The API answered ${response.status} ${response.statusText}.`;
}

export function getSession(): Promise<AdminResult<SessionInfo>> {
  return call({ method: "GET", path: "/api/admin/session" });
}

export function login(password: string): Promise<AdminResult<SessionInfo>> {
  return call({
    method: "POST",
    path: "/api/admin/login",
    json: { password },
  });
}

export function logout(csrfToken: string): Promise<AdminResult<null>> {
  return call({ method: "POST", path: "/api/admin/logout", csrfToken });
}

export function getSection<S extends SectionId>(
  section: S,
): Promise<AdminResult<SectionState<SectionDocuments[S]>>> {
  return call({ method: "GET", path: `/api/admin/content/${section}` });
}

/** Saves a whole section. `etag` is the one it was loaded with, so a save over someone else's answers `conflict`. */
export function putSection<S extends SectionId>(
  section: S,
  // A form's typed document, or what the JSON editor parsed: the API validates either.
  document: unknown,
  etag: string,
  csrfToken: string,
): Promise<AdminResult<SavedSection<SectionDocuments[S]>>> {
  return call({
    method: "PUT",
    path: `/api/admin/content/${section}`,
    json: document,
    csrfToken,
    ifMatch: etag,
  });
}

export function uploadResume(
  file: File,
  csrfToken: string,
): Promise<AdminResult<SavedResume>> {
  const form = new FormData();
  form.append("file", file);
  return call({ method: "PUT", path: "/api/admin/resume", form, csrfToken });
}
