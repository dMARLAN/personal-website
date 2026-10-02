import type { JsonValue } from "./jsonSchema";
import { childPointer, jsonEqual, ROOT, type Pointer } from "./pointer";

export interface Change {
  pointer: Pointer;
  /** Absent when the place is new in `after`. */
  before: JsonValue | undefined;
  /** Absent when the place is gone from `after`. */
  after: JsonValue | undefined;
}

function isObject(
  value: JsonValue | undefined,
): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The leaf-level differences between two documents, for the publish-conflict dialog. */
export function diffDocuments(
  before: JsonValue | undefined,
  after: JsonValue | undefined,
  pointer: Pointer = ROOT,
): Change[] {
  if (jsonEqual(before, after)) {
    return [];
  }
  if (isObject(before) && isObject(after)) {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
    return keys.flatMap((key) =>
      diffDocuments(before[key], after[key], childPointer(pointer, key)),
    );
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length);
    return Array.from({ length }, (_, index) =>
      diffDocuments(before[index], after[index], childPointer(pointer, index)),
    ).flat();
  }
  return [{ pointer, before, after }];
}
