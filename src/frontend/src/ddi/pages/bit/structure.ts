import type { BitItemKey, BitLegendKey } from "@/content/types";
import type { Pb } from "../../geometry";

/**
 * The real DCS BIT structure, from `Pages/MPD/BIT/*.lua` [pgB §3]: which group sits on which OSB, which items each
 * sublevel lists, and which item legends and fixed legends it shows. Content only renames the items.
 */

export type SublevelId =
  | "FCS-MC"
  | "SENSORS"
  | "STORES"
  | "COMM"
  | "NAV"
  | "DISPLAYS"
  | "STATUS MONITOR"
  | "EW";

/** An item legend: a check's own name, or a legend-only name that tests the listed checks (none: inert). */
export type ItemLegend =
  | { pb: Pb; item: BitItemKey }
  | { pb: Pb; legend: BitLegendKey; tests: readonly BitItemKey[] };

/** A fixed legend, drawn by `add_PB_label`. `\n` stacks lines in one string, as the Lua writes them. */
export interface FixedLegend {
  pb: Pb;
  text: string;
  label: string;
}

export interface Sublevel {
  id: SublevelId;
  /** The group block on BIT FAILURES (`BIT_EquipGroupsParams`). */
  groupPb: Pb;
  /** The group block's label; `STATUS\nMONITOR` is two lines. */
  groupLabel: string;
  /** The sublevel title, 200 % at (0, 237). */
  title: string;
  rows: readonly BitItemKey[];
  items: readonly ItemLegend[];
  /** BIT_DISPLAYS only: the DDI/MPCD/HUD bracket at PB5, which tests all four display rows. */
  bracket?: {
    pb: Pb;
    labels: readonly [BitLegendKey, BitItemKey, BitItemKey];
    tests: readonly BitItemKey[];
  };
  /** BIT_STAT_MON only: `TK2FL` and `TK3FL` on rows 12 and 13 (0-based), outside the group's status. */
  extraRows?: readonly { index: number; item: BitItemKey }[];
  /** PB7 and the bottom-row legends. All are inert here. */
  fixed: readonly FixedLegend[];
}

/** (ours) Readable names for the inert DCS legends. */
function maintenance(system: string): string {
  return `${system} maintenance`;
}

export const SUBLEVELS: readonly Sublevel[] = [
  {
    id: "FCS-MC",
    groupPb: 5,
    groupLabel: "FCS-MC",
    title: "FCS-MC",
    rows: ["MC1", "MC2", "FCSA", "FCSB"],
    items: [{ pb: 5, legend: "FCS", tests: ["FCSA", "FCSB"] }],
    // PB16 `FCS OPTION` and PB17's cycling label are built in the page module: PB16 is live.
    fixed: [],
  },
  {
    id: "SENSORS",
    groupPb: 4,
    groupLabel: "SENSORS",
    title: "SENSORS",
    rows: ["RDR", "FLIR", "LTDR"],
    items: [
      { pb: 3, item: "LTDR" },
      { pb: 4, item: "FLIR" },
      { pb: 5, item: "RDR" },
    ],
    fixed: [{ pb: 17, text: "RDR\nMAINT", label: maintenance("Radar") }],
  },
  {
    id: "STORES",
    groupPb: 3,
    groupLabel: "STORES",
    title: "STORES",
    rows: ["SMS", "AWW4", "CLC", "WPNS"],
    items: [
      { pb: 3, item: "CLC" },
      { pb: 4, item: "AWW4" },
      { pb: 5, item: "SMS" },
    ],
    fixed: [
      { pb: 7, text: "STATION", label: "Station" },
      { pb: 17, text: "SMS\nMAINT", label: maintenance("SMS") },
    ],
  },
  {
    id: "COMM",
    groupPb: 2,
    groupLabel: "COMM",
    title: "COMM",
    rows: ["CSC", "ICS", "IFF", "D_L", "COM1", "COM2", "MIDS"],
    items: [
      { pb: 2, item: "D_L" },
      { pb: 3, item: "IFF" },
      { pb: 4, item: "ICS" },
      { pb: 5, item: "CSC" },
      { pb: 11, item: "COM1" },
      { pb: 12, item: "COM2" },
      { pb: 15, item: "MIDS" },
    ],
    fixed: [],
  },
  {
    id: "NAV",
    groupPb: 1,
    groupLabel: "NAV",
    title: "NAV",
    rows: ["INS", "ADC", "ILS", "RALT", "TCN", "AUG", "BCN", "GPS"],
    items: [
      { pb: 1, item: "TCN" },
      { pb: 2, item: "RALT" },
      { pb: 3, item: "ILS" },
      { pb: 4, item: "ADC" },
      { pb: 5, item: "INS" },
      { pb: 11, item: "AUG" },
      { pb: 12, item: "BCN" },
      { pb: 13, item: "GPS" },
    ],
    fixed: [
      { pb: 16, text: "MAD\nCAL", label: "MAD calibration" },
      { pb: 17, text: "ADC\nMAINT", label: maintenance("ADC") },
      { pb: 19, text: "INS\nMAINT", label: maintenance("INS") },
      { pb: 20, text: "INS\nGB", label: "INS gyrocompass bias" },
    ],
  },
  {
    id: "DISPLAYS",
    groupPb: 11,
    groupLabel: "DISPLAYS",
    title: "DISPLAYS",
    rows: ["LDDI", "RDDI", "MPCD", "HUD", "IFEI", "DMS", "HMD"],
    items: [
      { pb: 2, item: "DMS" },
      // UFC has a legend but no row on this page, so its test shows nothing here: inert.
      { pb: 3, legend: "UFC", tests: [] },
      { pb: 4, item: "IFEI" },
      { pb: 11, item: "HMD" },
    ],
    bracket: {
      pb: 5,
      labels: ["DDI", "MPCD", "HUD"],
      tests: ["LDDI", "RDDI", "MPCD", "HUD"],
    },
    fixed: [
      { pb: 16, text: "UFC\nMAINT", label: maintenance("UFC") },
      { pb: 17, text: "HMD\nMAINT", label: maintenance("HMD") },
    ],
  },
  {
    id: "STATUS MONITOR",
    groupPb: 12,
    groupLabel: "STATUS\nMONITOR",
    title: "STATUS MONITOR",
    rows: ["SDC", "MU", "AISI"],
    items: [
      { pb: 2, legend: "DFIRS", tests: [] },
      { pb: 3, item: "AISI" },
      { pb: 4, item: "MU" },
      { pb: 5, item: "SDC" },
      { pb: 14, legend: "FQTY", tests: ["TK2FL", "TK3FL"] },
      { pb: 15, legend: "FXFR", tests: [] },
    ],
    extraRows: [
      { index: 12, item: "TK2FL" },
      { index: 13, item: "TK3FL" },
    ],
    fixed: [
      { pb: 7, text: "MSP", label: "Maintenance status panel" },
      { pb: 17, text: "FIRAM\nMAINT", label: maintenance("FIRAM") },
    ],
  },
  {
    id: "EW",
    groupPb: 13,
    groupLabel: "EW",
    title: "EW",
    rows: ["RWR", "IBS", "ALE_47", "ASPJ"],
    items: [
      { pb: 3, item: "ALE_47" },
      { pb: 4, item: "IBS" },
    ],
    fixed: [],
  },
];

/** BIT_FCS_MC.lua: PB17's labels, in the order `FCS OPTION` cycles them. */
export const FCS_OPTIONS: readonly string[] = [
  "FCS\nMAINT",
  "FCS\nNWS",
  "FCS\nATC",
  "FCS\nRIG",
  ...Array.from({ length: 12 }, (_, index) => `FCS\nTG${index + 1}`),
];

/**
 * `EquipItems` order in `BIT_defs.lua` (items this page lists). The failure list follows it; the C++ that fills the
 * list is not visible, so the order is our assumption.
 */
export const EQUIP_ORDER: readonly BitItemKey[] = [
  "MC1",
  "MC2",
  "FCSA",
  "FCSB",
  "RDR",
  "FLIR",
  "LTDR",
  "SMS",
  "AWW4",
  "CLC",
  "WPNS",
  "CSC",
  "ICS",
  "IFF",
  "D_L",
  "COM1",
  "COM2",
  "MIDS",
  "INS",
  "GPS",
  "ADC",
  "ILS",
  "RALT",
  "TCN",
  "BCN",
  "AUG",
  "LDDI",
  "RDDI",
  "MPCD",
  "HUD",
  "IFEI",
  "DMS",
  "HMD",
  "SDC",
  "MU",
  "AISI",
  "RWR",
  "IBS",
  "ALE_47",
  "ASPJ",
];
