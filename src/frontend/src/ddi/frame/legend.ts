import { MENU_TITLE, PB_LEGEND, type FontId } from "../constants";
import {
  align as alignBox,
  measure,
  pbAnchor,
  pbEdge,
  type Align,
  type Pb,
  type Point,
  type Rect,
} from "../geometry";

/** OSB legends use the 120 % font [fnd §5.3]. */
export const LEGEND_FONT: FontId = "F120";
/** The TAC/SUPT title uses the 150 % font [fnd §5.5]. */
export const MENU_TITLE_FONT: FontId = "F150";

export interface LegendText {
  text: string;
  align: Align;
  pos: Point;
}

export interface LegendBox {
  width: number;
  height: number;
  align: Align;
  pos: Point;
}

export interface LegendLayout {
  texts: LegendText[];
  boxes: LegendBox[];
}

/** Per edge: the inward direction (`offset` in the Lua) and the text alignment [fnd §5.3]. */
const EDGE_LAYOUT = {
  left: { inward: [1, 0], align: "LeftCenter" },
  top: { inward: [0, -1], align: "CenterTop" },
  right: { inward: [-1, 0], align: "RightCenter" },
  bottom: { inward: [0, 1], align: "CenterBottom" },
} as const;

/**
 * `add_PB_label` [fnd §5.3, §5.4]. Row legends stack each line 35 DI inward. Side legends put each word in its own
 * column of upright letters, 25 DI inward per word. A box's outer edge sits 6 DI beyond the text edge. `offset` moves
 * the whole legend, as a format's own wrapper does (for example `add_PB_label_RDR`).
 */
export function pbLabelLayout(
  pb: Pb,
  lines: readonly string[],
  boxed: boolean,
  offset: Point = [0, 0],
): LegendLayout {
  const { inward, align } = EDGE_LAYOUT[pbEdge(pb)];
  const [pbX, pbY] = pbAnchor(pb);
  const [anchorX, anchorY] = [pbX + offset[0], pbY + offset[1]];
  const isColumn = inward[1] === 0;
  const texts: LegendText[] = [];
  const boxes: LegendBox[] = [];
  lines.forEach((line, index) => {
    const step = isColumn
      ? PB_LEGEND.columnStep * index
      : PB_LEGEND.lineStep * index;
    texts.push({
      text: isColumn ? [...line].join("\n") : line,
      align,
      pos: [anchorX + step * inward[0], anchorY + step * inward[1]],
    });
    if (boxed) {
      const boxStep = step - PB_LEGEND.boxOffset;
      boxes.push({
        width: isColumn
          ? PB_LEGEND.columnBoxWidth
          : line.length * PB_LEGEND.rowBoxCharWidth,
        height: isColumn
          ? line.length * PB_LEGEND.columnBoxCharHeight
          : PB_LEGEND.rowBoxHeight,
        align,
        pos: [anchorX + boxStep * inward[0], anchorY + boxStep * inward[1]],
      });
    }
  });
  return { texts, boxes };
}

/** The ink extent of a legend: its texts and boxes. */
export function legendBounds({ texts, boxes }: LegendLayout): Rect[] {
  return [
    ...texts.map(({ text, align, pos }) =>
      alignBox(measure(text, LEGEND_FONT), align, pos),
    ),
    ...boxes.map(({ width, height, align, pos }) =>
      alignBox({ width, height }, align, pos),
    ),
  ];
}

/** The TAC/SUPT title box: 110 × 46 centred on (0, −446) [fnd §5.5]. */
export function menuTitleBox(): Rect {
  return alignBox(MENU_TITLE.box, "CenterCenter", MENU_TITLE.pos);
}
