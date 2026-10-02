import { afterEach, describe, expect, it, vi } from "vitest";
import { THEME_PREPAINT_SCRIPT } from "./prepaint";
import { THEME_STORAGE_KEY, parseThemeOverride, resolveTheme } from "./theme";

function runPrepaint(): void {
  // The script is our own constant, built from JSON-serialised tables.
  new Function(THEME_PREPAINT_SCRIPT)();
}

/** jsdom has no matchMedia: stand in for the OS colour scheme. */
function emulateOsNight(night: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: night && query === "(prefers-color-scheme: dark)",
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("the homepage pre-paint script", () => {
  it.each([
    [null, false],
    [null, true],
    ["day", true],
    ["night", false],
    ["midnight", true],
    ["<script>", false],
  ])(
    "resolves stored %j with OS night %j as resolveTheme does",
    (raw, night) => {
      emulateOsNight(night);
      if (raw !== null) {
        localStorage.setItem(THEME_STORAGE_KEY, raw);
      }
      runPrepaint();
      expect(document.documentElement.dataset.theme).toBe(
        resolveTheme(parseThemeOverride(raw), night),
      );
    },
  );

  it("lets the OS decide when storage throws", () => {
    emulateOsNight(true);
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    runPrepaint();
    expect(document.documentElement.dataset.theme).toBe("night");
  });
});
