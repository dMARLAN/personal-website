import type { FontId } from "../constants";
import { textPath } from "../font/layout";
import type { Align, Point } from "../geometry";

export interface StrokeTextProps {
  text: string;
  font: FontId;
  align: Align;
  pos: Point;
}

/** `addStrokeText`: the whole string is one path. Throws on a character the font lacks. */
export function StrokeText({
  text,
  font,
  align,
  pos,
}: StrokeTextProps): React.JSX.Element {
  return (
    <path
      d={textPath(text, font, align, pos)}
      vectorEffect="non-scaling-stroke"
    />
  );
}
