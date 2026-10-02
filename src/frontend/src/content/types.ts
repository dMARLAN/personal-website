// Content schema (docs/design.md section 11): the shapes rendering code reads. The API stores and validates the content
// (its Pydantic models are the source of truth); `adapt.ts` turns its generated types into these. Rendering code
// imports from content/, never the other way round. Limits come from each format's geometry. Content-fit tests
// enforce them against the seed snapshot, and the API enforces them on every save.

export interface LabelValue {
  label: string;
  value: string;
}

/**
 * About → TGT DATA OWNSHIP [pgB §11]. Limits are enforced by `ddi/pages/about.test.tsx`. The `EMERG` slot above the
 * box's top-left corner is the site name (`SITE_NAME`), so it is not content.
 */
export interface Profile {
  /** The `EXER` slot above the box's top-right corner; ≤ 18 chars. */
  badge: string;
  /** Status quadrant: 5 rows; label ≤ 7 incl. ":", value ≤ 9. */
  status: [LabelValue, LabelValue, LabelValue, LabelValue, LabelValue];
  /** Stores quadrant, the `X - XXXX` rows: 5 rows, ≤ 17 chars each. */
  loadout: [string, string, string, string, string];
  /** The fuel/gun line at y = −10; ≤ 19 chars. */
  footer: string;
  /** IFF quadrant: 3 rows; label, a space and value ≤ 18 chars. */
  tags: [LabelValue, LabelValue, LabelValue];
  /** The empty bottom-left quadrant; word-wrapped to ≤ 9 rows × 18 chars. */
  bio: string;
}

/** Resume → S/W CONFIGURATION [pgB §3]. Limits are tested in `ddi/pages/resume.test.tsx`. */
export interface Resume {
  /** 200 % at (0, 300); ≤ 24 chars per line. */
  title: [string, string];
  /** Skills, with the heading the semantic layer gives them. ≤ 12 rows; name ≤ 6, value ≤ 15. */
  left: { heading: string; rows: { name: string; value: string }[] };
  /** Qualifications, likewise. ≤ 12 rows; name ≤ 6, value ≤ 12. */
  right: { heading: string; rows: { name: string; value: string }[] };
}

/**
 * Work history → our tabbed layout (docs/pages/work.md). At most 5 employers, one per top-row OSB (PB6–10). Limits
 * are tested in `ddi/pages/work.test.tsx`.
 */
export interface Employer {
  /** Unique; names the employer's in-section state. */
  id: string;
  /** Top-row tab legend, ≤ 7 (the 169 DI OSB pitch). */
  tab: string;
  /** Header, 150 %, ≤ 30. */
  name: string;
  /** Under the header, left. */
  location: string;
  /** Under the header, right, for example "2019-2023". */
  span: string;
  /** Newest first; 1 to 4. */
  roles: Role[];
}

export interface Role {
  /** Role list, ≤ 27. */
  title: string;
  /** Role list, for example "2021-NOW"; ≤ 9. */
  span: string;
  /** Short highlights, word-wrapped to 38 chars. They fit under the role list: 14 rows when there are 4 roles. */
  bullets: string[];
}

/** Projects → STORES: one category per top-row OSB (PB6–10), in order. At most 5. */
export interface ProjectCategory {
  /** Top-row legend, ≤ 7 chars (169 DI pitch). */
  legend: string;
  /** The accessible name and semantic heading, for example "Web". */
  name: string;
}

/**
 * What a station carries, which picks its symbol [pgA §1.2]. `missile` is one `116-aim`, `pair` is two (a LAU-115
 * with 2 × AIM-9), `rack` is a BRU-33 `134-rhombus` with an amount, `tank` draws no symbol (like `FUEL`). Stations 1,
 * 4, 6 and 9 take only `missile`; station 5 takes only `rack` or `tank`.
 */
export type ProjectStore =
  | { kind: "missile" }
  | { kind: "pair" }
  /** `amount` is the number of parts the project ships as (services, packages), ≤ 2 digits. */
  | { kind: "rack"; amount: number }
  | { kind: "tank" };

/** Project health, as words from the DCS `Status_Set` (STORES.lua line 9). */
export type ProjectStatus = "RDY" | "STBY" | "DEGD" | "HUNG";

export interface ProjectField {
  label: string;
  value: string;
}

export interface ProjectLink {
  /** The DATA sublevel legend: `REPO` at PB16, `DEMO` at PB19. */
  kind: "REPO" | "DEMO";
  url: string;
}

/** Projects → STORES [pgA §1]. At most 9 projects, one per station. */
export interface Project {
  slug: string;
  station: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  /** The PROG title on the main page and the DATA title: ≤ 22 chars. */
  name: string;
  /** Station type text, F100, ≤ 6 (110-wide selection box). */
  code: string;
  store: ProjectStore;
  status: ProjectStatus;
  /** A `ProjectCategory.legend`. */
  category: string;
  /** PROG block: ≤ 5 rows per column. Left: label ≤ 7, value ≤ 7. Right: label ≤ 7, value ≤ 15. */
  fields: { left: ProjectField[]; right: ProjectField[] };
  /** DATA sublevel: wrapped to ≤ 7 rows × 47 chars at F100. */
  description: string;
  /** At most one of each kind. */
  links: ProjectLink[];
}

/**
 * Contact → MIDS status block [pgB §6]. The email fills the first row (label `EMAIL:`); `rows` fill the other three.
 * Each row (label, gap, value) is at most 46 chars. Limits are enforced by `ddi/pages/contact.test.tsx`.
 */
export interface Contact {
  email: string;
  rows: [LabelValue, LabelValue, LabelValue];
}

/** Links → UFC BU channel table [pgB §12]: ≤ 10 rows. Limits are enforced by `ddi/pages/links.test.tsx`. */
export interface LinkEntry {
  /** Name column, ≤ 8 chars. Written in normal case: the glass upper-cases it and the semantic layer keeps it. */
  name: string;
  /** Designation column, ≤ 6 chars, so it stays inside the 480 DI selection box. For example `CODE` or `PDF`. */
  tag: string;
  url: string;
}

/**
 * /server → ENG [pgA §2]: the two engine columns are two home-server hosts and the 13 engine rows are metrics. These
 * are the metric keys, top row first. A live stats API would return one number per key per host (`ServerSnapshot`).
 */
export const SERVER_METRICS = [
  "inletTemp",
  "cpu",
  "ram",
  "cpuTemp",
  "power",
  "fan",
  "memPressure",
  "throughput",
  "jitter",
  "diskTemp",
  "loadAvg",
  "disk",
  "uptime",
] as const;

export type ServerMetric = (typeof SERVER_METRICS)[number];

/** One host's readings: a number per metric, in that row's unit. */
export type HostReadings = Readonly<Record<ServerMetric, number>>;

/** Both hosts' readings at one moment, left host first. The shape a live stats API would return. */
export interface ServerSnapshot {
  hosts: readonly [HostReadings, HostReadings];
}

export interface ServerHost {
  /** Column header at (∓250, 413), in place of `LEFT EPE` / `RIGHT EPE`; ≤ 9 chars. */
  header: string;
  /** The semantic layer's name for the host. */
  name: string;
}

/** One ENG row: a server metric in place of an engine parameter. */
export interface ServerRow {
  metric: ServerMetric;
  /** Centre label, F150; ≤ 10 chars, the width of `INLET TEMP`. */
  label: string;
  /** The semantic layer's name, for example "CPU load". */
  name: string;
  /** The semantic layer's unit, for example "%". Empty for a bare number. */
  unit: string;
  /** Digits after the decimal point, on the glass and in the semantic layer. */
  decimals: number;
  /** Drawn right after the value on the glass, for example "D" for days. A value with its suffix is ≤ 6 chars. */
  suffix: string;
}

export interface ServerStats {
  hosts: readonly [ServerHost, ServerHost];
  /** Exactly one row per metric, in `SERVER_METRICS` order. */
  rows: readonly ServerRow[];
  /** What the server renders, and the centre the fake readings wander around. */
  baseline: ServerSnapshot;
}

/** /fcs → FCS [pgA §4]; fake data. A direction arrow beside a surface number. */
export type FcsArrow = "up" | "down" | "left" | "right";

export interface FcsSurfaceSide {
  /** ≤ 3 chars, right-aligned. */
  value: string;
  arrow: FcsArrow | null;
}

/** One row of the surface block: LEF, TEF, AIL, RUD and STAB in DCS order. */
export interface FcsSurface {
  /** ≤ 4 chars. */
  label: string;
  left: FcsSurfaceSide;
  right: FcsSurfaceSide;
}

/** One X in a channel table: that channel has failed. */
export interface FcsFailure {
  table: "left" | "right" | "bottom";
  /** Row from the top: 0–6 in the top tables, 0–10 in the bottom table. */
  row: number;
  channel: 1 | 2 | 3 | 4;
}

export interface FlightControls {
  /** Exactly 5 rows. */
  surfaces: FcsSurface[];
  /** The bottom-right table: exactly 11 rows. `label` ≤ 5 chars; `meaning` is for the semantic layer. */
  statusRows: { label: string; meaning: string }[];
  /** What channels 1–4 stand for, for the semantic layer. */
  channels: [string, string, string, string];
  failures: FcsFailure[];
  /** 200 % between "G-LIM" and "G"; ≤ 3 chars. */
  gLimit: string;
  /** L and R AOA values; ≤ 5 chars. */
  aoa: { left: string; right: string };
  /** The BLIN code slot at (−345, −190); ≤ 10 chars. */
  blinCode: string;
}

/** /fuel → FUEL [pgA §3]; fake "energy" reserves that move gently. */
export type FuelTankId =
  | "tk1"
  | "leftFeed"
  | "rightFeed"
  | "tk4"
  | "leftWing"
  | "rightWing"
  | "leftExternal"
  | "centreline"
  | "rightExternal";

/** How a tank's level moves, as a fraction of its capacity. */
export type FuelMotion =
  /** A slow sine: `level` at t = 0, ± `swing`. */
  | { kind: "wave"; level: number; swing: number; periodSeconds: number }
  /** Drains from full to `low` over the period, then refills at once. */
  | { kind: "drain"; low: number; periodSeconds: number };

export interface FuelTank {
  id: FuelTankId;
  /** F100 above the box; it must fit the box width. */
  label: string;
  /** The semantic layer's name, for example "Coffee". */
  name: string;
  /** Pounds when full; ≤ 4 digits. */
  capacity: number;
  motion: FuelMotion;
}

export interface FuelReserves {
  /** All nine tanks, each id once. */
  tanks: FuelTank[];
  /** Pounds; ≤ 4 digits. */
  bingo: number;
}

/** /chklst → CHKLST [pgB §2]. */
export interface ChecklistColumn {
  /** The heading: "LAND" or "T.O." in DCS. */
  title: string;
  /** What the heading means, for the semantic layer. */
  meaning: string;
  items: string[];
}

export interface Checklist {
  /** ≤ 6 items, ≤ 13 chars each, so they clear the right column. */
  left: ChecklistColumn;
  /** ≤ 9 items, ≤ 16 chars each. */
  right: ChecklistColumn;
  /** The A/C WT row: value at x = −79.5, ≤ 6 chars. */
  weight: { label: string; value: string };
  /** The MAX NZ row; DCS shows no value. */
  maxNz: string;
  /** The STAB POS row, for example " 1° NU". */
  stab: { label: string; left: string; right: string };
}

// /bit → BIT FAILURES and its sublevels [pgB §3]: a showcase page with mock data. Each DCS equipment item becomes a
// programming check. The page module owns the real DCS structure (which item sits in which list row and on which
// OSB); the content only themes the items.

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
export const BIT_ITEM_KEYS = [
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
  "ADC",
  "ILS",
  "RALT",
  "TCN",
  "AUG",
  "BCN",
  "GPS",
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
  "TK2FL",
  "TK3FL",
] as const;

export type BitItemKey = (typeof BIT_ITEM_KEYS)[number];

export interface BitCheck {
  /** List name column, ≤ 9 characters, so a space separates it from the status. A check that also has an item legend is ≤ 7, so `"   NAME"` fits its strip. */
  name: string;
  /** The status before any test. */
  status: Exclude<BitStatus, "IN TEST">;
  /** The status a test resolves to, after `IN TEST`. */
  afterTest: Exclude<BitStatus, "IN TEST">;
}

/** Item legends that have no list row of their own, themed. Each is ≤ 7 characters. */
export const BIT_LEGEND_KEYS = [
  "FCS",
  "UFC",
  "DDI",
  "DFIRS",
  "FQTY",
  "FXFR",
] as const;

export type BitLegendKey = (typeof BIT_LEGEND_KEYS)[number];

export interface SwConfigEntry {
  /** ≤ 6 characters, like the longest DCS name (`ALE-47`), so a gap separates it from the value. */
  name: string;
  /** ≤ 8 characters, the width of the DCS sample `XXXXXXXX`. */
  value: string;
}

export interface Bit {
  checks: Readonly<Record<BitItemKey, BitCheck>>;
  legendNames: Readonly<Record<BitLegendKey, string>>;
  /**
   * S/W CONFIGURATION: the site's own stack. The left column lists tools and versions; the right lists a role and the
   * tool that fills it. The left column keeps the DCS blank row (the ATARS slot) as `null`.
   */
  swConfig: {
    left: readonly (SwConfigEntry | null)[];
    right: readonly SwConfigEntry[];
  };
}

/** /radar → RDR ATTK in RWS; fake data (docs/pages/radar.md). */
export interface RadarScene {
  ownship: {
    /** Degrees magnetic, shown as `%03.0f°`. */
    heading: number;
    /** Knots calibrated, ≤ 3 digits. */
    airspeed: number;
    /** Shown as written, for example "0.90". */
    mach: string;
    /** Feet, 1000 to 99999. */
    altitude: number;
  };
  /** The priority A/A weapon and its count, ≤ 6 chars, for example "9X 2". */
  weapon: string;
  /** 3 to 6 contacts. */
  contacts: RadarContact[];
}

/** A contact at t = 0, moving in a straight line relative to our aircraft. */
export interface RadarContact {
  /** NM, within the 80 NM volume. */
  range: number;
  /** Degrees, right positive, within ±70. */
  azimuth: number;
  /** Speed relative to our aircraft, knots. */
  speed: number;
  /** Direction of that relative motion, degrees clockwise from our nose: 180 flies straight at us. */
  track: number;
  /** Feet. The contact flies level, so the elevation bars decide which scans see it. */
  altitude: number;
}

/** Projects → STORES: the top-row categories and the projects on the stations. */
export interface Projects {
  categories: readonly ProjectCategory[];
  projects: readonly Project[];
}

/** Every section, as the pages read it. `GET /api/content` serves it; `adapt.ts` shapes it. */
export interface SiteContent {
  profile: Profile;
  resume: Resume;
  employers: readonly Employer[];
  projects: Projects;
  contact: Contact;
  links: readonly LinkEntry[];
  server: ServerStats;
  fuel: FuelReserves;
  fcs: FlightControls;
  checklist: Checklist;
  bit: Bit;
  radar: RadarScene;
  mumi: MissionData;
}

/** One MUMI slot: the value on the glass and what it stands for, for the semantic layer. */
export interface MissionDataEntry {
  value: string;
  meaning: string;
}

/**
 * /mumi → MUMI; the site's deployment as fake mission data (docs/pages/mumi.md). Limits are `MUMI_LIMITS` in
 * `ddi/formats/mumi.tsx`.
 */
export interface MissionData {
  /** The memory unit: the home server the site is loaded from. ≤ 15 chars. */
  muId: MissionDataEntry;
  /** The MU ID after the load: the console the load opens. ≤ 15 chars. */
  loadedMuId: string;
  /** The two ID fields: the two images the cluster runs. ≤ 10 chars each. */
  idFields: readonly [MissionDataEntry, MissionDataEntry];
  /** MC (mission computer) is the site build; SMS (stores management) is the content database. ≤ 10 chars each. */
  mc: MissionDataEntry;
  sms: MissionDataEntry;
  /** The ERRORS list from the last load, ≤ 15 chars. A new load clears it. */
  errors: MissionDataEntry;
}
