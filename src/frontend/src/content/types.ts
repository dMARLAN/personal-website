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
}
