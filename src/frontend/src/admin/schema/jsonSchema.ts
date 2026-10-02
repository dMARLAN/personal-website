import openapi from "@/lib/api/openapi-schemas.json";

/** A JSON value as the editor holds a section document: what `JSON.parse` returns. */
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * The subset of JSON Schema 2020-12 (as FastAPI emits it in OpenAPI 3.1) that the form engine reads, with the API's
 * `x-` keys (docs/design.md section 13.2, `src/api/src/content/extensions.py`). Every `x-` key is optional: without
 * it the field falls back to the standard keywords.
 */
export interface JsonSchema {
  $ref?: string;
  type?: string | string[];
  title?: string;
  description?: string;
  default?: unknown;
  properties?: Readonly<Record<string, JsonSchema>>;
  required?: readonly string[];
  additionalProperties?: boolean | JsonSchema;
  propertyNames?: JsonSchema;
  items?: JsonSchema;
  prefixItems?: readonly JsonSchema[];
  minItems?: number;
  maxItems?: number;
  enum?: readonly unknown[];
  const?: unknown;
  allOf?: readonly JsonSchema[];
  anyOf?: readonly JsonSchema[];
  oneOf?: readonly JsonSchema[];
  discriminator?: {
    propertyName: string;
    mapping?: Readonly<Record<string, string>>;
  };
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  /** `"stroke-font"`: the glass draws the string, so it may use only the font's glyphs. */
  "x-ddi-charset"?: string;
  /** Greedy word wrap into at most `rows` rows of `chars` characters. */
  "x-ddi-wrap"?: { chars: number; rows: number };
  /** On an object drawn as one row: the named fields' lengths plus `gap` fit `maxLength`. */
  "x-ddi-combined-length"?: {
    fields: readonly string[];
    gap: number;
    maxLength: number;
  };
  /** `textarea`, `url` or `email`; absent is a one-line input. */
  "x-ui-widget"?: string;
  /** On a variable-length array: the item "add" appends. */
  "x-ui-new-item"?: unknown;
  /** On an array of objects: properties whose values are unique across the items. */
  "x-ui-unique-by"?: readonly string[];
  /** On a string: a path from the section root (`*` is any index) whose values are its options. */
  "x-ui-options-from"?: string;
  /** Rules nothing else expresses, as sentences to show beside the field. */
  "x-ui-rules"?: readonly string[];
}

/** The document `$ref`s resolve against: `#/components/schemas/<Name>`. */
export interface SchemaRoot {
  components: { schemas: Readonly<Record<string, JsonSchema>> };
}

/**
 * The API's schemas, committed beside the generated types (`npm run openapi:gen` writes both from one OpenAPI
 * document), so the forms, the validation and the TypeScript types always describe the same API.
 */
export const OPENAPI_SCHEMAS: SchemaRoot = openapi;

const REF_PREFIX = "#/components/schemas/";

/** `schema` with its `$ref` chain followed. Keywords beside a `$ref` (a field's title, description) win. */
export function resolveRef(root: SchemaRoot, schema: JsonSchema): JsonSchema {
  let resolved = schema;
  while (resolved.$ref !== undefined) {
    const ref: string = resolved.$ref;
    if (!ref.startsWith(REF_PREFIX)) {
      throw new Error(`unsupported $ref ${ref}`);
    }
    const target = root.components.schemas[ref.slice(REF_PREFIX.length)];
    if (target === undefined) {
      throw new Error(`unresolved $ref ${ref}`);
    }
    const siblings: JsonSchema = { ...resolved };
    delete siblings.$ref;
    resolved = { ...target, ...siblings };
  }
  return resolved;
}

/** The schema name of a section's document, from `SiteContent`'s property `$ref`. */
export function sectionSchemaName(root: SchemaRoot, section: string): string {
  const property = root.components.schemas.SiteContent?.properties?.[section];
  if (property?.$ref === undefined) {
    throw new Error(`SiteContent has no section ${section}`);
  }
  return property.$ref.slice(REF_PREFIX.length);
}
