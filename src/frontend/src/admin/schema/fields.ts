import { DDI_GLYPHS } from "@/ddi/font/glyphs";
import {
  resolveRef,
  type JsonSchema,
  type JsonValue,
  type SchemaRoot,
} from "./jsonSchema";

/**
 * The form engine's model of a schema: one node per field, with everything the widgets need already worked out
 * (label, widget, limits, the API's `x-` hints). `buildField` maps a section's JSON Schema to it; the React widgets
 * in `src/admin/form/` only render nodes. Missing hints degrade to the standard keywords: a humanised property name
 * for a missing title, a text input for a string, no charset check.
 */
export type FieldNode =
  | ObjectNode
  | ArrayNode
  | TupleNode
  | StringNode
  | NumberNode
  | BooleanNode
  | EnumNode
  | ConstNode
  | NullableNode
  | UnionNode;

interface NodeBase {
  label: string;
  /** The field's help text. */
  description: string | null;
  /** `x-ui-rules`: cross-field rules, as sentences. */
  rules: readonly string[];
  schema: JsonSchema;
}

export interface CombinedLength {
  fields: readonly string[];
  gap: number;
  maxLength: number;
}

/** An object, or a record keyed by an enum (`propertyNames`): its keys are fixed, so it is edited like an object. */
export interface ObjectNode extends NodeBase {
  kind: "object";
  /** In schema order, which is form order. */
  properties: readonly PropertyNode[];
  /** `x-ddi-combined-length`: fields drawn on one row that share its width. */
  combinedLength: CombinedLength | null;
}

export interface PropertyNode {
  key: string;
  node: FieldNode;
  required: boolean;
}

export interface ArrayNode extends NodeBase {
  kind: "array";
  item: FieldNode;
  minItems: number;
  maxItems: number | null;
  /** `x-ui-new-item`, else built from the item schema. */
  newItem: JsonValue | null;
  /** `x-ui-unique-by`. */
  uniqueBy: readonly string[];
}

/** A fixed-length array (`prefixItems`), such as five status rows: no add, remove or reorder. */
export interface TupleNode extends NodeBase {
  kind: "tuple";
  items: readonly FieldNode[];
}

export type StringWidget = "text" | "textarea" | "url" | "email";

export interface StringNode extends NodeBase {
  kind: "string";
  widget: StringWidget;
  minLength: number | null;
  maxLength: number | null;
  /** The characters the field may use (`x-ddi-charset`), compared upper-cased; null when unrestricted. */
  charset: ReadonlySet<string> | null;
  /** `x-ddi-wrap`: the text word-wraps into this many rows of this many characters. */
  wrap: { chars: number; rows: number } | null;
  /** `x-ui-options-from`: the value must be one found at this path from the section root. */
  optionsFrom: string | null;
}

export interface NumberNode extends NodeBase {
  kind: "number";
  integer: boolean;
  minimum: number | null;
  maximum: number | null;
  exclusiveMinimum: number | null;
  exclusiveMaximum: number | null;
}

export interface BooleanNode extends NodeBase {
  kind: "boolean";
}

export interface EnumNode extends NodeBase {
  kind: "enum";
  options: readonly string[];
}

/** A fixed value, such as a union variant's tag: nothing to edit. */
export interface ConstNode extends NodeBase {
  kind: "const";
  value: unknown;
}

/** `anyOf: [X, {type: null}]`: the field may be empty. */
export interface NullableNode extends NodeBase {
  kind: "nullable";
  inner: FieldNode;
}

/** A tagged union (`oneOf` with a `discriminator`), such as a fuel tank's motion. */
export interface UnionNode extends NodeBase {
  kind: "union";
  discriminator: string;
  variants: readonly UnionVariant[];
}

export interface UnionVariant {
  tag: string;
  node: ObjectNode;
}

const ACRONYMS: ReadonlySet<string> = new Set([
  "url",
  "id",
  "pdf",
  "aoa",
  "mu",
  "mc",
  "sms",
  "cpu",
  "ram",
]);

/** "loadedMuId" → "Loaded MU ID", for a property without a title. */
export function humanise(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) =>
      ACRONYMS.has(word.toLowerCase())
        ? word.toUpperCase()
        : word.toLowerCase(),
    );
  const [first = "", ...rest] = words;
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(" ");
}

/** Pydantic's generated title for a field: the alias, Python-`str.title()`d ("loadedMuId" → "Loadedmuid"). */
function pydanticTitle(key: string): string {
  return key
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** A field's own title, unless it is only Pydantic's generated one, which reads worse than the key humanised. */
function labelFor(key: string, propertySchema: JsonSchema): string {
  const title = propertySchema.title;
  return title !== undefined && title !== pydanticTitle(key)
    ? title
    : humanise(key);
}

export const STROKE_FONT = "stroke-font";

function charsetOf(schema: JsonSchema): ReadonlySet<string> | null {
  const charset = schema["x-ddi-charset"];
  if (charset === undefined) {
    return null;
  }
  if (charset !== STROKE_FONT) {
    throw new Error(`unknown x-ddi-charset ${charset}`);
  }
  return DDI_GLYPHS;
}

function stringWidget(schema: JsonSchema): StringWidget {
  const widget = schema["x-ui-widget"];
  switch (widget) {
    case undefined:
      return schema.format === "email"
        ? "email"
        : schema.format === "uri"
          ? "url"
          : "text";
    case "textarea":
    case "url":
    case "email":
      return widget;
    default:
      throw new Error(`unknown x-ui-widget ${widget}`);
  }
}

function isNullSchema(schema: JsonSchema): boolean {
  return schema.type === "null";
}

/** `allOf` parts merged into the schema. Only validation reads their `pattern`s, and Ajv reads the original. */
function withAllOf(root: SchemaRoot, schema: JsonSchema): JsonSchema {
  if (schema.allOf === undefined) {
    return schema;
  }
  const merged: JsonSchema = { ...schema };
  delete merged.allOf;
  for (const part of schema.allOf) {
    Object.assign(merged, { ...resolveRef(root, part), ...merged });
  }
  return merged;
}

const MAX_DEPTH = 24;

/** The form model for `propertySchema`, found at property (or index) `key`. */
export function buildField(
  root: SchemaRoot,
  propertySchema: JsonSchema,
  key: string,
  depth = 0,
): FieldNode {
  if (depth > MAX_DEPTH) {
    throw new Error(`schema nests deeper than ${MAX_DEPTH} at ${key}`);
  }
  const schema = withAllOf(root, resolveRef(root, propertySchema));
  const base: NodeBase = {
    label: labelFor(key, propertySchema),
    description: schema.description ?? null,
    rules: schema["x-ui-rules"] ?? [],
    schema,
  };
  const nested = (child: JsonSchema, childKey: string): FieldNode =>
    buildField(root, child, childKey, depth + 1);

  if (schema.anyOf !== undefined) {
    const present = schema.anyOf.filter((option) => !isNullSchema(option));
    if (present.length === 1 && present.length < schema.anyOf.length) {
      return { ...base, kind: "nullable", inner: nested(present[0], key) };
    }
    throw new Error(`unsupported anyOf at ${key}`);
  }
  if (schema.oneOf !== undefined) {
    return buildUnion(root, base, schema, key, depth);
  }
  if (schema.const !== undefined) {
    return { ...base, kind: "const", value: schema.const };
  }
  if (schema.enum !== undefined) {
    return { ...base, kind: "enum", options: schema.enum.map(String) };
  }
  switch (schema.type) {
    case "object":
      return buildObject(root, base, schema, depth);
    case "array":
      return buildArray(base, schema, key, nested);
    case "string":
      return {
        ...base,
        kind: "string",
        widget: stringWidget(schema),
        minLength: schema.minLength ?? null,
        maxLength: schema.maxLength ?? null,
        charset: charsetOf(schema),
        wrap: schema["x-ddi-wrap"] ?? null,
        optionsFrom: schema["x-ui-options-from"] ?? null,
      };
    case "integer":
    case "number":
      return {
        ...base,
        kind: "number",
        integer: schema.type === "integer",
        minimum: schema.minimum ?? null,
        maximum: schema.maximum ?? null,
        exclusiveMinimum: schema.exclusiveMinimum ?? null,
        exclusiveMaximum: schema.exclusiveMaximum ?? null,
      };
    case "boolean":
      return { ...base, kind: "boolean" };
  }
  throw new Error(`unsupported schema at ${key}: ${JSON.stringify(schema)}`);
}

function buildObject(
  root: SchemaRoot,
  base: NodeBase,
  schema: JsonSchema,
  depth: number,
): ObjectNode {
  const combinedLength = schema["x-ddi-combined-length"] ?? null;
  const keyEnum =
    schema.propertyNames === undefined
      ? undefined
      : resolveRef(root, schema.propertyNames).enum;
  if (
    keyEnum !== undefined &&
    typeof schema.additionalProperties === "object"
  ) {
    const valueSchema = schema.additionalProperties;
    return {
      ...base,
      kind: "object",
      combinedLength,
      properties: keyEnum.map(String).map((key) => ({
        key,
        node: { ...buildField(root, valueSchema, key, depth + 1), label: key },
        required: true,
      })),
    };
  }
  const required = new Set(schema.required ?? []);
  return {
    ...base,
    kind: "object",
    combinedLength,
    properties: Object.entries(schema.properties ?? {}).map(([key, child]) => ({
      key,
      node: buildField(root, child, key, depth + 1),
      required: required.has(key),
    })),
  };
}

function isJsonValue(value: unknown): value is JsonValue {
  // The schema is parsed JSON, so any value in it is a JSON value.
  return value !== undefined;
}

function buildArray(
  base: NodeBase,
  schema: JsonSchema,
  key: string,
  nested: (child: JsonSchema, childKey: string) => FieldNode,
): ArrayNode | TupleNode {
  if (schema.prefixItems !== undefined) {
    return {
      ...base,
      kind: "tuple",
      items: schema.prefixItems.map((item, index) => ({
        ...nested(item, `${key} ${index + 1}`),
        label: `${base.label} ${index + 1}`,
      })),
    };
  }
  if (schema.items === undefined) {
    throw new Error(`array without items at ${key}`);
  }
  const newItem: unknown = schema["x-ui-new-item"];
  return {
    ...base,
    kind: "array",
    item: nested(schema.items, "item"),
    minItems: schema.minItems ?? 0,
    maxItems: schema.maxItems ?? null,
    newItem: isJsonValue(newItem) ? newItem : null,
    uniqueBy: schema["x-ui-unique-by"] ?? [],
  };
}

function buildUnion(
  root: SchemaRoot,
  base: NodeBase,
  schema: JsonSchema,
  key: string,
  depth: number,
): UnionNode {
  const discriminator = schema.discriminator?.propertyName;
  if (discriminator === undefined || schema.oneOf === undefined) {
    throw new Error(`oneOf without a discriminator at ${key}`);
  }
  const variants = schema.oneOf.map((option) => {
    const node = buildField(root, option, key, depth + 1);
    if (node.kind !== "object") {
      throw new Error(`union variant at ${key} is not an object`);
    }
    const tagNode = node.properties.find(
      (property) => property.key === discriminator,
    )?.node;
    if (tagNode?.kind !== "const") {
      throw new Error(`union variant at ${key} has no const ${discriminator}`);
    }
    return { tag: String(tagNode.value), node };
  });
  return { ...base, kind: "union", discriminator, variants };
}

/** A section document's form model. */
export function buildSectionFields(
  root: SchemaRoot,
  schemaName: string,
): FieldNode {
  return buildField(
    root,
    { $ref: `#/components/schemas/${schemaName}` },
    schemaName,
  );
}
