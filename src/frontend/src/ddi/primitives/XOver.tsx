import { lineEnd, polylinePath, type Point } from "../geometry";

export interface XOverProps {
  w: number;
  h: number;
  pos: Point;
}

/**
 * `add_X_Over`: two diagonals across a `w` × `h` box centred on `pos`. Like the Lua, it floors the angle and
 * the diagonal length, so the lines can stop just short of the corners.
 */
export function XOver({ w, h, pos: [x, y] }: XOverProps): React.JSX.Element {
  const angle = Math.floor((Math.atan(h / w) * 180) / Math.PI);
  const length = Math.floor(Math.hypot(w, h));
  const bottomLeft: Point = [x - w / 2, y - h / 2];
  const topLeft: Point = [x - w / 2, y + h / 2];
  const d = [
    polylinePath([bottomLeft, lineEnd(bottomLeft, length, -90 + angle)]),
    polylinePath([topLeft, lineEnd(topLeft, length, -90 - angle)]),
  ].join(" ");
  return <path d={d} vectorEffect="non-scaling-stroke" />;
}
