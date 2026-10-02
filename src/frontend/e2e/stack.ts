import os from "node:os";
import path from "node:path";

// The stack e2e runs against: a production build of Next and the FastAPI app on a fresh SQLite database, wired as in
// the cluster (Next rewrites /api/* to the API; the API calls Next's /revalidate after each save).

// Override with E2E_PORT when several checkouts run e2e at once, so none reuses another's server.
export const PORT = Number(process.env.E2E_PORT ?? 3100);
export const API_PORT = Number(process.env.E2E_API_PORT ?? PORT + 5000);
export const BASE_URL = `http://localhost:${PORT}`;
export const API_URL = `http://127.0.0.1:${API_PORT}`;

/** Recreated on every API start, so each run begins from the seed content. */
export const API_DATA_DIR = path.join(
  os.tmpdir(),
  `personal-website-e2e-api-${API_PORT}`,
);

// Test-only credentials for the throwaway API: not secrets, and used nowhere else.
export const ADMIN_PASSWORD = "e2e-admin-password";
export const ADMIN_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$/dNhSnaTz5AvVFRvCmrRyw$pHlN7NJ9OcajLtd0uX6Nrc3oqaZzCwBQblkDJOav+hI";
export const REVALIDATE_SECRET = "e2e-revalidate-secret";
