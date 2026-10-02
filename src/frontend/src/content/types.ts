// Content schema (docs/design.md section 11). Rendering code imports from content/, never the other way round.
// Limits come from each format's geometry. Content-fit tests enforce them when each page ships.

/** About → TGT DATA OWNSHIP [pgB §11]. */
export interface Profile {
  /** Shown at (−385, 410); ≤ 30 chars. */
  header: string;
  /** 5 rows at y 335…171; label ≤ 7 incl. ":", value ≤ 9. */
  status: { label: string; value: string }[];
  /** Stores quadrant, x = 43; 5 rows, ≤ 18 chars each. */
  list: string[];
  /** The fuel/gun line at y = −10; ≤ 19 chars. */
  footer: string;
  /** IFF quadrant, x = 35; 3 rows, ≤ 18 chars in total. */
  tags: { label: string; value: string }[];
  /** The empty bottom-left quadrant; wrapped to 9 rows × 18 chars. */
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

/** Projects → STORES [pgA §1]. At most 9 projects, one per station. */
export interface Project {
  slug: string;
  station: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  /** Station type text, F100, ≤ 6 (110-wide selection box). */
  code: string;
  /** Words from DCS Status_Set. */
  status: "RDY" | "STBY" | "SEL" | "DEGD";
  /** Top-row legend, ≤ 7; ≤ 5 categories. */
  category: string;
  /** PROG block: 5 rows × 2 columns; labels ≤ 6, values ≤ 6 / ≤ 15. */
  fields: { label: string; value: string }[];
  /** DATA sublevel: 8 rows × 47 chars at F100 (square tier). */
  description: string;
  url?: string;
}

/** Contact → MIDS status block: 4 rows; values ≤ 21. */
export interface ContactRow {
  label: string;
  value: string;
}

export interface Contact {
  rows: [ContactRow, ContactRow, ContactRow, ContactRow];
  email: string;
}

/** Links → UFC BU: ≤ 10 rows; name, handle ≤ 8. */
export interface LinkEntry {
  name: string;
  handle: string;
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
