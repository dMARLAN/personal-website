export const FONT_IDS = [
  "F100",
  "F120",
  "F150",
  "F200",
  "F120_WIDE",
  "F150_WIDE",
  "F150_X_WIDE",
  "BIT",
  "F120_FCS",
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
  // FCS.lua `customStringDef`: 120 % glyphs with interchar 14, for the SV labels and the surface block.
  F120_FCS: { width: 14, height: 24, interchar: 14, interline: 6 },
};

/** `addStrokeArc` splits a full turn into at most this many segments. */
export const ARC_SEGMENTS_PER_TURN = 64;

// ---------------------------------------------------------------------------------------------------------------
// Frame geometry, in DI (docs/design.md section 4.2). "(ours)" marks our own design choices.
// ---------------------------------------------------------------------------------------------------------------

/** The glass's short side: the MDI mask at ±544.8 DI [fnd §1.2]. */
export const GLASS_SHORT = 1089.6;
export const GLASS_HALF = GLASS_SHORT / 2;
/** The drawable symbology square is ±512 DI [fnd §0]. */
export const SYMBOLOGY_HALF = 512;
/** MDI glass corner radius [fnd §1.2]. */
export const SCREEN_RADIUS = 174;
/**
 * (ours) The bezel band, the same depth on all four edges. A 42 DI cap sits midway between the viewport edge and the
 * lip ring, so it clears both by 7 DI. The real side border is about 185 DI [bzl §3].
 */
export const BAND = 64;
/** (ours) Cap side and corner radius. The real cap:pitch ratio is 0.56 and the radius 14 % of the side [bzl §3]. */
export const OSB_CAP = 42;
export const OSB_CAP_RADIUS = 6;
/** (ours) How far a pressed cap moves toward the glass. DCS snaps the cap with no animation [bzl §1]. */
export const OSB_PRESS_OFFSET = 2;
/** The recessed ring around the glass [bzl §3]. */
export const LIP_RING = 8;
/** (ours) The clear gap between a cap and the lip ring: what is left of the band once the cap is centred in it. */
export const OSB_LIP_GAP = (BAND - LIP_RING - OSB_CAP) / 2;
/** (ours) BRT and CONT, sized to the 64 × 64 corner cell. */
export const KNOB_DIAMETER = 50;
/** (ours) BRT and CONT placards: a rounded rect with condensed caps 12 DI high [bzl §3]. */
export const PLACARD = { width: 46, height: 22, capHeight: 12 } as const;
/** (ours) Holds the deepest edge-attached element, the BIT group rule (x −503 to −303) [pgB §3]. */
export const EDGE_STRIP_DEPTH = 260;
/** (ours) The inset vignette's blur and spread over the screen tint [fnd §4.2]. */
export const VIGNETTE = { blur: 120, spread: 20 } as const;

/**
 * (ours) The optional bloom's blur, in DI. It imitates DCS's engine-wide post-process bloom, which is not part of the
 * module [fnd §4.3]. The night theme turns it on (section 6.3).
 */
export const BLOOM_BLUR = 8;

/** Viewport size in DI that fits exactly: glass plus both side bands, and glass plus top and bottom bands. */
export const FRAME_MIN = {
  width: GLASS_SHORT + 2 * BAND,
  height: GLASS_SHORT + 2 * BAND,
} as const;

/** `--k`, the pixels per DI, as a CSS length: the largest scale at which the whole frame fits the viewport. */
export const FRAME_SCALE_CSS = `min(calc(100vw / ${FRAME_MIN.width}), calc(100dvh / ${FRAME_MIN.height}))`;

// ---------------------------------------------------------------------------------------------------------------
// OSB legends: `add_PB_label` and `addMenuLabel` in MPD_page_defs.lua [fnd §5.3–5.5].
// ---------------------------------------------------------------------------------------------------------------

export const PB_LEGEND = {
  /** Text edge of the side columns (|x|) and the rows (|y|). */
  edge: 500,
  /** Each extra row line moves this far inward. */
  lineStep: 35,
  /** Each extra side word becomes a new column this far inward. */
  columnStep: 25,
  /** A box's outer edge sits this far beyond the text edge. */
  boxOffset: 6,
  /** Horizontal boxes are 22·n × 36; vertical boxes are 26 × 32·n. */
  rowBoxCharWidth: 22,
  rowBoxHeight: 36,
  columnBoxWidth: 26,
  columnBoxCharHeight: 32,
} as const;

export const MENU_TITLE = {
  pos: [0, -446] as const,
  box: { width: 110, height: 46 },
} as const;

// ---------------------------------------------------------------------------------------------------------------
// Bezel controls (docs/design.md section 5).
// ---------------------------------------------------------------------------------------------------------------

/** BRT and CONT run 0 to 1. Clicks, the wheel and the arrow keys step 0.1 (DCS gain 0.1) [bzl §1]; a drag is continuous. */
export const KNOB_STEP = 0.1;
/** (ours) Knob values are rounded to whole thousandths, so 0.1 steps never drift. */
export const KNOB_DIVISIONS = 1000;
/** (ours) Knob pointer sweep: −150° (about 7 o'clock) at 0 to +150° (about 5 o'clock) at 1, 0° (12 o'clock) at 0.5. */
export const KNOB_SWEEP = 150;
/** (ours) A press must move this many CSS px before it turns into a drag; less is a click. */
export const KNOB_DRAG_THRESHOLD_PX = 4;
/** (ours) Horizontal drag travel, in CSS px, that sweeps a knob from 0 to 1, whatever the knob's size. */
export const KNOB_DRAG_RANGE_PX = 250;
/** (ours) Below BRT 0.5: f(b) = floor + (1 − floor)·2b. f(0.5) = 1. */
export const BRIGHTNESS_CURVE = { floor: 0.05 } as const;
/** (ours) Above BRT 0.5 the halo closes up to this share of its gap to full opacity, reached at BRT 1. */
export const HALO_BOOST = 0.5;
/** (ours) haloOpacity = soft − range·c. */
export const HALO_OPACITY = { soft: 0.75, range: 0.5 } as const;
/** (ours) Accumulated wheel `deltaY` per step, small enough for trackpads. */
export const KNOB_WHEEL_STEP_PX = 50;
/**
 * (ours) A drag snaps to 12 o'clock while its unsnapped value is within `window` of `centre`. The drag must travel
 * through the window to leave it, which feels like a notch.
 */
export const KNOB_DETENT = { centre: 0.5, window: 0.04 } as const;
