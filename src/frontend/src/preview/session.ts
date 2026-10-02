import { cookies } from "next/headers";
import { apiInternalUrl } from "@/lib/api/internalUrl";

/** The API's admin session cookie (`HttpOnly; Secure; SameSite=Strict; Path=/`, docs/design.md section 13.4). */
const ADMIN_SESSION_COOKIE = "pw_admin_session";
export const API_TIMEOUT_MS = 5000;

/**
 * The request's admin session as a `Cookie` header for the API, or null when it has none. Only this one cookie is
 * forwarded. Never log it: it is the session token.
 */
export async function sessionCookieHeader(): Promise<string | null> {
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE);
  return session === undefined
    ? null
    : `${ADMIN_SESSION_COOKIE}=${session.value}`;
}

/**
 * Asks the API whether the request carries a valid admin session (`GET /api/admin/session`). Throws when the API does
 * not answer, or answers anything but 200 or 401.
 */
export async function hasAdminSession(): Promise<boolean> {
  const cookie = await sessionCookieHeader();
  if (cookie === null) {
    return false;
  }
  const response = await fetch(`${apiInternalUrl()}/api/admin/session`, {
    headers: { Cookie: cookie, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (response.status === 401) {
    return false;
  }
  if (!response.ok) {
    throw new Error(`GET /api/admin/session answered ${response.status}`);
  }
  return true;
}
