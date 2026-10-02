import type { ServerRow, ServerSnapshot } from "@/content/types";

/** A reading as the glass draws it: fixed decimals, then the row's suffix, for example "3.40" or "41D". */
export function formatReading(value: number, row: ServerRow): string {
  return value.toFixed(row.decimals) + row.suffix;
}

/** A reading as the semantic layer reads it, with its unit, for example "46 °C". */
export function describeReading(value: number, row: ServerRow): string {
  const number = value.toFixed(row.decimals);
  return row.unit === "" ? number : `${number} ${row.unit}`;
}

/** The ENG value columns for `snapshot`: one left/right pair per row, top row first. */
export function engValues(
  rows: readonly ServerRow[],
  snapshot: ServerSnapshot,
): [string, string][] {
  const [left, right] = snapshot.hosts;
  return rows.map((row) => [
    formatReading(left[row.metric], row),
    formatReading(right[row.metric], row),
  ]);
}
