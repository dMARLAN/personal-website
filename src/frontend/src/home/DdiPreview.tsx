import { BAND, GLASS_HALF, MENU_TITLE, OSB_CAP } from "@/ddi/constants";
import {
  LEGEND_FONT,
  MENU_TITLE_FONT,
  pbLabelLayout,
} from "@/ddi/frame/legend";
import { PBS, pbAnchor, pbEdge, type Pb, type Point } from "@/ddi/geometry";
import { menuLegends } from "@/ddi/pages/registry";
import { StrokeBox } from "@/ddi/primitives/StrokeBox";
import { StrokeText } from "@/ddi/primitives/StrokeText";

const BEZEL_HALF = GLASS_HALF + BAND;
const BAND_CENTRE = GLASS_HALF + BAND / 2;
const VIEW_HALF = BEZEL_HALF + 8;

/** An OSB cap's centre: the legend anchor pushed out to the middle of its bezel band. */
function capCentre(pb: Pb): Point {
  const [x, y] = pbAnchor(pb);
  switch (pbEdge(pb)) {
    case "left":
      return [-BAND_CENTRE, y];
    case "right":
      return [BAND_CENTRE, y];
    case "top":
      return [x, BAND_CENTRE];
    case "bottom":
      return [x, -BAND_CENTRE];
  }
}

/**
 * A small, static drawing of the DDI on its TAC menu, for the homepage's cockpit-mode card. The legends come from
 * the page registry and are drawn in the DCS stroke font, so the preview always matches the real menu. Decorative:
 * the card's link carries the meaning.
 */
export function DdiPreview(): React.JSX.Element {
  const legends = menuLegends("TAC").map((legend) =>
    pbLabelLayout(legend.pb, legend.lines, legend.boxed ?? false),
  );
  return (
    <svg
      className="ddi-preview"
      viewBox={`${-VIEW_HALF} ${-VIEW_HALF} ${2 * VIEW_HALF} ${2 * VIEW_HALF}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="ddi-preview-glass" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#0b0f0b" />
          <stop offset="100%" stopColor="#030403" />
        </radialGradient>
        <linearGradient id="ddi-preview-bezel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3c3a" />
          <stop offset="100%" stopColor="#232523" />
        </linearGradient>
        <g id="ddi-preview-symbology">
          {legends.flatMap(({ texts, boxes }) => [
            ...texts.map((text) => (
              <StrokeText
                key={`${text.pos.join()}-${text.text}`}
                text={text.text}
                font={LEGEND_FONT}
                align={text.align}
                pos={text.pos}
              />
            )),
            ...boxes.map((box) => (
              <StrokeBox
                key={`box-${box.pos.join()}`}
                w={box.width}
                h={box.height}
                align={box.align}
                pos={box.pos}
              />
            )),
          ])}
          <StrokeText
            text="TAC"
            font={MENU_TITLE_FONT}
            align="CenterCenter"
            pos={MENU_TITLE.pos}
          />
          <StrokeBox
            w={MENU_TITLE.box.width}
            h={MENU_TITLE.box.height}
            pos={MENU_TITLE.pos}
          />
        </g>
      </defs>
      <rect
        x={-BEZEL_HALF}
        y={-BEZEL_HALF}
        width={2 * BEZEL_HALF}
        height={2 * BEZEL_HALF}
        rx={44}
        fill="url(#ddi-preview-bezel)"
      />
      {PBS.map((pb) => {
        const [x, y] = capCentre(pb);
        return (
          <rect
            key={pb}
            className="ddi-preview-osb"
            x={x - OSB_CAP / 2}
            y={-y - OSB_CAP / 2}
            width={OSB_CAP}
            height={OSB_CAP}
            rx={6}
          />
        );
      })}
      <rect
        x={-GLASS_HALF}
        y={-GLASS_HALF}
        width={2 * GLASS_HALF}
        height={2 * GLASS_HALF}
        rx={18}
        fill="url(#ddi-preview-glass)"
        stroke="#0c0d0c"
        strokeWidth={8}
      />
      <use href="#ddi-preview-symbology" className="ddi-preview-halo" />
      <use href="#ddi-preview-symbology" className="ddi-preview-core" />
    </svg>
  );
}
