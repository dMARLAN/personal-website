import type { LegendSpec } from "../frame/types";
import type { Pb } from "../geometry";

export type PageId =
  | "menu"
  | "about"
  | "resume"
  | "work"
  | "projects"
  | "contact"
  | "links"
  | "radar"
  | "server";

/** The two menus. Both live at `/`: they are in-section state, not URLs (docs/design.md section 9.4). */
export const MENU_NAMES = ["TAC", "SUPT"] as const;
export type MenuName = (typeof MENU_NAMES)[number];

/** Each menu's accessible name: the label of the PB18 legend that switches to it. */
export const MENU_LABELS: Readonly<Record<MenuName, string>> = {
  TAC: "Tactical menu",
  SUPT: "Support menu",
};

export interface PageDef {
  id: PageId;
  /** The section's URL. In-section state (sublevels, STEP, PAGE) has none (docs/design.md section 9.4). */
  path: string;
  kind: "menu" | "section" | "showcase";
  /** The page's legend on a menu: lines outermost first, for example ["RDR", "ATTK"]. */
  menu?: { on: MenuName; pb: Pb; legend: readonly string[] };
  /** The accessible name of OSBs that open the page, and the page's `<h1>`. */
  label: string;
  /** False hides the menu legend until the page ships, as DCS hides unavailable formats (`FormatLabelShow`). */
  available: boolean;
}

/** The single source for routes, menus and the sitemap (docs/design.md sections 9.3 and 12). */
export const PAGES: Readonly<Record<PageId, PageDef>> = {
  menu: {
    id: "menu",
    path: "/",
    kind: "menu",
    label: "Menu",
    available: true,
  },
  about: {
    id: "about",
    path: "/about",
    kind: "section",
    menu: { on: "TAC", pb: 20, legend: ["ABOUT"] },
    label: "About",
    available: false,
  },
  resume: {
    id: "resume",
    path: "/resume",
    kind: "section",
    menu: { on: "TAC", pb: 6, legend: ["RESUME"] },
    label: "Resume",
    available: false,
  },
  work: {
    id: "work",
    path: "/work",
    kind: "section",
    menu: { on: "TAC", pb: 7, legend: ["WORK"] },
    label: "Work history",
    available: false,
  },
  projects: {
    id: "projects",
    path: "/projects",
    kind: "section",
    menu: { on: "TAC", pb: 5, legend: ["PROJECTS"] },
    label: "Projects",
    available: false,
  },
  contact: {
    id: "contact",
    path: "/contact",
    kind: "section",
    menu: { on: "TAC", pb: 8, legend: ["CONTACT"] },
    label: "Contact",
    available: false,
  },
  links: {
    id: "links",
    path: "/links",
    kind: "section",
    menu: { on: "TAC", pb: 9, legend: ["LINKS"] },
    label: "Links",
    available: false,
  },
  radar: {
    id: "radar",
    path: "/radar",
    kind: "showcase",
    menu: { on: "TAC", pb: 4, legend: ["RDR", "ATTK"] },
    label: "Radar, simulated",
    available: true,
  },
  server: {
    id: "server",
    path: "/server",
    kind: "showcase",
    menu: { on: "SUPT", pb: 12, legend: ["ENG"] },
    label: "Home server, simulated",
    available: false,
  },
};

export const ALL_PAGES: readonly PageDef[] = Object.values(PAGES);

/** PB18 is `MENU` on every page [fnd §5.5]. On the menu it toggles TAC and SUPT in place; elsewhere it opens `/` (TAC). */
export const MENU_PB: Pb = 18;

function linkLegend(
  page: PageDef,
  pb: Pb,
  lines: readonly string[],
): LegendSpec {
  return {
    pb,
    lines,
    label: page.label,
    action: { kind: "link", href: page.path },
  };
}

/** The pages a menu lists. Only available pages by default; tests pass every page to check the full layout. */
export function menuPages(
  menu: MenuName,
  pages: readonly PageDef[] = ALL_PAGES.filter((page) => page.available),
): PageDef[] {
  return pages.filter((page) => page.menu?.on === menu);
}

/**
 * A menu's legends: one link per page on this menu, and `MENU` at PB18, which switches to the other menu without
 * changing the URL (docs/design.md sections 9.3 and 9.4).
 */
export function menuLegends(
  menu: MenuName,
  pages?: readonly PageDef[],
): LegendSpec[] {
  const other: MenuName = menu === "TAC" ? "SUPT" : "TAC";
  return [
    ...menuPages(menu, pages).flatMap((page) =>
      page.menu ? [linkLegend(page, page.menu.pb, page.menu.legend)] : [],
    ),
    {
      pb: MENU_PB,
      lines: ["MENU"],
      label: MENU_LABELS[other],
      action: { kind: "state", state: other },
    },
  ];
}
