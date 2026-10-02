import { describe, expect, it } from "vitest";
import { RADAR_SCENE } from "@/content/radar";
import type { RadarContact } from "@/content/types";
import { OPENING_SCAN, type ScanSettings } from "./settings";
import {
  BEAM_WIDTH,
  antennaAt,
  barElevation,
  closure,
  contactPath,
  contactPosition,
  eraseHits,
  frameSeconds,
  hitIntensity,
  instantaneousPrf,
  prfDetects,
  rankedTracks,
  restartFrame,
  scanAltitudeLimits,
  scanPattern,
  startActiveFrame,
  stepScan,
  sweepSeconds,
  visibleHit,
  warmScan,
  type ScanContext,
  type ScanState,
} from "./sim";

const OWN_ALTITUDE = 20480;

function rws(
  change: Partial<ScanSettings> = {},
): ReturnType<typeof scanPattern> {
  return scanPattern("RWS", { ...OPENING_SCAN, ...change });
}

describe("the scan pattern", () => {
  it("rasters 4 bars across 140° at 60°/s: left to right on bar 1, back on bar 2", () => {
    const pattern = rws();
    const sweep = 140 / 60;
    expect(sweepSeconds(pattern)).toBeCloseTo(sweep);
    expect(frameSeconds(pattern)).toBeCloseTo(4 * sweep);
    expect(antennaAt(pattern, 0)).toMatchObject({ azimuth: -70, bar: 1 });
    expect(antennaAt(pattern, 1).azimuth).toBeCloseTo(-10);
    expect(antennaAt(pattern, sweep + 1)).toMatchObject({ bar: 2 });
    expect(antennaAt(pattern, sweep + 1).azimuth).toBeCloseTo(10);
    const bars = [0, 1, 2, 3, 4, 5].map(
      (pass) => antennaAt(pattern, (pass + 0.5) * sweep).bar,
    );
    expect(bars).toEqual([1, 2, 3, 4, 1, 2]);
  });

  it("frames faster with fewer bars and a narrower azimuth", () => {
    expect(frameSeconds(rws({ bars: 6 }))).toBeCloseTo(14);
    expect(frameSeconds(rws({ bars: 1, azimuth: 20 }))).toBeCloseTo(1 / 3);
    const oneBar = rws({ bars: 1, azimuth: 20 });
    expect(antennaAt(oneBar, 0.1)).toMatchObject({ bar: 1 });
    // One bar: the antenna sweeps back and forth across ±10° on the same bar.
    expect(antennaAt(oneBar, 0).azimuth).toBe(-10);
    expect(antennaAt(oneBar, 1 / 3 + 0.1).azimuth).toBeCloseTo(4);
  });

  it("stacks the bars 1.3° apart about the centre, bar 1 on top; 4.2° at 5 NM; 2° for TWS 2-bar", () => {
    const pattern = rws();
    expect([1, 2, 3, 4].map((bar) => barElevation(pattern, bar))).toEqual([
      1.9500000000000002, 0.65, -0.65, -1.9500000000000002,
    ]);
    expect(barElevation(rws({ range: 5 }), 1)).toBeCloseTo(6.3);
    expect(
      scanPattern("TWS", { ...OPENING_SCAN, bars: 2, azimuth: 80 }).spacing,
    ).toBe(2);
    expect(barElevation(rws({ bars: 1 }), 1)).toBe(0);
  });

  it("keeps a centred scan inside the ±70° gimbal limits", () => {
    const pattern = scanPattern(
      "TWS",
      { ...OPENING_SCAN, bars: 2, azimuth: 80 },
      { azimuth: 60, elevation: 1 },
    );
    expect(pattern.centre).toEqual({ azimuth: 30, elevation: 1 });
    expect(antennaAt(pattern, 0).azimuth).toBe(-10);
    expect(barElevation(pattern, 1)).toBe(2);
  });

  it("interleaves the PRF pass by pass", () => {
    expect([0, 1, 2, 3].map((pass) => instantaneousPrf("INTL", pass))).toEqual([
      "HI",
      "MED",
      "HI",
      "MED",
    ]);
    expect(instantaneousPrf("MED", 0)).toBe("MED");
    expect(instantaneousPrf("HI", 1)).toBe("HI");
  });

  it("gives the cursor's altitude limits, in thousands of feet, from the bars' coverage", () => {
    expect(scanAltitudeLimits(rws(), OWN_ALTITUDE, 0)).toEqual({
      upper: 20,
      lower: 20,
    });
    const four = scanAltitudeLimits(rws(), OWN_ALTITUDE, 30);
    const one = scanAltitudeLimits(rws({ bars: 1 }), OWN_ALTITUDE, 30);
    expect(four.upper).toBeGreaterThan(one.upper);
    expect(four.lower).toBeLessThan(one.lower);
    // The guide's RWS figure shows a lower limit of −2.
    expect(scanAltitudeLimits(rws(), 1000, 160).lower).toBeLessThan(0);
  });
});

describe("the contacts", () => {
  const paths = RADAR_SCENE.contacts.map(contactPath);

  it("start where the content puts them", () => {
    RADAR_SCENE.contacts.forEach((contact, index) => {
      const start = contactPosition(paths[index], 0);
      expect(start.range).toBeCloseTo(contact.range);
      expect(start.azimuth).toBeCloseTo(contact.azimuth);
    });
  });

  it("stay inside the 80 NM, ±70° volume and re-enter where they came in", () => {
    for (const path of paths) {
      expect(path.enter).toBeLessThanOrEqual(0);
      expect(path.exit).toBeGreaterThan(0);
      for (let time = -600; time <= 600; time += 7) {
        const { range, azimuth } = contactPosition(path, time);
        expect(range).toBeLessThanOrEqual(80);
        expect(range).toBeGreaterThanOrEqual(2);
        expect(Math.abs(azimuth)).toBeLessThanOrEqual(70);
      }
      const span = path.exit - path.enter;
      expect(contactPosition(path, path.exit + 1).range).toBeCloseTo(
        contactPosition(path, path.exit + 1 - span).range,
      );
    }
  });

  it("close at their speed when they fly straight at us", () => {
    const headOn = contactPath({
      range: 40,
      azimuth: 0,
      speed: 600,
      track: 180,
      altitude: OWN_ALTITUDE,
    });
    expect(closure(headOn, 0)).toBeCloseTo(600);
  });

  it("rejects a contact that starts outside the volume", () => {
    expect(() =>
      contactPath({
        range: 90,
        azimuth: 0,
        speed: 500,
        track: 180,
        altitude: OWN_ALTITUDE,
      }),
    ).toThrow(/outside the volume/);
  });
});

describe("PRF detection", () => {
  it("HI sees the whole volume but not slow-closing contacts; MED sees any aspect to 40 NM", () => {
    expect(prfDetects("HI", 75, 500)).toBe(true);
    expect(prfDetects("HI", 20, 100)).toBe(false);
    expect(prfDetects("MED", 20, -200)).toBe(true);
    expect(prfDetects("MED", 45, 900)).toBe(false);
  });
});

/** A contact straight ahead, 20 NM out, closing at 600 knots, at `altitude`. The scans below are 1-bar MED unless set. */
function aheadAt(altitude: number): RadarContact {
  return { range: 20, azimuth: 0, speed: 600, track: 180, altitude };
}

function context(
  contacts: readonly RadarContact[],
  change: Partial<ScanSettings> = {},
  silent = false,
): ScanContext {
  return {
    paths: contacts.map(contactPath),
    pattern: rws({ prf: "MED", bars: 1, ...change }),
    prf: "MED",
    silent,
    ownAltitude: OWN_ALTITUDE,
  };
}

function freshScan(count: number): ScanState {
  return {
    time: 0,
    scanTime: 0,
    activeUntil: 0,
    hits: Array.from({ length: count }, () => null),
    seen: Array.from({ length: count }, () => null),
  };
}

/** Steps `seconds` at the 20 Hz frame interval. */
function run(state: ScanState, seconds: number, scan: ScanContext): ScanState {
  let current = state;
  for (let step = 0; step < Math.round(seconds / 0.05); step += 1) {
    current = stepScan(current, 0.05, scan);
  }
  return current;
}

describe("the scan state", () => {
  it("records a hit where and when the beam crosses a contact", () => {
    const scan = context([aheadAt(OWN_ALTITUDE)]);
    // Bar 1 sweeps left to right and crosses 0° after 70/60 s.
    const swept = run(freshScan(1), 1.5, scan);
    const hit = swept.hits[0];
    expect(hit?.time).toBeCloseTo(70 / 60, 2);
    expect(hit?.azimuth).toBeCloseTo(0);
    expect(hit?.range).toBeCloseTo(20 - (600 / 3600) * (70 / 60), 2);
    expect(swept.seen[0]).toBe(hit?.time);
    // Until the beam comes back, the brick stays put while the contact flies on.
    expect(run(swept, 0.5, scan).hits[0]).toEqual(hit);
  });

  it("sees a contact only on the bars that cover its elevation", () => {
    // 20 NM out, 2000 ft up is 0.94°: inside the 1-bar beam (±1.65°); 4000 ft (1.89°) is not.
    const low = context([aheadAt(OWN_ALTITUDE + 2000)], { bars: 1 });
    expect(run(freshScan(1), 1.5, low).hits[0]).not.toBeNull();
    const high = context([aheadAt(OWN_ALTITUDE + 4000)], { bars: 1 });
    expect(run(freshScan(1), 3, high).hits[0]).toBeNull();
    // Four bars reach +3.6°: bar 1 (+1.95°) sees it.
    const fourBars = context([aheadAt(OWN_ALTITUDE + 4000)], { bars: 4 });
    expect(run(freshScan(1), 2, fourBars).hits[0]).not.toBeNull();
    expect(BEAM_WIDTH).toBe(3.3);
  });

  it("stands still and sees nothing while silent, then ACTIVE scans one frame", () => {
    const silent = context([aheadAt(OWN_ALTITUDE)], {}, true);
    const quiet = run(freshScan(1), 3, silent);
    expect(quiet.scanTime).toBe(0);
    expect(quiet.time).toBeCloseTo(3);
    expect(quiet.hits[0]).toBeNull();
    const active = startActiveFrame(quiet, silent.pattern);
    const frame = frameSeconds(silent.pattern);
    const scanned = run(active, frame + 1, silent);
    expect(scanned.scanTime).toBeCloseTo(frame);
    expect(scanned.hits[0]).not.toBeNull();
    expect(run(scanned, 1, silent).scanTime).toBe(scanned.scanTime);
  });

  it("restarts a frame at bar 1, left edge, and erases the hits", () => {
    const scan = context([aheadAt(OWN_ALTITUDE)]);
    const swept = run(freshScan(1), 4, scan);
    expect(restartFrame(swept).scanTime).toBe(0);
    expect(eraseHits(swept).hits).toEqual([null]);
    expect(eraseHits(swept).seen).toEqual(swept.seen);
  });

  it("warms up to t = 0 with the antenna at the start of bar 1 and every hit aged under the aging time", () => {
    const paths = RADAR_SCENE.contacts.map(contactPath);
    const warm = warmScan(
      {
        paths,
        pattern: rws(),
        prf: "INTL",
        silent: false,
        ownAltitude: RADAR_SCENE.ownship.altitude,
      },
      8,
    );
    expect(warm).toMatchObject({ time: 0, scanTime: 0 });
    const shown = paths
      .map((_, index) => visibleHit(warm, index, 8))
      .filter((hit) => hit !== null);
    expect(shown.length).toBeGreaterThanOrEqual(3);
    for (const hit of shown) {
      expect(hit.age).toBeGreaterThanOrEqual(0);
      expect(hit.age).toBeLessThanOrEqual(8);
    }
  });

  it("dims a hit linearly over the target aging time", () => {
    expect(hitIntensity(0, 8)).toBe(1);
    expect(hitIntensity(4, 8)).toBe(0.5);
    expect(hitIntensity(16, 32)).toBe(0.5);
    const scan = context([aheadAt(OWN_ALTITUDE)]);
    const swept = run(freshScan(1), 1.5, scan);
    expect(visibleHit(swept, 0, 2)).not.toBeNull();
    const later = { ...swept, time: swept.time + 2 };
    expect(visibleHit(later, 0, 2)).toBeNull();
    expect(visibleHit(later, 0, 4)).not.toBeNull();
  });

  it("ranks the trackfiles by time to intercept and drops stale ones", () => {
    const contacts = [
      aheadAt(OWN_ALTITUDE),
      { ...aheadAt(OWN_ALTITUDE), range: 10, speed: 200 },
      { ...aheadAt(OWN_ALTITUDE), range: 30, speed: 1200 },
    ];
    const scan = context(contacts);
    const seen: ScanState = { ...freshScan(3), seen: [0, 0, 0] };
    // 20/600, 10/200 and 30/1200 hours: 2 minutes, 3 minutes and 1.5 minutes.
    expect(rankedTracks(seen, scan.paths, 5)).toEqual([2, 0, 1]);
    expect(
      rankedTracks({ ...seen, seen: [0, null, -10] }, scan.paths, 5),
    ).toEqual([0]);
  });
});
