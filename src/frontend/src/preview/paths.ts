import { PAGES } from "@/ddi/pages/registry";

/**
 * Draft-mode preview (docs/design.md section 13.9). The admin's preview frame enters it through `PREVIEW_ENABLE_ROUTE`,
 * which checks the admin session, turns on Next's draft mode and redirects to the page.
 */
export const PREVIEW_ENABLE_ROUTE = "/admin/preview/enable";
export const PREVIEW_DISABLE_ROUTE = "/admin/preview/disable";

/**
 * The pages a preview may open: the registry's routes, exactly. The routes redirect only to these, so neither is an
 * open redirect, and a query string or a look-alike path ("//evil.example", "/about/../x") is refused.
 */
const PREVIEW_PATHS: ReadonlySet<string> = new Set(
  Object.values(PAGES).map((page) => page.path),
);

export function isPreviewPath(path: string): boolean {
  return PREVIEW_PATHS.has(path);
}

/** Opens `path` in draft mode: the preview frame's `src`. */
export function previewUrl(path: string): string {
  return `${PREVIEW_ENABLE_ROUTE}?${new URLSearchParams({ path })}`;
}

/** Leaves draft mode and opens `path` as the public sees it: "View live". */
export function livePageUrl(path: string): string {
  return `${PREVIEW_DISABLE_ROUTE}?${new URLSearchParams({ path })}`;
}

/**
 * The `<meta name>` every response the preview frame can land on carries: a draft-mode page and the enable route's
 * refusals. Its `content` is a `PreviewState`; the admin reads it when the frame loads.
 */
export const PREVIEW_META_NAME = "pw-preview";

/**
 * What the frame shows. `draft`: the page, with every stored draft in place of its published section. `signed-out`:
 * no valid admin session, so no drafts (a draft-mode page then renders the published content). `error`: the API did
 * not answer.
 */
export type PreviewState = "draft" | "signed-out" | "error";

export function isPreviewState(value: string): value is PreviewState {
  return value === "draft" || value === "signed-out" || value === "error";
}

/** The admin asks the frame's page to render again from the server (`router.refresh()`), keeping its client state. */
export const REFRESH_MESSAGE = "pw-preview:refresh";
/** The frame's page tells the admin it rendered: on load and after each refresh. */
export const RENDERED_MESSAGE = "pw-preview:rendered";

export interface RenderedMessage {
  type: typeof RENDERED_MESSAGE;
  state: PreviewState;
  /** A new value on every server render, so a refresh that changed nothing on screen still reports. */
  renderId: string;
}

export function isRenderedMessage(data: unknown): data is RenderedMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    data.type === RENDERED_MESSAGE &&
    "state" in data &&
    typeof data.state === "string" &&
    isPreviewState(data.state) &&
    "renderId" in data &&
    typeof data.renderId === "string"
  );
}
