import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONTROLS,
  accumulateWheel,
  applyControls,
  brightnessCurve,
  canStepMode,
  controlsReducer,
  displayGain,
  haloOpacity,
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
  it.each(["brt", "cont"] as const)("clamps %s to 0–10 tenths", (knob) => {
    const top: ControlsState = { ...DEFAULT_CONTROLS, [knob]: 10 };
    expect(controlsReducer(top, { type: "knob", knob, step: 1 })).toBe(top);
    const bottom: ControlsState = { ...DEFAULT_CONTROLS, [knob]: 0 };
    expect(controlsReducer(bottom, { type: "knob", knob, step: -1 })).toBe(
      bottom,
    );
    expect(controlsReducer(bottom, { type: "knob", knob, step: 1 })[knob]).toBe(
      1,
    );
  });

  it("follows f(b) = 0.03 + 0.97·b^2.2", () => {
    expect(brightnessCurve(0)).toBeCloseTo(0.03);
    expect(brightnessCurve(10)).toBe(1);
    expect(brightnessCurve(5)).toBeCloseTo(0.03 + 0.97 * 0.5 ** 2.2);
  });

  it("scales NIGHT to 0.126 × f and DAY to f", () => {
    for (let brt = 0; brt <= 10; brt += 1) {
      expect(displayGain({ mode: "NIGHT", brt, cont: 5 })).toBeCloseTo(
        0.126 * brightnessCurve(brt),
      );
      expect(displayGain({ mode: "DAY", brt, cont: 5 })).toBe(
        brightnessCurve(brt),
      );
    }
  });

  it("runs the halo from 0.75 (soft) to 0.25 (crisp), 0.5 at the default", () => {
    expect(haloOpacity(0)).toBe(0.75);
    expect(haloOpacity(5)).toBe(0.5);
    expect(haloOpacity(10)).toBe(0.25);
  });

  it("sweeps the pointer from −135° to +135°", () => {
    expect([knobAngle(0), knobAngle(5), knobAngle(10)]).toEqual([-135, 0, 135]);
  });
});

describe("parseControls", () => {
  it("reads valid stored state", () => {
    expect(parseControls('{"mode":"NIGHT","brt":3,"cont":9}')).toEqual({
      mode: "NIGHT",
      brt: 3,
      cont: 9,
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
    '{"mode":"day","brt":"10","cont":null}',
    '{"mode":"STANDBY","brt":11,"cont":-1}',
    '{"mode":1,"brt":0.5,"cont":5.5}',
  ])("reads %j as the defaults", (raw) => {
    expect(parseControls(raw)).toEqual(DEFAULT_CONTROLS);
  });

  it("keeps the valid fields of a partly invalid value", () => {
    expect(parseControls('{"mode":"OFF","brt":99}')).toEqual({
      mode: "OFF",
      brt: 10,
      cont: 5,
    });
  });
});

describe("applyControls", () => {
  it("sets the mode and the custom properties on the element", () => {
    const element = document.createElement("html");
    applyControls(element, { mode: "NIGHT", brt: 10, cont: 0 });
    expect(element.dataset.ddiMode).toBe("NIGHT");
    expect(element.style.getPropertyValue("--ddi-gain")).toBe("0.126");
    expect(element.style.getPropertyValue("--ddi-halo")).toBe("0.75");
    expect(element.style.getPropertyValue("--ddi-selector-angle")).toBe(
      "-25deg",
    );
  });

  it("gives OFF zero gain", () => {
    const element = document.createElement("html");
    applyControls(element, { mode: "OFF", brt: 10, cont: 5 });
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
