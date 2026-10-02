// Writes the OpenAPI document's component schemas to src/lib/api/openapi-schemas.json, beside the generated types.
// The admin console builds its forms and validation from this file (docs/design.md section 13.8).
// Usage: node scripts/openapi-schemas.mjs <openapi.json URL>
import { writeFile } from "node:fs/promises";

const [url] = process.argv.slice(2);
if (url === undefined) {
  throw new Error("usage: node scripts/openapi-schemas.mjs <openapi.json URL>");
}
const response = await fetch(url);
if (!response.ok) {
  throw new Error(`${url} answered ${response.status}`);
}
const openapi = await response.json();
const output = new URL("../src/lib/api/openapi-schemas.json", import.meta.url);
await writeFile(
  output,
  `${JSON.stringify({ components: { schemas: openapi.components.schemas } }, null, 2)}\n`,
);
