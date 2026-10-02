import { StrokeBox } from "../primitives/StrokeBox";
import { StrokeText } from "../primitives/StrokeText";
import { FuelReadouts } from "./FuelReadouts";
import {
  FUEL_LABEL_GAP,
  FUEL_TANKS,
  FUEL_TOTALS,
  type FuelTankSpec,
} from "./fuelModel";

/** BINGO: the 150 % label over the 200 % value, which is right-aligned 100 DI right of the label (FUEL.lua). */
const BINGO = { x: 350, labelY: 350, valueOffset: [100, -45] } as const;

export interface FuelFormatProps {
  tanks: readonly FuelTankSpec[];
  bingo: number;
}

/**
 * The FUEL format [pgA §3]: nine boxed tanks with labels, BINGO, and TOTAL and INTERNAL. The quantities and carets
 * are the `FuelReadouts` island. EST, INV, CG DEGD and the update timer are hidden in DCS and are left out.
 */
export function FuelFormat({
  tanks,
  bingo,
}: FuelFormatProps): React.JSX.Element {
  const { x, labelY, rowStep } = FUEL_TOTALS;
  return (
    <>
      {tanks.map(({ id, label }) => {
        const {
          centre: [centreX, centreY],
          width,
          height,
        } = FUEL_TANKS[id];
        return (
          <g key={id}>
            <StrokeBox w={width} h={height} pos={[centreX, centreY]} />
            <StrokeText
              text={label}
              font="F100"
              align="CenterCenter"
              pos={[centreX, centreY + height / 2 + FUEL_LABEL_GAP]}
            />
          </g>
        );
      })}
      <StrokeText
        text="BINGO"
        font="F150"
        align="CenterCenter"
        pos={[BINGO.x, BINGO.labelY]}
      />
      <StrokeText
        text={String(bingo)}
        font="F200"
        align="RightCenter"
        pos={[
          BINGO.x + BINGO.valueOffset[0],
          BINGO.labelY + BINGO.valueOffset[1],
        ]}
      />
      <StrokeText
        text="TOTAL"
        font="F150"
        align="CenterCenter"
        pos={[x, labelY]}
      />
      <StrokeText
        text="INTERNAL"
        font="F150"
        align="CenterCenter"
        pos={[x, labelY - 2 * rowStep]}
      />
      <FuelReadouts tanks={tanks} />
    </>
  );
}
