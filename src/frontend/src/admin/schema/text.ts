/** Characters as Python's `len` counts them (code points), which is how the API checks `maxLength`. */
export function characterCount(text: string): number {
  return [...text].length;
}

export type CounterTone = "ok" | "near" | "over";

/** Amber from 85 % of the limit (or its last character), red past it. */
export function counterTone(length: number, maxLength: number): CounterTone {
  if (length > maxLength) {
    return "over";
  }
  return length >= Math.min(maxLength - 1, Math.ceil(maxLength * 0.85)) &&
    length > 0
    ? "near"
    : "ok";
}

/** The distinct characters of `text` outside `charset`, in order of first use. Lower case counts as upper case. */
export function invalidCharacters(
  text: string,
  charset: ReadonlySet<string>,
): string[] {
  const invalid = new Set<string>();
  for (const character of text) {
    const upper = character.toUpperCase();
    if (!charset.has(upper) || characterCount(upper) !== 1) {
      invalid.add(character);
    }
  }
  return [...invalid];
}
