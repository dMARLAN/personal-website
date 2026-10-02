import type { RadarScene } from "@/content/types";
import type { DdiScreens, LegendSpec } from "../../frame/types";
import { RdrAttkSymbology } from "../../formats/rdrAttk";
import { PBS, type Point } from "../../geometry";
import { MENU_LEGEND } from "../menuLegend";
import { RadarScope } from "./RadarScope";
import { RadarEdge, RadarOsb, RadarReadouts } from "./islands";

/** (ours) The acquisition cursor rests up and left of the velocity vector, as in the reference screenshot. */
export const CURSOR_POS: Point = [-270, 250];

/**
 * Every OSB but PB18 is a radar island: its legend, and what a press does, follow the radar state (`radarPanel`,
 * RDR_AA_MAIN_PBs.lua and RDR_AA_DATA_PBs.lua). The edge islands draw the legend text. PB18 is the base page's
 * `MENU`.
 */
export function radarLegends(): LegendSpec[] {
  return PBS.map((pb) =>
    pb === MENU_LEGEND.pb
      ? MENU_LEGEND
      : {
          pb,
          lines: [],
          label: `Radar pushbutton ${pb}`,
          action: { kind: "island", render: <RadarOsb pb={pb} /> },
        },
  );
}

/** /radar: one screen, RDR ATTK. The radar state (mode, scan settings, DATA) is island state (design section 9.4). */
export function radarScreens(scene: RadarScene): DdiScreens {
  return {
    initial: "RDR",
    screens: {
      RDR: {
        legends: radarLegends(),
        symbology: (
          <RdrAttkSymbology
            ownship={scene.ownship}
            weapon={scene.weapon}
            sensitivity="7"
            readouts={<RadarReadouts cursor={CURSOR_POS} scene={scene} />}
          />
        ),
        live: <RadarScope scene={scene} />,
        edges: {
          left: <RadarEdge edge="left" />,
          top: <RadarEdge edge="top" />,
          right: <RadarEdge edge="right" />,
          bottom: <RadarEdge edge="bottom" />,
        },
      },
    },
  };
}
