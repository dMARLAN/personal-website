import type { LegendSpec } from "../frame/types";
import { MENU_LABELS, MENU_PB, PAGES } from "./registry";

/** PB18 `MENU` on a section or showcase page: it opens `/`, which shows TAC (design section 9.4). */
export const MENU_LEGEND: LegendSpec = {
  pb: MENU_PB,
  lines: ["MENU"],
  label: MENU_LABELS.TAC,
  action: { kind: "link", href: PAGES.menu.path },
};
