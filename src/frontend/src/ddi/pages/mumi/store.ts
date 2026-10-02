import { useSyncExternalStore } from "react";

/**
 * (ours) The load's timing. DCS runs the load in C++ and the `MU LOAD` blink rate is not in the Lua [pgB §5].
 * The cue blinks for LOAD_MS, the completed load holds for COMPLETE_HOLD_MS, then the page navigates.
 */
export const LOAD_MS = 1200;
export const BLINK_MS = 200;
export const COMPLETE_HOLD_MS = 400;

export type MumiLoad =
  | { phase: "idle" }
  /** `cueOn` is the `MU LOAD` blink. */
  | { phase: "loading"; cueOn: boolean }
  | { phase: "complete" };

const IDLE: MumiLoad = { phase: "idle" };

let state: MumiLoad = IDLE;
const listeners = new Set<() => void>();
const timers = new Set<ReturnType<typeof setTimeout>>();

function update(next: MumiLoad): void {
  state = next;
  for (const listener of listeners) {
    listener();
  }
}

function clearTimers(): void {
  // The HTML timer API clears a timeout or an interval with either call.
  for (const timer of timers) {
    clearTimeout(timer);
  }
  timers.clear();
}

function after(ms: number, run: () => void): void {
  const timer = setTimeout(() => {
    timers.delete(timer);
    run();
  }, ms);
  timers.add(timer);
}

/**
 * The MUMI load, shared by the OSB that starts it and the glass that shows it. It is local to the page, has no URL,
 * and `reset` clears it when the page unmounts or comes back from the back/forward cache (design section 9.4).
 */
export const mumiLoad = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): MumiLoad {
    return state;
  },
  getServerSnapshot(): MumiLoad {
    return IDLE;
  },
  /**
   * Runs the load, then calls `navigate`. A press while a load runs does nothing. With `instant` (reduced motion)
   * it navigates at once and never blinks.
   */
  start(navigate: () => void, { instant }: { instant: boolean }): void {
    if (state.phase !== "idle") {
      return;
    }
    if (instant) {
      update({ phase: "complete" });
      navigate();
      return;
    }
    update({ phase: "loading", cueOn: true });
    const blink = setInterval(() => {
      if (state.phase === "loading") {
        update({ phase: "loading", cueOn: !state.cueOn });
      }
    }, BLINK_MS);
    timers.add(blink);
    after(LOAD_MS, () => {
      clearInterval(blink);
      timers.delete(blink);
      update({ phase: "complete" });
      after(COMPLETE_HOLD_MS, navigate);
    });
  },
  reset(): void {
    clearTimers();
    update(IDLE);
  },
};

export function useMumiLoad(): MumiLoad {
  return useSyncExternalStore(
    mumiLoad.subscribe,
    mumiLoad.getSnapshot,
    mumiLoad.getServerSnapshot,
  );
}
