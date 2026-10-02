import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";

/**
 * Every save also changes the homepage, which shows all the content, and its share card. Both are in the `(home)` route
 * group; the card's route has a build hash in its name, so the group's layout is the stable way to name both.
 */
const HOME_GROUP = "/(home)";

/**
 * The API calls this after each admin save (docs/design.md section 13.5): `Authorization: Bearer <REVALIDATE_SECRET>`
 * and `{"paths": ["/about"]}`. Each path, and the homepage, renders from the API again on its next request.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isAuthorized(request.headers.get("authorization"))) {
    return Response.json({ detail: "UNAUTHORIZED" }, { status: 401 });
  }
  const paths = sitePaths(await request.json().catch(() => null));
  if (paths === null) {
    return Response.json(
      { detail: 'Expected {"paths": ["/<path>", ...]}' },
      { status: 400 },
    );
  }
  for (const path of paths) {
    revalidatePath(path);
  }
  revalidatePath(HOME_GROUP, "layout");
  return Response.json({ revalidated: [...paths, HOME_GROUP] });
}

function isAuthorized(header: string | null): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (secret === undefined || secret === "") {
    throw new Error("REVALIDATE_SECRET is not set");
  }
  // Hashing both sides gives timingSafeEqual equal-length inputs, so the comparison leaks neither content nor length.
  return timingSafeEqual(digest(header ?? ""), digest(`Bearer ${secret}`));
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function sitePaths(body: unknown): string[] | null {
  if (typeof body !== "object" || body === null || !("paths" in body)) {
    return null;
  }
  const { paths } = body;
  if (!Array.isArray(paths)) {
    return null;
  }
  const valid = paths.filter(
    (path: unknown): path is string =>
      typeof path === "string" && path.startsWith("/"),
  );
  return valid.length === paths.length ? valid : null;
}
