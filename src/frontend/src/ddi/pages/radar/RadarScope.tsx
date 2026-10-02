"use client";

import type { RadarScene } from "@/content/types";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  DISPLAY_AZIMUTH,
  ELEVATION_DI_PER_DEGREE,
  ElevationCaret,
  RangeCaret,
  RawHit,
  SweepLine,
  TACTICAL_HALF,
  TrackSymbol,
  scopePoint,
} from "../../formats/rdrAttk";
import { formatNumber } from "../../geometry";
import type { RadarState } from "./settings";
import {
  antennaAt,
  closure,
  contactCourse,
  contactMach,
  contactPath,
  contactPosition,
  elevationAngle,
  eraseHits,
  hitIntensity,
  instantaneousPrf,
  rankedTracks,
  restartFrame,
  scanPattern,
  speedOfSound,
  startActiveFrame,
  stepScan,
  trackMemory,
  visibleHit,
  warmScan,
  type ContactPath,
  type ScanContext,
  type ScanPattern,
  type ScanState,
} from "./sim";
import {
  radarStore,
  resetRadarState,
  scanReadoutStore,
  trackFilesStore,
  useStore,
  type ScanReadout,
  type TrackFiles,
} from "./store";

/** The DCS device update rate: 20 Hz [bzl §1]. */
export const FRAME_INTERVAL_MS = 50;
/** (ours) The most sim time one frame may advance, so a stalled tab resumes where it stopped instead of jumping. */
const MAX_FRAME_STEP_MS = 100;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
/** (ours) TWS raw hits are "rendered at a lower intensity than the trackfiles" (guide, TWS HITS option). */
const TWS_HIT_INTENSITY = 0.5;

/** SVG transform for a DCS-coordinate offset (SVG is y-down). */
function translate(x: number, y: number): string {
  return `translate(${formatNumber(x)} ${formatNumber(-y)})`;
}

/** The contacts and our own aircraft, fixed for the page's lifetime. */
export interface RadarModel {
  paths: readonly ContactPath[];
  /** Feet. */
  ownAltitude: number;
  /** Our true airspeed, knots. */
  ownSpeed: number;
}

export function radarModel(scene: RadarScene): RadarModel {
  const { altitude, mach } = scene.ownship;
  return {
    paths: scene.contacts.map(contactPath),
    ownAltitude: altitude,
    ownSpeed: Number(mach) * speedOfSound(altitude),
  };
}

/** The scan pattern, the context to step it with, the trackfiles and their memory, for a radar state. */
export function scanSetup(
  state: RadarState,
  scan: ScanState,
  model: RadarModel,
): { pattern: ScanPattern; context: ScanContext; ranks: number[] } {
  const memory = trackMemory(scanPattern(state.mode, state.scan));
  const ranks = rankedTracks(scan, model.paths, memory);
  // TWS AUTO: "The azimuth and elevation TWS scan is centered on the L&S trackfiles" (guide, TWS).
  const lsIndex = ranks.at(0);
  let centre = { azimuth: 0, elevation: 0 };
  if (
    state.mode === "TWS" &&
    state.centring === "AUTO" &&
    lsIndex !== undefined
  ) {
    const ls = contactPosition(model.paths[lsIndex], scan.time);
    centre = {
      azimuth: ls.azimuth,
      elevation: elevationAngle(
        ls.range,
        model.paths[lsIndex].altitude,
        model.ownAltitude,
      ),
    };
  }
  const pattern = scanPattern(state.mode, state.scan, centre);
  return {
    pattern,
    ranks,
    context: {
      paths: model.paths,
      pattern,
      prf: state.scan.prf,
      silent: state.silent,
      ownAltitude: model.ownAltitude,
    },
  };
}

/** The scan the server renders at t = 0: the opening settings, already running long enough to show aged hits. */
export function initialScan(state: RadarState, model: RadarModel): ScanState {
  const empty: ScanState = {
    time: 0,
    scanTime: 0,
    activeUntil: 0,
    hits: model.paths.map(() => null),
    seen: model.paths.map(() => null),
  };
  const { pattern, context } = scanSetup(state, empty, model);
  return warmScan(context, Math.max(state.scan.aging, trackMemory(pattern)));
}

interface Placement {
  transform: string;
  opacity: string;
  visible: boolean;
}

const HIDDEN: Placement = { transform: "", opacity: "0", visible: false };

export interface ScopeFrame {
  sweep: string;
  caret: string;
  readout: ScanReadout;
  hits: Placement[];
  tracks: Placement[];
  rangeCaret: Placement;
  trackFiles: TrackFiles;
}

/** What the scope shows for a scan state, under the radar settings. */
export function scopeFrame(
  state: RadarState,
  scan: ScanState,
  model: RadarModel,
): ScopeFrame {
  const { pattern, ranks } = scanSetup(state, scan, model);
  const antenna = antennaAt(pattern, scan.scanTime);
  const range = state.scan.range;
  const tws = state.mode === "TWS";
  const hits = model.paths.map((_, index): Placement => {
    const hit = visibleHit(scan, index, state.scan.aging);
    if (hit === null || hit.range > range || (tws && !state.hits)) {
      return HIDDEN;
    }
    const [x, y] = scopePoint(hit.range, hit.azimuth, range);
    const intensity = hitIntensity(hit.age, state.scan.aging);
    return {
      transform: translate(x, y),
      opacity: formatNumber(tws ? intensity * TWS_HIT_INTENSITY : intensity),
      visible: true,
    };
  });
  // "Trackfiles that are outside of the display will be clamped to the screen edge" (guide, TWS).
  const trackPoint = (index: number): [number, number] => {
    const position = contactPosition(model.paths[index], scan.time);
    const [x, y] = scopePoint(position.range, position.azimuth, range);
    return [x, Math.min(y, TACTICAL_HALF)];
  };
  const tracks = model.paths.map((_, index): Placement => {
    if (!tws || !ranks.includes(index)) {
      return HIDDEN;
    }
    return {
      transform: translate(...trackPoint(index)),
      opacity: "1",
      visible: true,
    };
  });
  const lsIndex = tws ? ranks.at(0) : undefined;
  const rangeCaret =
    lsIndex === undefined
      ? HIDDEN
      : {
          transform: translate(0, trackPoint(lsIndex)[1]),
          opacity: "1",
          visible: true,
        };
  return {
    sweep: translate((antenna.azimuth / DISPLAY_AZIMUTH) * TACTICAL_HALF, 0),
    caret: translate(0, antenna.elevation * ELEVATION_DI_PER_DEGREE),
    readout: {
      bar: antenna.bar,
      prf: instantaneousPrf(state.scan.prf, antenna.pass),
      centreElevation: Math.round(pattern.centre.elevation * 10) / 10,
    },
    hits,
    tracks,
    rangeCaret,
    trackFiles: {
      ranks: model.paths.map((_, index) =>
        tws && ranks.includes(index) ? ranks.indexOf(index) + 1 : null,
      ),
      closure:
        lsIndex === undefined
          ? null
          : Math.round(closure(model.paths[lsIndex], scan.time)),
    },
  };
}

/** The pattern change that restarts the frame: a new bar count, width or bar spacing. */
function patternKey(pattern: ScanPattern): string {
  return `${pattern.bars}/${pattern.width}/${pattern.spacing}`;
}

function setPlacement(element: SVGGElement | null, placement: Placement): void {
  if (element === null) {
    return;
  }
  element.setAttribute("transform", placement.transform);
  element.setAttribute("opacity", placement.opacity);
  element.setAttribute("visibility", placement.visible ? "visible" : "hidden");
}

/**
 * The animated layer (design section 12, Radar): the antenna sweep line, the elevation caret, the raw hits and, in
 * TWS, the trackfiles and the L&S range caret. The server renders the t = 0 frame. In the browser a
 * requestAnimationFrame loop steps the scan at 20 Hz and writes attributes through refs, so React never re-renders
 * per frame. It stops while the tab is hidden and never starts under reduced motion; OSB presses still redraw the
 * still frame.
 */
export function RadarScope({
  scene,
}: {
  scene: RadarScene;
}): React.JSX.Element {
  const state = useStore(radarStore);
  const trackFiles = useStore(trackFilesStore);
  const model = useMemo(() => radarModel(scene), [scene]);
  const initial = useMemo(() => {
    const scan = initialScan(radarStore.initial, model);
    return { scan, frame: scopeFrame(radarStore.initial, scan, model) };
  }, [model]);
  const trackLooks = useMemo(
    () =>
      model.paths.map((path) => ({
        course: contactCourse(path, model.ownSpeed),
        mach: contactMach(path, model.ownSpeed),
        altitude: path.altitude,
      })),
    [model],
  );
  const sweepRef = useRef<SVGGElement>(null);
  const caretRef = useRef<SVGGElement>(null);
  const rangeCaretRef = useRef<SVGGElement>(null);
  const hitRefs = useRef<(SVGGElement | null)[]>([]);
  const trackRefs = useRef<(SVGGElement | null)[]>([]);
  const scanRef = useRef(initial.scan);
  const handled = useRef({
    erasures: state.erasures,
    activeRequests: state.activeRequests,
    pattern: patternKey(scanSetup(state, initial.scan, model).pattern),
  });

  /** Applies the presses the scan has not seen yet, steps it `seconds` forward and draws it. */
  const advance = (seconds: number): void => {
    const current = radarStore.get();
    let scan = scanRef.current;
    if (current.erasures !== handled.current.erasures) {
      handled.current.erasures = current.erasures;
      scan = eraseHits(scan);
    }
    const { pattern, context } = scanSetup(current, scan, model);
    const key = patternKey(pattern);
    if (key !== handled.current.pattern) {
      handled.current.pattern = key;
      scan = restartFrame(scan);
    }
    if (current.activeRequests !== handled.current.activeRequests) {
      handled.current.activeRequests = current.activeRequests;
      scan = startActiveFrame(scan, pattern);
    }
    if (seconds > 0) {
      scan = stepScan(scan, seconds, context);
    }
    scanRef.current = scan;

    const frame = scopeFrame(current, scan, model);
    sweepRef.current?.setAttribute("transform", frame.sweep);
    caretRef.current?.setAttribute("transform", frame.caret);
    frame.hits.forEach((hit, index) =>
      setPlacement(hitRefs.current[index], hit),
    );
    frame.tracks.forEach((track, index) =>
      setPlacement(trackRefs.current[index], track),
    );
    setPlacement(rangeCaretRef.current, frame.rangeCaret);
    scanReadoutStore.set(frame.readout);
    trackFilesStore.set(frame.trackFiles);
  };
  const advanceRef = useRef(advance);

  // A press redraws at once, before paint, from the current scan, even when the loop is not running.
  useLayoutEffect(() => {
    advanceRef.current = advance;
    advance(0);
  });

  useEffect(() => {
    const reducedMotion = window.matchMedia(REDUCED_MOTION);
    let request = 0;
    let lastFrame: number | null = null;
    // Frames are due on a fixed 50 ms schedule, not 50 ms after the last one, so a 60 Hz display that lands a
    // frame just short of 50 ms still averages 20 Hz.
    let nextDue = 0;

    const tick = (now: number): void => {
      request = requestAnimationFrame(tick);
      if (lastFrame === null) {
        lastFrame = now;
        nextDue = now + FRAME_INTERVAL_MS;
        return;
      }
      if (now < nextDue) {
        return;
      }
      nextDue += FRAME_INTERVAL_MS;
      if (nextDue <= now) {
        nextDue = now + FRAME_INTERVAL_MS;
      }
      const seconds = Math.min(now - lastFrame, MAX_FRAME_STEP_MS) / 1000;
      lastFrame = now;
      advanceRef.current(seconds);
    };
    const stop = (): void => {
      cancelAnimationFrame(request);
      request = 0;
    };
    const update = (): void => {
      if (reducedMotion.matches || document.hidden) {
        stop();
      } else if (request === 0) {
        lastFrame = null;
        request = requestAnimationFrame(tick);
      }
    };

    update();
    document.addEventListener("visibilitychange", update);
    reducedMotion.addEventListener("change", update);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", update);
      reducedMotion.removeEventListener("change", update);
      resetRadarState();
    };
  }, []);

  const { frame } = initial;
  const { scan } = state;
  const closureShown = state.declutter < 2 ? trackFiles.closure : null;
  return (
    <g
      className="radar-scope"
      data-testid="radar-scope"
      data-mode={state.mode}
      data-range={scan.range}
      data-bars={scan.bars}
      data-azimuth={scan.azimuth}
      data-prf={scan.prf}
      data-silent={state.silent}
    >
      <g ref={sweepRef} transform={frame.sweep} data-testid="radar-sweep">
        <SweepLine />
      </g>
      <g ref={caretRef} transform={frame.caret} data-testid="radar-caret">
        <ElevationCaret />
      </g>
      {frame.hits.map((hit, index) => (
        <g
          // Contacts are a fixed list for the page's lifetime, so the index is a stable key.
          key={index}
          ref={(element) => {
            hitRefs.current[index] = element;
          }}
          transform={hit.transform}
          opacity={hit.opacity}
          visibility={hit.visible ? "visible" : "hidden"}
          data-testid="radar-hit"
        >
          <RawHit />
        </g>
      ))}
      {frame.tracks.map((track, index) => {
        // Before the loop's first frame the trackfiles list is empty: no contact has a rank yet.
        const rank = trackFiles.ranks.at(index) ?? null;
        return (
          <g
            key={index}
            ref={(element) => {
              trackRefs.current[index] = element;
            }}
            transform={track.transform}
            opacity={track.opacity}
            visibility={track.visible ? "visible" : "hidden"}
            data-testid="radar-track"
            data-rank={rank ?? undefined}
          >
            {rank !== null && (
              <TrackSymbol rank={rank} {...trackLooks[index]} />
            )}
          </g>
        );
      })}
      <g
        ref={rangeCaretRef}
        transform={frame.rangeCaret.transform}
        visibility={frame.rangeCaret.visible ? "visible" : "hidden"}
        data-testid="radar-range-caret"
      >
        <RangeCaret closure={closureShown} />
      </g>
    </g>
  );
}
