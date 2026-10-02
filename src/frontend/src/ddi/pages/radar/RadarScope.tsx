"use client";

import type { RadarContact } from "@/content/types";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  DISPLAY_AZIMUTH,
  ELEVATION_DI_PER_DEGREE,
  ElevationCaret,
  RawHit,
  SweepLine,
  TACTICAL_HALF,
  scopePoint,
} from "../../formats/rdrAttk";
import { formatNumber } from "../../geometry";
import {
  antennaAzimuth,
  antennaElevation,
  contactPath,
  hitIntensity,
  rawHit,
  scanBar,
  type ContactPath,
} from "./sim";
import { barStore, rangeStore, resetRadarState } from "./store";

/** The DCS device update rate: 20 Hz [bzl §1]. */
export const FRAME_INTERVAL_MS = 50;
/** (ours) The most sim time one frame may advance, so a stalled tab resumes where it stopped instead of jumping. */
const MAX_FRAME_STEP_MS = 100;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** SVG transform for a DCS-coordinate offset (SVG is y-down). */
function translate(x: number, y: number): string {
  return `translate(${formatNumber(x)} ${formatNumber(-y)})`;
}

interface HitDrawing {
  transform: string;
  opacity: string;
  visible: boolean;
}

/** What the scope shows at sim `time` on the `range` NM scale. */
export function scopeFrame(
  paths: readonly ContactPath[],
  time: number,
  range: number,
): { sweep: string; caret: string; bar: number; hits: HitDrawing[] } {
  return {
    sweep: translate(
      (antennaAzimuth(time) / DISPLAY_AZIMUTH) * TACTICAL_HALF,
      0,
    ),
    caret: translate(0, antennaElevation(time) * ELEVATION_DI_PER_DEGREE),
    bar: scanBar(time),
    hits: paths.map((path) => {
      const hit = rawHit(path, time);
      if (hit === null || hit.range > range) {
        return { transform: "", opacity: "0", visible: false };
      }
      const [x, y] = scopePoint(hit.range, hit.azimuth, range);
      return {
        transform: translate(x, y),
        opacity: formatNumber(hitIntensity(hit.age)),
        visible: true,
      };
    }),
  };
}

/**
 * The animated RWS layer: the antenna sweep line, the elevation caret and the raw hits (design section 12, Radar).
 * The server renders the t = 0 frame. In the browser a requestAnimationFrame loop draws at 20 Hz by writing
 * attributes through refs, so React never re-renders per frame. It stops while the tab is hidden and never starts
 * under reduced motion.
 */
export function RadarScope({
  contacts,
}: {
  contacts: readonly RadarContact[];
}): React.JSX.Element {
  const range = useSyncExternalStore(
    rangeStore.subscribe,
    rangeStore.get,
    () => rangeStore.initial,
  );
  const paths = useMemo(() => contacts.map(contactPath), [contacts]);
  const sweepRef = useRef<SVGGElement>(null);
  const caretRef = useRef<SVGGElement>(null);
  const hitRefs = useRef<(SVGGElement | null)[]>([]);
  const simTime = useRef(0);
  const rangeRef = useRef(range);

  const draw = (): void => {
    const frame = scopeFrame(paths, simTime.current, rangeRef.current);
    sweepRef.current?.setAttribute("transform", frame.sweep);
    caretRef.current?.setAttribute("transform", frame.caret);
    frame.hits.forEach((hit, index) => {
      const element = hitRefs.current[index];
      if (element === null) {
        return;
      }
      element.setAttribute("transform", hit.transform);
      element.setAttribute("opacity", hit.opacity);
      element.setAttribute("visibility", hit.visible ? "visible" : "hidden");
    });
    barStore.set(frame.bar);
  };
  const drawRef = useRef(draw);

  // A new range redraws at once, before paint, from the current sim time.
  useLayoutEffect(() => {
    drawRef.current = draw;
    rangeRef.current = range;
    draw();
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
      simTime.current += Math.min(now - lastFrame, MAX_FRAME_STEP_MS) / 1000;
      lastFrame = now;
      drawRef.current();
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

  const initial = scopeFrame(paths, 0, rangeStore.initial);
  return (
    <g className="radar-scope" data-testid="radar-scope" data-range={range}>
      <g ref={sweepRef} transform={initial.sweep} data-testid="radar-sweep">
        <SweepLine />
      </g>
      <g ref={caretRef} transform={initial.caret}>
        <ElevationCaret />
      </g>
      {initial.hits.map((hit, index) => (
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
    </g>
  );
}
