import type { Edge, Pb } from "../geometry";

/** What an OSB does when pressed (docs/design.md sections 5.1 and 12). */
export type LegendAction =
  | { kind: "link"; href: string }
  | { kind: "download"; href: string }
  | { kind: "external"; href: string }
  | { kind: "island"; render: React.ReactNode }
  /** Switches the page's in-section state, for example TAC to SUPT. The URL does not change (section 9.4). */
  | { kind: "state"; state: string }
  | { kind: "inert" };

/** One OSB: its legend on the glass and what pressing it does. */
export interface LegendSpec {
  pb: Pb;
  /** Legend lines, outermost first, as `add_PB_label` takes its arguments [fnd §5.3]. */
  lines: readonly string[];
  boxed?: boolean;
  /** The accessible name, for example "Support menu". */
  label: string;
  action: LegendAction;
}

/** Everything a page puts on the glass. All content is in DCS coordinates (DI, +y up). */
export interface DdiScreen {
  /** What each OSB shows and does. OSBs without a legend are blank. */
  legends: readonly LegendSpec[];
  /** Drawn in the symbology square. */
  symbology: React.ReactNode;
  /** PB-anchored content, drawn in the edge strip of that edge. */
  edges?: Partial<Record<Edge, React.ReactNode>>;
  /** Wrapped running text, pre-wrapped for each prose tier. */
  prose?: { square: React.ReactNode; wide: React.ReactNode };
}

/**
 * A page's screens, one per in-section state (docs/design.md section 9.4). The URL picks the page; local client state
 * picks the screen, starting at `initial`. A page without in-section state has one screen.
 */
export interface DdiScreens {
  initial: string;
  screens: Readonly<Record<string, DdiScreen>>;
}

/** A frame renders a page's screens with its bezel and controls. Pages never know which frame renders them. */
export type DdiFrame = (props: { screens: DdiScreens }) => React.ReactNode;
