import type { LegendSpec } from "../frame/types";
import type { Pb } from "../geometry";

export type PageId =
  | "tac"
  | "supt"
  | "about"
  | "resume"
  | "work"
  | "workEmployer"
  | "projects"
  | "projectData"
  | "contact"
  | "links"
  | "radar"
  | "server";

export type MenuName = "TAC" | "SUPT";

export interface PageDef {
  id: PageId;
  /** The route, for example "/work/[employer]". */
  path: string;
  kind: "menu" | "section" | "showcase";
  /** The page's legend on a menu: lines outermost first, for example ["RDR", "ATTK"]. */
  menu?: { on: MenuName; pb: Pb; legend: readonly string[] };
  /** The accessible name of OSBs that open the page, and the page's `<h1>`. */
  label: string;
  /** Used for the return legend. */
  parent?: PageId;
  /** False hides the menu legend until the page ships, as DCS hides unavailable formats (`FormatLabelShow`). */
  available: boolean;
}

/** The single source for routes, menus, the sitemap and parent links (docs/design.md sections 9.3 and 12). */
export const PAGES: Readonly<Record<PageId, PageDef>> = {
  tac: {
    id: "tac",
    path: "/",
    kind: "menu",
    label: "Tactical menu",
    available: true,
  },
  supt: {
    id: "supt",
    path: "/supt",
    kind: "menu",
    label: "Support menu",
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
  workEmployer: {
    id: "workEmployer",
    path: "/work/[employer]",
    kind: "section",
    label: "Employer",
    parent: "work",
    available: false,
  },
  projects: {
    id: "projects",
    path: "/projects/[slug]",
    kind: "section",
    menu: { on: "TAC", pb: 5, legend: ["PROJECTS"] },
    label: "Projects",
    available: false,
  },
  projectData: {
    id: "projectData",
    path: "/projects/[slug]/data",
    kind: "section",
    label: "Project details",
    parent: "projects",
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
    available: false,
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

export const MENU_PAGES: Readonly<Record<MenuName, PageDef>> = {
  TAC: PAGES.tac,
  SUPT: PAGES.supt,
};

export const ALL_PAGES: readonly PageDef[] = Object.values(PAGES);

/** PB18 is `MENU` on every page [fnd §5.5]. On a menu it toggles TAC and SUPT; elsewhere it opens TAC. */
export const MENU_PB: Pb = 18;

export function isStaticPath(path: string): boolean {
  return !path.includes("[");
}

/**
 * Where a link to `page` goes: its path, or for a dynamic route the static part before the first parameter
 * (`/projects/[slug]` → `/projects`, which redirects to the first project, design section 9.1).
 */
export function pageHref(page: PageDef): string {
  const dynamicStart = page.path.indexOf("/[");
  return dynamicStart === -1 ? page.path : page.path.slice(0, dynamicStart);
}

function linkLegend(
  page: PageDef,
  pb: Pb,
  lines: readonly string[],
): LegendSpec {
  return {
    pb,
    lines,
    label: page.label,
    action: { kind: "link", href: pageHref(page) },
  };
}

/**
 * A menu's legends: one per page on this menu, and `MENU` at PB18 to the other menu (docs/design.md section 9.3).
 * Only available pages get a legend by default; tests pass every page to check the full layout.
 */
export function menuLegends(
  menu: MenuName,
  pages: readonly PageDef[] = ALL_PAGES.filter((page) => page.available),
): LegendSpec[] {
  const other = menu === "TAC" ? MENU_PAGES.SUPT : MENU_PAGES.TAC;
  return [
    ...pages.flatMap((page) =>
      page.menu?.on === menu
        ? [linkLegend(page, page.menu.pb, page.menu.legend)]
        : [],
    ),
    linkLegend(other, MENU_PB, ["MENU"]),
  ];
}
