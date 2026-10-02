import type { FieldNode, PropertyNode } from "./fields";
import { childPointer, ROOT, type Pointer } from "./pointer";

/** The API's 422 detail item (FastAPI's `ValidationError`): only `loc` and `msg` matter here. */
export interface LocatedMessage {
  loc: readonly (string | number)[];
  msg: string;
}

/**
 * The field a 422 `loc` names. FastAPI starts it with `body`; Pydantic puts a tagged union's tag between the union
 * and the variant's field (`store › rack › amount`), which is not a place in the document, so it is skipped. A
 * segment the schema does not know stops the walk: the issue lands on the deepest field it reached, such as a
 * row's two fields that are too long together, which Pydantic reports on the row.
 */
export function locToPointer(
  node: FieldNode,
  loc: readonly (string | number)[],
): Pointer {
  const segments = loc[0] === "body" ? loc.slice(1) : loc;
  let pointer = ROOT;
  let current: FieldNode = node;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const next = descend(current, segment);
    if (next === null) {
      break;
    }
    if (next.skip) {
      current = next.node;
      continue;
    }
    pointer = childPointer(pointer, segment);
    current = next.node;
  }
  return pointer;
}

function descend(
  node: FieldNode,
  segment: string | number,
): { node: FieldNode; skip: boolean } | null {
  switch (node.kind) {
    case "object": {
      const property = node.properties.find(({ key }) => key === segment);
      return property === undefined
        ? null
        : { node: property.node, skip: false };
    }
    case "array":
      return typeof segment === "number"
        ? { node: node.item, skip: false }
        : null;
    case "tuple": {
      const item =
        typeof segment === "number" ? node.items[segment] : undefined;
      return item === undefined ? null : { node: item, skip: false };
    }
    case "nullable":
      return descend(node.inner, segment);
    case "union": {
      const variant = node.variants.find(({ tag }) => tag === segment);
      return variant === undefined ? null : { node: variant.node, skip: true };
    }
    case "string":
    case "number":
    case "boolean":
    case "enum":
    case "const":
      return null;
  }
}

/** "Tags › 1": a field's place for people, one-based, from the pointer. */
export function describePointer(node: FieldNode, pointer: Pointer): string {
  if (pointer === ROOT) {
    return "The document";
  }
  const labels: string[] = [];
  let current: FieldNode | null = node;
  for (const segment of pointer.slice(1).split("/")) {
    if (current === null) {
      labels.push(segment);
      continue;
    }
    const index = Number(segment);
    switch (current.kind) {
      case "object": {
        const property: PropertyNode | undefined = current.properties.find(
          ({ key }) => key === segment,
        );
        labels.push(property?.node.label ?? segment);
        current = property?.node ?? null;
        break;
      }
      case "array":
        labels.push(String(index + 1));
        current = current.item;
        break;
      case "tuple":
        labels.push(String(index + 1));
        current = current.items[index] ?? null;
        break;
      default:
        labels.push(segment);
        current = null;
    }
    while (current?.kind === "nullable") {
      current = current.inner;
    }
  }
  return labels.join(" › ");
}
