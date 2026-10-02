import { existsSync } from "node:fs";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/lib/site";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { measure, pbEdge } from "../geometry";
import {
  LEGEND_FONT,
  legendBounds,
  menuTitleBox,
  pbLabelLayout,
} from "../frame/legend";
import type { Rect } from "../geometry";
import type { LegendSpec } from "../frame/types";
import {
  ALL_PAGES,
  MENU_NAMES,
  MENU_PB,
  PAGES,
  menuLegends,
  type MenuName,
} from "./registry";

const MENUS = MENU_NAMES;
const APP_DIR = path.resolve(import.meta.dirname, "../../app");

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.left < b.right && b.left < a.right && a.bottom < b.top && b.bottom < a.top
  );
}

/** Every legend each menu will ever show, including pages that have not shipped. */
function fullMenu(menu: MenuName): ReturnType<typeof menuLegends> {
  return menuLegends(menu, ALL_PAGES);
}

describe("the page registry", () => {
  it("keys every page by its own id", () => {
    for (const [id, page] of Object.entries(PAGES)) {
      expect(page.id).toBe(id);
    }
  });

  it.each(MENUS)("gives no two legends on %s the same OSB", (menu) => {
    const pbs = fullMenu(menu).map((legend) => legend.pb);
    expect(new Set(pbs).size).toBe(pbs.length);
  });

  it.each(MENUS)(
    "keeps every %s legend clear of the others and of the title box",
    (menu) => {
      const inks = fullMenu(menu).map((legend) => ({
        pb: legend.pb,
        rects: legendBounds(
          pbLabelLayout(legend.pb, legend.lines, legend.boxed ?? false),
        ),
      }));
      inks.push({ pb: MENU_PB, rects: [menuTitleBox()] });
      inks.forEach((first, index) => {
        for (const second of inks.slice(index + 1)) {
          for (const a of first.rects) {
            for (const b of second.rects) {
              expect(overlaps(a, b), `PB${first.pb} and PB${second.pb}`).toBe(
                false,
              );
            }
          }
        }
      });
    },
  );

  it("fits every row legend within the 169 DI pitch", () => {
    for (const menu of MENUS) {
      for (const legend of fullMenu(menu)) {
        if (pbEdge(legend.pb) === "top" || pbEdge(legend.pb) === "bottom") {
          for (const line of legend.lines) {
            expect(measure(line, LEGEND_FONT).width).toBeLessThan(169);
          }
        }
      }
    }
  });

  it("has a page module for every available route", () => {
    for (const page of ALL_PAGES.filter((candidate) => candidate.available)) {
      expect(
        existsSync(path.join(APP_DIR, page.path, "page.tsx")),
        page.path,
      ).toBe(true);
    }
  });

  it("shows only shipped pages' legends, plus MENU at PB18", () => {
    for (const menu of MENUS) {
      const shipped = ALL_PAGES.flatMap((page) =>
        page.available && page.menu?.on === menu
          ? [[page.menu.pb, page.menu.legend]]
          : [],
      );
      expect(menuLegends(menu).map(({ pb, lines }) => [pb, lines])).toEqual([
        ...shipped,
        [MENU_PB, ["MENU"]],
      ]);
    }
  });

  it("shows each shipped TAC section and SUPT showcase at its PB", () => {
    const supt = menuLegends("SUPT").map(({ pb, lines, action }) => [
      pb,
      lines,
      action,
    ]);
    expect(supt).toContainEqual([8, ["BIT"], { kind: "link", href: "/bit" }]);
    expect(supt).toContainEqual([
      11,
      ["CHKLST"],
      { kind: "link", href: "/chklst" },
    ]);
    expect(supt).toContainEqual([15, ["FCS"], { kind: "link", href: "/fcs" }]);
    expect(supt).toContainEqual([
      20,
      ["FUEL"],
      { kind: "link", href: "/fuel" },
    ]);
    const legends = menuLegends("TAC").map(({ pb, lines, action }) => [
      pb,
      lines,
      action,
    ]);
    expect(legends).toContainEqual([
      5,
      ["PROJECTS"],
      { kind: "link", href: "/projects" },
    ]);
    expect(legends).toContainEqual([
      6,
      ["RESUME"],
      { kind: "link", href: "/resume" },
    ]);
    expect(legends).toContainEqual([
      7,
      ["WORK"],
      { kind: "link", href: "/work" },
    ]);
    expect(legends).toContainEqual([
      8,
      ["CONTACT"],
      { kind: "link", href: "/contact" },
    ]);
    expect(legends).toContainEqual([
      9,
      ["LINKS"],
      { kind: "link", href: "/links" },
    ]);
    expect(legends).toContainEqual([
      20,
      ["ABOUT"],
      { kind: "link", href: "/about" },
    ]);
  });

  it("toggles TAC and SUPT in place with PB18: in-section state, not a URL", () => {
    const menuLegend = (menu: MenuName): LegendSpec => {
      const legend = menuLegends(menu).find(({ pb }) => pb === MENU_PB);
      if (legend === undefined) {
        throw new Error(`${menu} has no PB18 legend`);
      }
      return legend;
    };
    const [tacMenu, suptMenu] = [menuLegend("TAC"), menuLegend("SUPT")];
    expect(tacMenu.action).toEqual({ kind: "state", state: "SUPT" });
    expect(suptMenu.action).toEqual({ kind: "state", state: "TAC" });
    expect([tacMenu.label, suptMenu.label]).toEqual([
      "Support menu",
      "Tactical menu",
    ]);
  });

  it("serves both menus from one URL, /", () => {
    const menuRoutes = ALL_PAGES.filter((page) => page.kind === "menu");
    expect(menuRoutes.map((page) => page.path)).toEqual(["/"]);
    expect(ALL_PAGES.some((page) => page.path === "/supt")).toBe(false);
  });

  it("lists / and the shipped pages in the sitemap: SUPT has no URL of its own", () => {
    expect(sitemap()).toEqual(
      ALL_PAGES.filter((page) => page.available).map((page) => ({
        url: new URL(page.path, SITE_URL).toString(),
      })),
    );
    const urls = sitemap().map(({ url }) => url);
    for (const route of [
      "/",
      "/about",
      "/projects",
      "/resume",
      "/work",
      "/contact",
      "/links",
      "/server",
      "/fcs",
      "/fuel",
      "/chklst",
      "/bit",
    ]) {
      expect(urls).toContain(`${SITE_URL}${route}`);
    }
    expect(urls).not.toContain(`${SITE_URL}/supt`);
  });
});
