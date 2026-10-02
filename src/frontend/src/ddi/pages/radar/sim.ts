import type { RadarContact } from "@/content/types";
import { DISPLAY_AZIMUTH } from "../../formats/rdrAttk";

/*
 * The fake RWS scan (ours, docs/pages/radar.md). Everything is a pure function of the sim time in seconds, so a
 * frame can be drawn for any time, including the static t = 0 frame the server renders.
 */

/** (ours) Antenna azimuth rate, °/s. The scan covers the full 140° the `140°` legend shows. */
export const SCAN_RATE = 60;
const SWEEP_SECONDS = (2 * DISPLAY_AZIMUTH) / SCAN_RATE;
const SCAN_PERIOD = 2 * SWEEP_SECONDS;
/** (ours) A 4-bar scan: bar 1 is the top bar. Each sweep moves to the next bar, then back to bar 1. */
export const BAR_COUNT = 4;
/** (ours) Bar centres in degrees from the antenna elevation: 1.4° apart. */
const BAR_ELEVATIONS = [2.1, 0.7, -0.7, -2.1] as const;
/** (ours) Half the vertical coverage of the 4-bar scan, for the cursor's altitude limits: 3 × 1.4° + a 3.3° beam. */
export const SCAN_HALF_COVERAGE = (3 * 1.4 + 3.3) / 2;
/** (ours) How long a raw hit stays on the scope after the antenna last swept it, s. It dims linearly. */
export const HIT_AGING = 8;
/** (ours) Contacts fly inside this volume, then re-enter where they first came in. */
const VOLUME = { minRange: 2, maxRange: 80 } as const;
const STEP_SECONDS = 1;
const MAX_FLIGHT_SECONDS = 3600;

export interface Polar {
  /** NM. */
  range: number;
  /** Degrees, right positive. */
  azimuth: number;
}

export interface RawHitState extends Polar {
  /** Seconds since the antenna swept the contact. */
  age: number;
}

const DEGREES = Math.PI / 180;

/** The remainder of `value / divisor`, always in [0, divisor). */
function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

/** Where the antenna points at `time`: a triangle wave across ±70°, starting at the left edge. */
export function antennaAzimuth(time: number): number {
  const phase = modulo(time, SCAN_PERIOD);
  return phase < SWEEP_SECONDS
    ? -DISPLAY_AZIMUTH + SCAN_RATE * phase
    : DISPLAY_AZIMUTH - SCAN_RATE * (phase - SWEEP_SECONDS);
}

/** The bar being scanned at `time`, 1 to 4. */
export function scanBar(time: number): number {
  return modulo(Math.floor(time / SWEEP_SECONDS), BAR_COUNT) + 1;
}

/** The antenna elevation at `time`, degrees. */
export function antennaElevation(time: number): number {
  return BAR_ELEVATIONS[scanBar(time) - 1];
}

function toPolar(east: number, north: number): Polar {
  return {
    range: Math.hypot(east, north),
    azimuth: Math.atan2(east, north) / DEGREES,
  };
}

function inVolume({ range, azimuth }: Polar): boolean {
  return (
    range >= VOLUME.minRange &&
    range <= VOLUME.maxRange &&
    Math.abs(azimuth) <= DISPLAY_AZIMUTH
  );
}

/** A contact's straight path through the volume: where it is `seconds` after t = 0, and when it enters and leaves. */
export interface ContactPath {
  at: (seconds: number) => Polar;
  /** Seconds relative to t = 0: `enter` ≤ 0 ≤ `exit`. */
  enter: number;
  exit: number;
}

export function contactPath(contact: RadarContact): ContactPath {
  const east = contact.range * Math.sin(contact.azimuth * DEGREES);
  const north = contact.range * Math.cos(contact.azimuth * DEGREES);
  const nmPerSecond = contact.speed / 3600;
  const velocityEast = nmPerSecond * Math.sin(contact.track * DEGREES);
  const velocityNorth = nmPerSecond * Math.cos(contact.track * DEGREES);
  const at = (seconds: number): Polar =>
    toPolar(east + velocityEast * seconds, north + velocityNorth * seconds);
  if (!inVolume(at(0))) {
    throw new Error(
      `Radar contact at ${contact.range} NM, ${contact.azimuth}° starts outside the volume`,
    );
  }
  const edge = (direction: 1 | -1): number => {
    let seconds = 0;
    while (
      Math.abs(seconds) < MAX_FLIGHT_SECONDS &&
      inVolume(at(seconds + direction * STEP_SECONDS))
    ) {
      seconds += direction * STEP_SECONDS;
    }
    return seconds;
  };
  return { at, enter: edge(-1), exit: edge(1) };
}

/** Where the contact is at sim `time`: it flies its path, then re-enters where it first came in. */
export function contactPosition(path: ContactPath, time: number): Polar {
  const span = path.exit - path.enter;
  return path.at(path.enter + modulo(time - path.enter, span));
}

/** Bisection steps for a sweep crossing: 2.3 s / 2^30 is far below a frame. */
const CROSSING_STEPS = 30;

/** When the antenna crossed the contact between `start` and `end`, inside one sweep; null if it did not. */
function crossingIn(
  path: ContactPath,
  start: number,
  end: number,
): number | null {
  const gap = (time: number): number =>
    antennaAzimuth(time) - contactPosition(path, time).azimuth;
  let low = start;
  let high = end;
  const lowSign = Math.sign(gap(low));
  if (lowSign === Math.sign(gap(high))) {
    return null;
  }
  for (let step = 0; step < CROSSING_STEPS; step += 1) {
    const middle = (low + high) / 2;
    if (Math.sign(gap(middle)) === lowSign) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return high;
}

/** The last time at or before `time` that the antenna swept the contact, looking back far enough to age a hit out. */
export function lastSweptAt(path: ContactPath, time: number): number | null {
  const current = Math.floor(time / SWEEP_SECONDS);
  const sweeps = Math.ceil(HIT_AGING / SWEEP_SECONDS) + 1;
  for (let sweep = current; sweep > current - sweeps; sweep -= 1) {
    const start = sweep * SWEEP_SECONDS;
    const crossing = crossingIn(
      path,
      start,
      Math.min(time, start + SWEEP_SECONDS),
    );
    if (crossing !== null) {
      return crossing;
    }
  }
  return null;
}

/**
 * The raw hit the scope shows for a contact at `time`: the contact where the antenna last swept it, as an RWS scan
 * refreshes a brick only when the beam passes. Null once the hit has aged out.
 */
export function rawHit(path: ContactPath, time: number): RawHitState | null {
  const sweptAt = lastSweptAt(path, time);
  if (sweptAt === null || time - sweptAt > HIT_AGING) {
    return null;
  }
  return { ...contactPosition(path, sweptAt), age: time - sweptAt };
}

/** A raw hit's intensity: full when swept, dimming linearly to zero at `HIT_AGING`. */
export function hitIntensity(age: number): number {
  return 1 - age / HIT_AGING;
}

/**
 * The acquisition cursor's scan altitude limits at `range` NM, in thousands of feet: our altitude plus the height of
 * the scan's upper and lower edges at that range. The lower limit stops at 0.
 */
export function scanAltitudeLimits(
  altitude: number,
  range: number,
): { upper: number; lower: number } {
  const feet = range * 6076.12;
  const edge = (degrees: number): number =>
    Math.max(
      0,
      Math.round((altitude + feet * Math.tan(degrees * DEGREES)) / 1000),
    );
  return {
    upper: edge(SCAN_HALF_COVERAGE),
    lower: edge(-SCAN_HALF_COVERAGE),
  };
}
