/**
 * Where the Next.js server reaches FastAPI: content fetches at request time, and the `/api/*` rewrite (`next.config.ts`),
 * which `next build` bakes into the build. In the cluster it is the API Service; outside it, the API's `make run` port.
 */
export function apiInternalUrl(): string {
  return process.env.API_INTERNAL_URL ?? "http://localhost:8000";
}
