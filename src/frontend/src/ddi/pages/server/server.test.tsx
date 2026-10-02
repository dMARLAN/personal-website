import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SERVER_STATS } from "@/content/server";
import { SERVER_METRICS, type ServerSnapshot } from "@/content/types";
import { FullViewportFrame } from "../../frame/FullViewportFrame";
import {
  FAKE_BAND,
  FAKE_INTERVAL_MS,
  fakeServerStatsProvider,
  jitterSnapshot,
  type ServerStatsProvider,
  type SnapshotListener,
} from "./provider";
import { describeReading, engValues, formatReading } from "./readings";
import { SERVER_LEGENDS, serverScreens } from "./screens";
import { createSnapshotStore } from "./store";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const BASELINE = SERVER_STATS.baseline;

function stubReducedMotion(reduce: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query === "(prefers-reduced-motion: reduce)",
  }));
}

/** A provider the test drives by hand. */
function manualProvider(): ServerStatsProvider & {
  emit: SnapshotListener;
  active: () => boolean;
} {
  let listener: SnapshotListener | null = null;
  return {
    subscribe(next) {
      listener = next;
      return () => {
        listener = null;
      };
    },
    emit: (snapshot) => listener?.(snapshot),
    active: () => listener !== null,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("the readings", () => {
  const loadAvg = SERVER_STATS.rows.find((row) => row.metric === "loadAvg");
  const uptime = SERVER_STATS.rows.find((row) => row.metric === "uptime");

  it("format with the row's decimals and suffix, as the glass draws them", () => {
    if (loadAvg === undefined || uptime === undefined) {
      throw new Error("missing row");
    }
    expect(formatReading(3.4, loadAvg)).toBe("3.40");
    expect(formatReading(41.2, uptime)).toBe("41D");
    expect(describeReading(41.2, uptime)).toBe("41 days");
    expect(describeReading(0.724, loadAvg)).toBe("0.72");
  });

  it("give one left/right pair per row", () => {
    const values = engValues(SERVER_STATS.rows, BASELINE);
    expect(values).toHaveLength(13);
    expect(values[10]).toEqual(["0.72", "3.40"]);
  });
});

describe("the fake provider", () => {
  it("random-walks each reading within its band around the baseline", () => {
    let snapshot: ServerSnapshot = BASELINE;
    for (const random of [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0.5]) {
      snapshot = jitterSnapshot(BASELINE, snapshot, () => random);
      snapshot.hosts.forEach((host, side) => {
        for (const metric of SERVER_METRICS) {
          const centre = BASELINE.hosts[side][metric];
          expect(host[metric]).toBeGreaterThanOrEqual(
            Math.max(0, centre - FAKE_BAND[metric]),
          );
          expect(host[metric]).toBeLessThanOrEqual(centre + FAKE_BAND[metric]);
        }
      });
    }
    const top = jitterSnapshot(BASELINE, BASELINE, () => 1);
    expect(top.hosts[0].cpu).toBe(BASELINE.hosts[0].cpu + FAKE_BAND.cpu / 2);
    expect(top.hosts[0].uptime).toBe(BASELINE.hosts[0].uptime);
  });

  it("ticks every interval, skips hidden tabs and stops on unsubscribe", () => {
    vi.useFakeTimers();
    const listener = vi.fn();
    const stop = fakeServerStatsProvider(BASELINE, () => 1).subscribe(listener);
    vi.advanceTimersByTime(FAKE_INTERVAL_MS);
    expect(listener).toHaveBeenCalledTimes(1);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    vi.advanceTimersByTime(FAKE_INTERVAL_MS);
    expect(listener).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
    stop();
    vi.advanceTimersByTime(10 * FAKE_INTERVAL_MS);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("the snapshot store", () => {
  it("starts the provider with the first subscriber and stops it with the last", () => {
    stubReducedMotion(false);
    const provider = manualProvider();
    const store = createSnapshotStore(BASELINE, provider);
    const onChange = vi.fn();
    const unsubscribe = store.subscribe(onChange);
    expect(provider.active()).toBe(true);
    const next = jitterSnapshot(BASELINE, BASELINE, () => 1);
    provider.emit(next);
    expect(onChange).toHaveBeenCalledOnce();
    expect(store.getSnapshot()).toBe(next);
    expect(store.getServerSnapshot()).toBe(BASELINE);
    unsubscribe();
    expect(provider.active()).toBe(false);
  });

  it("never starts the provider under reduced motion", () => {
    stubReducedMotion(true);
    const provider = manualProvider();
    const store = createSnapshotStore(BASELINE, provider);
    store.subscribe(vi.fn());
    expect(provider.active()).toBe(false);
    expect(store.getSnapshot()).toBe(BASELINE);
  });
});

describe("the /server screen", () => {
  beforeEach(() => {
    stubReducedMotion(true);
  });

  it("has the real ENG legends: RECORD boxed and inert at PB16, MENU to / at PB18", () => {
    expect(
      SERVER_LEGENDS.map(({ pb, lines, boxed, action }) => ({
        pb,
        lines,
        boxed,
        action,
      })),
    ).toEqual([
      { pb: 16, lines: ["RECORD"], boxed: true, action: { kind: "inert" } },
      {
        pb: 18,
        lines: ["MENU"],
        boxed: undefined,
        action: { kind: "link", href: "/" },
      },
    ]);
  });

  it("renders RECORD as a disabled button and MENU as a link", () => {
    render(<FullViewportFrame screens={serverScreens()} />);
    const record = screen.getByRole("button", { name: "Record" });
    expect(record).toHaveAttribute("aria-disabled", "true");
    expect(record).toHaveAttribute("data-pb", "16");
    expect(screen.getByRole("link", { name: "Tactical menu" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("draws the headers, 13 labels and 26 values in the square", () => {
    const { container } = render(
      <FullViewportFrame screens={serverScreens()} />,
    );
    const square = container.querySelector("#ddi-square");
    expect(square?.querySelectorAll("path")).toHaveLength(2 + 13 + 26);
  });

  it("redraws the values when the provider ticks", () => {
    stubReducedMotion(false);
    vi.useFakeTimers();
    const { container } = render(
      <FullViewportFrame screens={serverScreens()} />,
    );
    const paths = (): string[] =>
      [
        ...(container.querySelector("#ddi-square")?.querySelectorAll("path") ??
          []),
      ].map((path) => path.getAttribute("d") ?? "");
    const before = paths();
    act(() => {
      vi.advanceTimersByTime(4 * FAKE_INTERVAL_MS);
    });
    expect(paths()).not.toEqual(before);
    expect(paths().slice(0, 15)).toEqual(before.slice(0, 15));
  });
});
