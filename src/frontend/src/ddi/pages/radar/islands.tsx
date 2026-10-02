"use client";

import { useSyncExternalStore } from "react";
import { useOsbPress } from "../../frame/Osb";
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
 * A range arrow OSB (PB11 up, PB12 down). It fires on press like every OSB (design section 5.1), through the
 * shared `useOsbPress`.
 */
export function RangeOsb({
  step,
  label,
}: {
  step: 1 | -1;
  label: string;
}): React.JSX.Element {
  // A button has no native action, so a click with no press before it must step the range too.
  const { pressed, handlers } = useOsbPress(
    () => rangeStore.set(steppedRange(rangeStore.get(), step)),
    true,
  );
  return (
    <button
      type="button"
      className="ddi-osb radar-range-osb"
      data-action="state"
      data-pressed={pressed || undefined}
      {...handlers}
    >
      <span className="ddi-osb-label">{label}</span>
    </button>
  );
}
