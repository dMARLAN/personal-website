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
/** (ours) One 80 DI cap plus 12 DI each side. The real side border is about 185 DI [bzl §3]. */
export const BAND_SIDE = 104;
export const BAND_BOTTOM = 104;
/** (ours) A 76 DI selector strip at the outer edge plus a 104 DI OSB row [bzl §3]. */
export const SELECTOR_STRIP = 76;
export const BAND_TOP = SELECTOR_STRIP + BAND_SIDE;
/** (ours) Cap side and corner radius. The real cap:pitch ratio is 0.56 and the radius 14 % of the side [bzl §3]. */
export const OSB_CAP = 80;
export const OSB_CAP_RADIUS = 11;
/** (ours) How far a pressed cap moves toward the glass. DCS snaps the cap with no animation [bzl §1]. */
export const OSB_PRESS_OFFSET = 4;
/** The recessed ring around the glass [bzl §3]. */
export const LIP_RING = 8;
/** (ours) BRT and CONT, sized to the 104 × 104 corner cell. */
export const KNOB_DIAMETER = 84;
/** (ours) The OFF/NIGHT/DAY knob and its plate. The plate layout is real [bzl §3]. */
export const SELECTOR_DIAMETER = 56;
export const SELECTOR_PLATE = { width: 300, height: 68 } as const;
/** (ours) BRT and CONT placards: a rounded rect with condensed caps 18 DI high [bzl §3]. */
export const PLACARD = { width: 72, height: 32, capHeight: 18 } as const;
/** (ours) Holds the deepest edge-attached element, the BIT group rule (x −503 to −303) [pgB §3]. */
export const EDGE_STRIP_DEPTH = 260;
/** (ours) The inset vignette's blur and spread over the screen tint [fnd §4.2]. */
export const VIGNETTE = { blur: 120, spread: 20 } as const;

/** Viewport size in DI that fits exactly: glass plus both side bands, and glass plus top and bottom bands. */
export const FRAME_MIN = {
  width: GLASS_SHORT + 2 * BAND_SIDE,
  height: GLASS_SHORT + BAND_TOP + BAND_BOTTOM,
} as const;

// ---------------------------------------------------------------------------------------------------------------
// Colours (docs/design.md sections 4.5 and 6.1).
// ---------------------------------------------------------------------------------------------------------------

export const COLORS = {
  /** Every stroke [fnd §2.1]. */
  green: "#1e8c00",
  /** The unlit screen texture: centre and vignette edge [fnd §4.2]. */
  screenTint: "#1a2218",
  screenEdge: "#151915",
  /** Bezel face and its satin top-light gradient [bzl §3]. */
  face: "#2f302f",
  faceTop: "#383a3b",
  faceBottom: "#2b2d2e",
  osbCap: "#282829",
  /** (ours) */
  osbCapPressed: "#222223",
  lipRing: "#252626",
  knob: "#222427",
  placard: "#404242",
} as const;

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

/** OFF/NIGHT/DAY in detent order (DCS arg 0, 0.1, 0.2) [bzl §1]. */
export const DISPLAY_MODES = ["OFF", "NIGHT", "DAY"] as const;
export type DisplayMode = (typeof DISPLAY_MODES)[number];

/** Selector pointer angles, clockwise from up, measured from the fan lines in `dcs-tex-ddi-bezel.png`. */
export const SELECTOR_ANGLES: Readonly<Record<DisplayMode, number>> = {
  OFF: -70,
  NIGHT: -25,
  DAY: 25,
};

/** Luminance scale per mode. NIGHT is the MDI cockpit value [fnd §2.2]. OFF draws nothing. */
export const MODE_SCALE: Readonly<Record<DisplayMode, number>> = {
  OFF: 0,
  NIGHT: 0.126,
  DAY: 1,
};

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
/** (ours) Accumulated wheel `deltaY` per step: 50 px for the knobs (trackpads), 100 px (one notch) per detent. */
export const KNOB_WHEEL_STEP_PX = 50;
export const SELECTOR_WHEEL_STEP_PX = 100;
