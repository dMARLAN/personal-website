import { CHECKLIST } from "@/content/checklist";
import { ChecklistFormat } from "../formats/checklist";
import type { DdiScreens } from "../frame/types";
import { menuLinkLegend } from "./registry";

/** /chklst: the real CHKLST format with a playful pre-flight checklist. DCS gives it no legends but MENU. */
export function chklstScreens(): DdiScreens {
  return {
    initial: "CHKLST",
    screens: {
      CHKLST: {
        legends: [menuLinkLegend()],
        symbology: <ChecklistFormat {...CHECKLIST} />,
      },
    },
  };
}
