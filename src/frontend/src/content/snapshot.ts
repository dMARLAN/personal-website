import { adaptSiteContent, type ApiSiteContent } from "./adapt";
import snapshotJson from "./snapshot.json";
import type { SiteContent } from "./types";

/**
 * The API's seed content, as `GET /api/content` serves a fresh database. Pages render it when the API has never
 * answered (the production build has no API) and in tests. Regenerate it with
 * `uv run python src/cli.py content-snapshot ../frontend/src/content/snapshot.json` from `src/api`; the API's test
 * `tests/seed/test_frontend_snapshot.py` fails when it drifts from the seed.
 */
// A JSON import's inferred type widens tuples and enums, so TypeScript cannot check it against the schema. That API
// test validates the file against the same `SiteContent` model instead.
const snapshotData: unknown = snapshotJson;
export const SNAPSHOT = snapshotData as ApiSiteContent;

export const SNAPSHOT_CONTENT: SiteContent = adaptSiteContent(SNAPSHOT);
