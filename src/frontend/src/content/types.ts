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

/** /server → ENG [pgA §2]; fake data. */
export interface ServerStats {
  /** Headers at (∓250, 413), ≤ 9. */
  hosts: [string, string];
  /** Exactly 13 rows; label ≤ 10, values ≤ 6. */
  rows: { label: string; left: string; right: string }[];
}
