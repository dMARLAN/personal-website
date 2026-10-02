import { afterEach, describe, expect, it } from "vitest";
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
    '{"mode":"OFF","brt":0,"cont":10}',
    '{"mode":"NIGHT","brt":7}',
    '{"mode":"DAY","brt":3.5,"cont":"9"}',
    '{"mode":"STANDBY","brt":10,"cont":10}',
  ])("draws stored %j exactly as parseControls + applyControls do", (raw) => {
    if (raw !== null) {
      localStorage.setItem(CONTROLS_STORAGE_KEY, raw);
    }
    runPrepaint();
    const expected = document.createElement("html");
    applyControls(expected, parseControls(raw));
    expect(controlsOf(document.documentElement)).toEqual(controlsOf(expected));
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
