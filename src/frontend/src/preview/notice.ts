import { PREVIEW_META_NAME, type PreviewState } from "./paths";

/**
 * The enable route's refusal, as a small page: the preview frame lands on it, and the admin reads its `<meta>` to show
 * its own "sign in" or error state over it.
 */
export function previewNotice(
  status: number,
  state: Exclude<PreviewState, "draft">,
  message: string,
): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="${PREVIEW_META_NAME}" content="${state}"><title>Preview</title></head><body style="font:14px system-ui,sans-serif;margin:2rem"><p>${message}</p></body></html>`;
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
