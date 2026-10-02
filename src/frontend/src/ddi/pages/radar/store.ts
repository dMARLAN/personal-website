import { useSyncExternalStore } from "react";
import {
  INITIAL_RADAR,
  radarReducer,
  type RadarAction,
  type RadarState,
} from "./settings";

/*
 * The radar page's local state, shared by its islands through `useSyncExternalStore`: the OSB islands, the legends
 * and readouts on the glass, and the scope. It is in-section state with no URL (design section 9.4). The scope resets
 * it when the page unmounts, so each visit starts at the defaults.
 */

export interface Store<T> {
  initial: T;
  get: () => T;
  set: (value: T) => void;
  subscribe: (listener: () => void) => () => void;
}

function createStore<T>(
  initial: T,
  equals: (a: T, b: T) => boolean = Object.is,
): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    initial,
    get: () => value,
    set: (next) => {
      if (equals(next, value)) {
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

/** Reads a store in a client component; the server renders its initial value. */
export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.initial);
}

/** Equal plain data: the loop writes a fresh object each frame, and only a real change should re-render. */
function sameData<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * What the loop shows outside the live layer: the PB6 bar number, the PB1 instantaneous PRF and the scan centre's
 * elevation, which sets the cursor's altitude limits. TWS AUTO moves the centre; it is rounded to 0.1°.
 */
export interface ScanReadout {
  bar: number;
  prf: "HI" | "MED";
  centreElevation: number;
}

/** The trackfiles: each contact's rank, or null when it has none. Rank 1 is the L&S. */
export interface TrackFiles {
  ranks: readonly (number | null)[];
  /** The L&S closure, knots, rounded. */
  closure: number | null;
}

export const radarStore = createStore<RadarState>(INITIAL_RADAR);
export const scanReadoutStore = createStore<ScanReadout>(
  { bar: 1, prf: "HI", centreElevation: 0 },
  sameData,
);
export const trackFilesStore = createStore<TrackFiles>(
  { ranks: [], closure: null },
  sameData,
);

/** (ours) SET and RSET stay boxed this long after a press, as RSET does on the Hoggit wiki ("boxes for 2 s"). */
export const MOMENTARY_BOX_MS = 2000;
const unboxTimers = new Map<"SET" | "RSET", ReturnType<typeof setTimeout>>();

function boxBriefly(legend: "SET" | "RSET"): void {
  clearTimeout(unboxTimers.get(legend));
  unboxTimers.set(
    legend,
    setTimeout(() => {
      unboxTimers.delete(legend);
      radarStore.set(radarReducer(radarStore.get(), { type: "unbox", legend }));
    }, MOMENTARY_BOX_MS),
  );
}

/** An OSB press: the reducer's next state, plus the timer that unboxes SET or RSET. */
export function pressRadar(action: RadarAction): void {
  radarStore.set(radarReducer(radarStore.get(), action));
  if (action.type === "set") {
    boxBriefly("SET");
  } else if (action.type === "reset") {
    boxBriefly("RSET");
  }
}

export function resetRadarState(): void {
  unboxTimers.forEach((timer) => clearTimeout(timer));
  unboxTimers.clear();
  radarStore.set(radarStore.initial);
  scanReadoutStore.set(scanReadoutStore.initial);
  trackFilesStore.set(trackFilesStore.initial);
}
