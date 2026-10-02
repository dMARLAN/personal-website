import { RANGE_SCALES, type RangeScale } from "../../formats/rdrAttk";

/*
 * The radar page's local state, shared by its islands through `useSyncExternalStore`: the range arrows (OSB islands)
 * and the readouts on the glass. It is in-section state with no URL (design section 9.4). The scope resets it when
 * the page unmounts, so each visit starts at the defaults.
 */

interface Store<T> {
  get: () => T;
  set: (value: T) => void;
  subscribe: (listener: () => void) => () => void;
}

function createStore<T>(initial: T): Store<T> & { initial: T } {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    initial,
    get: () => value,
    set: (next) => {
      if (next === value) {
        return;
      }
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** (ours) The page opens at 40 NM, as in the reference screenshot (docs/pages/radar.md). */
export const DEFAULT_RANGE: RangeScale = 40;

export const rangeStore = createStore<RangeScale>(DEFAULT_RANGE);
/** The elevation bar being scanned; the scope's loop writes it once per sweep. */
export const barStore = createStore(1);

/** The next range scale up (`step` 1) or down (−1). It stops at 5 and 160 NM. */
export function steppedRange(range: RangeScale, step: 1 | -1): RangeScale {
  const index = RANGE_SCALES.indexOf(range) + step;
  return RANGE_SCALES[Math.max(0, Math.min(RANGE_SCALES.length - 1, index))];
}

export function resetRadarState(): void {
  rangeStore.set(rangeStore.initial);
  barStore.set(barStore.initial);
}
