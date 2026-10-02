import { FONTS } from "../constants";
import { pbAnchor, type Align, type Pb, type Point } from "../geometry";
import { StrokeLine } from "../primitives/StrokeLine";
import { StrokeText } from "../primitives/StrokeText";

/**
 * The BIT formats, transcribed from `Pages/MPD/BIT/*.lua` [pgB §3]: BIT FAILURES and its sublevels. S/W CONFIGURATION is
 * the shared `SwConfig` format.
 * Every component takes content as props and draws in DCS coordinates. All text uses `BIT_PageFont`.
 */

// BIT_defs.lua
export const BIT = {
  /** `BIT_titlePosY`: titles are 200 % `CenterCenter` at (0, 237). */
  titleY: 237,
  /** `BIT_ItemPosY` = 237 − 76. */
  itemY: 161,
  nameX: -173,
  statusX: 29,
  /** glyph height 24 + `BIT_ItemInterline` 13. */
  pitch: 37,
  /** `BIT_FAILURES_AT_ONE_PAGE`. */
  rowsPerPage: 17,
  /** `BIT_groupInterLine`: a group's label sits this far above its rule and its status this far below. */
  groupInterline: 13,
  /** `BIT_groupLineLen`. */
  groupRule: 200,
  /** The rule starts 3 DI outside the label's left edge. */
  groupRuleInset: 3,
  /** `BIT_item_space`: item legends pad the name with three spaces on the button side. */
  itemSpace: "   ",
} as const;

/** `BIT_item_space_len` = 3·14 + 2·6. */
export const BIT_ITEM_SPACE_LENGTH =
  3 * FONTS.BIT.width + 2 * FONTS.BIT.interchar;

// BIT_DISPLAYS.lua: the DDI/MPCD/HUD bracket legend at PB5.
const BRACKET = {
  rule: 80,
  /** `BIT_ItemInterlineMDG`. */
  interline: 6,
} as const;

/** Where a status string goes. A page fills the slot, for example with a status that changes during a test. */
export interface TextPlace {
  align: Align;
  pos: Point;
}

export type StatusSlot = (place: TextPlace) => React.ReactNode;

export function BitText({
  text,
  align,
  pos,
}: {
  text: string;
  align: Align;
  pos: Point;
}): React.JSX.Element {
  return <StrokeText text={text} font="BIT" align={align} pos={pos} />;
}

/** A title: `STROKE_FNT_DFLT_200`, `CenterCenter` at (0, 237). */
export function BitTitle({ text }: { text: string }): React.JSX.Element {
  return (
    <StrokeText
      text={text}
      font="F200"
      align="CenterCenter"
      pos={[0, BIT.titleY]}
    />
  );
}

/** The y of list row `index` (0-based): 161 − 37·index. */
export function bitRowY(index: number): number {
  return BIT.itemY - BIT.pitch * index;
}

export interface BitRowProps {
  /** 0-based row on the 37 DI grid. */
  index: number;
  name: string;
  status: StatusSlot;
}

/** `add_BIT_item_status` and `add_BIT_failure`: the name at x −173 and the status at x 29, both `LeftCenter`. */
export function BitRow({
  index,
  name,
  status,
}: BitRowProps): React.JSX.Element {
  const y = bitRowY(index);
  return (
    <>
      <BitText text={name} align="LeftCenter" pos={[BIT.nameX, y]} />
      {status({ align: "LeftCenter", pos: [BIT.statusX, y] })}
    </>
  );
}

/** The x where a group block starts: the PB's x on the left, 200 DI inside it on the right. */
function groupX(pb: Pb): number {
  const [x] = pbAnchor(pb);
  return pb <= 5 ? x : x - BIT.groupRule;
}

export interface BitGroupBlockProps {
  pb: Pb;
  /** One or two lines, for example `STATUS\nMONITOR`. */
  label: string;
  status: StatusSlot;
}

/**
 * `add_BIT_EquipmentGroup`: the label `LeftBottom` 13 DI above the PB, a 200 DI rule at the PB pointing right, and the
 * group status `LeftTop` 13 DI below. Render it into its PB's edge strip.
 */
export function BitGroupBlock({
  pb,
  label,
  status,
}: BitGroupBlockProps): React.JSX.Element {
  const [, y] = pbAnchor(pb);
  const x = groupX(pb);
  return (
    <>
      <BitText
        text={label}
        align="LeftBottom"
        pos={[x, y + BIT.groupInterline]}
      />
      <StrokeLine
        len={BIT.groupRule}
        pos={[x - BIT.groupRuleInset, y]}
        rot={-90}
      />
      {status({ align: "LeftTop", pos: [x, y - BIT.groupInterline] })}
    </>
  );
}

/**
 * `add_BIT_item_PB_label`: a 24 DI vertical tick centred on the PB, and a horizontal `"   NAME"` (left side,
 * `LeftCenter`) or `"NAME   "` (right side, `RightCenter`). Unlike normal OSB legends, these read horizontally.
 */
export function BitItemLegend({
  pb,
  name,
}: {
  pb: Pb;
  name: string;
}): React.JSX.Element {
  const [x, y] = pbAnchor(pb);
  const left = pb <= 5;
  const tick = FONTS.BIT.height;
  return (
    <>
      <StrokeLine len={tick} pos={[x, y - tick / 2]} />
      <BitText
        text={left ? `${BIT.itemSpace}${name}` : `${name}${BIT.itemSpace}`}
        align={left ? "LeftCenter" : "RightCenter"}
        pos={[x, y]}
      />
    </>
  );
}

/**
 * The DISPLAYS bracket legend at a left PB (`BIT_DISPLAYS.lua`): three item names stacked on the PB, split by two 80 DI
 * rules, with one 96 DI vertical tick spanning all three.
 */
export function BitBracketLegend({
  pb,
  names,
}: {
  pb: Pb;
  names: readonly [top: string, middle: string, bottom: string];
}): React.JSX.Element {
  const [x, y] = pbAnchor(pb);
  const halfGlyph = FONTS.BIT.height / 2;
  const tick = 3 * FONTS.BIT.height + 4 * BRACKET.interline;
  const [top, middle, bottom] = names;
  return (
    <>
      <BitText
        text={`${BIT.itemSpace}${top}`}
        align="LeftBottom"
        pos={[x, y + halfGlyph + 2 * BRACKET.interline]}
      />
      <StrokeLine
        len={BRACKET.rule}
        pos={[x + BIT_ITEM_SPACE_LENGTH, y + halfGlyph + BRACKET.interline]}
        rot={-90}
      />
      <BitText
        text={`${BIT.itemSpace}${middle}`}
        align="LeftCenter"
        pos={[x, y]}
      />
      <StrokeLine
        len={BRACKET.rule}
        pos={[x + BIT_ITEM_SPACE_LENGTH, y - halfGlyph - BRACKET.interline]}
        rot={-90}
      />
      <BitText
        text={`${BIT.itemSpace}${bottom}`}
        align="LeftTop"
        pos={[x, y - halfGlyph - 2 * BRACKET.interline]}
      />
      <StrokeLine len={tick} pos={[x, y - tick / 2]} />
    </>
  );
}
