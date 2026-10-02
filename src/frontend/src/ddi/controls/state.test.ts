import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONTROLS,
  accumulateWheel,
  applyControls,
  brightnessCurve,
  canStepMode,
  clampKnob,
  contrastHalo,
  controlsReducer,
  displayGain,
  haloOpacity,
  dragKnob,
  knobAngle,
  parseControls,
  type ControlsState,
} from "./state";

describe("the OFF/NIGHT/DAY selector", () => {
  it("steps one detent at a time and never wraps", () => {
    const off: ControlsState = { ...DEFAULT_CONTROLS, mode: "OFF" };
    const night = controlsReducer(off, { type: "mode", step: 1 });
    const day = controlsReducer(night, { type: "mode", step: 1 });
    expect([night.mode, day.mode]).toEqual(["NIGHT", "DAY"]);
    expect(controlsReducer(day, { type: "mode", step: 1 })).toBe(day);
    expect(controlsReducer(off, { type: "mode", step: -1 })).toBe(off);
  });

  it("disables its end stops", () => {
    expect(canStepMode("OFF", -1)).toBe(false);
    expect(canStepMode("OFF", 1)).toBe(true);
    expect(canStepMode("NIGHT", -1)).toBe(true);
    expect(canStepMode("NIGHT", 1)).toBe(true);
    expect(canStepMode("DAY", 1)).toBe(false);
  });
});

describe("BRT and CONT", () => {
  it.each(["brt", "cont"] as const)("clamps %s steps to 0–1", (knob) => {
    const top: ControlsState = { ...DEFAULT_CONTROLS, [knob]: 1 };
    expect(controlsReducer(top, { type: "knob", knob, step: 1 })).toBe(top);
    const bottom: ControlsState = { ...DEFAULT_CONTROLS, [knob]: 0 };
    expect(controlsReducer(bottom, { type: "knob", knob, step: -1 })).toBe(
      bottom,
    );
    expect(controlsReducer(bottom, { type: "knob", knob, step: 1 })[knob]).toBe(
      0.1,
    );
  });

  it("steps 0.1 without drift", () => {
    let state = { ...DEFAULT_CONTROLS, brt: 0 };
    for (let count = 0; count < 7; count += 1) {
      state = controlsReducer(state, { type: "knob", knob: "brt", step: 1 });
    }
    expect(state.brt).toBe(0.7);
  });

  it("sets a continuous value, clamped and rounded to thousandths", () => {
    const set = (value: number): number =>
      controlsReducer(DEFAULT_CONTROLS, {
        type: "setKnob",
        knob: "cont",
        value,
      }).cont;
    expect([set(0.12345), set(-0.2), set(1.7)]).toEqual([0.123, 0, 1]);
    expect(
      controlsReducer(DEFAULT_CONTROLS, {
        type: "setKnob",
        knob: "cont",
        value: 0.5001,
      }),
    ).toBe(DEFAULT_CONTROLS);
  });

  it("defaults both knobs to 12 o'clock, 0.5", () => {
    expect([DEFAULT_CONTROLS.brt, DEFAULT_CONTROLS.cont]).toEqual([0.5, 0.5]);
    expect(knobAngle(DEFAULT_CONTROLS.brt)).toBe(0);
  });

  it("draws the material green at unit gain at BRT 0.5 and dims linearly to a 0.05 floor", () => {
    expect(brightnessCurve(0.5)).toBe(1);
    expect(brightnessCurve(1)).toBe(1);
    expect(brightnessCurve(0)).toBeCloseTo(0.05);
    expect(brightnessCurve(0.25)).toBeCloseTo(0.525);
  });

  it("scales NIGHT to 0.126 × f and DAY to f", () => {
    for (let brt = 0; brt <= 1; brt += 0.1) {
      expect(displayGain({ mode: "NIGHT", brt, cont: 0.5 })).toBeCloseTo(
        0.126 * brightnessCurve(brt),
      );
      expect(displayGain({ mode: "DAY", brt, cont: 0.5 })).toBe(
        brightnessCurve(brt),
      );
    }
  });

  it("runs the CONT halo from 0.75 (soft) to 0.25 (crisp), 0.5 at the default", () => {
    expect(contrastHalo(0)).toBe(0.75);
    expect(contrastHalo(0.5)).toBe(0.5);
    expect(contrastHalo(1)).toBe(0.25);
    expect(haloOpacity(DEFAULT_CONTROLS)).toBe(0.5);
  });

  it("boosts the halo above BRT 0.5, halfway to opaque at BRT 1", () => {
    expect(haloOpacity({ mode: "DAY", brt: 0.3, cont: 0.5 })).toBe(0.5);
    expect(haloOpacity({ mode: "DAY", brt: 0.75, cont: 0.5 })).toBe(0.625);
    expect(haloOpacity({ mode: "DAY", brt: 1, cont: 0.5 })).toBe(0.75);
    expect(haloOpacity({ mode: "DAY", brt: 1, cont: 0 })).toBe(0.875);
  });
});

describe("the knob angle", () => {
  it("sweeps the pointer from −150° through 0° (12 o'clock) to +150°", () => {
    expect([knobAngle(0), knobAngle(0.5), knobAngle(1)]).toEqual([
      -150, 0, 150,
    ]);
  });
});

describe("dragKnob", () => {
  it("turns up to the right and down to the left, 250 px for the full range", () => {
    expect(dragKnob(0.5, 25)).toBeCloseTo(0.6);
    expect(dragKnob(0.5, -50)).toBeCloseTo(0.3);
    expect(dragKnob(0, 250)).toBe(1);
  });

  it("clamps at the end stops and never wraps", () => {
    expect(dragKnob(0.9, 100)).toBe(1);
    expect(dragKnob(0.1, -100)).toBe(0);
  });

  it("moves at once on reversal after an overshoot", () => {
    let value = 0.9;
    for (const deltaX of [50, 50, 50]) {
      value = dragKnob(value, deltaX);
    }
    expect(value).toBe(1);
    expect(dragKnob(value, -25)).toBeCloseTo(0.9);
  });
});

describe("clampKnob", () => {
  it("clamps to 0–1 and rounds to thousandths", () => {
    expect([clampKnob(-1), clampKnob(0.1 + 0.2), clampKnob(2)]).toEqual([
      0, 0.3, 1,
    ]);
  });
});

describe("parseControls", () => {
  it("reads valid stored state", () => {
    expect(parseControls('{"mode":"NIGHT","brt":0.3,"cont":0.875}')).toEqual({
      mode: "NIGHT",
      brt: 0.3,
      cont: 0.875,
    });
  });

  it.each([
    null,
    "",
    "not json",
    "null",
    "42",
    '"DAY"',
    "[]",
    "{}",
    '{"mode":"day","brt":"1","cont":null}',
    '{"mode":"STANDBY","brt":true,"cont":{}}',
    '{"mode":1,"brt":"0.5","cont":[0.5]}',
  ])("reads %j as the defaults", (raw) => {
    expect(parseControls(raw)).toEqual(DEFAULT_CONTROLS);
  });

  it("clamps and rounds stored knob numbers", () => {
    expect(parseControls('{"mode":"OFF","brt":99,"cont":-1e308}')).toEqual({
      mode: "OFF",
      brt: 1,
      cont: 0,
    });
    expect(parseControls('{"brt":0.12345}').brt).toBe(0.123);
  });

  it("keeps the valid fields of a partly invalid value", () => {
    expect(parseControls('{"mode":"OFF","brt":"x","cont":0.2}')).toEqual({
      mode: "OFF",
      brt: 0.5,
      cont: 0.2,
    });
  });
});

describe("applyControls", () => {
  it("sets the mode and the custom properties on the element", () => {
    const element = document.createElement("html");
    applyControls(element, { mode: "NIGHT", brt: 0.5, cont: 0 });
    expect(element.dataset.ddiMode).toBe("NIGHT");
    expect(element.style.getPropertyValue("--ddi-gain")).toBe("0.126");
    expect(element.style.getPropertyValue("--ddi-halo")).toBe("0.75");
    expect(element.style.getPropertyValue("--ddi-selector-angle")).toBe(
      "-25deg",
    );
    expect(element.style.getPropertyValue("--ddi-brt-angle")).toBe("0deg");
    expect(element.style.getPropertyValue("--ddi-cont-angle")).toBe("-150deg");
  });

  it("gives OFF zero gain", () => {
    const element = document.createElement("html");
    applyControls(element, { mode: "OFF", brt: 1, cont: 0.5 });
    expect(element.dataset.ddiMode).toBe("OFF");
    expect(element.style.getPropertyValue("--ddi-gain")).toBe("0");
  });
});

describe("accumulateWheel", () => {
  it("steps once per threshold and keeps the remainder", () => {
    expect(accumulateWheel(0, 120, 50)).toEqual({ steps: 2, remainder: 20 });
    expect(accumulateWheel(20, 30, 50)).toEqual({ steps: 1, remainder: 0 });
    expect(accumulateWheel(0, -49, 50)).toEqual({ steps: 0, remainder: -49 });
    expect(accumulateWheel(-49, -2, 50)).toEqual({ steps: -1, remainder: -1 });
  });
});
