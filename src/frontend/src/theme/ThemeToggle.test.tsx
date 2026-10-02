import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY, parseThemeOverride, resolveTheme } from "./theme";

/** jsdom has no matchMedia: stand in for the OS colour scheme. */
function emulateOsNight(night: boolean): void {
  vi.stubGlobal("matchMedia", () => ({
    matches: night,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

type TestingLibrary = typeof import("@testing-library/react");
let testing: TestingLibrary | null = null;

/**
 * The store caches the override per module instance, so each test loads a fresh one. Testing Library is loaded with
 * it, so both use the same fresh copy of React.
 */
async function renderToggle(): Promise<HTMLElement> {
  vi.resetModules();
  testing = await import("@testing-library/react");
  const { ThemeToggle } = await import("./ThemeToggle");
  testing.render(<ThemeToggle />);
  return testing.screen.getByRole("button", { name: "Night mode" });
}

function click(element: HTMLElement): void {
  testing?.fireEvent.click(element);
}

beforeEach(() => {
  emulateOsNight(false);
});

afterEach(() => {
  testing?.cleanup();
  testing = null;
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("parseThemeOverride", () => {
  it("accepts only the exact theme names", () => {
    expect(parseThemeOverride("day")).toBe("day");
    expect(parseThemeOverride("night")).toBe("night");
    for (const raw of [null, "", "Night", '"night"', "dark", "light"]) {
      expect(parseThemeOverride(raw), String(raw)).toBeNull();
    }
  });
});

describe("resolveTheme", () => {
  it("follows the OS unless there is an override", () => {
    expect(resolveTheme(null, false)).toBe("day");
    expect(resolveTheme(null, true)).toBe("night");
    expect(resolveTheme("day", true)).toBe("day");
    expect(resolveTheme("night", false)).toBe("night");
  });
});

describe("the theme toggle", () => {
  it("follows the OS colour scheme by default", async () => {
    emulateOsNight(true);
    const toggle = await renderToggle();
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.dataset.theme).toBe("night");
  });

  it("flips the theme and stores the override", async () => {
    const toggle = await renderToggle();
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.dataset.theme).toBe("night");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("night");
    click(toggle);
    expect(document.documentElement.dataset.theme).toBe("day");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("day");
  });

  it("lets a stored override win over the OS", async () => {
    emulateOsNight(true);
    localStorage.setItem(THEME_STORAGE_KEY, "day");
    const toggle = await renderToggle();
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("ignores an invalid stored override", async () => {
    emulateOsNight(true);
    localStorage.setItem(THEME_STORAGE_KEY, "midnight");
    const toggle = await renderToggle();
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });
});
