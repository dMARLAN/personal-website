"use client";

import type { RadarScene } from "@/content/types";
import { useMemo } from "react";
import { useOsbPress } from "../../frame/Osb";
import {
  AcquisitionCursor,
  BraReadout,
  DISPLAY_AZIMUTH,
  ElevationBarNumber,
  IronCross,
  OneLookRaidLegend,
  PrfLegend,
  RDR_LEGEND_OFFSET,
  RadarModeText,
  RangeArrow,
  RangeScaleMax,
  RdrPriLegend,
  ScanCentringLegend,
  TACTICAL_HALF,
  TACTICAL_SIZE,
  TargetHeading,
  VelocityVector,
} from "../../formats/rdrAttk";
import { PBS, pbEdge, type Edge, type Pb, type Point } from "../../geometry";
import { PBLabel } from "../../primitives/PBLabel";
import { radarPanel, type RadarPanel } from "./legends";
import { radarModel } from "./RadarScope";
import type { RadarState } from "./settings";
import { contactCourse, scanAltitudeLimits, scanPattern } from "./sim";
import {
  pressRadar,
  radarStore,
  scanReadoutStore,
  trackFilesStore,
  useStore,
} from "./store";

/**
 * One radar OSB. Its legend and action follow the radar state (`radarPanel`): a working legend fires on press like
 * every OSB (design section 5.1) through the shared `useOsbPress`; an inert one is `aria-disabled`; an OSB with no
 * legend in this state is blank. A toggle reports its state with `aria-pressed`.
 */
export function RadarOsb({ pb }: { pb: Pb }): React.JSX.Element {
  const legend = radarPanel(useStore(radarStore))[pb];
  // A button has no native action, so a click with no press before it must fire too.
  const { pressed, handlers } = useOsbPress(() => {
    if (legend?.action) {
      pressRadar(legend.action);
    }
  }, true);
  if (legend === undefined) {
    return (
      <button
        type="button"
        className="ddi-osb"
        tabIndex={-1}
        aria-hidden="true"
        data-radar-pb={pb}
      />
    );
  }
  if (legend.action === null) {
    return (
      <button
        type="button"
        className="ddi-osb"
        tabIndex={-1}
        aria-disabled="true"
        data-radar-pb={pb}
      >
        <span className="ddi-osb-label">{legend.label}</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className="ddi-osb"
      data-action="state"
      data-radar-pb={pb}
      data-pressed={pressed || undefined}
      aria-pressed={legend.pressed}
      {...handlers}
    >
      <span className="ddi-osb-label">{legend.label}</span>
    </button>
  );
}

/** The legends the format draws itself on `edge`, rather than through `add_PB_label_RDR`. */
function FormatLegends({
  edge,
  state,
  panel,
}: {
  edge: Edge;
  state: RadarState;
  panel: RadarPanel;
}): React.ReactNode {
  const main = state.sublevel === "MAIN";
  const readout = useStore(scanReadoutStore);
  switch (edge) {
    case "left":
      return (
        <>
          <RadarModeText mode={state.mode} />
          {main && (
            <PrfLegend
              operating={state.scan.prf}
              instantaneous={state.scan.prf === "INTL" ? readout.prf : null}
            />
          )}
          {main && state.mode === "RWS" && <RdrPriLegend />}
        </>
      );
    case "top":
      return main && <ElevationBarNumber bar={readout.bar} />;
    case "right": {
      return main ? (
        <>
          {panel[11] && <RangeArrow step={1} />}
          {panel[12] && <RangeArrow step={-1} />}
          {state.mode === "TWS" && (
            <ScanCentringLegend centring={state.centring} />
          )}
        </>
      ) : (
        <OneLookRaidLegend boxed={state.oneLookRaid} />
      );
    }
    case "bottom":
      return null;
  }
}

/** The radar legends on one edge strip, redrawn when the radar state changes. */
export function RadarEdge({ edge }: { edge: Edge }): React.JSX.Element {
  const state = useStore(radarStore);
  const panel = radarPanel(state);
  return (
    <>
      {PBS.filter((pb) => pbEdge(pb) === edge).map((pb) => {
        const legend = panel[pb];
        return (
          legend !== undefined &&
          legend.lines.length > 0 && (
            <PBLabel
              key={pb}
              pb={pb}
              lines={legend.lines}
              boxed={legend.boxed}
              offset={RDR_LEGEND_OFFSET[edge]}
            />
          )
        );
      })}
      <FormatLegends edge={edge} state={state} panel={panel} />
    </>
  );
}

const DECLUTTER_TEXT = ["Off", "Level 1", "Level 2"] as const;

/** The current radar settings as text, for the semantic layer (design section 10.2). */
export function RadarSettings(): React.JSX.Element {
  const state = useStore(radarStore);
  const { scan } = state;
  return (
    <dl>
      <dt>Mode</dt>
      <dd>{state.mode}</dd>
      <dt>Elevation bars</dt>
      <dd>{scan.bars}</dd>
      <dt>Azimuth scan</dt>
      <dd>{scan.azimuth}°</dd>
      <dt>Range scale</dt>
      <dd>{scan.range} NM</dd>
      <dt>Pulse repetition frequency</dt>
      <dd>{scan.prf}</dd>
      <dt>Silent</dt>
      <dd>{state.silent ? "On" : "Off"}</dd>
      <dt>Target aging</dt>
      <dd>{scan.aging} seconds</dd>
      <dt>Declutter</dt>
      <dd>{DECLUTTER_TEXT[state.declutter]}</dd>
      {state.mode === "TWS" && (
        <>
          <dt>Scan centring</dt>
          <dd>{state.centring}</dd>
          <dt>Raw hits</dt>
          <dd>{state.hits ? "Shown" : "Hidden"}</dd>
        </>
      )}
    </dl>
  );
}

/** Where the cursor sits: range on the current scale and azimuth. */
function cursorPolar(
  cursor: Point,
  range: number,
): { range: number; azimuth: number } {
  return {
    range: ((cursor[1] + TACTICAL_HALF) / TACTICAL_SIZE) * range,
    azimuth: (cursor[0] / TACTICAL_HALF) * DISPLAY_AZIMUTH,
  };
}

/**
 * The static symbology the radar state changes: the range scale; the acquisition cursor with the scan altitude limits
 * at its range; the velocity vector and horizon (DCLTR removes them); the iron cross while silent; BRA; and the L&S
 * target heading in TWS.
 */
export function RadarReadouts({
  cursor,
  scene,
}: {
  cursor: Point;
  scene: RadarScene;
}): React.JSX.Element {
  const state = useStore(radarStore);
  const { centreElevation } = useStore(scanReadoutStore);
  const { ranks } = useStore(trackFilesStore);
  const model = useMemo(() => radarModel(scene), [scene]);
  const { ownship } = scene;
  const target = cursorPolar(cursor, state.scan.range);
  const { upper, lower } = scanAltitudeLimits(
    scanPattern(state.mode, state.scan, {
      azimuth: 0,
      elevation: centreElevation,
    }),
    ownship.altitude,
    target.range,
  );
  const lsIndex = ranks.indexOf(1);
  return (
    <>
      <RangeScaleMax range={state.scan.range} />
      <AcquisitionCursor pos={cursor} upper={upper} lower={lower} />
      {state.declutter === 0 && <VelocityVector />}
      {state.silent && <IronCross />}
      {state.bra && (
        <BraReadout
          bearing={(ownship.heading + target.azimuth + 360) % 360}
          range={target.range}
        />
      )}
      {state.mode === "TWS" && lsIndex !== -1 && state.declutter < 2 && (
        <TargetHeading
          heading={
            (ownship.heading +
              contactCourse(model.paths[lsIndex], model.ownSpeed) +
              360) %
            360
          }
        />
      )}
    </>
  );
}
