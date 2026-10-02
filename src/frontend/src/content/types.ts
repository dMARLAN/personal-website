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

/** Resume → S/W CONFIGURATION [pgB §3]. */
export interface Resume {
  /** 200 % at (0, 300); ≤ 24 chars per line. */
  title: [string, string];
  /** ≤ 12 rows; name ≤ 7, value ≤ 15. */
  left: { name: string; value: string }[];
  /** ≤ 12 rows; name ≤ 7, value ≤ 12. */
  right: { name: string; value: string }[];
  /** Committed in public/. */
  pdfPath: "/resume.pdf";
}

/** Work → BIT [pgB §3]. At most 8 employers (PB5→1, PB11→13). */
export interface Employer {
  /** URL slug. */
  id: string;
  /** Group-block label, ≤ 10 (200 DI rule). */
  short: string;
  /** Sublevel title, 200 %, ≤ 26. */
  name: string;
  /** Group-block status, for example "2021-2024", ≤ 10. */
  span: string;
  roles: Role[];
}

export interface Role {
  /** Sublevel item legend "   CODE", ≤ 6. */
  code: string;
  /** Main-list status column, ≤ 13. */
  title: string;
  /** Main-list name column, ≤ 10. */
  span: string;
  location: string;
  /** Prose; paged at 17 rows × 29 chars (square tier). */
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

/** /server → ENG [pgA §2]; fake data. */
export interface ServerStats {
  /** Headers at (∓250, 413), ≤ 9. */
  hosts: [string, string];
  /** Exactly 13 rows; label ≤ 10, values ≤ 6. */
  rows: { label: string; left: string; right: string }[];
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
