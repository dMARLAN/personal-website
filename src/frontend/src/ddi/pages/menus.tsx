import { MenuTitle } from "../primitives/MenuTitle";
import type { DdiScreen } from "../frame/types";
import { menuLegends, type MenuName } from "./registry";

/** TAC and SUPT: an empty body, the boxed title at (0, −446) and legends from the registry (design section 9.3). */
export function menuScreen(menu: MenuName): DdiScreen {
  return {
    legends: menuLegends(menu),
    symbology: null,
    edges: { bottom: <MenuTitle name={menu} boxed /> },
  };
}
