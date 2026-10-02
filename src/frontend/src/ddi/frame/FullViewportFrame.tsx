import {
  BAND,
  BLOOM_BLUR,
  EDGE_STRIP_DEPTH,
  FRAME_SCALE_CSS,
  GLASS_HALF,
  GLASS_SHORT,
  KNOB_ART,
  KNOB_DIAMETER,
  LIP_RING,
  OSB_CAP,
  OSB_CAP_RADIUS,
  OSB_ART,
  SCREEN_RADIUS,
  VIGNETTE,
} from "../constants";
import { ControlsIsland } from "../controls/ControlsIsland";
import { PBS, pbEdge, type Edge } from "../geometry";
import { EmissiveLayer } from "../primitives/EmissiveLayer";
import { PBLabel } from "../primitives/PBLabel";
import { Osb } from "./Osb";
import { ScreenStateProvider, ScreenStateSlot } from "./screenState";
import type { DdiScreen, DdiScreens } from "./types";

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
 * bezel, so the layout scales uniformly and is never stretched (design section 4.1). Colours are theme tokens in
 * `theme.css`, not here.
 */
const FRAME_STYLE: React.CSSProperties = {
  "--k": FRAME_SCALE_CSS,
  "--band": BAND,
  "--glass": GLASS_SHORT,
  "--screen-radius": SCREEN_RADIUS,
  "--strip": EDGE_STRIP_DEPTH,
  "--prose-square": 2 * PROSE_SQUARE_HALF,
  "--prose-wide": 2 * PROSE_WIDE_HALF,
  "--lip": LIP_RING,
  "--cap": OSB_CAP,
  "--cap-radius": OSB_CAP_RADIUS,
  // A cap is centred between the viewport edge and the lip ring, so it clears the ring by OSB_LIP_GAP.
  "--cap-centre": (BAND - LIP_RING) / 2,
  "--osb-art": OSB_ART,
  "--knob": KNOB_DIAMETER,
  "--knob-art": KNOB_ART,
  "--vignette-blur": VIGNETTE.blur,
  "--vignette-spread": VIGNETTE.spread,
};

/** Everything one screen draws on the glass: the square, the four edge strips and the prose layer. */
function EmissiveScreen({ screen }: { screen: DdiScreen }): React.JSX.Element {
  return (
    <>
      <svg
        className="ddi-square"
        viewBox={`${-GLASS_HALF} ${-GLASS_HALF} ${GLASS_SHORT} ${GLASS_SHORT}`}
      >
        <EmissiveLayer id="ddi-square">{screen.symbology}</EmissiveLayer>
        {screen.live && (
          <EmissiveLayer id="ddi-live" bloom={false}>
            {screen.live}
          </EmissiveLayer>
        )}
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
                  offset={legend.offset}
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
    </>
  );
}

function ScreenOsbs({ screen }: { screen: DdiScreen }): React.JSX.Element {
  const legends = new Map(screen.legends.map((legend) => [legend.pb, legend]));
  return (
    <>
      {PBS.map((pb) => (
        <Osb key={pb} pb={pb} legend={legends.get(pb)} />
      ))}
    </>
  );
}

/** Maps each in-section state to what `render` draws for its screen. */
function perState(
  { screens }: DdiScreens,
  render: (screen: DdiScreen) => React.ReactNode,
): Record<string, React.ReactNode> {
  return Object.fromEntries(
    Object.entries(screens).map(([state, screen]) => [state, render(screen)]),
  );
}

/**
 * The DDI filling the viewport (design section 4). The glass's short side is always 1089.6 DI; the long side takes
 * the rest. Every region is positioned by CSS alone, so nothing is measured and nothing flashes on hydration. Every
 * in-section state is server-rendered; the client shows the current one (section 9.4).
 */
export function FullViewportFrame({
  screens,
}: {
  screens: DdiScreens;
}): React.JSX.Element {
  return (
    <ScreenStateProvider initial={screens.initial}>
      <div className="ddi-frame" style={FRAME_STYLE}>
        <div className="ddi-screen" aria-hidden="true">
          <svg className="ddi-defs">
            {/* The optional bloom (section 6.3). The region covers every viewBox, in DI. */}
            <filter
              id="ddi-bloom"
              filterUnits="userSpaceOnUse"
              x={-PROSE_WIDE_HALF}
              y={-PROSE_WIDE_HALF}
              width={2 * PROSE_WIDE_HALF}
              height={2 * PROSE_WIDE_HALF}
            >
              <feGaussianBlur stdDeviation={BLOOM_BLUR} />
            </filter>
          </svg>
          <div className="ddi-emissive">
            <ScreenStateSlot
              states={perState(screens, (screen) => (
                <EmissiveScreen screen={screen} />
              ))}
            />
          </div>
        </div>
        <nav className="ddi-osbs" aria-label="Display pushbuttons">
          <ScreenStateSlot
            states={perState(screens, (screen) => (
              <ScreenOsbs screen={screen} />
            ))}
          />
        </nav>
        <ControlsIsland />
      </div>
    </ScreenStateProvider>
  );
}
