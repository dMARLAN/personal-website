export const FONT_IDS = [
  "F100",
  "F120",
  "F150",
  "F200",
  "F120_WIDE",
  "F150_WIDE",
  "F150_X_WIDE",
  "BIT",
] as const;

export type FontId = (typeof FONT_IDS)[number];

/** A `stringdefs` entry: glyph size, inter-character gap and interline gap, all in DI. */
export interface FontMetrics {
  width: number;
  height: number;
  interchar: number;
  interline: number;
}

/** The stroke font's authoring cell, which every glyph scales from [fnd §3.2]. */
export const GLYPH_CELL = { width: 12, height: 20 } as const;

// [fnd §3.3]; BIT [pgB §0]
export const FONTS: Readonly<Record<FontId, FontMetrics>> = {
  F100: { width: 12, height: 20, interchar: 4, interline: 5 },
  F120: { width: 14, height: 24, interchar: 6, interline: 6 },
  F150: { width: 18, height: 30, interchar: 6, interline: 12 },
  F200: { width: 24, height: 40, interchar: 12, interline: 12 },
  F120_WIDE: { width: 14, height: 24, interchar: 9, interline: 12 },
  F150_WIDE: { width: 18, height: 30, interchar: 9, interline: 12 },
  F150_X_WIDE: { width: 24, height: 30, interchar: 9, interline: 12 },
  BIT: { width: 14, height: 24, interchar: 6, interline: 8 },
};

/** `addStrokeArc` splits a full turn into at most this many segments. */
export const ARC_SEGMENTS_PER_TURN = 64;
