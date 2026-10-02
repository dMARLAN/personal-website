import type { Stroke } from "./generated/strokeFont";
import { formatNumber } from "./geometry";

/**
 * SVG path data for strokes authored y-down (glyphs and symbols), scaled by `scaleX`/`scaleY` and moved to
 * `origin` (SVG coordinates). A circle becomes an ellipse when the scales differ.
 */
export function strokesPath(
  strokes: readonly Stroke[],
  [originX, originY]: readonly [number, number],
  scaleX = 1,
  scaleY = scaleX,
): string {
  const at = (x: number, y: number): string =>
    `${formatNumber(originX + x * scaleX)},${formatNumber(originY + y * scaleY)}`;
  return strokes
    .map((stroke) => {
      switch (stroke.kind) {
        case "poly": {
          const commands: string[] = [];
          for (let index = 0; index < stroke.pts.length; index += 2) {
            commands.push(
              `${index === 0 ? "M" : "L"}${at(stroke.pts[index], stroke.pts[index + 1])}`,
            );
          }
          return commands.join(" ");
        }
        case "circle": {
          const radii = `${formatNumber(stroke.r * scaleX)} ${formatNumber(stroke.r * scaleY)}`;
          const right = at(stroke.cx + stroke.r, stroke.cy);
          const left = at(stroke.cx - stroke.r, stroke.cy);
          return `M${right} A${radii} 0 1 0 ${left} A${radii} 0 1 0 ${right} Z`;
        }
      }
    })
    .join(" ");
}
