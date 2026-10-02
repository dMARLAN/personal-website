import type { ServerSnapshot } from "@/content/types";
import type { ServerStatsProvider } from "./provider";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

export interface SnapshotStore {
  subscribe(onChange: () => void): () => void;
  getSnapshot(): ServerSnapshot;
  getServerSnapshot(): ServerSnapshot;
}

/**
 * The page's current readings, for `useSyncExternalStore`. The server and the first client render draw `baseline`, so
 * hydration matches. The provider runs only while something is subscribed, and never under reduced motion, which keeps
 * the readings static (design section 10.2).
 */
export function createSnapshotStore(
  baseline: ServerSnapshot,
  provider: ServerStatsProvider,
): SnapshotStore {
  let current = baseline;
  const listeners = new Set<() => void>();
  let stop: (() => void) | null = null;

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      if (stop === null && !window.matchMedia(REDUCED_MOTION).matches) {
        stop = provider.subscribe((snapshot) => {
          current = snapshot;
          listeners.forEach((listener) => listener());
        });
      }
      return () => {
        listeners.delete(onChange);
        if (listeners.size === 0 && stop !== null) {
          stop();
          stop = null;
        }
      };
    },
    getSnapshot: () => current,
    getServerSnapshot: () => baseline,
  };
}
