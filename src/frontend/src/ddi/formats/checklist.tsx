import type { FontId } from "../constants";
import { StrokeText } from "../primitives/StrokeText";

// Checklists.lua [pgB §2]: every string is 150 %, `LeftCenter` unless noted. B is the 150 % glyph height.
const B = 30;
const FONT: FontId = "F150";
export const CHECKLIST_LAYOUT = {
  rowPitch: 1.55 * B,
  topY: 13.6 * B,
  leftHeadingX: -9.65 * B,
  rightHeadingX: 2 * B,
  /** Items sit one letter's width, less 5 DI, right of their heading. */
  indent: B - 5,
  /** A/C WT's value: 7 heights right of the left heading. */
  weightValueOffset: 7 * B,
  /** Rows of the A/C WT, MAX NZ and STAB POS lines; the Lua skips rows between them. */
  weightRow: 9,
  maxNzRow: 12,
  stabRow: 14,
} as const;

const {
  rowPitch,
  topY,
  leftHeadingX,
  rightHeadingX,
  indent,
  weightValueOffset,
} = CHECKLIST_LAYOUT;
const LEFT_ITEM_X = leftHeadingX + indent;
const RIGHT_ITEM_X = rightHeadingX + indent;

function rowY(row: number): number {
  return topY - rowPitch * row;
}

export interface ChecklistFormatProps {
  left: { title: string; items: readonly string[] };
  right: { title: string; items: readonly string[] };
  weight: { label: string; value: string };
  maxNz: string;
  stab: { label: string; left: string; right: string };
}

function Column({
  title,
  items,
  headingX,
}: {
  title: string;
  items: readonly string[];
  headingX: number;
}): React.JSX.Element {
  return (
    <>
      <StrokeText
        text={title}
        font={FONT}
        align="LeftCenter"
        pos={[headingX, rowY(0)]}
      />
      {items.map((item, index) => (
        <StrokeText
          key={`${index}-${item}`}
          text={item}
          font={FONT}
          align="LeftCenter"
          pos={[headingX + indent, rowY(index + 1)]}
        />
      ))}
    </>
  );
}

/** The CHKLST format: two checklist columns, then A/C WT, MAX NZ and STAB POS. It has no OSB legends. */
export function ChecklistFormat({
  left,
  right,
  weight,
  maxNz,
  stab,
}: ChecklistFormatProps): React.JSX.Element {
  const { weightRow, maxNzRow, stabRow } = CHECKLIST_LAYOUT;
  return (
    <>
      <Column title={left.title} items={left.items} headingX={leftHeadingX} />
      <Column
        title={right.title}
        items={right.items}
        headingX={rightHeadingX}
      />
      <StrokeText
        text={weight.label}
        font={FONT}
        align="LeftCenter"
        pos={[leftHeadingX, rowY(weightRow)]}
      />
      <StrokeText
        text={weight.value}
        font={FONT}
        align="LeftCenter"
        pos={[leftHeadingX + weightValueOffset, rowY(weightRow)]}
      />
      <StrokeText
        text={maxNz}
        font={FONT}
        align="LeftCenter"
        pos={[leftHeadingX, rowY(maxNzRow)]}
      />
      <StrokeText
        text={stab.label}
        font={FONT}
        align="CenterCenter"
        pos={[0, rowY(stabRow)]}
      />
      <StrokeText
        text={stab.left}
        font={FONT}
        align="LeftCenter"
        pos={[LEFT_ITEM_X, rowY(stabRow)]}
      />
      <StrokeText
        text={stab.right}
        font={FONT}
        align="LeftCenter"
        pos={[RIGHT_ITEM_X + B, rowY(stabRow)]}
      />
    </>
  );
}

/** The x range each column's items may use: left items stop before the right heading; right items stop at ±470. */
export const CHECKLIST_ITEM_SPAN = {
  left: { from: LEFT_ITEM_X, to: rightHeadingX },
  right: { from: RIGHT_ITEM_X, to: 470 },
  weightValue: { from: leftHeadingX + weightValueOffset, to: RIGHT_ITEM_X },
} as const;
