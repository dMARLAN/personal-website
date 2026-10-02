import type { ServerStats } from "@/content/types";
import type { DdiScreens, LegendSpec } from "../../frame/types";
import { EngLabels } from "../../formats/eng";
import { MENU_LEGEND } from "../menuLegend";
import { ServerValues } from "./islands";

/**
 * The real ENG legends [pgA §2]: `RECORD` at PB16, always boxed, inert here (design section 9.2). PB18 is `MENU`,
 * which opens `/ddi` on TAC.
 */
export const SERVER_LEGENDS: readonly LegendSpec[] = [
  {
    pb: 16,
    lines: ["RECORD"],
    boxed: true,
    label: "Record",
    action: { kind: "inert" },
  },
  MENU_LEGEND,
];

/**
 * /server: the ENG format with two hosts in the engine columns. It has one screen and no in-section state. Render it
 * inside `ServerReadingsProvider`.
 */
export function serverScreens(stats: ServerStats): DdiScreens {
  return {
    initial: "ENG",
    screens: {
      ENG: {
        legends: SERVER_LEGENDS,
        symbology: (
          <>
            <EngLabels
              headers={[stats.hosts[0].header, stats.hosts[1].header]}
              labels={stats.rows.map((row) => row.label)}
            />
            <ServerValues />
          </>
        ),
      },
    },
  };
}
