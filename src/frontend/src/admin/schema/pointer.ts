import type { JsonValue } from "./jsonSchema";

/**
 * A field's place in a section document as a JSON Pointer (RFC 6901): "" is the document, "/status/0/value" a
 * field. Pointers are strings, so a field's props stay equal between renders and memoised fields skip re-rendering.
 */
export type Pointer = string;

export const ROOT: Pointer = "";

function escape(segment: string): string {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}

function unescape(segment: string): string {
  return segment.replaceAll("~1", "/").replaceAll("~0", "~");
}

export function childPointer(pointer: Pointer, key: string | number): Pointer {
  return `${pointer}/${escape(String(key))}`;
}

export function pointerSegments(pointer: Pointer): string[] {
  return pointer === ROOT ? [] : pointer.slice(1).split("/").map(unescape);
}

export function pointerFromPath(path: readonly (string | number)[]): Pointer {
  return path.reduce<Pointer>(childPointer, ROOT);
}

/** True when `pointer` is `ancestor` or inside it. */
export function isWithin(pointer: Pointer, ancestor: Pointer): boolean {
  return pointer === ancestor || pointer.startsWith(`${ancestor}/`);
}

function step(
  value: JsonValue | undefined,
  segment: string,
): JsonValue | undefined {
  if (Array.isArray(value)) {
    return value[Number(segment)];
  }
  if (typeof value === "object" && value !== null) {
    return value[segment];
  }
  return undefined;
}

/** The value at `pointer`, or undefined when the document has no such place. */
export function getAt(
  value: JsonValue,
  pointer: Pointer,
): JsonValue | undefined {
  return pointerSegments(pointer).reduce<JsonValue | undefined>(step, value);
}

/** A copy of `value` with `next` at `pointer`. Untouched branches keep their identity. */
export function setAt(
  value: JsonValue,
  pointer: Pointer,
  next: JsonValue,
): JsonValue {
  return setSegments(value, pointerSegments(pointer), next);
}

function setSegments(
  value: JsonValue,
  segments: readonly string[],
  next: JsonValue,
): JsonValue {
  if (segments.length === 0) {
    return next;
  }
  const [head, ...rest] = segments;
  if (Array.isArray(value)) {
    const index = Number(head);
    const copy = [...value];
    copy[index] = setSegments(value[index], rest, next);
    return copy;
  }
  if (typeof value === "object" && value !== null) {
    return { ...value, [head]: setSegments(value[head], rest, next) };
  }
  throw new Error(`cannot set ${head} inside ${JSON.stringify(value)}`);
}

/** Structural equality of two JSON values. */
export function jsonEqual(
  a: JsonValue | undefined,
  b: JsonValue | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a)) {
    return (
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((item, index) => jsonEqual(item, b[index]))
    );
  }
  if (
    typeof a === "object" &&
    a !== null &&
    typeof b === "object" &&
    b !== null &&
    !Array.isArray(b)
  ) {
    const keys = Object.keys(a);
    return (
      keys.length === Object.keys(b).length &&
      keys.every((key) => key in b && jsonEqual(a[key], b[key]))
    );
  }
  return false;
}
