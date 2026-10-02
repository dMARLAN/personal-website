import createClient from "openapi-fetch";
import type { paths } from "./schema";

/**
 * The typed API client for the browser. It calls the site's own origin: `/api/*` is rewritten to FastAPI
 * (`next.config.ts`), so the admin session cookie (`SameSite=Strict`, `Path=/api/admin`) and CSRF work.
 */
export const api = createClient<paths>({ baseUrl: "" });
