import { MenuTitle } from "../primitives/MenuTitle";
import type { DdiScreens } from "../frame/types";
import { MENU_NAMES, menuLegends } from "./registry";

/**
 * TAC and SUPT, the two in-section states of `/ddi`: each has an empty body, its boxed title at (0, −446) and legends
 * from the registry (design sections 9.3 and 9.4). The page opens on TAC.
 */
export function menuScreens(): DdiScreens {
  return {
    initial: "TAC",
    screens: Object.fromEntries(
      MENU_NAMES.map((menu) => [
        menu,
        {
          legends: menuLegends(menu),
          symbology: null,
          edges: { bottom: <MenuTitle name={menu} boxed /> },
        },
      ]),
    ),
  };
}
