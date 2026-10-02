import { describe, expect, test } from "vitest";
import { DDI_GLYPHS } from "@/ddi/font/glyphs";
import { defaultValue } from "./defaults";
import {
  buildField,
  humanise,
  type FieldNode,
  type ObjectNode,
} from "./fields";
import {
  OPENAPI_SCHEMAS,
  type JsonSchema,
  type SchemaRoot,
} from "./jsonSchema";
import { sectionModel } from "./sectionModel";

/** A schema root with one `Doc` schema, plus whatever it references. */
function rootWith(
  doc: JsonSchema,
  more: Record<string, JsonSchema> = {},
): SchemaRoot {
  return { components: { schemas: { Doc: doc, ...more } } };
}

function build(
  doc: JsonSchema,
  more: Record<string, JsonSchema> = {},
): ObjectNode {
  const node = buildField(
    rootWith(doc, more),
    { $ref: "#/components/schemas/Doc" },
    "Doc",
  );
  if (node.kind !== "object") {
    throw new Error("Doc is not an object");
  }
  return node;
}

function property(node: ObjectNode, key: string): FieldNode {
  const found = node.properties.find((candidate) => candidate.key === key);
  if (found === undefined) {
    throw new Error(`no property ${key}`);
  }
  return found.node;
}

const STROKE = { "x-ddi-charset": "stroke-font" } as const;

describe("schema → form model", () => {
  const doc = build(
    {
      type: "object",
      required: ["name", "bio", "url", "email", "kind", "on", "count", "rows"],
      properties: {
        name: {
          type: "string",
          maxLength: 8,
          minLength: 1,
          title: "Name",
          description: "Short.",
          ...STROKE,
        },
        bio: {
          type: "string",
          maxLength: 170,
          "x-ui-widget": "textarea",
          "x-ddi-wrap": { chars: 18, rows: 9 },
          ...STROKE,
        },
        url: { type: "string", "x-ui-widget": "url", title: "URL" },
        email: {
          type: "string",
          "x-ui-widget": "email",
          allOf: [{ pattern: "^[A-Z@.]*$" }],
          maxLength: 40,
        },
        kind: { $ref: "#/components/schemas/Kind" },
        on: { type: "boolean", title: "On" },
        count: { type: "integer", minimum: 1, maximum: 9, title: "Count" },
        ratio: { type: "number", exclusiveMinimum: 0, title: "Ratio" },
        loadedMuId: { type: "string", title: "Loadedmuid" },
        category: {
          type: "string",
          "x-ui-options-from": "categories/*/legend",
        },
        maybe: {
          anyOf: [{ $ref: "#/components/schemas/Kind" }, { type: "null" }],
        },
        rows: {
          type: "array",
          prefixItems: [
            { $ref: "#/components/schemas/Row" },
            { $ref: "#/components/schemas/Row" },
          ],
          minItems: 2,
          maxItems: 2,
          title: "Rows",
        },
        links: {
          type: "array",
          items: { $ref: "#/components/schemas/Row" },
          minItems: 1,
          maxItems: 10,
          title: "Links",
          "x-ui-new-item": { label: "NEW", value: "ITEM" },
          "x-ui-unique-by": ["label"],
          "x-ui-rules": ["Labels are unique."],
        },
        motion: { $ref: "#/components/schemas/Motion" },
        checks: {
          type: "object",
          propertyNames: { $ref: "#/components/schemas/Kind" },
          additionalProperties: { type: "string", maxLength: 7 },
        },
      },
    },
    {
      Kind: { type: "string", enum: ["REPO", "DEMO"], title: "Kind" },
      Row: {
        type: "object",
        title: "Row",
        required: ["label", "value"],
        properties: {
          label: { type: "string", maxLength: 7 },
          value: { type: "string", maxLength: 9 },
        },
        "x-ddi-combined-length": {
          fields: ["label", "value"],
          gap: 1,
          maxLength: 12,
        },
      },
      Wave: {
        type: "object",
        required: ["kind", "level"],
        properties: {
          kind: { const: "wave" },
          level: { type: "number", minimum: 0, maximum: 1 },
        },
      },
      Drain: {
        type: "object",
        required: ["kind", "low"],
        properties: {
          kind: { const: "drain" },
          low: { type: "number", minimum: 0.2 },
        },
      },
      Motion: {
        oneOf: [
          { $ref: "#/components/schemas/Wave" },
          { $ref: "#/components/schemas/Drain" },
        ],
        discriminator: {
          propertyName: "kind",
          mapping: { wave: "#/components/schemas/Wave" },
        },
      },
    },
  );

  test("a short glyph string is a text input with its limit, charset and help", () => {
    expect(property(doc, "name")).toMatchObject({
      kind: "string",
      widget: "text",
      label: "Name",
      description: "Short.",
      maxLength: 8,
      minLength: 1,
      charset: DDI_GLYPHS,
      wrap: null,
    });
  });

  test("wrapped prose is a textarea with its row budget", () => {
    expect(property(doc, "bio")).toMatchObject({
      kind: "string",
      widget: "textarea",
      wrap: { chars: 18, rows: 9 },
    });
  });

  test("URL and email widgets; allOf parts merge into the field", () => {
    expect(property(doc, "url")).toMatchObject({
      kind: "string",
      widget: "url",
      label: "URL",
    });
    expect(property(doc, "email")).toMatchObject({
      kind: "string",
      widget: "email",
      maxLength: 40,
      schema: { pattern: "^[A-Z@.]*$" },
    });
  });

  test("enums, booleans and numbers with their bounds", () => {
    expect(property(doc, "kind")).toMatchObject({
      kind: "enum",
      options: ["REPO", "DEMO"],
    });
    expect(property(doc, "on")).toMatchObject({ kind: "boolean" });
    expect(property(doc, "count")).toMatchObject({
      kind: "number",
      integer: true,
      minimum: 1,
      maximum: 9,
    });
    expect(property(doc, "ratio")).toMatchObject({
      kind: "number",
      integer: false,
      exclusiveMinimum: 0,
    });
  });

  test("a missing or generated title falls back to the humanised key", () => {
    expect(property(doc, "loadedMuId").label).toBe("Loaded MU ID");
    expect(property(doc, "bio").label).toBe("Bio");
    expect(humanise("gLimit")).toBe("G limit");
  });

  test("options from elsewhere in the document", () => {
    expect(property(doc, "category")).toMatchObject({
      kind: "string",
      optionsFrom: "categories/*/legend",
    });
  });

  test("anyOf with null is nullable", () => {
    expect(property(doc, "maybe")).toMatchObject({
      kind: "nullable",
      inner: { kind: "enum" },
    });
  });

  test("prefixItems is a fixed tuple with numbered items", () => {
    const rows = property(doc, "rows");
    expect(rows.kind).toBe("tuple");
    expect(
      rows.kind === "tuple" && rows.items.map((item) => item.label),
    ).toEqual(["Rows 1", "Rows 2"]);
  });

  test("a variable array carries its limits, new item, unique keys and rules", () => {
    expect(property(doc, "links")).toMatchObject({
      kind: "array",
      minItems: 1,
      maxItems: 10,
      newItem: { label: "NEW", value: "ITEM" },
      uniqueBy: ["label"],
      rules: ["Labels are unique."],
      item: {
        kind: "object",
        combinedLength: { fields: ["label", "value"], gap: 1, maxLength: 12 },
      },
    });
  });

  test("a discriminated union lists its variants by tag", () => {
    const motion = property(doc, "motion");
    expect(
      motion.kind === "union" && motion.variants.map((variant) => variant.tag),
    ).toEqual(["wave", "drain"]);
    expect(motion).toMatchObject({ discriminator: "kind" });
  });

  test("a map keyed by an enum is an object with every key", () => {
    const checks = property(doc, "checks");
    expect(
      checks.kind === "object" &&
        checks.properties.map((entry) => [entry.key, entry.node.label]),
    ).toEqual([
      ["REPO", "REPO"],
      ["DEMO", "DEMO"],
    ]);
  });

  test("defaults: the emptiest valid shape, the first variant, the lower bound", () => {
    expect(defaultValue(property(doc, "count"))).toBe(1);
    expect(defaultValue(property(doc, "ratio"))).toBe(1);
    expect(defaultValue(property(doc, "kind"))).toBe("REPO");
    expect(defaultValue(property(doc, "maybe"))).toBeNull();
    expect(defaultValue(property(doc, "motion"))).toEqual({
      kind: "wave",
      level: 0,
    });
    expect(defaultValue(property(doc, "rows"))).toEqual([
      { label: "", value: "" },
      { label: "", value: "" },
    ]);
  });

  test("an unknown widget or charset fails clearly", () => {
    expect(() =>
      build({
        type: "object",
        properties: { a: { type: "string", "x-ui-widget": "colour" } },
      }),
    ).toThrow("unknown x-ui-widget colour");
    expect(() =>
      build({
        type: "object",
        properties: { a: { type: "string", "x-ddi-charset": "latin" } },
      }),
    ).toThrow("unknown x-ddi-charset latin");
  });
});

describe("the API's schemas", () => {
  test("every section builds a form", () => {
    const sections = Object.keys(
      OPENAPI_SCHEMAS.components.schemas.SiteContent?.properties ?? {},
    );
    expect(sections).toHaveLength(13);
    for (const section of sections) {
      expect(sectionModel(section).fields.kind).toBe("object");
    }
  });

  test("Links: a reorderable list of rows with a new item from the schema", () => {
    const links = sectionModel("links").fields;
    expect(links.kind === "object" && links.properties[0].node).toMatchObject({
      kind: "array",
      label: "Links",
      maxItems: 10,
      newItem: { name: "Name", tag: "TAG", url: "https://example.com" },
      item: { kind: "object" },
    });
  });
});
