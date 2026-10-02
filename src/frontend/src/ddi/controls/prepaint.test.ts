import { afterEach, describe, expect, it } from "vitest";
import { DISPLAY_MODES } from "../constants";
import { PREPAINT_SCRIPT } from "./prepaint";
import {
  CONTROLS_STORAGE_KEY,
  VIEW_STORAGE_KEY,
  applyControls,
  parseControls,
} from "./state";

const CONTROL_PROPERTIES = [
  "--ddi-gain",
  "--ddi-halo",
  "--ddi-selector-angle",
  "--ddi-brt-angle",
  "--ddi-cont-angle",
];

function runPrepaint(): void {
  // The script is our own constant, built from JSON-serialised tables.
  new Function(PREPAINT_SCRIPT)();
}

function controlsOf(element: HTMLElement): Record<string, string | undefined> {
  return {
    mode: element.dataset.ddiMode,
    ...Object.fromEntries(
      CONTROL_PROPERTIES.map((property) => [
        property,
        element.style.getPropertyValue(property),
      ]),
    ),
  };
}

function expectPrepaintToMatch(raw: string | null): void {
  if (raw === null) {
    localStorage.removeItem(CONTROLS_STORAGE_KEY);
  } else {
    localStorage.setItem(CONTROLS_STORAGE_KEY, raw);
  }
  runPrepaint();
  const expected = document.createElement("html");
  applyControls(expected, parseControls(raw));
  expect(controlsOf(document.documentElement), String(raw)).toEqual(
    controlsOf(expected),
  );
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("style");
  document.documentElement.removeAttribute("data-ddi-mode");
  document.documentElement.removeAttribute("data-view");
  window.history.replaceState(null, "", "/");
});

describe("the pre-paint script", () => {
  it.each([
    null,
    "not json",
    "[]",
    '{"mode":"OFF","brt":0,"cont":1}',
    '{"mode":"NIGHT","brt":0.7}',
    '{"mode":"DAY","brt":0.35,"cont":"0.9"}',
    '{"mode":"STANDBY","brt":12,"cont":-3}',
    '{"mode":"DAY","brt":0.12345,"cont":0.9876}',
  ])("draws stored %j exactly as parseControls + applyControls do", (raw) => {
    expectPrepaintToMatch(raw);
  });

  it("matches applyControls across the whole knob range in every mode", () => {
    for (const mode of DISPLAY_MODES) {
      for (let thousandths = 0; thousandths <= 1000; thousandths += 7) {
        const value = thousandths / 1000;
        expectPrepaintToMatch(
          JSON.stringify({ mode, brt: value, cont: 1 - value }),
        );
      }
    }
  });

  it("turns the plain view on from ?view=plain and remembers it", () => {
    window.history.replaceState(null, "", "/supt?view=plain");
    runPrepaint();
    expect(document.documentElement.dataset.view).toBe("plain");
    expect(localStorage.getItem(VIEW_STORAGE_KEY)).toBe("plain");

    document.documentElement.removeAttribute("data-view");
    window.history.replaceState(null, "", "/");
    runPrepaint();
    expect(document.documentElement.dataset.view).toBe("plain");
  });

  it("turns the plain view off from ?view=ddi", () => {
    localStorage.setItem(VIEW_STORAGE_KEY, "plain");
    window.history.replaceState(null, "", "/?view=ddi");
    runPrepaint();
    expect(document.documentElement.dataset.view).toBeUndefined();
    expect(localStorage.getItem(VIEW_STORAGE_KEY)).toBeNull();
  });
});
