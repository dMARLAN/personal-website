import { LEGEND_FONT, pbLabelLayout } from "../frame/legend";
import type { Pb, Point } from "../geometry";
import { StrokeBox } from "./StrokeBox";
import { StrokeText } from "./StrokeText";

export interface PBLabelProps {
  pb: Pb;
  /** Outermost line first, as `add_PB_label` takes its arguments. */
  lines: readonly string[];
  boxed?: boolean;
  /** Moves the whole legend, in DI. */
  offset?: Point;
}

/** `add_PB_label` [fnd §5.3]: an OSB legend. Render it into the edge strip of its PB's edge. */
export function PBLabel({
  pb,
  lines,
  boxed = false,
  offset,
}: PBLabelProps): React.JSX.Element {
  const { texts, boxes } = pbLabelLayout(pb, lines, boxed, offset);
  return (
    <>
      {texts.map(({ text, align, pos }) => (
        <StrokeText
          key={`text-${text}-${pos.join()}`}
          text={text}
          font={LEGEND_FONT}
          align={align}
          pos={pos}
        />
      ))}
      {boxes.map(({ width, height, align, pos }) => (
        <StrokeBox
          key={`box-${pos.join()}`}
          w={width}
          h={height}
          align={align}
          pos={pos}
        />
      ))}
    </>
  );
}
