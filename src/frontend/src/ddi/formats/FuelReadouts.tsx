"use client";

import { StrokeLine } from "../primitives/StrokeLine";
import { StrokeText } from "../primitives/StrokeText";
import { useFuelSeconds } from "./fuelClock";
import {
  FUEL_CARET,
  FUEL_TANKS,
  FUEL_TOTALS,
  caretTip,
  fuelReading,
  type FuelTankSpec,
} from "./fuelModel";

export interface FuelReadoutsProps {
  tanks: readonly FuelTankSpec[];
}

/**
 * The FUEL format's moving parts (ours): each tank's quantity and caret, TOTAL and INTERNAL. The server draws the
 * t = 0 frame; on the client the levels move gently with `useFuelSeconds`.
 */
export function FuelReadouts({ tanks }: FuelReadoutsProps): React.JSX.Element {
  const reading = fuelReading(tanks, useFuelSeconds());
  const { x, labelY, rowStep } = FUEL_TOTALS;
  return (
    <g data-fuel-total={reading.total}>
      {reading.tanks.map(({ id, fraction, pounds }) => {
        const tip = caretTip(id, fraction);
        return (
          <g key={id}>
            <StrokeText
              text={String(pounds)}
              font="F200"
              align="CenterCenter"
              pos={FUEL_TANKS[id].centre}
            />
            <StrokeLine
              len={FUEL_CARET.length}
              pos={tip}
              rot={-90 + FUEL_CARET.angle}
            />
            <StrokeLine
              len={FUEL_CARET.length}
              pos={tip}
              rot={-90 - FUEL_CARET.angle}
            />
          </g>
        );
      })}
      <StrokeText
        text={String(reading.total)}
        font="F200"
        align="CenterCenter"
        pos={[x, labelY - rowStep]}
      />
      <StrokeText
        text={String(reading.internal)}
        font="F200"
        align="CenterCenter"
        pos={[x, labelY - 3 * rowStep]}
      />
    </g>
  );
}
