import type { FlightControls } from "@/content/types";
import { FcsFormat } from "../formats/fcs";
import type { DdiScreens } from "../frame/types";
import { MENU_LEGEND } from "./menuLegend";

/** /fcs: the real FCS format with playful system-health data. BLIN and AOA are real legends, inert here. */
export function fcsScreens(controls: FlightControls): DdiScreens {
  return {
    initial: "FCS",
    screens: {
      FCS: {
        legends: [
          {
            pb: 2,
            lines: ["BLIN"],
            label: "BLIN codes",
            action: { kind: "inert" },
          },
          {
            pb: 16,
            lines: ["AOA"],
            label: "Angle of attack",
            action: { kind: "inert" },
          },
          MENU_LEGEND,
        ],
        symbology: <FcsFormat {...controls} />,
      },
    },
  };
}
