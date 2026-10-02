import { RANGE_SCALES } from "../../formats/rdrAttk";
import type { Pb } from "../../geometry";
import type { RadarAction, RadarState } from "./settings";

/*
 * Which legend each OSB shows in each radar state, and what pressing it does (RDR_AA_MAIN_PBs.lua for the main level,
 * RDR_AA_DATA_PBs.lua for DATA; docs/pages/radar.md section 1.6). PB18 `MENU` is the base page's and is not here.
 */

export interface RadarLegend {
  /** `add_PB_label_RDR` lines. Empty when the format draws the legend itself (PRF, RDR/PRI, mode, arrows, AUTO/MAN). */
  lines: readonly string[];
  boxed: boolean;
  /** The accessible name. A cycle includes its current value. */
  label: string;
  /** What a press does; null for an inert legend (design section 9.2). */
  action: RadarAction | null;
  /** A toggle's state, for `aria-pressed`. */
  pressed?: boolean;
}

export type RadarPanel = Partial<Record<Pb, RadarLegend>>;

function legend(
  lines: readonly string[],
  label: string,
  action: RadarAction | null,
  boxed = false,
): RadarLegend {
  return { lines, boxed, label, action };
}

function toggle(
  lines: readonly string[],
  label: string,
  action: RadarAction,
  on: boolean,
): RadarLegend {
  return { lines, boxed: on, label, action, pressed: on };
}

const DECLUTTER_LEGENDS = ["DCLTR", "DCLTR 1", "DCLTR 2"] as const;

/** PB10: ACTIVE replaces the target aging (and the empty main-level slot) while the radar is silent. */
function activeLegend(state: RadarState): RadarLegend | undefined {
  return state.silent
    ? legend(["ACTIVE"], "Active: scan one frame", { type: "active" })
    : undefined;
}

/** `add_PB16_DATA_label`: boxed on the DATA sublevel. */
function dataLegend(state: RadarState): RadarLegend {
  return toggle(
    [" DATA "],
    "Data",
    { type: "toggleData" },
    state.sublevel === "DATA",
  );
}

function mainPanel(state: RadarState): RadarPanel {
  const { scan, mode } = state;
  const tws = mode === "TWS";
  const panel: RadarPanel = {
    1: legend([], `Pulse repetition frequency, ${scan.prf}`, {
      type: "cyclePrf",
    }),
    5: legend([], `Radar mode, ${mode}`, { type: "toggleMode" }),
    6: legend([`${scan.bars}B`], `Elevation bars, ${scan.bars}B`, {
      type: "cycleBars",
    }),
    7: toggle([" SIL "], "Silent", { type: "toggleSilent" }, state.silent),
    10: activeLegend(state),
    14: legend(
      ["RSET"],
      "Reset scan settings",
      { type: "reset" },
      state.resetBoxed,
    ),
    15: toggle(
      ["NCTR"],
      "Target recognition",
      { type: "toggle", option: "nctr" },
      state.nctr,
    ),
    16: dataLegend(state),
    19: legend([`${scan.azimuth}°`], `Azimuth scan, ${scan.azimuth}°`, {
      type: "cycleAzimuth",
    }),
  };
  // "When at maximum range, the increment arrow is no longer displayed" (guide, RWS items 9 and 10).
  if (scan.range !== RANGE_SCALES[RANGE_SCALES.length - 1]) {
    panel[11] = legend([], "Increase range scale", {
      type: "stepRange",
      step: 1,
    });
  }
  if (scan.range !== RANGE_SCALES[0]) {
    panel[12] = legend([], "Decrease range scale", {
      type: "stepRange",
      step: -1,
    });
  }
  if (tws) {
    panel[8] = toggle(
      ["HITS"],
      "Raw hits",
      { type: "toggle", option: "hits" },
      state.hits,
    );
    panel[9] = legend(["RAID"], "Scan raid", null);
    panel[13] = legend([], `Scan centring, ${state.centring}`, {
      type: "toggleCentring",
    });
    panel[20] = legend(["EXP"], "Expand", null);
  } else {
    panel[2] = legend([], "Radar priority", null);
    panel[8] = legend(["ERASE"], "Erase", { type: "erase" });
    panel[13] = legend(
      ["SET"],
      "Save scan settings",
      { type: "set" },
      state.setBoxed,
    );
    panel[17] = legend(["CHAN"], "Channel", null);
    panel[20] = legend(["MODE"], "Mode", null);
  }
  return panel;
}

function dataPanel(state: RadarState): RadarPanel {
  const panel: RadarPanel = {
    1: legend(["LDF"], "Low duty factor", null),
    2: legend([state.speedGate], `Speed gate, ${state.speedGate}`, {
      type: "toggleSpeedGate",
    }),
    4: legend(["ECCM"], "Electronic counter-countermeasures", null),
    10:
      activeLegend(state) ??
      legend(
        [String(state.scan.aging)],
        `Target aging, ${state.scan.aging} seconds`,
        { type: "cycleAging" },
      ),
    12: toggle(
      [],
      "One-look raid",
      { type: "toggle", option: "oneLookRaid" },
      state.oneLookRaid,
    ),
    13: toggle(
      ["COLOR"],
      "Colour",
      { type: "toggle", option: "color" },
      state.color,
    ),
    14: toggle(
      ["MSI"],
      "Multi-sensor integration",
      { type: "toggle", option: "msi" },
      state.msi,
    ),
    16: dataLegend(state),
    17: legend(
      [DECLUTTER_LEGENDS[state.declutter]],
      `Declutter, ${["off", "level 1", "level 2"][state.declutter]}`,
      { type: "cycleDeclutter" },
      state.declutter > 0,
    ),
    19: toggle(
      ["BRA"],
      "Bearing and range to the cursor",
      { type: "toggle", option: "bra" },
      state.bra,
    ),
  };
  // "LTWS is only available when the radar is in RWS mode" (guide, LTWS).
  if (state.mode === "RWS") {
    panel[15] = toggle(
      ["LTWS"],
      "Latent track while scan",
      { type: "toggle", option: "ltws" },
      state.ltws,
    );
  }
  return panel;
}

/** Every OSB's legend in `state`. An OSB missing from the panel is blank. */
export function radarPanel(state: RadarState): RadarPanel {
  return state.sublevel === "DATA" ? dataPanel(state) : mainPanel(state);
}
