import type { FontId } from "../constants";
import { pbAnchor, type Pb } from "../geometry";
import { StrokeBox } from "../primitives/StrokeBox";
import { StrokeLine } from "../primitives/StrokeLine";
import { StrokeSymbol } from "../primitives/StrokeSymbol";
import { StrokeText } from "../primitives/StrokeText";
import { PlacedTexts, type PlacedText } from "./placedText";

// UFC BU, the backup UFC on a DDI: UFC_BU.lua [pgB §12].
const TABLE_FONT: FontId = "F120";
const SCRATCHPAD_FONT: FontId = "F100";

/** Channel table columns, all `CenterCenter`: station number, frequency, designation. */
export const UFC_BU_COLUMNS = { number: -200, name: -20, tag: 180 } as const;
/**
 * (ours) Row y = 300 − 54·i. DCS sets each row's y from C++ (`MPD_UFC_BU_CurrentGroupChannel`), so the pitch is
 * unknown. 54 is the 50 DI selection box plus a 4 DI gap; the 10 keypad rows end at y = −186.
 */
export const UFC_BU_ROWS = { firstY: 300, pitch: 54 } as const;
/** The selection box round a row. */
export const UFC_BU_SELECTION_BOX = { width: 480, height: 50 } as const;
/** The bottom rule: 550 DI from (−270, −350), pointing right. */
const BOTTOM_RULE = { length: 550, pos: [-270, -350] } as const;
/** The scratchpad: a 200 × 50 box at (280, 380) holding 100 % text. */
export const UFC_BU_SCRATCHPAD = {
  width: 200,
  height: 50,
  pos: [280, 380],
} as const;
/** The vertical `CHAN` label, 100 % `LeftCenter` at (−505, 227). The trailing line break is in the Lua. */
const CHAN_LABEL = { text: "C\nH\nA\nN\n", pos: [-505, 227] } as const;
/** `selectPBSymbol` raises the 075 arrow 16 DI above its PB anchor; the down arrow is the up arrow turned 180°. */
const ARROW_RAISE = 16;
export const UFC_BU_DOWN_PB: Pb = 4;
export const UFC_BU_UP_PB: Pb = 5;

export interface UfcBuRow {
  /** The keypad digit that selects the row. */
  number: string;
  name: string;
  tag: string;
}

export interface UfcBuProps {
  rows: readonly UfcBuRow[];
  /** The boxed row's index, or null for none. */
  selected: number | null;
  /** The scratchpad's text, or null to hide the scratchpad. */
  scratchpad: string | null;
}

export function ufcBuRowY(index: number): number {
  return UFC_BU_ROWS.firstY - UFC_BU_ROWS.pitch * index;
}

/** Where each table string goes. The component draws these; tests measure them. */
export function ufcBuTableTexts(rows: readonly UfcBuRow[]): PlacedText[] {
  return rows.flatMap((row, index): PlacedText[] =>
    (["number", "name", "tag"] as const).map((column) => ({
      text: row[column],
      font: TABLE_FONT,
      align: "CenterCenter",
      pos: [UFC_BU_COLUMNS[column], ufcBuRowY(index)],
    })),
  );
}

/** The UFC BU body: the channel table, the selection box, the bottom rule and the scratchpad. Draw it in the square. */
export function UfcBu({
  rows,
  selected,
  scratchpad,
}: UfcBuProps): React.JSX.Element {
  return (
    <>
      <PlacedTexts texts={ufcBuTableTexts(rows)} />
      {selected !== null && (
        <StrokeBox
          w={UFC_BU_SELECTION_BOX.width}
          h={UFC_BU_SELECTION_BOX.height}
          pos={[0, ufcBuRowY(selected)]}
        />
      )}
      <StrokeLine len={BOTTOM_RULE.length} pos={BOTTOM_RULE.pos} rot={-90} />
      {scratchpad !== null && (
        <>
          <StrokeText
            text={scratchpad}
            font={SCRATCHPAD_FONT}
            align="CenterCenter"
            pos={UFC_BU_SCRATCHPAD.pos}
          />
          <StrokeBox
            w={UFC_BU_SCRATCHPAD.width}
            h={UFC_BU_SCRATCHPAD.height}
            pos={UFC_BU_SCRATCHPAD.pos}
          />
        </>
      )}
    </>
  );
}

/** The channel-step arrows at PB4 (down) and PB5 (up) and the vertical `CHAN` between them. Draw it in the left strip. */
export function UfcBuChannelStep(): React.JSX.Element {
  const [downX, downY] = pbAnchor(UFC_BU_DOWN_PB);
  const [upX, upY] = pbAnchor(UFC_BU_UP_PB);
  return (
    <>
      <StrokeSymbol
        id="075-arrow-up"
        pos={[downX, downY + ARROW_RAISE]}
        rot={180}
      />
      <StrokeSymbol id="075-arrow-up" pos={[upX, upY + ARROW_RAISE]} />
      <StrokeText
        text={CHAN_LABEL.text}
        font={SCRATCHPAD_FONT}
        align="LeftCenter"
        pos={CHAN_LABEL.pos}
      />
    </>
  );
}
