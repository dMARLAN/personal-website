import type { RadarScene } from "@/content/types";
import type { DdiScreens, LegendSpec } from "../../frame/types";
import {
  RDR_LEGEND_OFFSET,
  RangeArrows,
  RdrAttkLeftEdge,
  RdrAttkSymbology,
} from "../../formats/rdrAttk";
import { pbEdge, type Pb, type Point } from "../../geometry";
import { MENU_PB, PAGES } from "../registry";
import { RadarScope } from "./RadarScope";
import { BarNumber, RangeOsb, RangeReadouts } from "./islands";
import "./radar.css";

/** (ours) The acquisition cursor rests up and left of the velocity vector, as in the reference screenshot. */
const CURSOR_POS: Point = [-270, 250];

function inert(pb: Pb, lines: readonly string[], label: string): LegendSpec {
  return {
    pb,
    lines,
    offset: RDR_LEGEND_OFFSET[pbEdge(pb)],
    label: `${label}, simulated`,
    action: { kind: "inert" },
  };
}

/**
 * Every RWS legend at its real position (RDR_AA_MAIN_PBs.lua; docs/pages/radar.md). Legends the Lua draws as plain
 * text rather than `add_PB_label_RDR` (PB1 PRF, PB2 RDR/PRI, PB5 mode) have no lines here: the left edge draws them.
 * The range arrows work; the rest are inert, as on every showcase page (design section 9.2).
 */
export function radarLegends(): LegendSpec[] {
  return [
    inert(1, [], "Pulse repetition frequency"),
    inert(2, [], "Radar priority"),
    inert(5, [], "Radar mode"),
    inert(6, ["4B"], "Elevation bars"),
    inert(7, ["SIL"], "Silent"),
    inert(8, ["ERASE"], "Erase"),
    {
      pb: 11,
      lines: [],
      label: "Increase range scale",
      action: {
        kind: "island",
        render: <RangeOsb step={1} label="Increase range scale" />,
      },
    },
    {
      pb: 12,
      lines: [],
      label: "Decrease range scale",
      action: {
        kind: "island",
        render: <RangeOsb step={-1} label="Decrease range scale" />,
      },
    },
    inert(13, ["SET"], "Set"),
    inert(14, ["RSET"], "Reset"),
    { ...inert(15, ["NCTR"], "Target recognition"), boxed: true },
    inert(16, ["DATA"], "Data"),
    inert(17, ["CHAN"], "Channel"),
    {
      pb: MENU_PB,
      lines: ["MENU"],
      label: "Tactical menu",
      action: { kind: "link", href: PAGES.menu.path },
    },
    inert(19, ["140°"], "Azimuth scan"),
    inert(20, ["MODE"], "Mode"),
  ];
}

/** /radar: one screen, RDR ATTK in RWS. The range scale is island state (design section 9.4). */
export function radarScreens(scene: RadarScene): DdiScreens {
  return {
    initial: "RWS",
    screens: {
      RWS: {
        legends: radarLegends(),
        symbology: (
          <RdrAttkSymbology
            ownship={scene.ownship}
            weapon={scene.weapon}
            sensitivity="7"
            rangeReadouts={
              <RangeReadouts
                cursor={CURSOR_POS}
                altitude={scene.ownship.altitude}
              />
            }
          />
        ),
        live: <RadarScope contacts={scene.contacts} />,
        edges: {
          left: (
            <RdrAttkLeftEdge
              mode="RWS"
              operatingPrf="INTL"
              instantaneousPrf="HI"
            />
          ),
          top: <BarNumber />,
          right: <RangeArrows />,
        },
      },
    },
  };
}
