import type { SectionId } from "./api";
import type { JsonValue } from "./schema/jsonSchema";
import { isSectionId } from "./sections";

/**
 * Unsaved edits, mirrored to localStorage while they exist, so an expired session, a sign-out or a closed tab does
 * not lose them. The console restores them when it next loads.
 */
const STASH_KEY = "admin:unsaved-edits";

export type Stash = Partial<Record<SectionId, JsonValue>>;

export function readStash(): Stash {
  const stored = localStorage.getItem(STASH_KEY);
  if (stored === null) {
    return {};
  }
  const parsed: unknown = JSON.parse(stored);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${STASH_KEY} in localStorage is not an object`);
  }
  return Object.fromEntries(
    Object.entries(parsed).filter(([section]) => isSectionId(section)),
  );
}

export function writeStash(stash: Stash): void {
  if (Object.keys(stash).length === 0) {
    localStorage.removeItem(STASH_KEY);
  } else {
    localStorage.setItem(STASH_KEY, JSON.stringify(stash));
  }
}
