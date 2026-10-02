import { RESUME_PDF_URL } from "@/content/resume";
import type { Resume } from "@/content/types";
import { SwConfig } from "../formats/swConfig";
import type { DdiScreens, LegendSpec } from "../frame/types";
import { MENU_LEGEND } from "./menuLegend";

/** PB20, `OVRD`'s position on S/W CONFIG [pgB §3]: the only action OSB the format has. */
export const RESUME_PDF_PB = 20;

export function resumeLegends(): LegendSpec[] {
  return [
    {
      pb: RESUME_PDF_PB,
      lines: ["PDF"],
      label: "Download the resume (PDF)",
      action: { kind: "download", href: RESUME_PDF_URL },
    },
    MENU_LEGEND,
  ];
}

/** Resume on S/W CONFIGURATION: one screen, no in-section state (docs/pages/resume.md). */
export function resumeScreens(resume: Resume): DdiScreens {
  return {
    initial: "main",
    screens: {
      main: {
        legends: resumeLegends(),
        symbology: (
          <SwConfig
            title={resume.title}
            left={resume.left.rows}
            right={resume.right.rows}
          />
        ),
      },
    },
  };
}
