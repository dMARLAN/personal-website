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
