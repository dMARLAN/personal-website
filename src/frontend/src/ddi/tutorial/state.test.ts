import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TUTORIAL_DONE,
  TUTORIAL_STORAGE_KEY,
  isTutorialDone,
  storeTutorialDone,
  tutorialPending,
} from "./state";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("the tutorial flag", () => {
  it.each([
    [null, false],
    ["done", true],
    ["DONE", false],
    ['"done"', false],
    ["true", false],
    ["", false],
  ] as const)("reads stored %j as done: %s", (raw, done) => {
    expect(isTutorialDone(raw)).toBe(done);
  });

  it("is pending until the dismissal is stored", () => {
    expect(tutorialPending()).toBe(true);
    storeTutorialDone();
    expect(localStorage.getItem(TUTORIAL_STORAGE_KEY)).toBe(TUTORIAL_DONE);
    expect(tutorialPending()).toBe(false);
  });

  it("is pending again when the stored value is not the exact flag", () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "yes");
    expect(tutorialPending()).toBe(true);
  });

  it("reads blocked storage as dismissed, so the overlay cannot return on every page", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(tutorialPending()).toBe(false);
  });

  it("does not throw when storage refuses the write", () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(() => storeTutorialDone()).not.toThrow();
  });
});
