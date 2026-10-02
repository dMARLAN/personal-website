import type { RadarContact } from "@/content/types";
import { DISPLAY_AZIMUTH } from "../../formats/rdrAttk";
import type { Prf, RadarMode, ScanSettings } from "./settings";

/*
 * The fake A/A scan (ours, docs/pages/radar.md section 3). Contacts fly straight lines, a pure function of the sim
 * time. The antenna follows a raster scan pattern on its own scan clock, which stops while the radar is silent. A
 * `ScanState` steps forward frame by frame: each step finds the contacts the beam crossed and records their hits.
 */

/** (ours) Antenna azimuth rate, °/s. */
export const SCAN_RATE = 60;
/** (ours) The beam's height, degrees: a contact is seen on a bar when it is within half of it. */
export const BEAM_WIDTH = 3.3;
/** "Bar spacing is generally 1.3°; however, when 5 nm scale is selected, it is 4.2°" (guide, RWS item 3). */
const BAR_SPACING = 1.3;
const BAR_SPACING_5_NM = 4.2;
/** "For 4 and 6 bars, the elevation bar spacing is 1.3 degrees. For 2 bars it is 2°" (guide, TWS). */
const BAR_SPACING_TWS_2_BAR = 2;
/** (ours) What each PRF sees. HI reaches the whole volume but misses low-closure (beam and tail aspect) contacts. */
export const PRF_DETECTION = {
  HI: { maxRange: 80, minClosure: 300 },
  MED: { maxRange: 40, minClosure: -Infinity },
} as const;
/** (ours) A trackfile coasts this long past one frame without a hit, then drops. */
export const TRACK_GRACE = 3;
/** (ours) Contacts fly inside this volume, then re-enter where they first came in. */
const VOLUME = { minRange: 2, maxRange: 80 } as const;
const STEP_SECONDS = 1;
const MAX_FLIGHT_SECONDS = 3600;
/** The fixed step the warm-up runs at: the 20 Hz frame interval. */
const WARM_STEP = 0.05;
/**
 * A step is at most 100 ms (`MAX_FRAME_STEP_MS`), so the beam moves at most 6° in one; a far wider change in the
 * beam-to-contact gap is the contact re-entering the volume, not a crossing.
 */
const MAX_GAP_CHANGE = 20;
const FEET_PER_NM = 6076.12;
const DEGREES = Math.PI / 180;

export interface Polar {
  /** NM. */
  range: number;
  /** Degrees, right positive. */
  azimuth: number;
}

/** The remainder of `value / divisor`, always in [0, divisor). */
function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

// ---- Scan pattern ---------------------------------------------------------------------------------------------

export interface ScanPattern {
  bars: number;
  /** The total azimuth width, degrees. */
  width: number;
  /** Degrees between bar centres. */
  spacing: number;
  /** The scan centre, degrees. */
  centre: { azimuth: number; elevation: number };
}

/** Where the antenna points, and which bar and pass it is on. A pass is one sweep across the width. */
export interface Antenna {
  azimuth: number;
  elevation: number;
  /** 1 is the top bar. */
  bar: number;
  pass: number;
}

/**
 * The scan pattern for the settings. The centre is the boresight, or a point TWS AUTO centres on; it stays inside
 * the ±70° gimbal limits with the whole width.
 */
export function scanPattern(
  mode: RadarMode,
  scan: ScanSettings,
  centre: { azimuth: number; elevation: number } = {
    azimuth: 0,
    elevation: 0,
  },
): ScanPattern {
  const limit = DISPLAY_AZIMUTH - scan.azimuth / 2;
  let spacing = BAR_SPACING;
  if (mode === "TWS" && scan.bars === 2) {
    spacing = BAR_SPACING_TWS_2_BAR;
  } else if (mode === "RWS" && scan.range === 5) {
    spacing = BAR_SPACING_5_NM;
  }
  return {
    bars: scan.bars,
    width: scan.azimuth,
    spacing,
    centre: {
      azimuth: Math.max(-limit, Math.min(limit, centre.azimuth)),
      elevation: centre.elevation,
    },
  };
}

export function sweepSeconds(pattern: ScanPattern): number {
  return pattern.width / SCAN_RATE;
}

/** One frame: every bar swept once. */
export function frameSeconds(pattern: ScanPattern): number {
  return pattern.bars * sweepSeconds(pattern);
}

/** The pass the antenna is on at `scanTime`. A boundary belongs to the pass it starts. */
function passAt(pattern: ScanPattern, scanTime: number): number {
  return Math.floor(scanTime / sweepSeconds(pattern) + 1e-9);
}

/** The antenna azimuth during `pass`: even passes sweep left to right, odd passes back. */
function passAzimuth(
  pattern: ScanPattern,
  pass: number,
  scanTime: number,
): number {
  const half = pattern.width / 2;
  const travelled = (scanTime - pass * sweepSeconds(pattern)) * SCAN_RATE;
  const offset = modulo(pass, 2) === 0 ? -half + travelled : half - travelled;
  return pattern.centre.azimuth + offset;
}

/** A bar's centre elevation: the bars stack about the scan centre, bar 1 on top. */
export function barElevation(pattern: ScanPattern, bar: number): number {
  return (
    pattern.centre.elevation +
    ((pattern.bars - 1) / 2 - (bar - 1)) * pattern.spacing
  );
}

/** Where the antenna is at `scanTime`: a raster from the top-left corner, one bar further down each pass. */
export function antennaAt(pattern: ScanPattern, scanTime: number): Antenna {
  const pass = passAt(pattern, scanTime);
  const bar = modulo(pass, pattern.bars) + 1;
  return {
    azimuth: passAzimuth(pattern, pass, scanTime),
    elevation: barElevation(pattern, bar),
    bar,
    pass,
  };
}

/** The PRF a pass transmits: "Interleaved alternates Medium and High bar coverage" (guide, RWS item 17). */
export function instantaneousPrf(prf: Prf, pass: number): "HI" | "MED" {
  if (prf !== "INTL") {
    return prf;
  }
  return modulo(pass, 2) === 0 ? "HI" : "MED";
}

/** Half the scan's vertical coverage, degrees: the bars plus half a beam at each end. */
export function scanHalfCoverage(pattern: ScanPattern): number {
  return ((pattern.bars - 1) * pattern.spacing + BEAM_WIDTH) / 2;
}

/**
 * The acquisition cursor's scan altitude limits at `range` NM, in thousands of feet: our altitude plus the height of
 * the scan's upper and lower edges at that range. The guide's RWS figure shows a negative lower limit, so it does
 * not stop at 0.
 */
export function scanAltitudeLimits(
  pattern: ScanPattern,
  altitude: number,
  range: number,
): { upper: number; lower: number } {
  const half = scanHalfCoverage(pattern);
  const edge = (degrees: number): number =>
    Math.round(
      (altitude + range * FEET_PER_NM * Math.tan(degrees * DEGREES)) / 1000,
    );
  return {
    upper: edge(pattern.centre.elevation + half),
    lower: edge(pattern.centre.elevation - half),
  };
}

// ---- Contacts -------------------------------------------------------------------------------------------------

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
  /** Feet. */
  altitude: number;
  /** Relative velocity, knots: east (right) and north (nose) components. */
  velocity: { east: number; north: number };
}

export function contactPath(contact: RadarContact): ContactPath {
  const east = contact.range * Math.sin(contact.azimuth * DEGREES);
  const north = contact.range * Math.cos(contact.azimuth * DEGREES);
  const velocity = {
    east: contact.speed * Math.sin(contact.track * DEGREES),
    north: contact.speed * Math.cos(contact.track * DEGREES),
  };
  const at = (seconds: number): Polar =>
    toPolar(
      east + (velocity.east / 3600) * seconds,
      north + (velocity.north / 3600) * seconds,
    );
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
  return {
    at,
    enter: edge(-1),
    exit: edge(1),
    altitude: contact.altitude,
    velocity,
  };
}

/** The time along the path for sim `time`: the contact flies its path, then re-enters where it first came in. */
function pathTime(path: ContactPath, time: number): number {
  return path.enter + modulo(time - path.enter, path.exit - path.enter);
}

export function contactPosition(path: ContactPath, time: number): Polar {
  return path.at(pathTime(path, time));
}

/** How fast the range closes, knots: positive when the contact comes towards us. */
export function closure(path: ContactPath, time: number): number {
  const local = pathTime(path, time);
  return (path.at(local - 0.5).range - path.at(local + 0.5).range) * 3600;
}

/** The elevation of a contact at `range` NM, degrees above our flight path (level flight). */
export function elevationAngle(
  range: number,
  altitude: number,
  ownAltitude: number,
): number {
  return Math.atan2(altitude - ownAltitude, range * FEET_PER_NM) / DEGREES;
}

/** Whether a pass at `prf` sees a contact at `range` closing at `closing` knots. */
export function prfDetects(
  prf: "HI" | "MED",
  range: number,
  closing: number,
): boolean {
  const { maxRange, minClosure } = PRF_DETECTION[prf];
  return range <= maxRange && closing >= minClosure;
}

// ---- Scan state -----------------------------------------------------------------------------------------------

export interface Hit extends Polar {
  /** The sim time the beam crossed the contact. */
  time: number;
}

export interface ScanState {
  /** Sim time, s: the contacts fly on it. */
  time: number;
  /** Scan clock, s: the antenna moves on it. It stops while the radar is silent. */
  scanTime: number;
  /** A silent radar transmits until the scan clock reaches this, after an ACTIVE press. */
  activeUntil: number;
  /** Each contact's latest raw hit, or null. */
  hits: readonly (Hit | null)[];
  /** When each contact was last seen, or null: the trackfiles. */
  seen: readonly (number | null)[];
}

export interface ScanContext {
  paths: readonly ContactPath[];
  pattern: ScanPattern;
  prf: Prf;
  silent: boolean;
  ownAltitude: number;
}

/** Records each contact the beam crosses on `pass` between scan times `start` and `start + seconds`. */
function sweepPart(
  state: ScanState,
  context: ScanContext,
  pass: number,
  seconds: number,
  hits: (Hit | null)[],
  seen: (number | null)[],
): void {
  const { pattern, paths } = context;
  const fromAzimuth = passAzimuth(pattern, pass, state.scanTime);
  const toAzimuth = passAzimuth(pattern, pass, state.scanTime + seconds);
  const beamElevation = barElevation(pattern, modulo(pass, pattern.bars) + 1);
  const prf = instantaneousPrf(context.prf, pass);
  paths.forEach((path, index) => {
    const fromGap = fromAzimuth - contactPosition(path, state.time).azimuth;
    const toGap =
      toAzimuth - contactPosition(path, state.time + seconds).azimuth;
    // No crossing; or a jump far wider than one step sweeps, which is the contact re-entering the volume.
    if (
      (Math.sign(fromGap) === Math.sign(toGap) && fromGap !== 0) ||
      Math.abs(fromGap - toGap) > MAX_GAP_CHANGE
    ) {
      return;
    }
    const crossed =
      fromGap === toGap
        ? state.time
        : state.time + (seconds * fromGap) / (fromGap - toGap);
    const position = contactPosition(path, crossed);
    const elevation = elevationAngle(
      position.range,
      path.altitude,
      context.ownAltitude,
    );
    if (
      Math.abs(elevation - beamElevation) <= BEAM_WIDTH / 2 &&
      prfDetects(prf, position.range, closure(path, crossed))
    ) {
      hits[index] = { ...position, time: crossed };
      seen[index] = crossed;
    }
  });
}

/** Advances the scan by `seconds`. A silent radar's antenna stands still and records nothing, outside ACTIVE. */
export function stepScan(
  state: ScanState,
  seconds: number,
  context: ScanContext,
): ScanState {
  const transmit = context.silent
    ? Math.max(0, Math.min(seconds, state.activeUntil - state.scanTime))
    : seconds;
  const hits = [...state.hits];
  const seen = [...state.seen];
  let current = state;
  let remaining = transmit;
  const sweep = sweepSeconds(context.pattern);
  while (remaining > 1e-9) {
    const pass = passAt(context.pattern, current.scanTime);
    const part = Math.min(remaining, (pass + 1) * sweep - current.scanTime);
    sweepPart(current, context, pass, part, hits, seen);
    current = {
      ...current,
      time: current.time + part,
      scanTime: current.scanTime + part,
    };
    remaining -= part;
  }
  return {
    ...state,
    time: state.time + seconds,
    scanTime: state.scanTime + transmit,
    hits,
    seen,
  };
}

/** The radar starts a fresh frame: bar 1 at the left edge. A pattern change does this. */
export function restartFrame(state: ScanState): ScanState {
  return { ...state, scanTime: 0, activeUntil: 0 };
}

/** ACTIVE: a silent radar runs one full frame from bar 1 (guide, RWS item 4). */
export function startActiveFrame(
  state: ScanState,
  pattern: ScanPattern,
): ScanState {
  return { ...state, scanTime: 0, activeUntil: frameSeconds(pattern) };
}

/** ERASE: "all target history on the radar display is removed until detected and displayed again". */
export function eraseHits(state: ScanState): ScanState {
  return { ...state, hits: state.hits.map(() => null) };
}

/**
 * The scan at t = 0, as if it had been running: it steps whole frames from before t = 0, enough to fill `history`
 * seconds, so the first frame already shows aged hits. It ends at t = 0 with the antenna at the start of bar 1.
 */
export function warmScan(context: ScanContext, history: number): ScanState {
  const frame = frameSeconds(context.pattern);
  const span = Math.max(1, Math.ceil(history / frame)) * frame;
  let state: ScanState = {
    time: -span,
    scanTime: 0,
    activeUntil: 0,
    hits: context.paths.map(() => null),
    seen: context.paths.map(() => null),
  };
  const steps = Math.ceil(span / WARM_STEP);
  for (let step = 0; step < steps; step += 1) {
    state = stepScan(state, Math.min(WARM_STEP, -state.time), context);
  }
  return { ...state, time: 0, scanTime: 0 };
}

/** A raw hit's intensity: full when swept, dimming linearly to zero at the target aging time. */
export function hitIntensity(age: number, aging: number): number {
  return 1 - age / aging;
}

/** The hit a contact shows at the state's time, with its age; null once it has aged out or was erased. */
export function visibleHit(
  state: ScanState,
  index: number,
  aging: number,
): (Hit & { age: number }) | null {
  const hit = state.hits[index];
  if (hit === null || state.time - hit.time > aging) {
    return null;
  }
  return { ...hit, age: state.time - hit.time };
}

/** How long a trackfile lasts without a hit: one frame plus the grace. */
export function trackMemory(pattern: ScanPattern): number {
  return frameSeconds(pattern) + TRACK_GRACE;
}

/**
 * The trackfiles in rank order, as contact indices (ours: by time to intercept; an opening contact ranks after every
 * closing one, nearest first). Rank 1 is the L&S (guide, TWS: "the highest priority target is always assigned as the
 * L&S target").
 */
export function rankedTracks(
  state: ScanState,
  paths: readonly ContactPath[],
  memory: number,
): number[] {
  const timeToGo = (index: number): number => {
    const closing = closure(paths[index], state.time);
    return closing > 0
      ? contactPosition(paths[index], state.time).range / closing
      : Infinity;
  };
  return state.seen
    .map((seenAt, index) => ({ seenAt, index }))
    .filter(({ seenAt }) => seenAt !== null && state.time - seenAt <= memory)
    .map(({ index }) => index)
    .sort(
      (a, b) =>
        timeToGo(a) - timeToGo(b) ||
        contactPosition(paths[a], state.time).range -
          contactPosition(paths[b], state.time).range,
    );
}

/** A contact's Mach number: its true velocity is its relative velocity plus ours, `ownSpeed` knots along the nose. */
export function contactMach(path: ContactPath, ownSpeed: number): number {
  const speed = Math.hypot(path.velocity.east, path.velocity.north + ownSpeed);
  return speed / speedOfSound(path.altitude);
}

/** A contact's true course relative to our nose, degrees clockwise. */
export function contactCourse(path: ContactPath, ownSpeed: number): number {
  return (
    Math.atan2(path.velocity.east, path.velocity.north + ownSpeed) / DEGREES
  );
}

/** The ISA speed of sound at `altitude` feet, knots, up to the tropopause. */
export function speedOfSound(altitude: number): number {
  const kelvin = 288.15 - 1.98 * (Math.min(altitude, 36089) / 1000);
  return 661.47 * Math.sqrt(kelvin / 288.15);
}
