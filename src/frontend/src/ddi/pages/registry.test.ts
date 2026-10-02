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

  it("shows only shipped pages, plus MENU", () => {
    for (const menu of MENUS) {
      const shipped = ALL_PAGES.filter(
        (page) => page.available && page.menu?.on === menu,
      ).map((page) => [page.menu?.pb, page.menu?.legend]);
      expect(menuLegends(menu).map(({ pb, lines }) => [pb, lines])).toEqual([
        ...shipped,
        [18, ["MENU"]],
      ]);
    }
  });

  it("toggles TAC and SUPT in place with PB18: in-section state, not a URL", () => {
    const pb18 = (menu: MenuName): ReturnType<typeof menuLegends>[number] => {
      const legend = menuLegends(menu).find(({ pb }) => pb === MENU_PB);
      if (legend === undefined) {
        throw new Error(`${menu} has no PB18 legend`);
      }
      return legend;
    };
    const tacMenu = pb18("TAC");
    const suptMenu = pb18("SUPT");
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

  it("lists / and each shipped section in the sitemap: SUPT has no URL of its own", () => {
    const shipped = ALL_PAGES.filter((page) => page.available).map((page) => ({
      url: new URL(page.path, SITE_URL).toString(),
    }));
    expect(sitemap()).toEqual(shipped);
    expect(shipped).toContainEqual({ url: `${SITE_URL}/` });
  });
});
