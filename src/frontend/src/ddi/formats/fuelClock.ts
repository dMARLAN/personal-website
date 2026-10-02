"use client";

import { useSyncExternalStore } from "react";

/** (ours) How often the tanks move: 4 Hz is smooth enough for a caret that travels a few DI per second. */
export const FUEL_TICK_MS = 250;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const listeners = new Set<() => void>();
let elapsedSeconds = 0;
let timer: ReturnType<typeof setInterval> | undefined;

/**
 * Time advances only while the page is visible and motion is allowed, so the tanks hold still under reduced motion
 * and resume where they left off. It survives remounts, such as the FLBIT screen swap, so the tanks never jump.
 */
function tick(): void {
  if (document.hidden || window.matchMedia(REDUCED_MOTION).matches) {
    return;
  }
  elapsedSeconds += FUEL_TICK_MS / 1000;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  timer ??= setInterval(tick, FUEL_TICK_MS);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** Seconds the tanks have been moving. The server, and hydration, draw t = 0. */
export function useFuelSeconds(): number {
  return useSyncExternalStore(
    subscribe,
    () => elapsedSeconds,
    () => 0,
  );
}
