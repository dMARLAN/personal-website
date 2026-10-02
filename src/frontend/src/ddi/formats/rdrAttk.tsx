import { polylinePath, type Edge, type Point } from "../geometry";
import { StrokeCircle } from "../primitives/StrokeCircle";
import { StrokeLine } from "../primitives/StrokeLine";
import { StrokeBox } from "../primitives/StrokeBox";
import { StrokeSymbol } from "../primitives/StrokeSymbol";
import { StrokeText } from "../primitives/StrokeText";

/*
 * RDR ATTK, A/A (RWS), transcribed from Pages/MPD/RDR/*.lua and Sensors/Radar/RadarDefs.lua. docs/pages/radar.md
 * holds the full transcription. All positions are DCS DI, +y up. "(ours)" marks values the Lua does not give.
 */

/** `RDR_tacticalAreaSizeDI = roundDI(InToDI(4))`: the B-scope square (RadarDefs.lua). */
export const TACTICAL_SIZE = 819;
export const TACTICAL_HALF = TACTICAL_SIZE / 2;
/** `RDR_AOT_zoneSizeDI`: 6 % of the tactical area, the band above the AOT line (RadarDefs.lua). */
const AOT_ZONE = 49;
const AOT_LINE_Y = TACTICAL_HALF - AOT_ZONE;
/** The B-scope spans ±70° of azimuth: `ten_degreesSz = tactical_display_sz_half / 7` (RDR_defs.lua). */
export const DISPLAY_AZIMUTH = 70;
const TEN_DEGREES = TACTICAL_HALF / 7;
const REF_LINE_LENGTH = TEN_DEGREES - 4;
const AZIMUTH_REF_SPACING = TEN_DEGREES * 3;
const RANGE_REF_SPACING = TACTICAL_HALF / 2;
/** The elevation reference lines put ±30° at ±201.75 DI (`add_elevation_ref_lines`). */
export const ELEVATION_DI_PER_DEGREE = (RANGE_REF_SPACING - 3) / 30;
const UPPER_DATA_BLOCK_Y = TACTICAL_HALF + 12;
const RF_CHANNEL_SHIFT_Y = 7;
/** `RDR_TDC_HeightDI`, `RDR_TDC_WidthDI` (RadarDefs.lua). */
const TDC = { height: 52, width: 62 } as const;
/** The A/A range scales, in NM. The arrows at PB11 and PB12 step through them. */
export const RANGE_SCALES = [5, 10, 20, 40, 80, 160] as const;
export type RangeScale = (typeof RANGE_SCALES)[number];

/**
 * `add_PB_label_RDR` moves every RDR legend off its PB anchor: side columns 6 DI inward and 25 DI up, rows 8 DI
 * outward (RDR_defs.lua).
 */
export const RDR_LEGEND_OFFSET: Readonly<Record<Edge, Point>> = {
  left: [6, 25],
  top: [0, 8],
  right: [-6, 25],
  bottom: [0, -8],
};

/** Where a contact at `range` NM and `azimuth` degrees (right positive) sits on the B-scope. */
export function scopePoint(
  range: number,
  azimuth: number,
  scale: number,
): Point {
  return [
    (azimuth / DISPLAY_AZIMUTH) * TACTICAL_HALF,
    -TACTICAL_HALF + (range / scale) * TACTICAL_SIZE,
  ];
}

/** `add_azimuth_ref_lines`: ticks at 0°, ±30° and ±60°, pointing into the scope from `y`. */
function AzimuthRefLines({ y }: { y: number }): React.JSX.Element {
  const rot = y > 0 ? 180 : 0;
  return (
    <>
      {[-2, -1, 0, 1, 2].map((step) => (
        <StrokeLine
          key={step}
          len={REF_LINE_LENGTH}
          pos={[AZIMUTH_REF_SPACING * step, y]}
          rot={rot}
        />
      ))}
    </>
  );
}

/** `add_range_speed_ref_lines`, four gaps: ticks at the quarter ranges, pointing into the scope from `x`. */
function RangeRefLines({ x }: { x: number }): React.JSX.Element {
  const rot = x > 0 ? 90 : -90;
  return (
    <>
      {[-1, 0, 1].map((step) => (
        <StrokeLine
          key={step}
          len={REF_LINE_LENGTH}
          pos={[x, RANGE_REF_SPACING * step]}
          rot={rot}
        />
      ))}
    </>
  );
}

/** `add_elevation_ref_lines`: long ticks at +30°, 0° and −30°, short ticks every 10° between, outside the left edge. */
function ElevationRefLines(): React.JSX.Element {
  const x = -TACTICAL_HALF - 5;
  const top = RANGE_REF_SPACING - 2;
  const spacing = RANGE_REF_SPACING - 3;
  const longTicks = [0, 1, 2].map((index) => top - spacing * index);
  const shortTicks = [1, 2, 4, 5].map((index) => top - (spacing / 3) * index);
  return (
    <>
      {longTicks.map((y) => (
        <StrokeLine key={`long-${y}`} len={20} pos={[x, y]} rot={90} />
      ))}
      {shortTicks.map((y) => (
        <StrokeLine key={`short-${y}`} len={8} pos={[x, y]} rot={90} />
      ))}
    </>
  );
}

/**
 * `add_RDR_FLIR_AC_VelVector_HorizonLine`, in level flight: the HUD velocity vector at 150 % and the horizon line
 * through its centre. The symbol's origin is its bounding-box centre, so it moves up 10 DI × 1.5 to put the circle's
 * centre on the Lua position (inferred: DCS anchors it `FromSet`).
 */
function VelocityVector(): React.JSX.Element {
  const [x, y]: Point = [0, RANGE_REF_SPACING - RANGE_REF_SPACING / 3];
  const scale = 1.5;
  const gap = 60;
  const width = 140;
  const tick = 40;
  return (
    <>
      <StrokeSymbol
        id="125-velocity-vector"
        pos={[x, y + 10 * scale]}
        scale={scale}
      />
      {[-1, 1].map((side) => (
        <g key={side}>
          <StrokeLine len={width} pos={[x + gap * side, y]} rot={-90 * side} />
          <StrokeLine
            len={tick}
            pos={[x + (gap + width) * side, y]}
            rot={180}
          />
        </g>
      ))}
    </>
  );
}

/** `addMPD_TDC_diamond`: an 18 DI box turned 45° with a centre dot, at (448, 455). */
function TdcDiamond(): React.JSX.Element {
  const [x, y]: Point = [448, 455];
  const half = 9 * Math.SQRT2;
  return (
    <>
      <path
        d={polylinePath(
          [
            [x, y + half],
            [x + half, y],
            [x, y - half],
            [x - half, y],
          ],
          true,
        )}
        vectorEffect="non-scaling-stroke"
      />
      <StrokeCircle r={1} pos={[x, y]} />
    </>
  );
}

/** Own aircraft data around the scope (RDR_AA_AG.lua, MPD_page_defs.lua). */
export interface RdrOwnship {
  /** Degrees, shown as `%03.0f°`. */
  heading: number;
  /** Knots calibrated. */
  airspeed: number;
  /** Shown as written, for example "0.90". */
  mach: string;
  /** Feet. */
  altitude: number;
}

export interface RdrAttkProps {
  ownship: RdrOwnship;
  /** The priority A/A weapon and its count, for example "9X 2". */
  weapon: string;
  /** `MPD_RDR_AA_SensitivityIndicator`, 150 % at the lower left. */
  sensitivity: string;
  /** Range scale and cursor readouts: a client island, because the range arrows change them. */
  rangeReadouts: React.ReactNode;
}

function AircraftData({ ownship }: { ownship: RdrOwnship }): React.JSX.Element {
  const airspeedPos: Point = [-323, -TACTICAL_HALF - 4 - 24 / 2];
  const machPos: Point = [airspeedPos[0] - 5, airspeedPos[1] - 28];
  const altitudePos: Point = [TACTICAL_HALF, -TACTICAL_HALF - 30 / 2 - 8];
  const thousands = Math.floor(ownship.altitude / 1000);
  const hundreds = String(ownship.altitude % 1000).padStart(3, "0");
  return (
    <>
      <StrokeText
        text={String(ownship.airspeed)}
        font="F120"
        align="RightCenter"
        pos={airspeedPos}
      />
      <StrokeText
        text="M"
        font="F120"
        align="RightCenter"
        pos={[machPos[0] - 5 * (14 + 6), machPos[1]]}
      />
      <StrokeText
        text={ownship.mach}
        font="F120"
        align="RightCenter"
        pos={[machPos[0] + 3, machPos[1]]}
      />
      {/* Altitude: thousands at 150 % with a 9 DI gap, the rest at 120 % (`add_RDR_FLIR_AC_Altitude`). */}
      <StrokeText
        text={String(thousands)}
        font="F150_WIDE"
        align="RightCenter"
        pos={[altitudePos[0] - 18 * 3 - 9 * 2 - 4, altitudePos[1]]}
      />
      <StrokeText
        text={hundreds}
        font="F120"
        align="RightCenter"
        pos={[altitudePos[0] - 14, altitudePos[1]]}
      />
    </>
  );
}

/** The static RWS symbology in the square: everything that does not move each frame. */
export function RdrAttkSymbology({
  ownship,
  weapon,
  sensitivity,
  rangeReadouts,
}: RdrAttkProps): React.JSX.Element {
  return (
    <>
      <StrokeBox w={TACTICAL_SIZE} h={TACTICAL_SIZE} pos={[0, 0]} />
      <StrokeLine
        len={TACTICAL_SIZE}
        pos={[TACTICAL_HALF, AOT_LINE_Y]}
        rot={90}
      />
      <AzimuthRefLines y={AOT_LINE_Y} />
      <AzimuthRefLines y={-TACTICAL_HALF} />
      <RangeRefLines x={TACTICAL_HALF} />
      <RangeRefLines x={-TACTICAL_HALF} />
      <ElevationRefLines />
      <VelocityVector />
      <StrokeText
        text={`${String(ownship.heading).padStart(3, "0")}°`}
        font="F120"
        align="CenterBottom"
        pos={[0, UPPER_DATA_BLOCK_Y]}
      />
      <StrokeText
        text="OPR"
        font="F120"
        align="RightBottom"
        pos={[-TACTICAL_HALF + 4, TACTICAL_HALF + RF_CHANNEL_SHIFT_Y + 24 + 5]}
      />
      <StrokeText
        text="C11"
        font="F120"
        align="RightBottom"
        pos={[-TACTICAL_HALF - 2, TACTICAL_HALF + RF_CHANNEL_SHIFT_Y]}
      />
      <TdcDiamond />
      <StrokeText
        text={weapon}
        font="F120"
        align="CenterCenter"
        pos={[370, 435]}
      />
      <StrokeText
        text={sensitivity}
        font="F150"
        align="RightBottom"
        pos={[-TACTICAL_HALF - 10, -TACTICAL_HALF]}
      />
      {/* The minimum range; the maximum is in `rangeReadouts`. */}
      <StrokeText
        text="0"
        font="F120"
        align="RightBottom"
        pos={[TACTICAL_HALF + 49, -TACTICAL_HALF]}
      />
      <AircraftData ownship={ownship} />
      {rangeReadouts}
    </>
  );
}

/** `MPD_RDR_Range_VS_scaleMaxMin`: the range scale, at the scope's top-right corner. */
export function RangeScaleMax({ range }: { range: number }): React.JSX.Element {
  return (
    <StrokeText
      text={String(range)}
      font="F120"
      align="LeftTop"
      pos={[TACTICAL_HALF + 15, TACTICAL_HALF + 6]}
    />
  );
}

/**
 * `addAcqusitionCursor` at `pos`: two vertical lines, each drawn three times 1 DI apart, with the scan altitude
 * limits above and below in thousands of feet (RDR_AA.lua).
 */
export function AcquisitionCursor({
  pos: [x, y],
  upper,
  lower,
}: {
  pos: Point;
  upper: number;
  lower: number;
}): React.JSX.Element {
  const limitX = x + 12 + 4 / 2;
  return (
    <>
      {[-1, 1].flatMap((side) =>
        [-1, 0, 1].map((shift) => (
          <StrokeLine
            key={`${side}${shift}`}
            len={TDC.height}
            pos={[x + (side * TDC.width) / 2 + shift, y - TDC.height / 2]}
          />
        )),
      )}
      <StrokeText
        text={String(upper)}
        font="F100"
        align="RightBottom"
        pos={[limitX, y + TDC.height / 2 + 5]}
      />
      <StrokeText
        text={String(lower)}
        font="F100"
        align="RightTop"
        pos={[limitX, y - TDC.height / 2 - 9]}
      />
    </>
  );
}

/** `B_sweep`: the antenna azimuth line, 5 DI taller than the scope, drawn at x = 0. Move it with a transform. */
export function SweepLine(): React.JSX.Element {
  return <StrokeLine len={TACTICAL_SIZE + 5} pos={[0, -TACTICAL_HALF]} />;
}

/** `add_RDR_caret` (24 × 32) at the left edge, pointing left, drawn at y = 0. Move it with a transform. */
export function ElevationCaret(): React.JSX.Element {
  const width = 24;
  const height = 32;
  const angle = (Math.atan(height / 2 / width) * 180) / Math.PI;
  const length = width / Math.cos((angle * Math.PI) / 180);
  return (
    <>
      <StrokeLine len={length} pos={[-TACTICAL_HALF, 0]} rot={-90 + angle} />
      <StrokeLine len={length} pos={[-TACTICAL_HALF, 0]} rot={-90 - angle} />
    </>
  );
}

/** A raw radar contact (RDR_contacts.lua): four 18 DI lines 2 DI apart, a "brick", drawn at the origin. */
export function RawHit(): React.JSX.Element {
  const width = 18;
  return (
    <>
      {[1, 2, 3, 4].map((index) => (
        <StrokeLine
          key={index}
          len={width}
          pos={[-width / 2, 2 * (index - 2.5)]}
          rot={-90}
        />
      ))}
    </>
  );
}

/** The left-edge texts that are not plain PB legends: the mode, PRF and RDR/PRI (RDR_AA_SPECIAL.lua, RDR_AA_MAIN_PBs.lua). */
export function RdrAttkLeftEdge({
  mode,
  operatingPrf,
  instantaneousPrf,
}: {
  mode: string;
  operatingPrf: string;
  instantaneousPrf: string;
}): React.JSX.Element {
  const prfPos: Point = [-500 + 14 * 2 + 6 + 6 / 2, -361 + 10];
  return (
    <>
      <StrokeText
        text={mode}
        font="F120"
        align="LeftCenter"
        pos={[-494, 335]}
      />
      <StrokeText
        text={operatingPrf}
        font="F120"
        align="CenterBottom"
        pos={prfPos}
      />
      <StrokeText
        text={instantaneousPrf}
        font="F120"
        align="CenterBottom"
        pos={[prfPos[0], prfPos[1] + 24 + 6]}
      />
      {/* `add_PB_label(2, "RDR", "PRI")`, moved 25 DI up, with PRI 10 DI further in. */}
      <StrokeText
        text={"R\nD\nR"}
        font="F120"
        align="LeftCenter"
        pos={[-500, -194 + 25]}
      />
      <StrokeText
        text={"P\nR\nI"}
        font="F120"
        align="LeftCenter"
        pos={[-500 + 25 + 10, -194 + 25]}
      />
    </>
  );
}

/** `addRangeIncDecArrows`: the 076 arrows by PB11 (up) and PB12 (down), right edges at x = 485. */
export function RangeArrows(): React.JSX.Element {
  const halfWidth = 6.51;
  const x = 500 - 15 - halfWidth;
  return (
    <>
      <StrokeSymbol id="076-arrow-up" pos={[x, 307 + 15]} />
      <StrokeSymbol id="076-arrow-up" pos={[x, 140 + 50]} rot={180} />
    </>
  );
}

/** `Elevation_bar_number`: the current bar, `LeftTop` 40 DI right of the PB6 legend's anchor. */
export function ElevationBarNumber({
  bar,
}: {
  bar: number;
}): React.JSX.Element {
  return (
    <StrokeText
      text={String(bar)}
      font="F120"
      align="LeftTop"
      pos={[-336 + 40, 500 + RDR_LEGEND_OFFSET.top[1]]}
    />
  );
}
