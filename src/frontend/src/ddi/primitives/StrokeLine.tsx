import { lineEnd, polylinePath, type Point } from "../geometry";

export interface StrokeLineProps {
  len: number;
  pos: Point;
  /** Degrees counter-clockwise from up. */
  rot?: number;
}

/** `addStrokeLine`: from `pos` to `pos + len·(−sin rot, cos rot)`. */
export function StrokeLine({
  len,
  pos,
  rot = 0,
}: StrokeLineProps): React.JSX.Element {
  return (
    <path
      d={polylinePath([pos, lineEnd(pos, len, rot)])}
      vectorEffect="non-scaling-stroke"
    />
  );
}
