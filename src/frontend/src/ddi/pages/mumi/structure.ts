import type { Pb } from "../../geometry";

/** One `add_PB_label` call in MUMI.lua: lines outermost first, and an accessible name (ours). */
export interface MumiLegend {
  pb: Pb;
  lines: readonly string[];
  label: string;
}

/** PB10 switches the two legend sets, `MORE` on Main and `RETURN` on More [pgB §5]. */
export const SUBLEVEL_PB: Pb = 10;
/**
 * (ours) The `LOAD` legend that runs the load: MUMI.lua has no LOAD legend (docs/pages/mumi.md). No OSB is blank in
 * both sets, so it sits on the More set's PB12, with blank PB11 and PB13 either side.
 */
export const LOAD_PB: Pb = 12;
export const LOAD_LEGEND: MumiLegend = {
  pb: LOAD_PB,
  lines: ["LOAD"],
  label: "Load the admin console",
};
/** Where the load ends: the admin console, a normal navigation out of the DDI. */
export const ADMIN_PATH = "/admin";

/** `MUMI_Menu_Main` (`MPD_MUMI_PB_Label_Main`, sublevel 0), PB10 `MORE` aside. Each legend has its own box. */
export const MAIN_LEGENDS: readonly MumiLegend[] = [
  { pb: 1, lines: ["RECCE"], label: "Reconnaissance data" },
  { pb: 2, lines: ["HARM"], label: "HARM data" },
  { pb: 3, lines: ["RDR"], label: "Radar data" },
  { pb: 4, lines: ["TCN"], label: "TACAN data" },
  { pb: 5, lines: ["WYPT"], label: "Waypoint data" },
  { pb: 6, lines: ["BIT"], label: "BIT data" },
  { pb: 7, lines: ["MI"], label: "Memory inspect" },
  { pb: 8, lines: ["IFF"], label: "IFF data" },
  { pb: 9, lines: ["DL 13"], label: "Link 16 data" },
  { pb: 11, lines: ["ID"], label: "Identification data" },
  { pb: 12, lines: ["MON", "FATG"], label: "Fatigue monitor data" },
  { pb: 13, lines: ["COMM"], label: "Radio presets" },
  { pb: 14, lines: ["HOLD"], label: "Hold" },
  { pb: 15, lines: ["ERASE"], label: "Erase" },
  { pb: 16, lines: ["ALR67"], label: "Radar warning data" },
  { pb: 17, lines: ["D/L"], label: "Data link data" },
  { pb: 19, lines: ["ALM", "GPS"], label: "GPS almanac" },
  { pb: 20, lines: ["WYPT", "GPS"], label: "GPS waypoints" },
];

/** `MUMI_Menu_More` (`MPD_MUMI_PB_Label_More`, sublevel 1), PB10 `RETURN` aside. */
export const MORE_LEGENDS: readonly MumiLegend[] = [
  { pb: 1, lines: ["PB"], label: "Pre-briefed targets" },
  { pb: 2, lines: ["NET3"], label: "Network 3 data" },
  { pb: 3, lines: ["NET2"], label: "Network 2 data" },
  { pb: 4, lines: ["NET1"], label: "Network 1 data" },
  { pb: 5, lines: ["SA"], label: "Situational awareness data" },
  { pb: 7, lines: ["JSOW"], label: "JSOW data" },
  { pb: 8, lines: ["JDAM"], label: "JDAM data" },
  { pb: 9, lines: ["SLAMR"], label: "SLAM-ER data" },
  { pb: 14, lines: ["CAS", "DCS"], label: "CAS data" },
  { pb: 15, lines: ["NETS", "DCS"], label: "Network data" },
  { pb: 16, lines: ["FLRP"], label: "Flight reference points" },
  { pb: 17, lines: ["WIND"], label: "Wind data" },
  { pb: 19, lines: ["PROG", "ROE"], label: "Rules of engagement" },
  { pb: 20, lines: ["GPI"], label: "GPI data" },
];
