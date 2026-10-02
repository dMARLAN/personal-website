import { SERVER_STATS } from "@/content/server";
import type { DdiScreens, LegendSpec } from "../../frame/types";
import { EngLabels } from "../../formats/eng";
import { MENU_LABELS, MENU_PB, PAGES } from "../registry";
import { ServerValues } from "./islands";

/**
 * The real ENG legends [pgA §2]: `RECORD` at PB16, always boxed, inert here (design section 9.2). PB18 is `MENU`,
 * which opens `/` on TAC.
 */
export const SERVER_LEGENDS: readonly LegendSpec[] = [
  {
    pb: 16,
    lines: ["RECORD"],
    boxed: true,
    label: "Record",
    action: { kind: "inert" },
  },
  {
    pb: MENU_PB,
    lines: ["MENU"],
    label: MENU_LABELS.TAC,
    action: { kind: "link", href: PAGES.menu.path },
  },
];

/** /server: the ENG format with two hosts in the engine columns. It has one screen and no in-section state. */
export function serverScreens(): DdiScreens {
  return {
    initial: "ENG",
    screens: {
      ENG: {
        legends: SERVER_LEGENDS,
        symbology: (
          <>
            <EngLabels
              headers={[
                SERVER_STATS.hosts[0].header,
                SERVER_STATS.hosts[1].header,
              ]}
              labels={SERVER_STATS.rows.map((row) => row.label)}
            />
            <ServerValues />
          </>
        ),
      },
    },
  };
}
