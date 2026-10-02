import type { FontId } from "../constants";
import { measure, type Point } from "../geometry";
import { StrokeBox } from "../primitives/StrokeBox";
import { StrokeLine } from "../primitives/StrokeLine";
import { StrokeSymbol } from "../primitives/StrokeSymbol";
import { StrokeText } from "../primitives/StrokeText";

// The STORES format (STORES.lua) [pgA §1]: the wingform, the nine station slot stacks, the PROG block and the DATA
// freeze block. It takes content as props and never imports from content/.

/** Every STORES text is the 100 % font. */
export const STORES_FONT: FontId = "F100";

// STORES.lua lines 35–48.
const LSTY_POS = 230;
/** One text row in a station's slot stack. */
export const ROW = 28;
const LITTLE_ANGLE = 3;
const BIG_ANGLE = 25;
const LITTLE_LINE_LEN = 45;
const BIG_LINE_LEN = 350;
const LITTLE_LINE_X = 45;
const PAIR_SPACING = 15;
const PYLON_TICK = 5;
/** The selection box round a station's type text: 110 × 26, and 110 × 22 on the centreline. */
export const SELECTION_BOX = { width: 110, height: 26, centrelineHeight: 22 };
/** The 116-aim missile symbol is drawn rotated 45° (`setMissleSymbol`). */
const MISSILE_ROT = 45;

const radians = (degrees: number): number => (degrees * Math.PI) / 180;

/** `addStrokeLine` arguments. */
export interface LineSpec {
  len: number;
  pos: Point;
  rot: number;
}

const FUSELAGE_TOP = LSTY_POS + 13;

/**
 * The wing roots, computed as the Lua does. `math.floor` makes the left root (−48, 198) and the right (47, 198): the
 * 1 DI asymmetry is real.
 */
function wingRoot(side: -1 | 1): Point {
  const angle = radians(-90 + side * LITTLE_ANGLE);
  return [
    side * LITTLE_LINE_X + Math.floor(Math.cos(angle) * LITTLE_LINE_LEN),
    FUSELAGE_TOP + Math.floor(Math.sin(angle) * LITTLE_LINE_LEN),
  ];
}

/** The wingform: four stroke lines, two fuselage sides and two leading edges swept 25° down (lines 52–58). */
export const WINGFORM_LINES: readonly LineSpec[] = [
  {
    len: LITTLE_LINE_LEN,
    pos: [-LITTLE_LINE_X, FUSELAGE_TOP],
    rot: 180 - LITTLE_ANGLE,
  },
  { len: BIG_LINE_LEN, pos: wingRoot(-1), rot: 90 + BIG_ANGLE },
  {
    len: LITTLE_LINE_LEN,
    pos: [LITTLE_LINE_X, FUSELAGE_TOP],
    rot: 180 + LITTLE_ANGLE,
  },
  { len: BIG_LINE_LEN, pos: wingRoot(1), rot: -90 - BIG_ANGLE },
];

/** The next station out along a wing: a third of the wing, floored at each step, as the Lua steps `BigLinePos`. */
function stepOut([x, y]: Point, side: -1 | 1): Point {
  const third = BIG_LINE_LEN / 3;
  return [
    x + side * Math.floor(Math.cos(radians(BIG_ANGLE)) * third),
    y + Math.floor(Math.sin(radians(-BIG_ANGLE)) * third),
  ];
}

export const STATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type Station = (typeof STATIONS)[number];

const LEFT_INBOARD = stepOut(wingRoot(-1), -1);
const RIGHT_INBOARD = stepOut(wingRoot(1), 1);

/**
 * Station anchors (STORES.lua lines 80–200). DCS draws no station numbers: 1 is the left wingtip, 5 the centreline
 * and 9 the right wingtip.
 */
export const STATION_ANCHORS: Readonly<Record<Station, Point>> = {
  1: stepOut(stepOut(LEFT_INBOARD, -1), -1),
  2: stepOut(LEFT_INBOARD, -1),
  3: LEFT_INBOARD,
  4: [-LITTLE_LINE_X, FUSELAGE_TOP],
  5: [0, LSTY_POS],
  6: [LITTLE_LINE_X, FUSELAGE_TOP],
  7: RIGHT_INBOARD,
  8: stepOut(RIGHT_INBOARD, 1),
  9: stepOut(stepOut(RIGHT_INBOARD, 1), 1),
};

/** Pylon ticks: 5 DI down at the wing pylons, 5 DI outboard at the fuselage stations. The tips and centreline have none. */
export const PYLON_TICKS: readonly LineSpec[] = [
  { len: PYLON_TICK, pos: STATION_ANCHORS[4], rot: 90 },
  { len: PYLON_TICK, pos: STATION_ANCHORS[3], rot: -180 },
  { len: PYLON_TICK, pos: STATION_ANCHORS[2], rot: -180 },
  { len: PYLON_TICK, pos: STATION_ANCHORS[6], rot: -90 },
  { len: PYLON_TICK, pos: STATION_ANCHORS[7], rot: -180 },
  { len: PYLON_TICK, pos: STATION_ANCHORS[8], rot: -180 },
];

export function Wingform(): React.JSX.Element {
  return (
    <>
      {[...WINGFORM_LINES, ...PYLON_TICKS].map(({ len, pos, rot }) => (
        <StrokeLine
          key={`${pos.join()}-${rot}`}
          len={len}
          pos={pos}
          rot={rot}
        />
      ))}
    </>
  );
}

/** What a station carries; it picks the symbol [pgA §1.2]. */
export type StationLoad =
  | { kind: "missile" }
  | { kind: "pair" }
  | { kind: "rack"; amount: number }
  | { kind: "tank" };

/**
 * The loads each station's Lua can draw. The tips and fuselage stations have only `MPD_SMS_MissleSymbol`; the
 * centreline has only the BRU-33 rack (or no symbol, like a tank); the wing pylons have all of them.
 */
export const STATION_LOADS: Readonly<
  Record<Station, readonly StationLoad["kind"][]>
> = {
  1: ["missile"],
  2: ["missile", "pair", "rack", "tank"],
  3: ["missile", "pair", "rack", "tank"],
  4: ["missile"],
  5: ["rack", "tank"],
  6: ["missile"],
  7: ["missile", "pair", "rack", "tank"],
  8: ["missile", "pair", "rack", "tank"],
  9: ["missile"],
};

/**
 * Stations with a `Selective_Box` round their type text. The tips and fuselage stations have none: DCS shows their
 * selection as `SEL` in the status slot instead [gpg §3].
 */
export function hasSelectionBox(station: Station): boolean {
  return [2, 3, 5, 7, 8].includes(station);
}

/** The status word a station shows: `SEL` replaces it on a selected station that has no selection box. */
export function stationStatus(
  station: Station,
  status: string,
  selected: boolean,
): string {
  return selected && !hasSelectionBox(station) ? "SEL" : status;
}

export interface StationStoreProps {
  station: Station;
  load: StationLoad;
  /** The type text, ≤ 6 characters. */
  code: string;
  status: string;
  selected: boolean;
}

interface PlacedText {
  text: string;
  pos: Point;
  align: "CenterCenter" | "LeftCenter" | "RightCenter";
}

interface StationLayout {
  symbols: { id: "116-aim" | "134-rhombus"; pos: Point; rot: number }[];
  texts: PlacedText[];
  /** The type text, which the selection box surrounds. */
  type: PlacedText;
}

function symbolsFor(
  load: StationLoad,
  [x, y]: Point,
): StationLayout["symbols"] {
  switch (load.kind) {
    case "missile":
      return [{ id: "116-aim", pos: [x, y], rot: MISSILE_ROT }];
    case "pair":
      return [-PAIR_SPACING, PAIR_SPACING].map((dx) => ({
        id: "116-aim" as const,
        pos: [x + dx, y] as const,
        rot: MISSILE_ROT,
      }));
    case "rack":
      return [{ id: "134-rhombus", pos: [x, y], rot: 0 }];
    case "tank":
      return [];
  }
}

/**
 * A wing pylon or the centreline: symbol, amount, type and status stack down from `top`, one 28 DI row each. The
 * engine shifts the amount and type down a row per occupied row above (`MPD_SMS_Pylon_Label_Type(n, -28)`) [pgA §1.2].
 */
function stackLayout(
  load: StationLoad,
  [x, top]: Point,
  code: string,
  status: string,
): StationLayout {
  const symbols = symbolsFor(load, [x, top]);
  let row = symbols.length > 0 ? 1 : 0;
  const nextRow = (text: string): PlacedText => ({
    text,
    pos: [x, top - ROW * row++],
    align: "CenterCenter",
  });
  const amount = load.kind === "rack" ? [nextRow(String(load.amount))] : [];
  const type = nextRow(code);
  return { symbols, texts: [...amount, type, nextRow(status)], type };
}

export function stationLayout({
  station,
  load,
  code,
  status,
  selected,
}: StationStoreProps): StationLayout {
  const shown = stationStatus(station, status, selected);
  const [x, y] = STATION_ANCHORS[station];
  switch (station) {
    case 1:
    case 9: {
      // The tip labels sit above the tip; STA1's have an extra −10 DI x offset that STA9's do not (lines 205–207).
      const labelX = station === 1 ? x - 10 : x;
      const type: PlacedText = {
        text: code,
        pos: [labelX, y + 2 * ROW],
        align: "CenterCenter",
      };
      return {
        symbols: symbolsFor(load, [x + (station === 1 ? -8 : 8), y]),
        texts: [
          type,
          { text: shown, pos: [labelX, y + 3 * ROW], align: "CenterCenter" },
        ],
        type,
      };
    }
    case 4:
    case 6: {
      const side = station === 4 ? -1 : 1;
      const align = station === 4 ? "RightCenter" : "LeftCenter";
      const type: PlacedText = {
        text: code,
        pos: [x + side * 2 * ROW, y],
        align,
      };
      return {
        symbols: symbolsFor(load, [x + side * ROW, y]),
        texts: [
          type,
          { text: shown, pos: [x + side * 2 * ROW, LSTY_POS - ROW], align },
        ],
        type,
      };
    }
    case 5:
      return stackLayout(load, [x, LSTY_POS - 2 * ROW], code, shown);
    default:
      return stackLayout(load, [x, y - ROW], code, shown);
  }
}

/** The centre of `text` placed with `align` at `pos`. */
function textCentre({ text, pos: [x, y], align }: PlacedText): Point {
  const { width } = measure(text, STORES_FONT);
  const shift =
    align === "LeftCenter"
      ? width / 2
      : align === "RightCenter"
        ? -width / 2
        : 0;
  return [x + shift, y];
}

/** One station's contents: its symbol row and slot stack, with the type boxed when it is the selected station. */
export function StationStore(props: StationStoreProps): React.JSX.Element {
  const { symbols, texts, type } = stationLayout(props);
  return (
    <>
      {symbols.map(({ id, pos, rot }) => (
        <StrokeSymbol key={`${id}-${pos.join()}`} id={id} pos={pos} rot={rot} />
      ))}
      {texts.map(({ text, pos, align }) => (
        <StrokeText
          key={`${pos.join()}`}
          text={text}
          font={STORES_FONT}
          align={align}
          pos={pos}
        />
      ))}
      {props.selected && hasSelectionBox(props.station) && (
        <StrokeBox
          w={SELECTION_BOX.width}
          h={
            props.station === 5
              ? SELECTION_BOX.centrelineHeight
              : SELECTION_BOX.height
          }
          pos={textCentre(type)}
        />
      )}
    </>
  );
}

// The PROG block (lines 216–330): `PROG_BOMB` sits at (0, +15) inside `PROG_BASE`, so every y below includes it.
const PROG_OFFSET = 15;
const PROG_TITLE_Y = -180 + PROG_OFFSET;
/** The underline runs 7 DI left of the title ink and 4 DI right of it, as under `PROG 1` (−45 to +50). */
const TITLE_UNDERLINE = { left: 7, right: 4, below: ROW / 2 + 3 };
const PROG_FIRST_ROW_Y = -210 - ROW + PROG_OFFSET;
/** Label and value columns: x = −220 + 130·i. */
export const PROG_COLUMNS = {
  leftLabel: -220,
  leftValue: -90,
  rightLabel: 40,
  rightValue: 170,
} as const;
export const PROG_ROWS = 5;

export interface ProgRow {
  label: string;
  value: string;
}

export interface ProgBlockProps {
  /** Shown where DCS shows `PROG 1`, underlined. */
  title: string;
  left: readonly ProgRow[];
  right: readonly ProgRow[];
}

/** The y of PROG row `index` (0-based): −223, −251, … −335. */
export function progRowY(index: number): number {
  return PROG_FIRST_ROW_Y - ROW * index;
}

/** A title's underline, as under `PROG 1`. `left` is the title ink's left edge and `y` its centre line. */
function TitleUnderline({
  title,
  left,
  y,
}: {
  title: string;
  left: number;
  y: number;
}): React.JSX.Element {
  const { width } = measure(title, STORES_FONT);
  return (
    <StrokeLine
      len={width + TITLE_UNDERLINE.left + TITLE_UNDERLINE.right}
      pos={[left - TITLE_UNDERLINE.left, y - TITLE_UNDERLINE.below]}
      rot={-90}
    />
  );
}

export function ProgBlock({
  title,
  left,
  right,
}: ProgBlockProps): React.JSX.Element {
  const columns = [
    {
      rows: left,
      labelX: PROG_COLUMNS.leftLabel,
      valueX: PROG_COLUMNS.leftValue,
    },
    {
      rows: right,
      labelX: PROG_COLUMNS.rightLabel,
      valueX: PROG_COLUMNS.rightValue,
    },
  ];
  return (
    <>
      <StrokeText
        text={title}
        font={STORES_FONT}
        align="CenterCenter"
        pos={[0, PROG_TITLE_Y]}
      />
      <TitleUnderline
        title={title}
        left={-measure(title, STORES_FONT).width / 2}
        y={PROG_TITLE_Y}
      />
      {columns.flatMap(({ rows, labelX, valueX }) =>
        rows.flatMap(({ label, value }, index) => [
          <StrokeText
            key={`${labelX}-${index}`}
            text={label}
            font={STORES_FONT}
            align="LeftCenter"
            pos={[labelX, progRowY(index)]}
          />,
          <StrokeText
            key={`${valueX}-${index}`}
            text={value}
            font={STORES_FONT}
            align="LeftCenter"
            pos={[valueX, progRowY(index)]}
          />,
        ]),
      )}
    </>
  );
}

// The DATA freeze block (lines 786–832): an 800 DI rule at y = −100, then rows 40 DI apart from x = −380.
const DATA_RULE = { len: 800, pos: [-400, -100] as const };
const DATA_ROW_PITCH = 40;
export const DATA_TEXT_X = -380;
/** Rows y = −140 − 40·i for i = 0…7: the title and seven text rows. */
export const DATA_ROWS = 8;
/** Characters per DATA text row: 47 × 16 − 4 = 748 DI, from x = −380 to 368. */
export const DATA_ROW_CHARS = 47;

/** The y of DATA row `index` (0-based). */
export function dataRowY(index: number): number {
  return DATA_RULE.pos[1] - DATA_ROW_PITCH * (index + 1);
}

export interface DataBlockProps {
  title: string;
  /** Pre-wrapped rows of at most `DATA_ROW_CHARS` characters. */
  rows: readonly string[];
}

/**
 * The DATA sublevel: the freeze rule, then the title and the text rows, all `LeftCenter` at x = −380. (ours) The
 * title is underlined like the PROG title, so it reads apart from the text below it.
 */
export function DataBlock({ title, rows }: DataBlockProps): React.JSX.Element {
  return (
    <>
      <StrokeLine len={DATA_RULE.len} pos={DATA_RULE.pos} rot={-90} />
      <TitleUnderline title={title} left={DATA_TEXT_X} y={dataRowY(0)} />
      {[title, ...rows].map((text, index) => (
        <StrokeText
          key={index}
          text={text}
          font={STORES_FONT}
          align="LeftCenter"
          pos={[DATA_TEXT_X, dataRowY(index)]}
        />
      ))}
    </>
  );
}

/** Greedy word wrap to rows of at most `width` characters. A single word longer than a row throws. */
export function wrapWords(text: string, width: number): string[] {
  const rows: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (word.length > width) {
      throw new Error(`"${word}" is longer than a ${width}-character row`);
    }
    const last = rows.at(-1);
    if (last !== undefined && last.length + 1 + word.length <= width) {
      rows[rows.length - 1] = `${last} ${word}`;
    } else {
      rows.push(word);
    }
  }
  return rows;
}
