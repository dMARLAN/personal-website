import { unstable_cache } from "next/cache";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { draftMode } from "next/headers";
import { cache } from "react";
import { apiInternalUrl } from "@/lib/api/internalUrl";
import type { PreviewState } from "@/preview/paths";
import { API_TIMEOUT_MS, sessionCookieHeader } from "@/preview/session";
import { adaptSiteContent, type ApiSiteContent } from "./adapt";
import { withDrafts, type ApiDrafts } from "./drafts";
import { SNAPSHOT } from "./snapshot";
import type { SiteContent } from "./types";

/** How long a page drawn from fallback content counts as fresh before it asks the API again. */
const FALLBACK_REVALIDATE_SECONDS = 1;

interface Loaded {
  content: ApiSiteContent;
  /** Null outside draft mode. */
  preview: Exclude<PreviewState, "error"> | null;
}

/**
 * One load per render (React `cache`), shared by the page, its metadata and the layout's preview bridge. Outside draft
 * mode it is the published content; in draft mode, the admin's preview (docs/design.md section 13.9).
 */
const load = cache(async (): Promise<Loaded> => {
  if ((await draftMode()).isEnabled) {
    return loadPreview();
  }
  return { content: await loadContent(), preview: null };
});

/**
 * Every section, from `GET /api/content` (docs/design.md section 13.7). Pages are static: Next caches each rendered
 * page until the API's call to `/revalidate` expires it, and the first request after that renders it again.
 *
 * When there is no API answer (the production build has no API; at request time it may be briefly down), pages render
 * fallback content and are marked short-lived, so the next requests retry the API. The fallback is the last content
 * this server process got from the API, else the seed snapshot.
 *
 * In draft mode each section with a stored draft renders the draft instead.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> =>
  adaptSiteContent((await load()).content),
);

/** Whether this render is a preview showing drafts (`draft`), one without a valid session (`signed-out`), or neither. */
export async function getPreviewState(): Promise<Loaded["preview"]> {
  return (await load()).preview;
}

// The last content the API returned in this process: what the site showed before the API went away.
let lastFetched: ApiSiteContent | null = null;

async function loadContent(): Promise<ApiSiteContent> {
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
    return fallback();
  }
  try {
    lastFetched = await fetchContent("force-cache");
    return lastFetched;
  } catch (error) {
    console.error("GET /api/content failed; rendering fallback content", error);
    return fallback();
  }
}

/**
 * Draft mode: the published content with the drafts in place, both fetched uncached on every render. The drafts call
 * checks the forwarded admin session, so a render without a valid one gets no drafts and shows the published content,
 * reported as `signed-out`. A draft-mode page is dynamic and never cached (Next skips the fetch and page caches for it).
 * It has no fallback: when the API is down the render fails, and the admin shows an error.
 */
async function loadPreview(): Promise<Loaded> {
  const cookie = await sessionCookieHeader();
  const [live, drafts] = await Promise.all([
    fetchContent("no-store"),
    cookie === null ? null : fetchDrafts(cookie),
  ]);
  return drafts === null
    ? { content: live, preview: "signed-out" }
    : { content: withDrafts(live, drafts), preview: "draft" };
}

async function fetchContent(cacheMode: RequestCache): Promise<ApiSiteContent> {
  const response = await fetch(`${apiInternalUrl()}/api/content`, {
    cache: cacheMode,
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`GET /api/content answered ${response.status}`);
  }
  // The API serialises this through its `SiteContent` response model, the schema these types are generated from.
  const content: unknown = await response.json();
  return content as ApiSiteContent;
}

/** The stored drafts, or null when the session is missing or expired (401). */
async function fetchDrafts(cookie: string): Promise<ApiDrafts | null> {
  const response = await fetch(`${apiInternalUrl()}/api/admin/drafts`, {
    headers: { Cookie: cookie, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`GET /api/admin/drafts answered ${response.status}`);
  }
  // The API serialises this through its `Drafts` response model, validated like a publish.
  const drafts: unknown = await response.json();
  return drafts as ApiDrafts;
}

async function fallback(): Promise<ApiSiteContent> {
  await markShortLived();
  return lastFetched ?? SNAPSHOT;
}

// Its value is unused. Outside Cache Components, unstable_cache is the documented way to give a render a revalidate
// period without a fetch: the page that calls it becomes an ISR page that expires (`expireTime`) and renders again.
const markShortLived = unstable_cache(
  async (): Promise<boolean> => true,
  ["content-fallback"],
  { revalidate: FALLBACK_REVALIDATE_SECONDS },
);
