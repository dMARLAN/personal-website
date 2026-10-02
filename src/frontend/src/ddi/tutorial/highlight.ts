import { PB_ROW_PITCH, pbAnchor, pbEdge, type Pb } from "../geometry";
import { menuLegends } from "../pages/registry";

/**
 * The OSB that the "press the buttons" callout marks (docs/design.md section 5.6): the leftmost top-row OSB with a
 * legend on TAC, so it is live on the menu. Its leader runs right along the band, then down into the glass, so the
 * label reads from the left edge of the row.
 */
function highlightedOsb(): Pb {
  const topRow = menuLegends("TAC")
    .map((legend) => legend.pb)
    .filter((pb) => pbEdge(pb) === "top");
  if (topRow.length === 0) {
    throw new Error("The tutorial needs a top-row legend on the TAC menu");
  }
  // PB6 to PB10 run left to right.
  return topRow.reduce((leftmost, pb) => (pb < leftmost ? pb : leftmost));
}

export const TUTORIAL_OSB: Pb = highlightedOsb();

/** The x of the OSB's centre, and of its leader's drop: midway to the next row position on its right, between legends. */
export const TUTORIAL_OSB_X = pbAnchor(TUTORIAL_OSB)[0];
export const TUTORIAL_OSB_RISER_X = TUTORIAL_OSB_X + PB_ROW_PITCH / 2;
