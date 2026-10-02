import type { LegendSpec } from "../frame/types";
import { MENU_PB, PAGES } from "./registry";

/** PB18 `MENU` on a section page: it opens `/`, which shows TAC (docs/design.md section 9.4). */
export const RETURN_TO_MENU: LegendSpec = {
  pb: MENU_PB,
  lines: ["MENU"],
  label: PAGES.menu.label,
  action: { kind: "link", href: PAGES.menu.path },
};
