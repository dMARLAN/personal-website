import {
  isPreviewState,
  PREVIEW_DISABLE_ROUTE,
  PREVIEW_ENABLE_ROUTE,
  type PreviewState,
} from "@/preview/paths";

/**
 * Turns draft mode on again before a refresh (docs/design.md section 13.9). The cookie is the whole browser's, so
 * "View live" or another tab may have turned it off since the frame loaded. The route checks the session first.
 */
export async function armPreview(): Promise<PreviewState> {
  let response: Response;
  try {
    response = await fetch(PREVIEW_ENABLE_ROUTE, {
      method: "POST",
      cache: "no-store",
    });
  } catch (error) {
    console.error("Preview: the enable route did not answer", error);
    return "error";
  }
  if (response.status === 204) {
    return "draft";
  }
  return response.status === 401 ? "signed-out" : "error";
}

/** Leaves draft mode, so this browser sees the public pages again (sign-out). */
export async function exitPreview(): Promise<void> {
  await fetch(PREVIEW_DISABLE_ROUTE, { method: "POST", cache: "no-store" });
}

/**
 * What a page the frame loaded shows, from its `<meta name="pw-preview">`. A page without one is not a draft-mode
 * render (Next's error page, or a page outside the site), so it counts as an error.
 */
export function frameStateFromMeta(content: string | null): PreviewState {
  return content !== null && isPreviewState(content) ? content : "error";
}
