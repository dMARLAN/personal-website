// /bit → BIT FAILURES and its sublevels [pgB §3]: a showcase page with mock data. Each DCS equipment item becomes a
// programming check. The page module owns the real DCS structure (which item sits in which list row and on which
// OSB); this file only themes the items.
//
// PLACEHOLDER: playful mock checks and tool versions until Chad replaces them. No personal details.

/** `BIT_StatMsgs` [pgB §3], plus `NO TEST`, which only the STATUS MONITOR fuel-low rows use. */
export type BitStatus =
  | "IN TEST"
  | "RESTRT"
  | "SF TEST"
  | "OFF"
  | "NOT RDY"
  | "NO TEST"
  | "MUX FAIL"
  | "DEGD+OVRHT"
  | "OVRHT"
  | "DEGD"
  | "OP GO"
  | "GO"
  | "PBIT GO";

/** The DCS equipment items the BIT sublevels list (`EquipItems` in `BIT_defs.lua`), plus the two fuel-low rows. */
export type BitItemKey =
  | "MC1"
  | "MC2"
  | "FCSA"
  | "FCSB"
  | "RDR"
  | "FLIR"
  | "LTDR"
  | "SMS"
  | "AWW4"
  | "CLC"
  | "WPNS"
  | "CSC"
  | "ICS"
  | "IFF"
  | "D_L"
  | "COM1"
  | "COM2"
  | "MIDS"
  | "INS"
  | "ADC"
  | "ILS"
  | "RALT"
  | "TCN"
  | "AUG"
  | "BCN"
  | "GPS"
  | "LDDI"
  | "RDDI"
  | "MPCD"
  | "HUD"
  | "IFEI"
  | "DMS"
  | "HMD"
  | "SDC"
  | "MU"
  | "AISI"
  | "RWR"
  | "IBS"
  | "ALE_47"
  | "ASPJ"
  | "TK2FL"
  | "TK3FL";

export interface BitCheck {
  /** List name column, ≤ 9 characters, so a space separates it from the status. A check that also has an item legend is ≤ 7, so `"   NAME"` fits its strip. */
  name: string;
  /** The status before any test. */
  status: Exclude<BitStatus, "IN TEST">;
  /** The status a test resolves to, after `IN TEST`. */
  afterTest: Exclude<BitStatus, "IN TEST">;
}

/** Item legends that have no list row of their own, themed. Each is ≤ 7 characters. */
export type BitLegendKey = "FCS" | "UFC" | "DDI" | "DFIRS" | "FQTY" | "FXFR";

export interface SwConfigEntry {
  /** ≤ 6 characters, like the longest DCS name (`ALE-47`), so a gap separates it from the value. */
  name: string;
  /** ≤ 8 characters, the width of the DCS sample `XXXXXXXX`. */
  value: string;
}

export const BIT_CHECKS: Readonly<Record<BitItemKey, BitCheck>> = {
  // FCS-MC: the build pipeline.
  MC1: { name: "LINT", status: "GO", afterTest: "GO" },
  MC2: { name: "TYPECHECK", status: "GO", afterTest: "GO" },
  FCSA: { name: "UNIT TEST", status: "GO", afterTest: "GO" },
  FCSB: { name: "FLAKY E2E", status: "RESTRT", afterTest: "GO" },
  // SENSORS: observability.
  RDR: { name: "LOGS", status: "GO", afterTest: "GO" },
  FLIR: { name: "METRICS", status: "PBIT GO", afterTest: "GO" },
  LTDR: { name: "ALERTS", status: "OFF", afterTest: "GO" },
  // STORES: storage, and the one store nobody releases on a Friday.
  SMS: { name: "CACHE", status: "DEGD", afterTest: "GO" },
  AWW4: { name: "DB", status: "GO", afterTest: "GO" },
  CLC: { name: "BACKUPS", status: "NOT RDY", afterTest: "GO" },
  WPNS: { name: "FRI PROD", status: "NOT RDY", afterTest: "NOT RDY" },
  // COMM: talking to humans.
  CSC: { name: "SLACK", status: "GO", afterTest: "GO" },
  ICS: { name: "EMAIL", status: "DEGD", afterTest: "GO" },
  IFF: { name: "REVIEWS", status: "NOT RDY", afterTest: "GO" },
  D_L: { name: "STANDUP", status: "OVRHT", afterTest: "GO" },
  COM1: { name: "ZOOM", status: "RESTRT", afterTest: "GO" },
  COM2: { name: "PAGER", status: "OFF", afterTest: "GO" },
  MIDS: { name: "1:1", status: "GO", afterTest: "GO" },
  // NAV: finding your way. It's always DNS.
  INS: { name: "GIT", status: "GO", afterTest: "GO" },
  ADC: { name: "MERGE", status: "MUX FAIL", afterTest: "GO" },
  ILS: { name: "REBASE", status: "SF TEST", afterTest: "GO" },
  RALT: { name: "DNS", status: "DEGD", afterTest: "DEGD" },
  TCN: { name: "VPN", status: "NOT RDY", afterTest: "GO" },
  AUG: { name: "GREP", status: "PBIT GO", afterTest: "GO" },
  BCN: { name: "DOCS", status: "DEGD", afterTest: "GO" },
  GPS: { name: "ROUTER", status: "OP GO", afterTest: "GO" },
  // DISPLAYS: the frontend.
  LDDI: { name: "FLEXBOX", status: "GO", afterTest: "GO" },
  RDDI: { name: "GRID", status: "GO", afterTest: "GO" },
  MPCD: { name: "HTML", status: "GO", afterTest: "GO" },
  HUD: { name: "JS", status: "DEGD+OVRHT", afterTest: "GO" },
  IFEI: { name: "A11Y", status: "GO", afterTest: "GO" },
  DMS: { name: "THEME", status: "PBIT GO", afterTest: "GO" },
  HMD: { name: "HEADSET", status: "OFF", afterTest: "GO" },
  // STATUS MONITOR: the engineer.
  SDC: { name: "COFFEE", status: "NOT RDY", afterTest: "GO" },
  MU: { name: "SLEEP", status: "DEGD", afterTest: "DEGD" },
  AISI: { name: "DUCK", status: "GO", afterTest: "GO" },
  TK2FL: { name: "MUG 1", status: "NO TEST", afterTest: "NO TEST" },
  TK3FL: { name: "MUG 2", status: "GO", afterTest: "GO" },
  // EW: security.
  RWR: { name: "NPM AUDIT", status: "DEGD", afterTest: "DEGD" },
  IBS: { name: "2FA", status: "GO", afterTest: "GO" },
  ALE_47: { name: "TLS", status: "GO", afterTest: "GO" },
  ASPJ: { name: "SECRETS", status: "OP GO", afterTest: "GO" },
};

export const BIT_LEGEND_NAMES: Readonly<Record<BitLegendKey, string>> = {
  FCS: "TESTS",
  UFC: "KEYS",
  DDI: "CSS",
  DFIRS: "OUTAGES",
  FQTY: "MUGS",
  FXFR: "KETTLE",
};

/**
 * S/W CONFIGURATION: the site's own stack. The left column lists tools and versions; the right lists a role and the
 * tool that fills it. The left column keeps the DCS blank row (the ATARS slot) as `null`.
 * PLACEHOLDER: versions are a snapshot, not read from the lockfiles.
 */
export const SW_CONFIG: {
  left: readonly (SwConfigEntry | null)[];
  right: readonly SwConfigEntry[];
} = {
  left: [
    { name: "NODE", value: "24" },
    { name: "NEXT", value: "16.3.8" },
    { name: "REACT", value: "19.3.0" },
    null,
    { name: "TS", value: "6.0.3" },
    { name: "ESLINT", value: "9.39.5" },
    { name: "VITEST", value: "5.0.3" },
    { name: "PYTHON", value: "3.14" },
    { name: "RUFF", value: "0.16.10" },
    { name: "UV", value: "0.9" },
    { name: "DOCKER", value: "28" },
    { name: "GIT", value: "2.51" },
  ],
  right: [
    { name: "CSS", value: "TW 4.3.3" },
    { name: "E2E", value: "PW 1.63" },
    { name: "A11Y", value: "AXE 4.13" },
    { name: "API", value: "FASTAPI" },
    { name: "ASGI", value: "UVICORN" },
    { name: "TYPES", value: "PYRIGHT" },
    { name: "K8S", value: "KIND" },
    { name: "DEV", value: "TILT" },
    { name: "IDE", value: "PYCHARM" },
    { name: "OS", value: "WSL2" },
    { name: "SIM", value: "DCS 2.9" },
    { name: "FUEL", value: "COFFEE" },
  ],
};
