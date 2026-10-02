import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { isPreviewPath } from "@/preview/paths";

/**
 * Leaves draft mode (docs/design.md section 13.9). It needs no session: leaving only drops back to the public pages.
 *
 * GET `?path=/about` is "View live": it redirects to the page as the public sees it. POST answers 204 (sign-out).
 */
export async function GET(request: NextRequest): Promise<Response> {
  const path = request.nextUrl.searchParams.get("path");
  if (path === null || !isPreviewPath(path)) {
    return Response.json({ detail: "INVALID_PATH" }, { status: 400 });
  }
  (await draftMode()).disable();
  redirect(path);
}

export async function POST(): Promise<Response> {
  (await draftMode()).disable();
  return new Response(null, { status: 204 });
}
