import type { FontId } from "../constants";
import type { Point } from "../geometry";
import { StrokeText } from "../primitives/StrokeText";

// ENG.lua [pgA §2]: text only, no geometry. Every string is font 150.
const TOP_Y = 343;
const ROW_PITCH = 60;
const HEADER_OFFSET = 70;
const HEADER_X = 250;
const LEFT_VALUE_X = -180;
const RIGHT_VALUE_X = 260;

export const ENG_FONT: FontId = "F150";
/** The Lua draws 13 rows, INLET TEMP to TDP. */
export const ENG_ROW_COUNT = 13;
/** (ours) Content limits that keep every string clear of its neighbours; `eng.test.tsx` checks them with `measure`. */
export const ENG_LIMITS = { header: 9, label: 10, value: 6 } as const;

/** Row `index` is `CenterCenter` at y = 343 − 60·index. */
export function engRowY(index: number): number {
  return TOP_Y - ROW_PITCH * index;
}

/** The headers sit 70 DI above the first row, centred at x = ∓250. */
export const ENG_HEADER_POS: readonly [Point, Point] = [
  [-HEADER_X, TOP_Y + HEADER_OFFSET],
  [HEADER_X, TOP_Y + HEADER_OFFSET],
];

/** Values are `RightCenter`: the left column ends at x = −180 and the right one at x = 260. */
export const ENG_VALUE_X: readonly [number, number] = [
  LEFT_VALUE_X,
  RIGHT_VALUE_X,
];

export interface EngLabelsProps {
  /** `LEFT EPE` and `RIGHT EPE` in DCS. */
  headers: readonly [string, string];
  /** The centre column, top row first. */
  labels: readonly string[];
}

/** The static part of ENG: the two column headers and the centre labels. */
export function EngLabels({
  headers,
  labels,
}: EngLabelsProps): React.JSX.Element {
  return (
    <>
      {headers.map((header, side) => (
        <StrokeText
          key={`header-${side}`}
          text={header}
          font={ENG_FONT}
          align="CenterCenter"
          pos={ENG_HEADER_POS[side]}
        />
      ))}
      {labels.map((label, index) => (
        <StrokeText
          key={`label-${index}`}
          text={label}
          font={ENG_FONT}
          align="CenterCenter"
          pos={[0, engRowY(index)]}
        />
      ))}
    </>
  );
}

export interface EngValuesProps {
  /** Left and right value per row, top row first. */
  values: readonly (readonly [string, string])[];
}

/** The value columns, which the engine controllers drive in DCS. Pure, so a client island can redraw them. */
export function EngValues({ values }: EngValuesProps): React.JSX.Element {
  return (
    <>
      {values.flatMap((pair, index) =>
        pair.map((value, side) => (
          <StrokeText
            key={`value-${index}-${side}`}
            text={value}
            font={ENG_FONT}
            align="RightCenter"
            pos={[ENG_VALUE_X[side], engRowY(index)]}
          />
        )),
      )}
    </>
  );
}
