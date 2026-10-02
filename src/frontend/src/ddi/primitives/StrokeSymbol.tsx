import { STROKE_SYMBOLS, type SymbolId } from "../generated/strokeSymbols";
import { formatNumber, toSvg, type Point } from "../geometry";
import { strokesPath } from "../strokes";

export interface StrokeSymbolProps {
  id: SymbolId;
  pos: Point;
  /** Degrees counter-clockwise from up. */
  rot?: number;
  scale?: number;
}

/** `addStrokeSymbol`: a symbol from the DCS stroke symbol sets, centred on `pos`. */
export function StrokeSymbol({
  id,
  pos,
  rot = 0,
  scale = 1,
}: StrokeSymbolProps): React.JSX.Element {
  const [x, y] = toSvg(pos);
  const transform = `translate(${formatNumber(x)} ${formatNumber(y)}) rotate(${formatNumber(-rot)}) scale(${formatNumber(scale)})`;
  return (
    <path
      d={strokesPath(STROKE_SYMBOLS[id], [0, 0])}
      transform={transform}
      vectorEffect="non-scaling-stroke"
    />
  );
}
