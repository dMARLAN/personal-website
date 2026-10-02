import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bitTests, TEST_DURATION_MS } from "./store";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  bitTests.reset();
  vi.useRealTimers();
});

describe("the BIT test store", () => {
  it("runs a test for TEST_DURATION_MS, then marks it tested", () => {
    bitTests.start(["RALT"], { instant: false });
    expect(bitTests.getSnapshot().testing.has("RALT")).toBe(true);
    vi.advanceTimersByTime(TEST_DURATION_MS - 1);
    expect(bitTests.getSnapshot().tested.has("RALT")).toBe(false);
    vi.advanceTimersByTime(1);
    expect(bitTests.getSnapshot().testing.size).toBe(0);
    expect(bitTests.getSnapshot().tested.has("RALT")).toBe(true);
  });

  it("resolves at once under reduced motion, with no IN TEST", () => {
    bitTests.start(["RALT", "ADC"], { instant: true });
    expect(bitTests.getSnapshot().testing.size).toBe(0);
    expect([...bitTests.getSnapshot().tested]).toEqual(["RALT", "ADC"]);
  });

  it("STOP aborts running tests and leaves them untested", () => {
    bitTests.start(["RALT"], { instant: false });
    bitTests.stop();
    vi.advanceTimersByTime(TEST_DURATION_MS);
    expect(bitTests.getSnapshot().testing.size).toBe(0);
    expect(bitTests.getSnapshot().tested.size).toBe(0);
  });

  it("notifies subscribers and resets to the initial state", () => {
    const listener = vi.fn();
    const unsubscribe = bitTests.subscribe(listener);
    bitTests.start(["RALT"], { instant: true });
    expect(listener).toHaveBeenCalledTimes(1);
    bitTests.reset();
    expect(bitTests.getSnapshot()).toBe(bitTests.getServerSnapshot());
    unsubscribe();
  });

  it("cycles the FCS option and wraps", () => {
    bitTests.cycleFcsOption(2);
    expect(bitTests.getSnapshot().fcsOption).toBe(1);
    bitTests.cycleFcsOption(2);
    expect(bitTests.getSnapshot().fcsOption).toBe(0);
  });
});
