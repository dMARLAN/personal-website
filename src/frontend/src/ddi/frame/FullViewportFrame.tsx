import {
  BAND_BOTTOM,
  BAND_SIDE,
  BAND_TOP,
  COLORS,
  EDGE_STRIP_DEPTH,
  FRAME_MIN,
  GLASS_HALF,
  GLASS_SHORT,
  KNOB_DIAMETER,
  LIP_RING,
  OSB_CAP,
  OSB_CAP_RADIUS,
  OSB_PRESS_OFFSET,
  SCREEN_RADIUS,
  SELECTOR_PLATE,
  SELECTOR_STRIP,
  VIGNETTE,
} from "../constants";
import { ControlsIsland } from "../controls/ControlsIsland";
import { PBS, pbEdge, type Edge } from "../geometry";
import { EmissiveLayer } from "../primitives/EmissiveLayer";
import { PBLabel } from "../primitives/PBLabel";
import { Osb } from "./Osb";
import type { DdiScreen } from "./types";

const EDGES: readonly Edge[] = ["left", "top", "right", "bottom"];

/** Each edge strip keeps DCS coordinates unchanged: it is a slice of the square's viewBox (design section 4.3). */
const STRIP_VIEWBOX: Readonly<Record<Edge, string>> = {
  left: `${-GLASS_HALF} ${-GLASS_HALF} ${EDGE_STRIP_DEPTH} ${GLASS_SHORT}`,
  right: `${GLASS_HALF - EDGE_STRIP_DEPTH} ${-GLASS_HALF} ${EDGE_STRIP_DEPTH} ${GLASS_SHORT}`,
  top: `${-GLASS_HALF} ${-GLASS_HALF} ${GLASS_SHORT} ${EDGE_STRIP_DEPTH}`,
  bottom: `${-GLASS_HALF} ${GLASS_HALF - EDGE_STRIP_DEPTH} ${GLASS_SHORT} ${EDGE_STRIP_DEPTH}`,
};

/** Prose tiers: the square's box, or 1536 DI wide (design section 4.3). */
const PROSE_SQUARE_HALF = 512;
const PROSE_WIDE_HALF = 768;

/**
 * Every frame size in DI, as CSS custom properties. `--k` is pixels per DI: the one scale for the glass and the
 * bezel, so the layout scales uniformly and is never stretched (design section 4.1).
 */
const FRAME_STYLE: React.CSSProperties = {
  "--k": `min(calc(100vw / ${FRAME_MIN.width}), calc(100dvh / ${FRAME_MIN.height}))`,
  "--band-top": BAND_TOP,
  "--band-side": BAND_SIDE,
  "--band-bottom": BAND_BOTTOM,
  "--selector-strip": SELECTOR_STRIP,
  "--screen-offset": (BAND_TOP - BAND_BOTTOM) / 2,
  "--glass": GLASS_SHORT,
  "--screen-radius": SCREEN_RADIUS,
  "--strip": EDGE_STRIP_DEPTH,
  "--prose-square": 2 * PROSE_SQUARE_HALF,
  "--prose-wide": 2 * PROSE_WIDE_HALF,
  "--lip": LIP_RING,
  "--cap": OSB_CAP,
  "--cap-radius": OSB_CAP_RADIUS,
  "--press": OSB_PRESS_OFFSET,
  "--knob": KNOB_DIAMETER,
  "--selector-width": SELECTOR_PLATE.width,
  "--selector-height": SELECTOR_PLATE.height,
  "--vignette-blur": VIGNETTE.blur,
  "--vignette-spread": VIGNETTE.spread,
  "--color-screen": COLORS.screenTint,
  "--color-screen-edge": COLORS.screenEdge,
  "--color-face": COLORS.face,
  "--color-face-top": COLORS.faceTop,
  "--color-face-bottom": COLORS.faceBottom,
  "--color-cap": COLORS.osbCap,
  "--color-cap-pressed": COLORS.osbCapPressed,
  "--color-lip": COLORS.lipRing,
  "--color-knob": COLORS.knob,
  "--color-placard": COLORS.placard,
};

/**
 * The DDI filling the viewport (design section 4). The glass's short side is always 1089.6 DI; the long side takes
 * the rest. Every region is positioned by CSS alone, so nothing is measured and nothing flashes on hydration.
 */
export function FullViewportFrame({
  screen,
}: {
  screen: DdiScreen;
}): React.JSX.Element {
  const legends = new Map(screen.legends.map((legend) => [legend.pb, legend]));
  return (
    <div className="ddi-frame" style={FRAME_STYLE}>
      <div className="ddi-screen" aria-hidden="true">
        <div className="ddi-emissive">
          <svg
            className="ddi-square"
            viewBox={`${-GLASS_HALF} ${-GLASS_HALF} ${GLASS_SHORT} ${GLASS_SHORT}`}
          >
            <EmissiveLayer id="ddi-square">{screen.symbology}</EmissiveLayer>
          </svg>
          {EDGES.map((edge) => (
            <svg
              key={edge}
              className={`ddi-strip ddi-strip-${edge}`}
              viewBox={STRIP_VIEWBOX[edge]}
            >
              <EmissiveLayer id={`ddi-edge-${edge}`}>
                {screen.legends
                  .filter((legend) => pbEdge(legend.pb) === edge)
                  .map((legend) => (
                    <PBLabel
                      key={legend.pb}
                      pb={legend.pb}
                      lines={legend.lines}
                      boxed={legend.boxed}
                    />
                  ))}
                {screen.edges?.[edge]}
              </EmissiveLayer>
            </svg>
          ))}
          {screen.prose && (
            <>
              <svg
                className="ddi-prose ddi-prose-square"
                viewBox={`${-PROSE_SQUARE_HALF} ${-GLASS_HALF} ${2 * PROSE_SQUARE_HALF} ${GLASS_SHORT}`}
              >
                <EmissiveLayer id="ddi-prose-square">
                  {screen.prose.square}
                </EmissiveLayer>
              </svg>
              <svg
                className="ddi-prose ddi-prose-wide"
                viewBox={`${-PROSE_WIDE_HALF} ${-GLASS_HALF} ${2 * PROSE_WIDE_HALF} ${GLASS_SHORT}`}
              >
                <EmissiveLayer id="ddi-prose-wide">
                  {screen.prose.wide}
                </EmissiveLayer>
              </svg>
            </>
          )}
        </div>
      </div>
      <nav className="ddi-osbs" aria-label="Display pushbuttons">
        {PBS.map((pb) => (
          <Osb key={pb} pb={pb} legend={legends.get(pb)} />
        ))}
      </nav>
      <ControlsIsland />
    </div>
  );
}
