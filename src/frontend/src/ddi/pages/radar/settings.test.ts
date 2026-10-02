import { describe, expect, it } from "vitest";
import {
  INITIAL_RADAR,
  OPENING_SCAN,
  fitScan,
  radarReducer,
  steppedRange,
  type RadarAction,
  type RadarState,
} from "./settings";

function press(state: RadarState, ...actions: RadarAction[]): RadarState {
  return actions.reduce(radarReducer, state);
}

/** The values `read` takes over `count` presses of `action`, starting from `state`. */
function cycle<T>(
  state: RadarState,
  action: RadarAction,
  count: number,
  read: (state: RadarState) => T,
): T[] {
  const values: T[] = [];
  let current = state;
  for (let index = 0; index < count; index += 1) {
    current = radarReducer(current, action);
    values.push(read(current));
  }
  return values;
}

const TWS = press(INITIAL_RADAR, { type: "toggleMode" });

describe("the RWS scan settings", () => {
  it("open at 4 bars, 140°, 40 NM and INTL", () => {
    expect(INITIAL_RADAR.mode).toBe("RWS");
    expect(INITIAL_RADAR.scan).toEqual({
      bars: 4,
      azimuth: 140,
      range: 40,
      prf: "INTL",
      aging: 8,
    });
  });

  it("cycle the bars 4, 6, 1, 2, 4", () => {
    expect(
      cycle(
        INITIAL_RADAR,
        { type: "cycleBars" },
        4,
        (state) => state.scan.bars,
      ),
    ).toEqual([6, 1, 2, 4]);
  });

  it("cycle the azimuth 140, 80, 60, 40, 20, 140", () => {
    expect(
      cycle(
        INITIAL_RADAR,
        { type: "cycleAzimuth" },
        5,
        (state) => state.scan.azimuth,
      ),
    ).toEqual([80, 60, 40, 20, 140]);
  });

  it("cycle the PRF INTL, HI, MED, INTL", () => {
    expect(
      cycle(INITIAL_RADAR, { type: "cyclePrf" }, 3, (state) => state.scan.prf),
    ).toEqual(["HI", "MED", "INTL"]);
  });

  it("cycle the target aging 8, 16, 32, 2, 4, 8", () => {
    expect(
      cycle(
        INITIAL_RADAR,
        { type: "cycleAging" },
        5,
        (state) => state.scan.aging,
      ),
    ).toEqual([16, 32, 2, 4, 8]);
  });

  it("step the range scale between 5 and 160 NM", () => {
    expect(steppedRange(40, 1)).toBe(80);
    expect(steppedRange(160, 1)).toBe(160);
    expect(steppedRange(5, -1)).toBe(5);
    expect(
      press(INITIAL_RADAR, { type: "stepRange", step: -1 }).scan.range,
    ).toBe(20);
  });
});

describe("TWS", () => {
  it("toggles with RWS and fits the scan: no 1-bar scan, and the widest azimuth shrinks with the bars", () => {
    expect(TWS.mode).toBe("TWS");
    expect(TWS.scan).toMatchObject({ bars: 4, azimuth: 40 });
    const oneBar = press(
      INITIAL_RADAR,
      { type: "cycleBars" },
      {
        type: "cycleBars",
      },
    );
    expect(oneBar.scan.bars).toBe(1);
    expect(press(oneBar, { type: "toggleMode" }).scan).toMatchObject({
      bars: 2,
      azimuth: 80,
    });
    expect(press(TWS, { type: "toggleMode" })).toMatchObject({
      mode: "RWS",
      scan: { bars: 4, azimuth: 40 },
    });
  });

  it("cycles the bars 4, 6, 2, 4 and fits the azimuth to each", () => {
    expect(
      cycle(TWS, { type: "cycleBars" }, 3, ({ scan }) => [
        scan.bars,
        scan.azimuth,
      ]),
    ).toEqual([
      [6, 20],
      [2, 20],
      [4, 20],
    ]);
  });

  it("cycles only the azimuths the bars allow", () => {
    const twoBar = press(TWS, { type: "cycleBars" }, { type: "cycleBars" });
    expect(twoBar.scan.bars).toBe(2);
    expect(
      cycle(twoBar, { type: "cycleAzimuth" }, 4, (state) => state.scan.azimuth),
    ).toEqual([80, 60, 40, 20]);
    expect(
      cycle(TWS, { type: "cycleAzimuth" }, 2, (state) => state.scan.azimuth),
    ).toEqual([20, 40]);
    const sixBar = press(TWS, { type: "cycleBars" });
    expect(press(sixBar, { type: "cycleAzimuth" }).scan.azimuth).toBe(20);
  });

  it("fits any scan, and leaves RWS scans alone", () => {
    const wide = { ...OPENING_SCAN, bars: 6, azimuth: 140 } as const;
    expect(fitScan("TWS", wide)).toMatchObject({ bars: 6, azimuth: 20 });
    expect(fitScan("RWS", wide)).toBe(wide);
  });

  it("toggles the scan centring MAN and AUTO, and the raw hits", () => {
    expect(TWS.centring).toBe("MAN");
    expect(press(TWS, { type: "toggleCentring" }).centring).toBe("AUTO");
    expect(TWS.hits).toBe(true);
    expect(press(TWS, { type: "toggle", option: "hits" }).hits).toBe(false);
  });
});

describe("SET and RSET", () => {
  it("save the scan settings and return to them", () => {
    const changed = press(
      INITIAL_RADAR,
      { type: "cycleBars" },
      { type: "cycleAzimuth" },
      { type: "cyclePrf" },
      { type: "stepRange", step: 1 },
    );
    expect(press(changed, { type: "reset" }).scan).toEqual(OPENING_SCAN);
    const saved = press(changed, { type: "set" });
    expect(saved.setBoxed).toBe(true);
    const restored = press(
      saved,
      { type: "cycleBars" },
      { type: "cycleAging" },
      { type: "reset" },
    );
    expect(restored.scan).toEqual(changed.scan);
    expect(restored.resetBoxed).toBe(true);
    expect(press(restored, { type: "unbox", legend: "RSET" }).resetBoxed).toBe(
      false,
    );
  });

  it("fit the saved settings to TWS", () => {
    expect(press(TWS, { type: "reset" }).scan).toMatchObject({
      bars: 4,
      azimuth: 40,
    });
  });
});

describe("the other controls", () => {
  it("toggle SIL, and count ACTIVE and ERASE presses for the scope", () => {
    const silent = press(INITIAL_RADAR, { type: "toggleSilent" });
    expect(silent.silent).toBe(true);
    expect(press(silent, { type: "toggleSilent" }).silent).toBe(false);
    const pressed = press(
      silent,
      { type: "active" },
      { type: "erase" },
      {
        type: "erase",
      },
    );
    expect(pressed).toMatchObject({ activeRequests: 1, erasures: 2 });
  });

  it("open and close DATA", () => {
    const data = press(INITIAL_RADAR, { type: "toggleData" });
    expect(data.sublevel).toBe("DATA");
    expect(press(data, { type: "toggleData" }).sublevel).toBe("MAIN");
  });

  it("toggle the boxed options and cycle the declutter", () => {
    expect(INITIAL_RADAR.nctr).toBe(true);
    expect(press(INITIAL_RADAR, { type: "toggle", option: "nctr" }).nctr).toBe(
      false,
    );
    expect(press(INITIAL_RADAR, { type: "toggle", option: "bra" }).bra).toBe(
      true,
    );
    expect(
      cycle(
        INITIAL_RADAR,
        { type: "cycleDeclutter" },
        3,
        (state) => state.declutter,
      ),
    ).toEqual([1, 2, 0]);
    expect(press(INITIAL_RADAR, { type: "toggleSpeedGate" }).speedGate).toBe(
      "WIDE",
    );
  });
});
