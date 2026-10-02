import type { FieldNode, NumberNode } from "./fields";
import type { JsonValue } from "./jsonSchema";

function isJsonValue(value: unknown): value is JsonValue {
  return value !== undefined;
}

function numberDefault(node: NumberNode): number {
  if (node.minimum !== null) {
    return node.minimum;
  }
  if (node.exclusiveMinimum !== null) {
    return node.exclusiveMinimum + 1;
  }
  if (node.maximum !== null && node.maximum < 0) {
    return node.maximum;
  }
  return 0;
}

/** The value a new field or array item starts from: the schema's `default`, else the emptiest valid shape. */
export function defaultValue(node: FieldNode): JsonValue {
  const declared: unknown = node.schema.default;
  if (isJsonValue(declared)) {
    return structuredClone(declared);
  }
  switch (node.kind) {
    case "object":
      return Object.fromEntries(
        node.properties
          .filter((property) => property.required)
          .map((property) => [property.key, defaultValue(property.node)]),
      );
    case "array":
      return Array.from({ length: node.minItems }, () =>
        defaultValue(node.item),
      );
    case "tuple":
      return node.items.map(defaultValue);
    case "string":
      return "";
    case "number":
      return numberDefault(node);
    case "boolean":
      return false;
    case "enum":
      return node.options[0];
    case "const":
      if (!isJsonValue(node.value)) {
        throw new Error(`const ${node.label} has no value`);
      }
      return node.value;
    case "nullable":
      return null;
    case "union":
      return defaultValue(node.variants[0].node);
  }
}
