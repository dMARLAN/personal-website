import { ARC_SEGMENTS_PER_TURN } from "../constants";
import {
  arcPoint,
  formatNumber,
  polylinePath,
  toSvg,
  type Point,
} from "../geometry";

export interface StrokeCircleProps {
  r: number;
  pos: Point;
}

/** `addStrokeCircle`: a full circle. */
export function StrokeCircle({ r, pos }: StrokeCircleProps): React.JSX.Element {
  const [cx, cy] = toSvg(pos);
  return (
    <circle
      cx={formatNumber(cx)}
      cy={formatNumber(cy)}
      r={formatNumber(r)}
      vectorEffect="non-scaling-stroke"
    />
  );
}

export interface StrokeArcProps {
  r: number;
  /** Arc length in degrees, clockwise from up. Capped at 360, as in DCS. */
  arc?: number;
  /** Degrees counter-clockwise from up. */
  rot?: number;
  pos: Point;
}

/** `addStrokeArc`: a polyline of at most 64 segments per turn, with points at (r·sin a, r·cos a). */
export function StrokeArc({
  r,
  arc = 360,
  rot = 0,
  pos,
}: StrokeArcProps): React.JSX.Element {
  const sweep = Math.min(arc, 360);
  const count = Math.ceil((sweep / 360) * ARC_SEGMENTS_PER_TURN);
  const points = Array.from({ length: count + 1 }, (_, index): Point => {
    const [x, y] = arcPoint(r, (sweep / count) * index);
    const radians = (rot * Math.PI) / 180;
    return [
      pos[0] + x * Math.cos(radians) - y * Math.sin(radians),
      pos[1] + x * Math.sin(radians) + y * Math.cos(radians),
    ];
  });
  return <path d={polylinePath(points)} vectorEffect="non-scaling-stroke" />;
}
