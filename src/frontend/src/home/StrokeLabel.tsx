import { measure } from "@/ddi/geometry";
import { StrokeText } from "@/ddi/primitives/StrokeText";

const FONT = "F100";
/** Room for the stroke's round caps at the edges of the box. */
const PAD = 2;

/**
 * A short label in the DCS stroke font, as the homepage's one cockpit accent. Decorative: the heading beside it says
 * the same thing in text.
 */
export function StrokeLabel({ text }: { text: string }): React.JSX.Element {
  const { width, height } = measure(text, FONT);
  return (
    <svg
      className="stroke-label"
      viewBox={`${-PAD} ${-PAD} ${width + 2 * PAD} ${height + 2 * PAD}`}
      style={{ aspectRatio: `${width + 2 * PAD} / ${height + 2 * PAD}` }}
      aria-hidden="true"
      focusable="false"
    >
      <StrokeText text={text} font={FONT} align="LeftTop" pos={[0, 0]} />
    </svg>
  );
}
