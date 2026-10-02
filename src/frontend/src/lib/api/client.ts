import createClient from "openapi-fetch";
import type { paths } from "./schema";

// Server-side requests use the in-cluster address when one is configured.
function apiBaseUrl(): string {
  if (typeof window === "undefined") {
    const internalUrl = process.env.API_INTERNAL_URL;
    if (internalUrl !== undefined && internalUrl !== "") {
      return internalUrl;
    }
  }
  // NEXT_PUBLIC_API_URL is inlined at build time, so it works in the browser too.
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl !== undefined && envUrl !== "") {
    return envUrl;
  }
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
}

export const api = createClient<paths>({
  baseUrl: apiBaseUrl(),
});
