import {
  align as alignBox,
  polylinePath,
  type Align,
  type Point,
} from "../geometry";

export interface StrokeBoxProps {
  w: number;
  h: number;
  align?: Align;
  pos: Point;
}

/** `addStrokeBox`: a 4-edge rectangle. DCS defaults the alignment to `CenterCenter`. */
export function StrokeBox({
  w,
  h,
  align = "CenterCenter",
  pos,
}: StrokeBoxProps): React.JSX.Element {
  const { left, right, bottom, top } = alignBox(
    { width: w, height: h },
    align,
    pos,
  );
  const corners = [
    [left, top],
    [right, top],
    [right, bottom],
    [left, bottom],
  ] as const;
  return (
    <path d={polylinePath(corners, true)} vectorEffect="non-scaling-stroke" />
  );
}
