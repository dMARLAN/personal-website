import { unstable_cache } from "next/cache";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { cache } from "react";
import { apiInternalUrl } from "@/lib/api/internalUrl";
import { adaptSiteContent, type ApiSiteContent } from "./adapt";
import { SNAPSHOT } from "./snapshot";
import type { SiteContent } from "./types";

/** How long a page drawn from fallback content counts as fresh before it asks the API again. */
const FALLBACK_REVALIDATE_SECONDS = 1;
const API_TIMEOUT_MS = 5000;

/**
 * Every section, from `GET /api/content` (docs/design.md section 13.7). Pages are static: Next caches each rendered
 * page until the API's call to `/revalidate` expires it, and the first request after that renders it again.
 *
 * When there is no API answer (the production build has no API; at request time it may be briefly down), pages render
 * fallback content and are marked short-lived, so the next requests retry the API. The fallback is the last content
 * this server process got from the API, else the seed snapshot.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> =>
  adaptSiteContent(await loadContent()),
);

// The last content the API returned in this process: what the site showed before the API went away.
let lastFetched: ApiSiteContent | null = null;

async function loadContent(): Promise<ApiSiteContent> {
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
    return fallback();
  }
  try {
    lastFetched = await fetchContent();
    return lastFetched;
  } catch (error) {
    console.error("GET /api/content failed; rendering fallback content", error);
    return fallback();
  }
}

async function fetchContent(): Promise<ApiSiteContent> {
  const response = await fetch(`${apiInternalUrl()}/api/content`, {
    cache: "force-cache",
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`GET /api/content answered ${response.status}`);
  }
  // The API serialises this through its `SiteContent` response model, the schema these types are generated from.
  const content: unknown = await response.json();
  return content as ApiSiteContent;
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
