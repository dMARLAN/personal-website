"use client";

import { useRef } from "react";
import { accumulateWheel, type Step } from "./state";

// Line and page deltas (Firefox with some mice) converted to pixels, so the step thresholds mean the same everywhere.
const PIXELS_PER_LINE = 40;
const PIXELS_PER_PAGE = 800;

function wheelPixels(event: React.WheelEvent): number {
  switch (event.deltaMode) {
    case WheelEvent.DOM_DELTA_LINE:
      return event.deltaY * PIXELS_PER_LINE;
    case WheelEvent.DOM_DELTA_PAGE:
      return event.deltaY * PIXELS_PER_PAGE;
    default:
      return event.deltaY;
  }
}

/** A wheel handler that calls `onStep` once per `stepPx` of accumulated scroll. Wheel up steps up (+1). */
export function useWheelSteps(
  stepPx: number,
  onStep: (step: Step) => void,
): (event: React.WheelEvent) => void {
  const accumulated = useRef(0);
  return (event) => {
    if (event.ctrlKey) {
      return;
    }
    const { steps, remainder } = accumulateWheel(
      accumulated.current,
      wheelPixels(event),
      stepPx,
    );
    accumulated.current = remainder;
    const step: Step = steps > 0 ? -1 : 1;
    for (let count = 0; count < Math.abs(steps); count += 1) {
      onStep(step);
    }
  };
}
