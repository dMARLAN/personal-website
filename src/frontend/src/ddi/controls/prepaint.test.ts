import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  parseThemeOverride,
  resolveTheme,
} from "@/theme/theme";
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
  "--ddi-brt-angle",
  "--ddi-cont-angle",
];

function runPrepaint(): void {
  // The script is our own constant, built from JSON-serialised tables.
  new Function(PREPAINT_SCRIPT)();
}

/** jsdom has no matchMedia: stand in for the OS colour scheme. */
function emulateOsNight(night: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: night && query === "(prefers-color-scheme: dark)",
  }));
}

function controlsOf(element: HTMLElement): Record<string, string> {
  return Object.fromEntries(
    CONTROL_PROPERTIES.map((property) => [
      property,
      element.style.getPropertyValue(property),
    ]),
  );
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

beforeEach(() => {
  emulateOsNight(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.removeAttribute("style");
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-view");
  window.history.replaceState(null, "", "/");
});

describe("the pre-paint script", () => {
  it.each([
    null,
    "not json",
    "[]",
    '{"brt":0,"cont":1}',
    '{"brt":0.7}',
    '{"brt":0.35,"cont":"0.9"}',
    '{"brt":12,"cont":-3}',
    '{"brt":0.12345,"cont":0.9876}',
  ])("draws stored %j exactly as parseControls + applyControls do", (raw) => {
    expectPrepaintToMatch(raw);
  });

  it("matches applyControls across the whole knob range", () => {
    for (let thousandths = 0; thousandths <= 1000; thousandths += 7) {
      const value = thousandths / 1000;
      expectPrepaintToMatch(JSON.stringify({ brt: value, cont: 1 - value }));
    }
  });

  it.each([
    [null, false],
    [null, true],
    ["day", true],
    ["night", false],
    ["NIGHT", true],
    ["dusk", false],
    ['"night"', false],
  ] as const)(
    "resolves stored theme %j with OS night %s as parseThemeOverride + resolveTheme do",
    (raw, osNight) => {
      emulateOsNight(osNight);
      if (raw !== null) {
        localStorage.setItem(THEME_STORAGE_KEY, raw);
      }
      runPrepaint();
      expect(document.documentElement.dataset.theme).toBe(
        resolveTheme(parseThemeOverride(raw), osNight),
      );
    },
  );

  it("turns the plain view on from ?view=plain and remembers it", () => {
    window.history.replaceState(null, "", "/?view=plain");
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
