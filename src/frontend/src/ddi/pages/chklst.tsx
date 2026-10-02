import type { Checklist } from "@/content/types";
import { ChecklistFormat } from "../formats/checklist";
import type { DdiScreens } from "../frame/types";
import { MENU_LEGEND } from "./menuLegend";

/** /chklst: the real CHKLST format with a playful pre-flight checklist. DCS gives it no legends but MENU. */
export function chklstScreens(checklist: Checklist): DdiScreens {
  return {
    initial: "CHKLST",
    screens: {
      CHKLST: {
        legends: [MENU_LEGEND],
        symbology: <ChecklistFormat {...checklist} />,
      },
    },
  };
}
