import type { FontId } from "../constants";
import { align, measure, type Align, type Point, type Rect } from "../geometry";
import { StrokeText } from "../primitives/StrokeText";

/** One `addStrokeText` call: a format's layout function returns these, so tests can measure what the glass draws. */
export interface PlacedText {
  text: string;
  font: FontId;
  align: Align;
  pos: Point;
}

/** The ink box of a placed string, in DCS coordinates. */
export function placedTextBounds({
  text,
  font,
  align: alignment,
  pos,
}: PlacedText): Rect {
  return align(measure(text, font), alignment, pos);
}

export function PlacedTexts({
  texts,
}: {
  texts: readonly PlacedText[];
}): React.JSX.Element {
  return (
    <>
      {texts.map(({ text, font, align: alignment, pos }) => (
        <StrokeText
          key={`${pos.join()}-${text}`}
          text={text}
          font={font}
          align={alignment}
          pos={pos}
        />
      ))}
    </>
  );
}
