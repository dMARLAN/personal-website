import { BAND, FRAME_SCALE_CSS } from "@/ddi/constants";

/** The DDI corner buttons' diameter: the theme toggle and the homepage link beside it. */
const CORNER_BUTTON_PX = 28;

/**
 * Sizes a DDI corner button and sets `--corner-inset`, which centres the theme toggle in the bezel's top-right corner
 * cell (`BAND` DI square) but keeps it at least 4px from the edges. theme.css places each button from it.
 */
export const CORNER_PLACEMENT: React.CSSProperties = {
  "--corner-inset": `max(4px, calc((${BAND} * ${FRAME_SCALE_CSS} - ${CORNER_BUTTON_PX}px) / 2))`,
  "--corner-button": `${CORNER_BUTTON_PX}px`,
  width: CORNER_BUTTON_PX,
  height: CORNER_BUTTON_PX,
};
