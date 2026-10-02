import type { FontId } from "../constants";
import type { Point } from "../geometry";
import { StrokeText } from "../primitives/StrokeText";

/** `BIT/SW_CONFIG.lua` and `BIT/BIT_defs.lua` [pgB §3]. */
export const SW_CONFIG = {
  /** `CONFIG_TITLE`: two lines, 200 %, `CenterCenter`. The lines centre at y ≈ 326 and 274. */
  title: { pos: [0, 300] as Point, font: "F200" as FontId },
  /** `CONFIG_ItemPosY` = `CONFIG_titlePosY` − 120. */
  firstRowY: 180,
  /** `glyphNominalHeight120` + `BIT_ItemInterline` = 24 + 13. */
  rowPitch: 37,
  rows: 12,
  /** `BIT_PageFont`: 120 % with an interline of 8. */
  font: "BIT" as FontId,
  /** `firstColumnPosX` and `secondColumnPosX`: each item's name, `LeftCenter`. */
  columnX: { left: -370, right: 80 },
  /** `softwareIdIdentX`: the value sits this far right of its name. */
  valueOffset: 150,
} as const;

/** The inner edge of the right-side OSB legends (x = 500 less the 14 DI glyph) [pgB §1]. */
export const SW_CONFIG_RIGHT_LIMIT = 470;

export interface SwConfigRow {
  name: string;
  value: string;
}

export interface SwConfigProps {
  title: readonly [string, string];
  left: readonly SwConfigRow[];
  right: readonly SwConfigRow[];
}

/** The y of row `index` (0-based). */
export function swConfigRowY(index: number): number {
  return SW_CONFIG.firstRowY - SW_CONFIG.rowPitch * index;
}

function Column({
  rows,
  x,
}: {
  rows: readonly SwConfigRow[];
  x: number;
}): React.JSX.Element {
  return (
    <>
      {rows.map(({ name, value }, index) => (
        <g key={`${index}-${name}`}>
          <StrokeText
            text={name}
            font={SW_CONFIG.font}
            align="LeftCenter"
            pos={[x, swConfigRowY(index)]}
          />
          <StrokeText
            text={value}
            font={SW_CONFIG.font}
            align="LeftCenter"
            pos={[x + SW_CONFIG.valueOffset, swConfigRowY(index)]}
          />
        </g>
      ))}
    </>
  );
}

/**
 * S/W CONFIGURATION, exact: the two-line title and a 2 × 12 name/value table (render: `dcs-sw-config.*`). Legends
 * are the page's own. Draw it in the symbology square.
 */
export function SwConfig({
  title,
  left,
  right,
}: SwConfigProps): React.JSX.Element {
  return (
    <>
      <StrokeText
        text={title.join("\n")}
        font={SW_CONFIG.title.font}
        align="CenterCenter"
        pos={SW_CONFIG.title.pos}
      />
      <Column rows={left} x={SW_CONFIG.columnX.left} />
      <Column rows={right} x={SW_CONFIG.columnX.right} />
    </>
  );
}
