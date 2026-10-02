import { FUEL_RESERVES } from "@/content/fuel";
import { FlbitTimeout } from "../formats/FlbitTimeout";
import { FuelFormat } from "../formats/fuel";
import type { DdiScreens, LegendSpec } from "../frame/types";
import { menuLinkLegend } from "./registry";

/** The two in-section states: the page, and the page while the fuel low BIT runs. */
export const FUEL_STATES = { idle: "FUEL", testing: "FLBIT" } as const;

const RESET_SDC: LegendSpec = {
  pb: 10,
  lines: ["RESET", "SDC"],
  label: "Reset SDC",
  action: { kind: "inert" },
};

/**
 * /fuel: the real FUEL format with "energy" reserves. PB20 `FLBIT` runs the fuel low BIT: the legend is boxed for
 * 13 s, then the page returns to its idle state [gpg §5]. Neither state changes the URL.
 */
export function fuelScreens(): DdiScreens {
  const symbology = (
    <FuelFormat tanks={FUEL_RESERVES.tanks} bingo={FUEL_RESERVES.bingo} />
  );
  return {
    initial: FUEL_STATES.idle,
    screens: {
      [FUEL_STATES.idle]: {
        legends: [
          RESET_SDC,
          {
            pb: 20,
            lines: ["FLBIT"],
            label: "Fuel low warning test",
            action: { kind: "state", state: FUEL_STATES.testing },
          },
          menuLinkLegend(),
        ],
        symbology,
      },
      [FUEL_STATES.testing]: {
        legends: [
          RESET_SDC,
          {
            pb: 20,
            lines: ["FLBIT"],
            boxed: true,
            label: "Fuel low warning test, running",
            action: { kind: "state", state: FUEL_STATES.testing },
          },
          menuLinkLegend(),
        ],
        symbology: (
          <>
            {symbology}
            <FlbitTimeout state={FUEL_STATES.idle} />
          </>
        ),
      },
    },
  };
}
