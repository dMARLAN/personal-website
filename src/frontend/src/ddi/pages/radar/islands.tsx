"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import {
  AcquisitionCursor,
  ElevationBarNumber,
  RangeScaleMax,
  TACTICAL_HALF,
  TACTICAL_SIZE,
} from "../../formats/rdrAttk";
import type { Point } from "../../geometry";
import { scanAltitudeLimits } from "./sim";
import { barStore, rangeStore, steppedRange } from "./store";

function useRange(): number {
  return useSyncExternalStore(
    rangeStore.subscribe,
    rangeStore.get,
    () => rangeStore.initial,
  );
}

/**
 * The readouts that follow the range scale: the scale itself and the acquisition cursor's altitude limits, which
 * depend on the range under the cursor.
 */
export function RangeReadouts({
  cursor,
  altitude,
}: {
  cursor: Point;
  altitude: number;
}): React.JSX.Element {
  const range = useRange();
  const cursorRange = ((cursor[1] + TACTICAL_HALF) / TACTICAL_SIZE) * range;
  const { upper, lower } = scanAltitudeLimits(altitude, cursorRange);
  return (
    <>
      <RangeScaleMax range={range} />
      <AcquisitionCursor pos={cursor} upper={upper} lower={lower} />
    </>
  );
}

/** The bar number next to the `4B` legend, written by the scope's loop once per sweep. */
export function BarNumber(): React.JSX.Element {
  const bar = useSyncExternalStore(
    barStore.subscribe,
    barStore.get,
    () => barStore.initial,
  );
  return <ElevationBarNumber bar={bar} />;
}

/**
 * A range arrow OSB (PB11 up, PB12 down). It fires on press like every OSB (design section 5.1): primary-button
 * `pointerdown` or Enter/Space, and swallows the `click` that follows a pointer press.
 */
export function RangeOsb({
  step,
  label,
}: {
  step: 1 | -1;
  label: string;
}): React.JSX.Element {
  const [pressed, setPressed] = useState(false);
  const suppressClick = useRef(false);
  const fire = (): void => rangeStore.set(steppedRange(rangeStore.get(), step));
  return (
    <button
      type="button"
      className="ddi-osb radar-range-osb"
      data-action="state"
      data-pressed={pressed || undefined}
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return;
        }
        suppressClick.current = true;
        fire();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }
        event.preventDefault();
        if (!event.repeat) {
          setPressed(true);
          fire();
        }
      }}
      onKeyUp={() => setPressed(false)}
      onBlur={() => setPressed(false)}
      onClick={() => {
        if (suppressClick.current) {
          suppressClick.current = false;
        } else {
          fire();
        }
      }}
    >
      <span className="ddi-osb-label">{label}</span>
    </button>
  );
}
