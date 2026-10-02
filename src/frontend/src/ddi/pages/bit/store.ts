import { useSyncExternalStore } from "react";
import { INITIAL_TEST_STATE, type BitTestState } from "./status";

/** (ours) How long a check shows `IN TEST` before it resolves. DCS tests run in C++ and take their own time. */
export const TEST_DURATION_MS = 1500;

let state: BitTestState = INITIAL_TEST_STATE;
const listeners = new Set<() => void>();
const timers = new Set<ReturnType<typeof setTimeout>>();

function update(next: BitTestState): void {
  state = next;
  for (const listener of listeners) {
    listener();
  }
}

function clearTimers(): void {
  for (const timer of timers) {
    clearTimeout(timer);
  }
  timers.clear();
}

function finish(ids: readonly string[]): void {
  const finished = ids.filter((id) => state.testing.has(id));
  update({
    ...state,
    testing: new Set([...state.testing].filter((id) => !finished.includes(id))),
    tested: new Set([...state.tested, ...finished]),
  });
}

/**
 * The BIT page's test state, shared by the OSB islands that start tests and the status cells that show them. It is
 * local to the page, has no URL, and `reset` clears it when the page unmounts (design section 9.4).
 */
export const bitTests = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): BitTestState {
    return state;
  },
  getServerSnapshot(): BitTestState {
    return INITIAL_TEST_STATE;
  },
  /** Starts a test of `ids`. With `instant` (reduced motion) the checks resolve at once and never show `IN TEST`. */
  start(ids: readonly string[], { instant }: { instant: boolean }): void {
    if (instant) {
      update({
        ...state,
        testing: new Set([...state.testing].filter((id) => !ids.includes(id))),
        tested: new Set([...state.tested, ...ids]),
      });
      return;
    }
    update({ ...state, testing: new Set([...state.testing, ...ids]) });
    const timer = setTimeout(() => {
      timers.delete(timer);
      finish(ids);
    }, TEST_DURATION_MS);
    timers.add(timer);
  },
  /** `STOP`: aborts every running test. The checks keep the status they had before it started. */
  stop(): void {
    clearTimers();
    update({ ...state, testing: new Set() });
  },
  cycleFcsOption(count: number): void {
    update({ ...state, fcsOption: (state.fcsOption + 1) % count });
  },
  reset(): void {
    clearTimers();
    update(INITIAL_TEST_STATE);
  },
};

export function useBitTests(): BitTestState {
  return useSyncExternalStore(
    bitTests.subscribe,
    bitTests.getSnapshot,
    bitTests.getServerSnapshot,
  );
}
