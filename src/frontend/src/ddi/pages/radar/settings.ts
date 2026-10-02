import { RANGE_SCALES, type RangeScale } from "../../formats/rdrAttk";

/*
 * The radar page's settings and what each OSB press does to them, as a pure reducer (docs/pages/radar.md section 3).
 * Option lists come from RDR_AA_MAIN_PBs.lua and RDR_AA_DATA_PBs.lua; the cycle rules come from the DCS F/A-18C
 * Early Access Guide (RWS, RWS DATA and TWS).
 */

export type RadarMode = "RWS" | "TWS";
export type BarCount = 1 | 2 | 4 | 6;
/** The total azimuth scan width, degrees: the `140°` legend. */
export type AzimuthWidth = 140 | 80 | 60 | 40 | 20;
export type Prf = "HI" | "MED" | "INTL";
/** Seconds a raw hit stays on the scope after the last sweep that saw it (DATA PB10). */
export type TargetAging = 2 | 4 | 8 | 16 | 32;
/** DATA PB17: 0 is `DCLTR`, 1 and 2 are `DCLTR 1` and `DCLTR 2`. */
export type Declutter = 0 | 1 | 2;
export type Sublevel = "MAIN" | "DATA";
export type Centring = "AUTO" | "MAN";

/** "Each successive press cycles between 1, 2, 4 and 6 bars" (guide, RWS item 3). TWS has no 1-bar scan. */
export const BAR_OPTIONS: Readonly<Record<RadarMode, readonly BarCount[]>> = {
  RWS: [1, 2, 4, 6],
  TWS: [2, 4, 6],
};
/** `AzimuthScan_Additional_Layout`: "140 80 60 40 20". The guide: "successive presses cycle between the settings". */
export const RWS_AZIMUTHS: readonly AzimuthWidth[] = [140, 80, 60, 40, 20];
/** TWS ties the azimuth to the bars (guide, TWS: "2 bar = 20°, 40°, 60°, and 80°; 4 bar = 20° or 40°; 6 bar = 20°"). */
const TWS_AZIMUTHS: Readonly<Record<2 | 4 | 6, readonly AzimuthWidth[]>> = {
  2: [80, 60, 40, 20],
  4: [40, 20],
  6: [20],
};
/** `Instantaneous_PRF_Layout`: "HI MED INTL". */
export const PRF_OPTIONS: readonly Prf[] = ["HI", "MED", "INTL"];
/** `TargetAging_Additional_Layout`: "2 4 8 16 32". */
export const AGING_OPTIONS: readonly TargetAging[] = [2, 4, 8, 16, 32];

/** What SET saves and RSET restores (guide, RWS item 11: "range, elevation bar scan, azimuth, PRF, and target aging"). */
export interface ScanSettings {
  bars: BarCount;
  azimuth: AzimuthWidth;
  range: RangeScale;
  prf: Prf;
  aging: TargetAging;
}

export interface RadarState {
  mode: RadarMode;
  sublevel: Sublevel;
  scan: ScanSettings;
  /** The settings SET saved for the priority weapon; RSET returns to them. */
  saved: ScanSettings;
  silent: boolean;
  /** Counts ACTIVE presses: each one asks the silent radar for one frame. The scope runs it. */
  activeRequests: number;
  /** Counts ERASE presses: each one clears the hit history. The scope clears it. */
  erasures: number;
  nctr: boolean;
  /** TWS PB8: raw hits shown beside the trackfiles. */
  hits: boolean;
  centring: Centring;
  /** SET and RSET stay boxed for a moment after a press. */
  setBoxed: boolean;
  resetBoxed: boolean;
  speedGate: "NORM" | "WIDE";
  oneLookRaid: boolean;
  color: boolean;
  msi: boolean;
  ltws: boolean;
  bra: boolean;
  declutter: Declutter;
}

/**
 * (ours) The page opens at 4 bars, 140°, 40 NM and interleaved PRF, as in the reference screenshot. The AIM-9's own
 * default is 80° (guide, weapon select switch), so we treat the opening settings as ones the pilot SET earlier.
 */
export const OPENING_SCAN: ScanSettings = {
  bars: 4,
  azimuth: 140,
  range: 40,
  prf: "INTL",
  aging: 8,
};

export const INITIAL_RADAR: RadarState = {
  mode: "RWS",
  sublevel: "MAIN",
  scan: OPENING_SCAN,
  saved: OPENING_SCAN,
  silent: false,
  activeRequests: 0,
  erasures: 0,
  // Boxed in the reference screenshot.
  nctr: true,
  // Boxed in the guide's TWS figure.
  hits: true,
  // "MAN mode is the default" (guide, TWS).
  centring: "MAN",
  setBoxed: false,
  resetBoxed: false,
  speedGate: "NORM",
  oneLookRaid: false,
  // COLOR is boxed in the guide's DATA figure; the site still draws monochrome (design section 6.1).
  color: true,
  msi: false,
  // "The LTWS option is initially boxed by default" (guide, LTWS).
  ltws: true,
  bra: false,
  declutter: 0,
};

export type ToggleOption =
  "nctr" | "hits" | "oneLookRaid" | "color" | "msi" | "ltws" | "bra";

export type RadarAction =
  | { type: "cycleBars" }
  | { type: "cycleAzimuth" }
  | { type: "stepRange"; step: 1 | -1 }
  | { type: "cyclePrf" }
  | { type: "toggleMode" }
  | { type: "toggleSilent" }
  | { type: "active" }
  | { type: "erase" }
  | { type: "set" }
  | { type: "reset" }
  | { type: "unbox"; legend: "SET" | "RSET" }
  | { type: "toggle"; option: ToggleOption }
  | { type: "toggleCentring" }
  | { type: "toggleData" }
  | { type: "toggleSpeedGate" }
  | { type: "cycleAging" }
  | { type: "cycleDeclutter" };

/** The option after `value`, wrapping to the first. */
export function nextOption<T>(options: readonly T[], value: T): T {
  const index = options.indexOf(value);
  if (index === -1) {
    throw new Error(`${String(value)} is not one of ${options.join(", ")}`);
  }
  return options[(index + 1) % options.length];
}

/** The azimuth widths the mode allows at `bars`. */
export function azimuthOptions(
  mode: RadarMode,
  bars: BarCount,
): readonly AzimuthWidth[] {
  if (mode === "RWS") {
    return RWS_AZIMUTHS;
  }
  if (bars === 1) {
    throw new Error("TWS has no 1-bar scan");
  }
  return TWS_AZIMUTHS[bars];
}

/**
 * Fits scan settings to a mode: TWS has no 1-bar scan, and its widest azimuth shrinks as the bars grow. A width the
 * mode does not allow becomes the widest it does (ours: DCS's choice on entering TWS is in the C++).
 */
export function fitScan(mode: RadarMode, scan: ScanSettings): ScanSettings {
  if (mode === "RWS") {
    return scan;
  }
  const bars = scan.bars === 1 ? 2 : scan.bars;
  const azimuths = azimuthOptions(mode, bars);
  const azimuth = azimuths.includes(scan.azimuth) ? scan.azimuth : azimuths[0];
  return { ...scan, bars, azimuth };
}

/** The next range scale up (`step` 1) or down (−1). It stops at 5 and 160 NM. */
export function steppedRange(range: RangeScale, step: 1 | -1): RangeScale {
  const index = RANGE_SCALES.indexOf(range) + step;
  return RANGE_SCALES[Math.max(0, Math.min(RANGE_SCALES.length - 1, index))];
}

function withScan(
  state: RadarState,
  change: Partial<ScanSettings>,
): RadarState {
  return { ...state, scan: fitScan(state.mode, { ...state.scan, ...change }) };
}

export function radarReducer(
  state: RadarState,
  action: RadarAction,
): RadarState {
  const { scan } = state;
  switch (action.type) {
    case "cycleBars":
      return withScan(state, {
        bars: nextOption(BAR_OPTIONS[state.mode], scan.bars),
      });
    case "cycleAzimuth":
      return withScan(state, {
        azimuth: nextOption(
          azimuthOptions(state.mode, scan.bars),
          scan.azimuth,
        ),
      });
    case "stepRange":
      return withScan(state, { range: steppedRange(scan.range, action.step) });
    case "cyclePrf":
      return withScan(state, { prf: nextOption(PRF_OPTIONS, scan.prf) });
    case "cycleAging":
      return withScan(state, { aging: nextOption(AGING_OPTIONS, scan.aging) });
    case "toggleMode": {
      const mode = state.mode === "RWS" ? "TWS" : "RWS";
      return { ...state, mode, scan: fitScan(mode, scan) };
    }
    case "toggleSilent":
      return { ...state, silent: !state.silent };
    case "active":
      return { ...state, activeRequests: state.activeRequests + 1 };
    case "erase":
      return { ...state, erasures: state.erasures + 1 };
    case "set":
      return { ...state, saved: scan, setBoxed: true };
    case "reset":
      return {
        ...state,
        scan: fitScan(state.mode, state.saved),
        resetBoxed: true,
      };
    case "unbox":
      return action.legend === "SET"
        ? { ...state, setBoxed: false }
        : { ...state, resetBoxed: false };
    case "toggle":
      return { ...state, [action.option]: !state[action.option] };
    case "toggleCentring":
      return {
        ...state,
        centring: state.centring === "AUTO" ? "MAN" : "AUTO",
      };
    case "toggleData":
      return {
        ...state,
        sublevel: state.sublevel === "MAIN" ? "DATA" : "MAIN",
      };
    case "toggleSpeedGate":
      return {
        ...state,
        speedGate: state.speedGate === "NORM" ? "WIDE" : "NORM",
      };
    case "cycleDeclutter":
      return {
        ...state,
        declutter: nextOption<Declutter>([0, 1, 2], state.declutter),
      };
  }
}
