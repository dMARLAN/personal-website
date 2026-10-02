import type { SyntaxNode, Tree } from "@lezer/common";
import { pointerSegments, type Pointer } from "../schema/pointer";

const VALUE_NODES: ReadonlySet<string> = new Set([
  "True",
  "False",
  "Null",
  "Number",
  "String",
  "Object",
  "Array",
]);

function children(node: SyntaxNode): SyntaxNode[] {
  const list: SyntaxNode[] = [];
  for (let child = node.firstChild; child !== null; child = child.nextSibling) {
    list.push(child);
  }
  return list;
}

function propertyKey(property: SyntaxNode, text: string): string | null {
  const name = property.getChild("PropertyName");
  if (name === null) {
    return null;
  }
  try {
    const key: unknown = JSON.parse(text.slice(name.from, name.to));
    return typeof key === "string" ? key : null;
  } catch {
    // A half-typed key cannot be the one a pointer names.
    return null;
  }
}

/**
 * The text range of the value a JSON Pointer names, found in the editor's syntax tree, so a schema message can mark
 * the exact place. A missing place (a required property that is absent) marks its parent; a missing property's
 * parent object is marked at its key list.
 */
export function pointerRange(
  tree: Tree,
  text: string,
  pointer: Pointer,
): { from: number; to: number } | null {
  const top = tree.topNode.firstChild;
  if (top === null || !VALUE_NODES.has(top.name)) {
    return null;
  }
  let node: SyntaxNode = top;
  let markKey: SyntaxNode | null = null;
  for (const segment of pointerSegments(pointer)) {
    let next: SyntaxNode | null = null;
    if (node.name === "Object") {
      const property = children(node).find(
        (child) =>
          child.name === "Property" && propertyKey(child, text) === segment,
      );
      if (property !== undefined) {
        markKey = property.getChild("PropertyName");
        next =
          children(property).find((child) => VALUE_NODES.has(child.name)) ??
          null;
      }
    } else if (node.name === "Array") {
      next =
        children(node).filter((child) => VALUE_NODES.has(child.name))[
          Number(segment)
        ] ?? null;
      if (next !== null) {
        markKey = null;
      }
    }
    if (next === null) {
      break;
    }
    node = next;
  }
  // A container's whole range would underline pages of text: mark its key, or its opening bracket.
  if (node.name === "Object" || node.name === "Array") {
    return markKey === null
      ? { from: node.from, to: node.from + 1 }
      : { from: markKey.from, to: markKey.to };
  }
  return { from: node.from, to: node.to };
}
