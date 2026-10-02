import {
  BRIGHTNESS_CURVE,
  DISPLAY_MODES,
  HALO_OPACITY,
  KNOB_STEPS,
  KNOB_SWEEP,
  MODE_SCALE,
  SELECTOR_ANGLES,
  type DisplayMode,
} from "../constants";

/** The bezel controls. BRT and CONT are integer tenths (0–10) so steps never drift. */
export interface ControlsState {
  mode: DisplayMode;
  brt: number;
  cont: number;
}

/** DAY is the autostart position [fnd §2.2]. BRT 1.0 draws the material green at unit gain. */
export const DEFAULT_CONTROLS: ControlsState = {
  mode: "DAY",
  brt: 10,
  cont: 5,
};

export const CONTROLS_STORAGE_KEY = "ddi:controls:v1";

export const VIEW_STORAGE_KEY = "ddi:view:v1";
/** `?view=plain` turns the plain view on and `?view=ddi` turns it off (docs/design.md section 10.2). */
export const VIEW_PARAM = "view";

export type Knob = "brt" | "cont";
export type Step = -1 | 1;

export type ControlsAction =
  { type: "mode"; step: Step } | { type: "knob"; knob: Knob; step: Step };

/** The selector has 3 detents and is not cyclic [bzl §1]: a step past an end stop does nothing. */
export function canStepMode(mode: DisplayMode, step: Step): boolean {
  const index = DISPLAY_MODES.indexOf(mode) + step;
  return index >= 0 && index < DISPLAY_MODES.length;
}

export function controlsReducer(
  state: ControlsState,
  action: ControlsAction,
): ControlsState {
  switch (action.type) {
    case "mode": {
      if (!canStepMode(state.mode, action.step)) {
        return state;
      }
      const mode =
        DISPLAY_MODES[DISPLAY_MODES.indexOf(state.mode) + action.step];
      return { ...state, mode };
    }
    case "knob": {
      const value = Math.min(
        KNOB_STEPS,
        Math.max(0, state[action.knob] + action.step),
      );
      return value === state[action.knob]
        ? state
        : { ...state, [action.knob]: value };
    }
  }
}

function isDisplayMode(value: unknown): value is DisplayMode {
  return DISPLAY_MODES.some((mode) => mode === value);
}

function isTenths(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= KNOB_STEPS
  );
}

/**
 * Reads stored controls. Storage is untrusted input (another version, another tab, or a hand edit), so each field
 * that is missing or invalid reads as its default (docs/design.md section 5.5).
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
  const { mode, brt, cont } = stored as Record<string, unknown>;
  return {
    mode: isDisplayMode(mode) ? mode : DEFAULT_CONTROLS.mode,
    brt: isTenths(brt) ? brt : DEFAULT_CONTROLS.brt,
    cont: isTenths(cont) ? cont : DEFAULT_CONTROLS.cont,
  };
}

/** (ours) f(b) = 0.03 + 0.97·b^2.2: even-looking steps in linear light, and BRT 0 stays visible. */
export function brightnessCurve(brt: number): number {
  const { floor, exponent } = BRIGHTNESS_CURVE;
  return floor + (1 - floor) * (brt / KNOB_STEPS) ** exponent;
}

/** gain = modeScale × f(BRT) (docs/design.md section 5.5). */
export function displayGain({ mode, brt }: ControlsState): number {
  return MODE_SCALE[mode] * brightnessCurve(brt);
}

/** (ours) CONT sets the stroke edge: haloOpacity = 0.75 − 0.5·c. */
export function haloOpacity(cont: number): number {
  return HALO_OPACITY.soft - (HALO_OPACITY.range * cont) / KNOB_STEPS;
}

/** (ours) The knob pointer sweeps −135° at 0 to +135° at 1. */
export function knobAngle(tenths: number): number {
  return -KNOB_SWEEP + (2 * KNOB_SWEEP * tenths) / KNOB_STEPS;
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
    "--ddi-halo": cssNumber(haloOpacity(state.cont)),
    "--ddi-selector-angle": `${SELECTOR_ANGLES[state.mode]}deg`,
    "--ddi-brt-angle": `${cssNumber(knobAngle(state.brt))}deg`,
    "--ddi-cont-angle": `${cssNumber(knobAngle(state.cont))}deg`,
  };
}

/** Writes the controls' state onto `element` (the `<html>` element). */
export function applyControls(
  element: HTMLElement,
  state: ControlsState,
): void {
  element.dataset.ddiMode = state.mode;
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
