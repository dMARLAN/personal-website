// Content schema (docs/design.md section 11). Rendering code imports from content/, never the other way round.
// Limits come from each format's geometry. Content-fit tests enforce them when each page ships.

export interface LabelValue {
  label: string;
  value: string;
}

/** About → TGT DATA OWNSHIP [pgB §11]. Limits are enforced by `ddi/pages/about.test.tsx`. */
export interface Profile {
  /** The `EMERG` slot above the box's top-left corner; ≤ 18 chars. */
  header: string;
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
  /** Committed in public/. */
  pdfPath: "/resume.pdf";
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
