import { BAND, FRAME_SCALE_CSS } from "@/ddi/constants";

/** The DDI corner buttons' diameter: the theme toggle and the homepage link beside it. */
const CORNER_BUTTON_PX = 28;
/** The space between the theme toggle and the homepage link. */
const CORNER_GAP_PX = 8;

/**
 * The corner buttons' placement as custom properties. `--corner-inset` centres the theme toggle in the bezel's
 * top-right corner cell (`BAND` DI square) but keeps it at least 4px from the edges. theme.css places each button from
 * them, and the first-visit tutorial marks the buttons from the same values.
 */
export const CORNER_VARIABLES: React.CSSProperties = {
  "--corner-inset": `max(4px, calc((${BAND} * ${FRAME_SCALE_CSS} - ${CORNER_BUTTON_PX}px) / 2))`,
  "--corner-button": `${CORNER_BUTTON_PX}px`,
  "--corner-gap": `${CORNER_GAP_PX}px`,
};

/** Sizes a DDI corner button and sets its placement variables. */
export const CORNER_PLACEMENT: React.CSSProperties = {
  ...CORNER_VARIABLES,
  width: CORNER_BUTTON_PX,
  height: CORNER_BUTTON_PX,
};
