import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RADAR_SCENE } from "@/content/radar";
import { scopePoint } from "../../formats/rdrAttk";
import { LEGEND_FONT, legendBounds, pbLabelLayout } from "../../frame/legend";
import { PBS, measure, pbEdge, type Pb, type Rect } from "../../geometry";
import { RadarScope, initialScan, radarModel, scopeFrame } from "./RadarScope";
import { RadarOsb } from "./islands";
import { radarPanel, type RadarPanel } from "./legends";
import { radarLegends } from "./screens";
import {
  INITIAL_RADAR,
  radarReducer,
  type RadarAction,
  type RadarState,
} from "./settings";
import { radarStore, resetRadarState } from "./store";

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.left < b.right && b.left < a.right && a.bottom < b.top && b.bottom < a.top
  );
}

function press(state: RadarState, ...actions: RadarAction[]): RadarState {
  return actions.reduce(radarReducer, state);
}

afterEach(() => {
  resetRadarState();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const STATES: Record<string, RadarState> = {
  RWS: INITIAL_RADAR,
  "RWS silent": press(INITIAL_RADAR, { type: "toggleSilent" }),
  "RWS at 160 NM": press(
    INITIAL_RADAR,
    { type: "stepRange", step: 1 },
    { type: "stepRange", step: 1 },
  ),
  TWS: press(INITIAL_RADAR, { type: "toggleMode" }),
  "RWS DATA": press(INITIAL_RADAR, { type: "toggleData" }),
  "TWS DATA silent": press(
    INITIAL_RADAR,
    { type: "toggleMode" },
    { type: "toggleData" },
    { type: "toggleSilent" },
    { type: "cycleDeclutter" },
    { type: "cycleDeclutter" },
  ),
};

function linesAt(panel: RadarPanel): Partial<Record<Pb, readonly string[]>> {
  return Object.fromEntries(
    PBS.flatMap((pb) => {
      const legend = panel[pb];
      return legend === undefined ? [] : [[pb, legend.lines]];
    }),
  );
}

describe("the RDR ATTK legends", () => {
  it("put a radar island on every OSB but PB18 MENU", () => {
    const legends = radarLegends();
    expect(legends.map((legend) => legend.pb)).toEqual([...PBS]);
    expect(legends.find((legend) => legend.pb === 18)).toMatchObject({
      lines: ["MENU"],
      action: { kind: "link", href: "/ddi" },
    });
    expect(
      legends.filter((legend) => legend.action.kind === "island"),
    ).toHaveLength(19);
  });

  it("show the RWS main level as the reference does", () => {
    expect(linesAt(radarPanel(INITIAL_RADAR))).toEqual({
      1: [],
      2: [],
      5: [],
      6: ["4B"],
      7: [" SIL "],
      8: ["ERASE"],
      11: [],
      12: [],
      13: ["SET"],
      14: ["RSET"],
      15: ["NCTR"],
      16: [" DATA "],
      17: ["CHAN"],
      19: ["140°"],
      20: ["MODE"],
    });
    const panel = radarPanel(INITIAL_RADAR);
    expect(panel[15]?.boxed).toBe(true);
    expect(panel[7]?.boxed).toBe(false);
    expect(panel[6]?.label).toBe("Elevation bars, 4B");
    expect(panel[1]?.label).toBe("Pulse repetition frequency, INTL");
  });

  it("make every OSB work except RDR/PRI, CHAN and MODE", () => {
    const inert = PBS.filter(
      (pb) => radarPanel(INITIAL_RADAR)[pb]?.action === null,
    );
    expect(inert).toEqual([2, 17, 20]);
  });

  it("box SIL and offer ACTIVE at PB10 while silent", () => {
    const panel = radarPanel(STATES["RWS silent"]);
    expect(panel[7]).toMatchObject({ boxed: true, pressed: true });
    expect(panel[10]).toMatchObject({
      lines: ["ACTIVE"],
      action: { type: "active" },
    });
  });

  it("drop the range arrow at its end of the scales", () => {
    const panel = radarPanel(STATES["RWS at 160 NM"]);
    expect(panel[11]).toBeUndefined();
    expect(panel[12]).toBeDefined();
  });

  it("swap in the TWS legends: HITS, RAID, AUTO/MAN and EXP", () => {
    const panel = radarPanel(STATES.TWS);
    expect(linesAt(panel)).toMatchObject({
      8: ["HITS"],
      9: ["RAID"],
      13: [],
      19: ["40°"],
      20: ["EXP"],
    });
    expect(panel[2]).toBeUndefined();
    expect(panel[17]).toBeUndefined();
    expect(panel[13]?.label).toBe("Scan centring, MAN");
    expect(panel[9]?.action).toBeNull();
  });

  it("show the DATA sublevel with DATA boxed", () => {
    expect(linesAt(radarPanel(STATES["RWS DATA"]))).toEqual({
      1: ["LDF"],
      2: ["NORM"],
      4: ["ECCM"],
      10: ["8"],
      12: [],
      13: ["COLOR"],
      14: ["MSI"],
      15: ["LTWS"],
      16: [" DATA "],
      17: ["DCLTR"],
      19: ["BRA"],
    });
    const panel = radarPanel(STATES["TWS DATA silent"]);
    expect(panel[16]?.boxed).toBe(true);
    expect(panel[15]).toBeUndefined();
    expect(panel[10]?.lines).toEqual(["ACTIVE"]);
    expect(panel[17]).toMatchObject({ lines: ["DCLTR 2"], boxed: true });
  });

  it("keep the legends clear of each other and fit the row pitch, in every state", () => {
    for (const state of Object.values(STATES)) {
      const panel = radarPanel(state);
      const inks = PBS.flatMap((pb) => {
        const legend = panel[pb];
        return legend === undefined
          ? []
          : [
              legendBounds(
                pbLabelLayout(pb, legend.lines, legend.boxed, [0, 0]),
              ),
            ];
      });
      inks.forEach((first, index) => {
        for (const second of inks.slice(index + 1)) {
          for (const a of first) {
            for (const b of second) {
              expect(overlaps(a, b)).toBe(false);
            }
          }
        }
      });
      for (const pb of PBS) {
        const edge = pbEdge(pb);
        for (const line of panel[pb]?.lines ?? []) {
          if (edge === "top" || edge === "bottom") {
            expect(measure(line, LEGEND_FONT).width).toBeLessThan(169);
          }
        }
      }
    }
  });
});

describe("the B-scope frame", () => {
  const model = radarModel(RADAR_SCENE);

  it("maps azimuth across ±70° and range up from the bottom edge", () => {
    expect(scopePoint(0, 0, 40)).toEqual([0, -409.5]);
    expect(scopePoint(40, 70, 40)).toEqual([409.5, 409.5]);
    expect(scopePoint(20, -35, 40)).toEqual([-204.75, 0]);
  });

  it("opens with the antenna at the left edge on bar 1 and most contacts shown", () => {
    const scan = initialScan(INITIAL_RADAR, model);
    const frame = scopeFrame(INITIAL_RADAR, scan, model);
    expect(frame.sweep).toBe("translate(-409.5 0)");
    expect(frame.readout).toEqual({ bar: 1, prf: "HI", centreElevation: 0 });
    expect(frame.hits.filter((hit) => hit.visible).length).toBeGreaterThan(2);
    expect(frame.tracks.every((track) => !track.visible)).toBe(true);
  });

  it("hides hits beyond the range scale", () => {
    const scan = initialScan(INITIAL_RADAR, model);
    const visible = (state: RadarState): number =>
      scopeFrame(state, scan, model).hits.filter((hit) => hit.visible).length;
    const at5 = press(
      INITIAL_RADAR,
      ...Array.from({ length: 3 }, (): RadarAction => ({
        type: "stepRange",
        step: -1,
      })),
    );
    expect(visible(at5)).toBe(0);
    expect(visible(INITIAL_RADAR)).toBeLessThanOrEqual(
      visible(press(INITIAL_RADAR, { type: "stepRange", step: 1 })),
    );
  });

  it("draws ranked trackfiles in TWS, with HITS dimming the raw hits", () => {
    const tws = STATES.TWS;
    const scan = initialScan(INITIAL_RADAR, model);
    const frame = scopeFrame(tws, scan, model);
    const ranks = frame.trackFiles.ranks.filter((rank) => rank !== null);
    expect(ranks.length).toBeGreaterThan(0);
    expect([...ranks].sort()).toEqual(ranks.map((_, index) => index + 1));
    expect(frame.rangeCaret.visible).toBe(true);
    expect(frame.trackFiles.closure).toBeGreaterThan(0);
    const rws = scopeFrame(INITIAL_RADAR, scan, model);
    rws.hits.forEach((hit, index) => {
      if (hit.visible) {
        expect(Number(frame.hits[index].opacity)).toBeCloseTo(
          Number(hit.opacity) / 2,
        );
      }
    });
    const noHits = scopeFrame(
      press(tws, { type: "toggle", option: "hits" }),
      scan,
      model,
    );
    expect(noHits.hits.every((hit) => !hit.visible)).toBe(true);
  });
});

function renderScope(): void {
  render(
    <svg>
      <RadarScope scene={RADAR_SCENE} />
    </svg>,
  );
}

describe("RadarScope", () => {
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    frames = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
  });

  function stubReducedMotion(matches: boolean): void {
    vi.stubGlobal("matchMedia", () => ({
      matches,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  }

  function runFrame(time: number): void {
    const callback = frames.shift();
    if (callback === undefined) {
      throw new Error("no frame requested");
    }
    act(() => callback(time));
  }

  it("draws the t = 0 frame, then advances at 20 Hz", () => {
    stubReducedMotion(false);
    renderScope();
    const sweep = screen.getByTestId("radar-sweep");
    expect(sweep).toHaveAttribute("transform", "translate(-409.5 0)");
    runFrame(1000);
    runFrame(1030);
    expect(sweep).toHaveAttribute("transform", "translate(-409.5 0)");
    runFrame(1050);
    // 50 ms at 60°/s is 3°: 3/70 of the half width.
    expect(sweep).toHaveAttribute("transform", "translate(-391.95 0)");
  });

  it("never starts the loop under reduced motion", () => {
    stubReducedMotion(true);
    renderScope();
    expect(frames).toHaveLength(0);
    expect(screen.getByTestId("radar-sweep")).toHaveAttribute(
      "transform",
      "translate(-409.5 0)",
    );
  });

  it("stops the sweep while silent", () => {
    stubReducedMotion(false);
    renderScope();
    const sweep = screen.getByTestId("radar-sweep");
    runFrame(1000);
    runFrame(1050);
    act(() =>
      radarStore.set(radarReducer(radarStore.get(), { type: "toggleSilent" })),
    );
    const stopped = sweep.getAttribute("transform");
    runFrame(1100);
    runFrame(1150);
    expect(sweep).toHaveAttribute("transform", stopped);
  });

  it("redraws at once when an OSB changes the scan, even under reduced motion", () => {
    stubReducedMotion(true);
    render(
      <>
        <svg>
          <RadarScope scene={RADAR_SCENE} />
        </svg>
        <RadarOsb pb={11} />
        <RadarOsb pb={8} />
        <RadarOsb pb={19} />
      </>,
    );
    const scope = screen.getByTestId("radar-scope");
    const visible = (): number =>
      screen
        .getAllByTestId("radar-hit")
        .filter((hit) => hit.getAttribute("visibility") === "visible").length;
    expect(scope).toHaveAttribute("data-range", "40");
    const before = visible();
    const up = screen.getByRole("button", { name: "Increase range scale" });
    fireEvent.pointerDown(up, { button: 0 });
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    up.dispatchEvent(click);
    expect(radarStore.get().scan.range).toBe(80);
    expect(scope).toHaveAttribute("data-range", "80");
    expect(visible()).toBeGreaterThanOrEqual(before);

    fireEvent.keyDown(screen.getByRole("button", { name: "Erase" }), {
      key: "Enter",
    });
    expect(visible()).toBe(0);

    const azimuth = screen.getByRole("button", { name: "Azimuth scan, 140°" });
    fireEvent.pointerDown(azimuth, { button: 0 });
    expect(scope).toHaveAttribute("data-azimuth", "80");
    expect(azimuth).toHaveAccessibleName("Azimuth scan, 80°");
    // A new pattern starts its frame at the left edge of the narrower scan: −40° of ±70°.
    expect(screen.getByTestId("radar-sweep")).toHaveAttribute(
      "transform",
      "translate(-234 0)",
    );
  });
});

describe("RadarOsb", () => {
  it("renders a blank, an inert and a working OSB as DCS does", () => {
    render(
      <>
        <RadarOsb pb={9} />
        <RadarOsb pb={17} />
        <RadarOsb pb={7} />
      </>,
    );
    const blank = document.querySelector("[data-radar-pb='9']");
    expect(blank).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Channel").closest("button")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    const silent = screen.getByRole("button", { name: "Silent" });
    expect(silent).toHaveAttribute("aria-pressed", "false");
    fireEvent.pointerDown(silent, { button: 0 });
    expect(silent).toHaveAttribute("aria-pressed", "true");
    expect(radarStore.get().silent).toBe(true);
  });

  it("boxes SET for two seconds after a press", () => {
    vi.useFakeTimers();
    render(<RadarOsb pb={13} />);
    fireEvent.keyDown(
      screen.getByRole("button", { name: "Save scan settings" }),
      {
        key: " ",
      },
    );
    expect(radarStore.get().setBoxed).toBe(true);
    act(() => vi.advanceTimersByTime(2000));
    expect(radarStore.get().setBoxed).toBe(false);
  });
});
