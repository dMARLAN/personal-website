import Ajv2020, {
  type ErrorObject,
  type ValidateFunction,
} from "ajv/dist/2020";
import { wrapText, WordTooLongError } from "@/ddi/font/wrap";
import type {
  ArrayNode,
  FieldNode,
  ObjectNode,
  StringNode,
  UnionNode,
} from "./fields";
import type { JsonValue, SchemaRoot } from "./jsonSchema";
import { childPointer, ROOT, type Pointer } from "./pointer";
import { characterCount, invalidCharacters } from "./text";

/** A problem with one field, from the client's checks or the API's 422. */
export interface FieldIssue {
  pointer: Pointer;
  message: string;
}

/** An issue that names the schema keyword (or `x-` key) that failed. */
export interface SchemaIssue extends FieldIssue {
  keyword: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Ajv rejects OpenAPI's `discriminator.mapping`; its `discriminator` option reads the tag from each `oneOf`
 * branch's `const` instead, which FastAPI always emits, so the mapping is redundant here.
 */
function withoutDiscriminatorMappings(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(withoutDiscriminatorMappings);
  }
  if (!isRecord(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      key === "discriminator" && isRecord(child)
        ? { propertyName: child.propertyName }
        : withoutDiscriminatorMappings(child),
    ]),
  );
}

const ROOT_ID = "openapi";

/** One compiled validator per section schema, over one Ajv instance holding the API's schemas. */
export class SchemaValidator {
  private readonly ajv: Ajv2020;
  private readonly compiled = new Map<string, ValidateFunction>();

  constructor(root: SchemaRoot) {
    // strict: false lets the `x-` keys through: they describe the form, they are not validation keywords.
    this.ajv = new Ajv2020({
      allErrors: true,
      strict: false,
      discriminator: true,
    });
    const schemas = withoutDiscriminatorMappings(root);
    if (!isRecord(schemas)) {
      throw new Error("the OpenAPI schemas are not an object");
    }
    this.ajv.addSchema({ ...schemas, $id: ROOT_ID });
  }

  private validator(schemaName: string): ValidateFunction {
    let validate = this.compiled.get(schemaName);
    if (validate === undefined) {
      validate = this.ajv.compile({
        $ref: `${ROOT_ID}#/components/schemas/${schemaName}`,
      });
      this.compiled.set(schemaName, validate);
    }
    return validate;
  }

  /** The schema's complaints about `document`, one per field, in words. */
  validate(schemaName: string, document: unknown): SchemaIssue[] {
    const validate = this.validator(schemaName);
    return validate(document) ? [] : toIssues(validate.errors ?? []);
  }
}

function messageFor(error: ErrorObject): string {
  const params: Record<string, unknown> = error.params;
  switch (error.keyword) {
    case "maxLength":
      return `Too long: at most ${String(params.limit)} characters.`;
    case "minLength":
      return params.limit === 1
        ? "Required."
        : `Too short: at least ${String(params.limit)} characters.`;
    case "pattern":
      return `Does not match the format ${String(params.pattern)}.`;
    case "required":
      return "Required.";
    case "additionalProperties":
      return "Not a field of this section.";
    case "maxItems":
      return `At most ${String(params.limit)} items.`;
    case "minItems":
      return `At least ${String(params.limit)} items.`;
    case "minimum":
    case "maximum":
    case "exclusiveMinimum":
    case "exclusiveMaximum":
      return `Must be ${String(params.comparison)} ${String(params.limit)}.`;
    case "type":
      return `Must be ${params.type === "integer" ? "a whole number" : `a ${String(params.type)}`}.`;
    case "enum":
      return Array.isArray(params.allowedValues)
        ? `Must be one of ${params.allowedValues.join(", ")}.`
        : "Not one of the allowed values.";
    default:
      return `${error.message ?? "Invalid"}.`;
  }
}

function errorPointer(error: ErrorObject): Pointer {
  const params: Record<string, unknown> = error.params;
  if (
    error.keyword === "required" &&
    typeof params.missingProperty === "string"
  ) {
    return childPointer(error.instancePath, params.missingProperty);
  }
  if (
    error.keyword === "additionalProperties" &&
    typeof params.additionalProperty === "string"
  ) {
    return childPointer(error.instancePath, params.additionalProperty);
  }
  // Ajv's instancePath is already a JSON Pointer.
  return error.instancePath;
}

/** Ajv's errors as field issues: the `anyOf` wrapper and the "or null" branch of a nullable field are dropped. */
function toIssues(errors: readonly ErrorObject[]): SchemaIssue[] {
  const seen = new Set<string>();
  const issues: SchemaIssue[] = [];
  for (const error of errors) {
    const isNullBranch =
      error.keyword === "type" && error.params.type === "null";
    if (
      error.keyword === "anyOf" ||
      error.keyword === "oneOf" ||
      error.keyword === "allOf" ||
      isNullBranch
    ) {
      continue;
    }
    const issue = {
      pointer: errorPointer(error),
      message: messageFor(error),
      keyword: error.keyword,
    };
    const key = `${issue.pointer}\n${issue.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      issues.push(issue);
    }
  }
  return issues;
}

/** The values at `path` from the document root, where `*` is every index or key: `categories/*\/legend`. */
export function valuesAt(
  document: JsonValue | undefined,
  path: string,
): JsonValue[] {
  let current: (JsonValue | undefined)[] = [document];
  for (const segment of path.split("/")) {
    current = current.flatMap((value): (JsonValue | undefined)[] => {
      if (segment === "*") {
        return Array.isArray(value)
          ? value
          : isRecord(value)
            ? Object.values(value)
            : [];
      }
      if (Array.isArray(value)) {
        return [value[Number(segment)]];
      }
      return isRecord(value) ? [value[segment]] : [];
    });
  }
  return current.filter((value): value is JsonValue => value !== undefined);
}

/** How many rows `text` wraps to, or the word too long to wrap. */
export function wrappedRows(
  text: string,
  chars: number,
): { rows: number } | { tooLong: string } {
  try {
    return { rows: wrapText(text, chars).length };
  } catch (error) {
    if (error instanceof WordTooLongError) {
      const word =
        text.split(/\s+/).find((candidate) => candidate.length > chars) ?? "";
      return { tooLong: word };
    }
    throw error;
  }
}

function stringIssues(
  node: StringNode,
  text: string,
  pointer: Pointer,
  document: JsonValue,
): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  if (node.charset !== null) {
    const invalid = invalidCharacters(text, node.charset);
    if (invalid.length > 0) {
      issues.push({
        pointer,
        keyword: "x-ddi-charset",
        message: `The glass cannot draw ${invalid.map((character) => JSON.stringify(character)).join(" ")}.`,
      });
    }
  }
  if (node.wrap !== null) {
    const wrapped = wrappedRows(text, node.wrap.chars);
    if ("tooLong" in wrapped) {
      issues.push({
        pointer,
        keyword: "x-ddi-wrap",
        message: `“${wrapped.tooLong}” is longer than ${node.wrap.chars} characters, so it cannot wrap.`,
      });
    } else if (wrapped.rows > node.wrap.rows) {
      issues.push({
        pointer,
        keyword: "x-ddi-wrap",
        message: `Wraps to ${wrapped.rows} rows; the slot fits ${node.wrap.rows} rows of ${node.wrap.chars} characters.`,
      });
    }
  }
  if (node.optionsFrom !== null) {
    const options = valuesAt(document, node.optionsFrom);
    if (!options.includes(text)) {
      issues.push({
        pointer,
        keyword: "x-ui-options-from",
        message: `Must be one of ${options.map(String).join(", ")}.`,
      });
    }
  }
  return issues;
}

function objectIssues(
  node: ObjectNode,
  value: Record<string, JsonValue>,
  pointer: Pointer,
): SchemaIssue[] {
  const combined = node.combinedLength;
  if (combined === null) {
    return [];
  }
  const texts = combined.fields.map((field) => value[field]);
  if (!texts.every((text): text is string => typeof text === "string")) {
    return [];
  }
  const length = texts.reduce(
    (total, text) => total + characterCount(text),
    combined.gap,
  );
  if (length <= combined.maxLength) {
    return [];
  }
  // On the last field, as the API reports it.
  return [
    {
      pointer: childPointer(
        pointer,
        combined.fields[combined.fields.length - 1],
      ),
      keyword: "x-ddi-combined-length",
      message: `${combined.fields.join(" and ")} together are ${length} characters; the row fits ${combined.maxLength}.`,
    },
  ];
}

function arrayIssues(
  node: ArrayNode,
  items: readonly JsonValue[],
  pointer: Pointer,
): SchemaIssue[] {
  return node.uniqueBy.flatMap((key) => {
    const firstAt = new Map<string, number>();
    return items.flatMap((item, index) => {
      const entry = isRecord(item) ? item[key] : undefined;
      if (entry === undefined) {
        return [];
      }
      const seen = JSON.stringify(entry);
      const earlier = firstAt.get(seen);
      if (earlier === undefined) {
        firstAt.set(seen, index);
        return [];
      }
      return [
        {
          pointer: childPointer(childPointer(pointer, index), key),
          keyword: "x-ui-unique-by",
          message: `Must be unique: item ${earlier + 1} has it too.`,
        },
      ];
    });
  });
}

export function unionVariantOf(
  node: UnionNode,
  value: JsonValue | undefined,
): UnionNode["variants"][number] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const tag = value[node.discriminator];
  return node.variants.find((variant) => variant.tag === tag);
}

/**
 * The rules JSON Schema cannot express, which the API's `x-` keys describe: the glyph set, word wrap, a row's
 * combined length, unique items and options from elsewhere in the document. Checked here so the form flags them
 * as they are typed; the API enforces them all on save.
 */
export function hintIssues(
  node: FieldNode,
  value: JsonValue | undefined,
  document: JsonValue,
  pointer: Pointer = ROOT,
): SchemaIssue[] {
  switch (node.kind) {
    case "string":
      return typeof value === "string"
        ? stringIssues(node, value, pointer, document)
        : [];
    case "object":
      return isRecord(value)
        ? [
            ...objectIssues(node, value, pointer),
            ...node.properties.flatMap((property) =>
              hintIssues(
                property.node,
                value[property.key],
                document,
                childPointer(pointer, property.key),
              ),
            ),
          ]
        : [];
    case "array":
      return Array.isArray(value)
        ? [
            ...arrayIssues(node, value, pointer),
            ...value.flatMap((item, index) =>
              hintIssues(
                node.item,
                item,
                document,
                childPointer(pointer, index),
              ),
            ),
          ]
        : [];
    case "tuple":
      return Array.isArray(value)
        ? node.items.flatMap((item, index) =>
            hintIssues(
              item,
              value[index],
              document,
              childPointer(pointer, index),
            ),
          )
        : [];
    case "nullable":
      return value === null
        ? []
        : hintIssues(node.inner, value, document, pointer);
    case "union": {
      const variant = unionVariantOf(node, value);
      return variant === undefined
        ? []
        : hintIssues(variant.node, value, document, pointer);
    }
    case "number":
    case "boolean":
    case "enum":
    case "const":
      return [];
  }
}
