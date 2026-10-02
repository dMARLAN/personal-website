import { describe, expect, it } from "vitest";
import { RADAR_SCENE } from "@/content/radar";
import {
  BAR_COUNT,
  HIT_AGING,
  antennaAzimuth,
  antennaElevation,
  contactPath,
  contactPosition,
  hitIntensity,
  lastSweptAt,
  rawHit,
  scanAltitudeLimits,
  scanBar,
} from "./sim";

const SWEEP = 140 / 60;

describe("the RWS scan", () => {
  it("sweeps ±70° at 60°/s as a triangle wave, starting at the left edge", () => {
    expect(antennaAzimuth(0)).toBe(-70);
    expect(antennaAzimuth(1)).toBeCloseTo(-10);
    expect(antennaAzimuth(SWEEP)).toBeCloseTo(70);
    expect(antennaAzimuth(SWEEP + 1)).toBeCloseTo(10);
    expect(antennaAzimuth(2 * SWEEP)).toBeCloseTo(-70);
  });

  it("moves to the next of 4 bars each sweep, then back to bar 1", () => {
    const bars = Array.from({ length: 6 }, (_, sweep) =>
      scanBar(sweep * SWEEP + 0.1),
    );
    expect(bars).toEqual([1, 2, 3, 4, 1, 2]);
    expect(BAR_COUNT).toBe(4);
    expect(antennaElevation(0.1)).toBeGreaterThan(
      antennaElevation(SWEEP + 0.1),
    );
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

  it("move plausibly: no faster than 1000 knots relative", () => {
    for (const path of paths) {
      const a = path.at(0);
      const b = path.at(1);
      const toXY = ({ range, azimuth }: { range: number; azimuth: number }) => [
        range * Math.sin((azimuth * Math.PI) / 180),
        range * Math.cos((azimuth * Math.PI) / 180),
      ];
      const [ax, ay] = toXY(a);
      const [bx, by] = toXY(b);
      expect(Math.hypot(bx - ax, by - ay) * 3600).toBeLessThanOrEqual(1000);
    }
  });

  it("are swept by the antenna at the time the hit records", () => {
    for (const path of paths) {
      for (const time of [0, 3.7, 40, 251.3]) {
        const swept = lastSweptAt(path, time);
        if (swept === null) {
          throw new Error("expected a sweep");
        }
        expect(swept).toBeLessThanOrEqual(time);
        expect(time - swept).toBeLessThanOrEqual(2 * SWEEP);
        expect(antennaAzimuth(swept)).toBeCloseTo(
          contactPosition(path, swept).azimuth,
          3,
        );
      }
    }
  });

  it("refresh a raw hit only when the antenna sweeps them", () => {
    const path = paths[0];
    const time = 40;
    const hit = rawHit(path, time);
    if (hit === null) {
      throw new Error("expected a hit");
    }
    const sweptAt = time - hit.age;
    expect(antennaAzimuth(sweptAt)).toBeCloseTo(hit.azimuth, 3);
    // Between sweeps the brick stays put while the contact moves on.
    const later = rawHit(path, time + 0.01);
    expect(later?.range).toBe(hit.range);
    expect(contactPosition(path, time + 0.01).range).not.toBe(hit.range);
  });

  it("show every contact on the t = 0 frame", () => {
    for (const path of paths) {
      const hit = rawHit(path, 0);
      expect(hit).not.toBeNull();
      expect(hit?.age).toBeLessThan(HIT_AGING);
    }
  });

  it("dim a hit linearly as it ages", () => {
    expect(hitIntensity(0)).toBe(1);
    expect(hitIntensity(HIT_AGING / 2)).toBe(0.5);
    expect(hitIntensity(HIT_AGING)).toBe(0);
  });

  it("rejects a contact that starts outside the volume", () => {
    expect(() =>
      contactPath({ range: 90, azimuth: 0, speed: 500, track: 180 }),
    ).toThrow(/outside the volume/);
  });
});

describe("the cursor's scan altitude limits", () => {
  it("bracket our altitude, in thousands of feet, and stop at 0", () => {
    expect(scanAltitudeLimits(20480, 0)).toEqual({ upper: 20, lower: 20 });
    const { upper, lower } = scanAltitudeLimits(20480, 30);
    expect(upper).toBeGreaterThan(20);
    expect(lower).toBeLessThan(20);
    expect(scanAltitudeLimits(1000, 160).lower).toBe(0);
  });
});
