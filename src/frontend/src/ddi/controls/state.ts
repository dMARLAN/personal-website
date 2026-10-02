import {
  BRIGHTNESS_CURVE,
  HALO_OPACITY,
  HALO_BOOST,
  KNOB_DETENT,
  KNOB_DIVISIONS,
  KNOB_DRAG_RANGE_PX,
  KNOB_STEP,
  KNOB_SWEEP,
} from "../constants";

/** The bezel controls. BRT and CONT run 0 to 1, rounded to whole thousandths (see `clampKnob`). */
export interface ControlsState {
  brt: number;
  cont: number;
}

/** Both knobs start at 12 o'clock; BRT 0.5 draws the material green at unit gain. */
export const DEFAULT_CONTROLS: ControlsState = {
  brt: 0.5,
  cont: 0.5,
};

/** v1 stored integer tenths. v3 dropped the OFF/NIGHT/DAY mode. An older value is ignored and reads as the defaults. */
export const CONTROLS_STORAGE_KEY = "ddi:controls:v3";

export const VIEW_STORAGE_KEY = "ddi:view:v1";
/** `?view=plain` turns the plain view on and `?view=ddi` turns it off (docs/design.md section 10.2). */
export const VIEW_PARAM = "view";

export type Knob = "brt" | "cont";
export type Step = -1 | 1;

export type ControlsAction =
  | { type: "knob"; knob: Knob; step: Step }
  | { type: "setKnob"; knob: Knob; value: number };

export function controlsReducer(
  state: ControlsState,
  action: ControlsAction,
): ControlsState {
  switch (action.type) {
    case "knob":
      return setKnob(
        state,
        action.knob,
        state[action.knob] + action.step * KNOB_STEP,
      );
    case "setKnob":
      return setKnob(state, action.knob, action.value);
  }
}

function setKnob(
  state: ControlsState,
  knob: Knob,
  value: number,
): ControlsState {
  const clamped = clampKnob(value);
  return clamped === state[knob] ? state : { ...state, [knob]: clamped };
}

/** Clamps a knob value to 0–1 and rounds it to whole thousandths (`KNOB_DIVISIONS`), so 0.1 steps never drift. */
export function clampKnob(value: number): number {
  const rounded = Math.round(value * KNOB_DIVISIONS) / KNOB_DIVISIONS;
  return Math.min(1, Math.max(0, rounded));
}

function parseKnob(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? clampKnob(value)
    : fallback;
}

/**
 * Reads stored controls. Storage is untrusted input (another version, another tab, or a hand edit), so each field
 * that is missing or invalid reads as its default, and a knob number outside 0–1 is clamped (docs/design.md section 5.5).
 */
export function parseControls(raw: string | null): ControlsState {
  let stored: unknown = null;
  try {
    stored = raw === null ? null : JSON.parse(raw);
  } catch {
    return DEFAULT_CONTROLS;
  }
  if (typeof stored !== "object" || stored === null) {
    return DEFAULT_CONTROLS;
  }
  const { brt, cont } = stored as Record<string, unknown>;
  return {
    brt: parseKnob(brt, DEFAULT_CONTROLS.brt),
    cont: parseKnob(cont, DEFAULT_CONTROLS.cont),
  };
}

/**
 * (ours) BRT's emissive gain factor. f(b) = floor + (1 − floor)·2b below 0.5, and 1 from 0.5 up. Browsers composite
 * opacity on sRGB-encoded values, which are close to perceptual, so a straight line dims in even-looking steps. The
 * floor keeps BRT 0 visibly different from OFF.
 */
export function brightnessCurve(brt: number): number {
  const { floor } = BRIGHTNESS_CURVE;
  return Math.min(1, floor + (1 - floor) * 2 * brt);
}

/** gain = f(BRT) (docs/design.md section 5.5). */
export function displayGain({ brt }: ControlsState): number {
  return brightnessCurve(brt);
}

/** (ours) CONT sets the stroke edge: 0.75 − 0.5·c. */
export function contrastHalo(cont: number): number {
  return HALO_OPACITY.soft - HALO_OPACITY.range * cont;
}

/**
 * (ours) The halo opacity. Above BRT 0.5 the gain is already 1 and cannot rise in an additive model, so BRT lights
 * more of the stroke's falloff instead: the CONT halo closes up to `HALO_BOOST` of its gap to 1, reached at BRT 1.
 */
export function haloOpacity({ brt, cont }: ControlsState): number {
  const halo = contrastHalo(cont);
  return halo + (1 - halo) * HALO_BOOST * Math.max(0, 2 * brt - 1);
}

/** (ours) The knob pointer: −150° at 0, 0° (12 o'clock) at 0.5, +150° at 1, clockwise from up. */
export function knobAngle(value: number): number {
  return KNOB_SWEEP * (2 * value - 1);
}

/**
 * A drag turns the knob by the horizontal pointer travel since the last move: right is clockwise (up) and left is
 * counter-clockwise (down). It clamps at the end stops, so reversing moves the knob at once, with no overshoot to
 * travel back through. The result is not rounded; the reducer rounds what it stores.
 */
export function dragKnob(value: number, deltaX: number): number {
  return Math.min(1, Math.max(0, value + deltaX / KNOB_DRAG_RANGE_PX));
}

/**
 * (ours) The centre detent: a drag's unsnapped value within `KNOB_DETENT.window` of 12 o'clock commits exactly 0.5.
 * The drag keeps accumulating the unsnapped value, so it must travel through the window to leave it.
 */
export function snapKnob(raw: number): number {
  return Math.abs(raw - KNOB_DETENT.centre) <= KNOB_DETENT.window
    ? KNOB_DETENT.centre
    : raw;
}

function cssNumber(value: number): string {
  return String(Math.round(value * 10000) / 10000);
}

/** The CSS custom properties that draw the controls' state. They live on `<html>`. */
export function controlsStyle(
  state: ControlsState,
): Record<`--${string}`, string> {
  return {
    "--ddi-gain": cssNumber(displayGain(state)),
    "--ddi-halo": cssNumber(haloOpacity(state)),
    "--ddi-brt-angle": `${cssNumber(knobAngle(state.brt))}deg`,
    "--ddi-cont-angle": `${cssNumber(knobAngle(state.cont))}deg`,
  };
}

/** Writes the controls' state onto `element` (the `<html>` element). */
export function applyControls(
  element: HTMLElement,
  state: ControlsState,
): void {
  for (const [property, value] of Object.entries(controlsStyle(state))) {
    element.style.setProperty(property, value);
  }
}

/** Turns wheel input into whole steps, keeping the remainder so slow trackpad scrolls still add up. */
export function accumulateWheel(
  accumulated: number,
  deltaY: number,
  stepPx: number,
): { steps: number; remainder: number } {
  const total = accumulated + deltaY;
  // + 0 turns Math.trunc's −0 into 0.
  const steps = Math.trunc(total / stepPx) + 0;
  return { steps, remainder: total - steps * stepPx };
}
