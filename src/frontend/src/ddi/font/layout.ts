import { FONTS, GLYPH_CELL, type FontId } from "../constants";
import {
  align,
  alignFractions,
  lineWidth,
  measure,
  textLines,
  type Align,
  type Point,
} from "../geometry";
import { strokesPath } from "../strokes";
import { glyph } from "./glyphs";

/** One glyph cell, placed in SVG coordinates (y down) by its top-left corner. */
export interface PlacedGlyph {
  character: string;
  x: number;
  y: number;
}

/**
 * Places each character of `text` per the `stringdefs` model [fnd §3.3]. The block's bounding box is aligned
 * to `pos`, and each line is aligned horizontally within it. A space advances one cell and draws nothing.
 */
export function layoutText(
  text: string,
  font: FontId,
  alignment: Align,
  pos: Point,
): PlacedGlyph[] {
  const metrics = FONTS[font];
  const block = align(measure(text, font), alignment, pos);
  const [fractionX] = alignFractions(alignment);
  const placed: PlacedGlyph[] = [];
  textLines(text).forEach((line, lineIndex) => {
    const lineTop =
      block.top - lineIndex * (metrics.height + metrics.interline);
    const lineLeft =
      block.left +
      (block.right - block.left - lineWidth(line.length, font)) * fractionX;
    line.forEach((character, index) => {
      if (character === " ") {
        return;
      }
      placed.push({
        character,
        x: lineLeft + index * (metrics.width + metrics.interchar),
        y: -lineTop,
      });
    });
  });
  return placed;
}

/** SVG path data for `text`: every glyph scaled non-uniformly from the 12 × 20 cell to the font's size. */
export function textPath(
  text: string,
  font: FontId,
  alignment: Align,
  pos: Point,
): string {
  const metrics = FONTS[font];
  const scaleX = metrics.width / GLYPH_CELL.width;
  const scaleY = metrics.height / GLYPH_CELL.height;
  return layoutText(text, font, alignment, pos)
    .map(({ character, x, y }) =>
      strokesPath(glyph(character, text), [x, y], scaleX, scaleY),
    )
    .join(" ");
}
