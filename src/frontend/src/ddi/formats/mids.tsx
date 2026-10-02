import type { FontId } from "../constants";
import { measure, type Point } from "../geometry";
import { StrokeLine } from "../primitives/StrokeLine";
import { PlacedTexts, type PlacedText } from "./placedText";

// MIDS: MIDS.lua [pgB §6]. All text is 120 %.
const FONT: FontId = "F120";

/** Status block rows: y = 341, 274, 207, 140 (pitch 67). */
export const MIDS_STATUS_Y = [341, 274, 207, 140] as const;
/** A value starts 25 DI right of its label's right edge. */
const VALUE_GAP = 25;
/** Two symmetric 725 DI rules. */
const DIVIDER = { length: 725, y: [-118, -292] } as const;
/** The cautions line: an empty string, `LeftBottom` at (−330, −172). */
export const MIDS_CAUTIONS_POS: Point = [-330, -172];
export const MIDS_FONT = FONT;

export interface MidsRow {
  label: string;
  value: string;
}

/**
 * Where each status row goes. DCS places each label's right edge by hand: (25, 341), (−55, 274), (−30, 207),
 * (10, 140). With its sample values every row is centred on x = 0 to within 13 DI. Our labels differ, so (ours)
 * each row is centred exactly: label right edge = (label width − 25 − value width) / 2.
 */
export function midsStatusTexts(rows: readonly MidsRow[]): PlacedText[] {
  return rows.flatMap(({ label, value }, index): PlacedText[] => {
    const y = MIDS_STATUS_Y[index];
    const labelRight =
      (measure(label, FONT).width - VALUE_GAP - measure(value, FONT).width) / 2;
    return [
      { text: label, font: FONT, align: "RightBottom", pos: [labelRight, y] },
      {
        text: value,
        font: FONT,
        align: "LeftBottom",
        pos: [labelRight + VALUE_GAP, y],
      },
    ];
  });
}

export interface MidsProps {
  /** Up to four status rows (`NET ENTRY:`, `DATE:`, `TIME:`, `NETWORK:` in DCS). */
  rows: readonly MidsRow[];
  /** What the cautions line shows; draw it at `MIDS_CAUTIONS_POS`. */
  cautions?: React.ReactNode;
}

/** The MIDS page body: the status block, the two rules and the cautions line. Draw it in the symbology square. */
export function Mids({ rows, cautions }: MidsProps): React.JSX.Element {
  return (
    <>
      <PlacedTexts texts={midsStatusTexts(rows)} />
      {DIVIDER.y.map((y) => (
        <StrokeLine
          key={y}
          len={DIVIDER.length}
          pos={[-DIVIDER.length / 2, y]}
          rot={-90}
        />
      ))}
      {cautions}
    </>
  );
}
