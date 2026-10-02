import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { previewNotice } from "@/preview/notice";
import { isPreviewPath } from "@/preview/paths";
import { hasAdminSession } from "@/preview/session";

/**
 * Enters draft mode (docs/design.md section 13.9), only for a valid admin session: the Next server forwards the
 * session cookie to `GET /api/admin/session`.
 *
 * GET `?path=/about` is the preview frame's `src`: it redirects to the page, which must be one of the registry's routes.
 * POST answers 204: the admin re-arms draft mode before each refresh, since "View live" or another tab may have left it.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const path = request.nextUrl.searchParams.get("path");
  if (path === null || !isPreviewPath(path)) {
    return Response.json({ detail: "INVALID_PATH" }, { status: 400 });
  }
  const refusal = await enable();
  if (refusal !== null) {
    return refusal;
  }
  redirect(path);
}

export async function POST(): Promise<Response> {
  return (await enable()) ?? new Response(null, { status: 204 });
}

async function enable(): Promise<Response | null> {
  let signedIn: boolean;
  try {
    signedIn = await hasAdminSession();
  } catch (error) {
    console.error("Preview: the session check failed", error);
    return previewNotice(
      503,
      "error",
      "The API did not answer, so the preview cannot render.",
    );
  }
  if (!signedIn) {
    return previewNotice(401, "signed-out", "Sign in to preview.");
  }
  (await draftMode()).enable();
  return null;
}
