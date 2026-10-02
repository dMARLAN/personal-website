/** (ours) The first-visit tutorial (docs/design.md section 5.6). A new format gets a new key, so it shows again. */
export const TUTORIAL_STORAGE_KEY = "ddi:tutorial:v1";
/** The only stored value that means the visitor has dismissed the tutorial. */
export const TUTORIAL_DONE = "done";
/** `<html data-tutorial="open">` shows the overlay. The pre-paint script sets it, so it never flashes. */
export const TUTORIAL_OPEN = "open";

/** Reads the stored flag. Storage is untrusted input, so only the exact value counts as dismissed. */
export function isTutorialDone(raw: string | null): boolean {
  return raw === TUTORIAL_DONE;
}

/**
 * Whether this visitor still has to see the tutorial. Storage can throw when the browser blocks it. A dismissal could
 * then never persist and the overlay would return on every page, so blocked storage reads as dismissed.
 */
export function tutorialPending(): boolean {
  try {
    return !isTutorialDone(localStorage.getItem(TUTORIAL_STORAGE_KEY));
  } catch {
    return false;
  }
}

/** Stores the dismissal. If storage throws, the overlay still closes for this page view. */
export function storeTutorialDone(): void {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, TUTORIAL_DONE);
  } catch {
    // Not persisted: see tutorialPending.
  }
}
