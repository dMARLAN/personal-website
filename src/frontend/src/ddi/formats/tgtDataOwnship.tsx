import type { FontId } from "../constants";
import { lineWidth, type Rect } from "../geometry";
import { StrokeBox } from "../primitives/StrokeBox";
import { StrokeLine } from "../primitives/StrokeLine";
import { PlacedTexts, type PlacedText } from "./placedText";

// TGT DATA OWNSHIP: TGT_DATA_COMMON_PBs.lua and TGT_DATA_OWNSHIP.lua [pgB §11]. All text is 120 %.
const FONT: FontId = "F120";

/** The frame box: 800 × 840 centred on (0, −25), so x −400…400 and y −445…395. */
export const TGT_DATA_BOX = {
  halfWidth: 400,
  halfHeight: 420,
  y: -25,
} as const;
const BOX_TOP = TGT_DATA_BOX.y + TGT_DATA_BOX.halfHeight;
const BOX_BOTTOM = TGT_DATA_BOX.y - TGT_DATA_BOX.halfHeight;
/** `EMERG` and `EXER` sit 15 DI inside the box's sides and 15 DI above its top. */
const CORNER_INSET = 15;

/** Status quadrant: labels `RightBottom` at x = −210, values `LeftBottom` at −185, 5 rows from y = 335, pitch 41. */
const STATUS = {
  labelX: -TGT_DATA_BOX.halfWidth / 2 - 10,
  valueGap: 25,
  firstY: BOX_TOP - 60,
  pitch: 41,
} as const;
/** Stores quadrant: x = 43, on the status rows. */
const STORES_X = 43;
/** The fuel/gun line: `XX.X` at (−385, −10). */
const FOOTER = {
  x: -TGT_DATA_BOX.halfWidth + CORNER_INSET,
  y: TGT_DATA_BOX.y + 15,
} as const;
/** IFF quadrant: x = 35, 3 rows from y = −85, pitch 45. */
const IFF = { x: 35, firstY: TGT_DATA_BOX.y - 60, pitch: 45 } as const;
/**
 * (ours) The empty bottom-left quadrant holds free text: x = −385 (the fuel line's x), rows from y = −85 (the IFF
 * rows' first y) at the status pitch of 41, which fits 9 rows above the box bottom at −445.
 */
export const FREE_TEXT = {
  x: FOOTER.x,
  firstY: IFF.firstY,
  pitch: STATUS.pitch,
  rows: 9,
} as const;
/** (ours) Characters per free-text row: the most that keep the same 15 DI inset from the divider at x = 0 (18). */
export const FREE_TEXT_CHARS = maxChars(-FREE_TEXT.x - CORNER_INSET);

function maxChars(span: number): number {
  let count = 0;
  while (lineWidth(count + 1, FONT) <= span) {
    count += 1;
  }
  return count;
}

/** The four quadrants inside the box, which a page's text must stay within. */
export const TGT_DATA_QUADRANTS: Readonly<
  Record<"topLeft" | "topRight" | "bottomLeft" | "bottomRight", Rect>
> = {
  topLeft: {
    left: -TGT_DATA_BOX.halfWidth,
    right: 0,
    bottom: TGT_DATA_BOX.y,
    top: BOX_TOP,
  },
  topRight: {
    left: 0,
    right: TGT_DATA_BOX.halfWidth,
    bottom: TGT_DATA_BOX.y,
    top: BOX_TOP,
  },
  bottomLeft: {
    left: -TGT_DATA_BOX.halfWidth,
    right: 0,
    bottom: BOX_BOTTOM,
    top: TGT_DATA_BOX.y,
  },
  bottomRight: {
    left: 0,
    right: TGT_DATA_BOX.halfWidth,
    bottom: BOX_BOTTOM,
    top: TGT_DATA_BOX.y,
  },
};

export interface TgtDataRow {
  label: string;
  value: string;
}

export interface TgtDataOwnshipProps {
  /** `EMERG`'s slot, above the box's top-left corner. */
  topLeft: string;
  /** `EXER`'s slot, above the box's top-right corner. */
  topRight: string;
  /** The 5 status rows (`VC:`, `TYPE:`, `STRGTH:`, `ACTVTY:`, `PRI TN:` in DCS). */
  status: readonly TgtDataRow[];
  /** The 5 stores rows (`X - XXXX` in DCS). */
  stores: readonly string[];
  /** The fuel/gun line (`XX.X FUEL GUN` in DCS). */
  footer: string;
  /** The 3 IFF rows (`IFF 1:` to `IFF 3:` in DCS). */
  iff: readonly string[];
  /** (ours) Pre-wrapped rows for the empty bottom-left quadrant. */
  freeText: readonly string[];
}

/** Where each string goes. The component draws these; tests measure them. */
export function tgtDataOwnshipTexts(props: TgtDataOwnshipProps): PlacedText[] {
  const rowY = (index: number): number => STATUS.firstY - STATUS.pitch * index;
  return [
    {
      text: props.topLeft,
      font: FONT,
      align: "LeftBottom",
      pos: [FOOTER.x, BOX_TOP + CORNER_INSET],
    },
    {
      text: props.topRight,
      font: FONT,
      align: "RightBottom",
      pos: [TGT_DATA_BOX.halfWidth - CORNER_INSET, BOX_TOP + CORNER_INSET],
    },
    ...props.status.flatMap(({ label, value }, index): PlacedText[] => [
      {
        text: label,
        font: FONT,
        align: "RightBottom",
        pos: [STATUS.labelX, rowY(index)],
      },
      {
        text: value,
        font: FONT,
        align: "LeftBottom",
        pos: [STATUS.labelX + STATUS.valueGap, rowY(index)],
      },
    ]),
    ...props.stores.map((text, index): PlacedText => ({
      text,
      font: FONT,
      align: "LeftBottom",
      pos: [STORES_X, rowY(index)],
    })),
    {
      text: props.footer,
      font: FONT,
      align: "LeftBottom",
      pos: [FOOTER.x, FOOTER.y],
    },
    ...props.iff.map((text, index): PlacedText => ({
      text,
      font: FONT,
      align: "LeftBottom",
      pos: [IFF.x, IFF.firstY - IFF.pitch * index],
    })),
    ...props.freeText.map((text, index): PlacedText => ({
      text,
      font: FONT,
      align: "LeftBottom",
      pos: [FREE_TEXT.x, FREE_TEXT.firstY - FREE_TEXT.pitch * index],
    })),
  ];
}

/** The TGT DATA OWNSHIP page body: the box, its two dividers and the text. Draw it in the symbology square. */
export function TgtDataOwnship(props: TgtDataOwnshipProps): React.JSX.Element {
  const { halfWidth, halfHeight, y } = TGT_DATA_BOX;
  return (
    <>
      <StrokeBox w={2 * halfWidth} h={2 * halfHeight} pos={[0, y]} />
      <StrokeLine len={2 * halfWidth} pos={[-halfWidth, y]} rot={-90} />
      <StrokeLine len={2 * halfHeight} pos={[0, BOX_BOTTOM]} />
      <PlacedTexts texts={tgtDataOwnshipTexts(props)} />
    </>
  );
}
