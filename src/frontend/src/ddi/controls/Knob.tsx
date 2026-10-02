"use client";

import {
  KNOB_DIAMETER,
  KNOB_STEPS,
  KNOB_WHEEL_STEP_PX,
  PLACARD,
} from "../constants";
import { KnobBody } from "./Selector";
import { type Knob as KnobName, type Step } from "./state";
import { dispatchControls } from "./store";
import { useWheelSteps } from "./useWheelSteps";

const RADIUS = KNOB_DIAMETER / 2;
// (ours) The placard is a collar round the knob with a 72 DI tab that points inward along the bottom band, the
// teardrop shape of the DCS bezel [bzl §3].
const PLACARD_COLLAR = RADIUS + 5;
const PLACARD_END = PLACARD_COLLAR + PLACARD.width;

interface KnobProps {
  knob: KnobName;
  value: number;
  /** The corner the knob sits in; its placard points toward the centre. */
  corner: "left" | "right";
  label: string;
  placard: string;
}

const ARROW_STEPS: Readonly<Record<string, Step>> = {
  ArrowUp: 1,
  ArrowRight: 1,
  ArrowDown: -1,
  ArrowLeft: -1,
};

/**
 * BRT or CONT (design sections 5.3 and 5.4): 0 to 1 in 0.1 steps. The left half decreases and the right half
 * increases; the wheel and the arrow keys on either half step too.
 */
export function Knob({
  knob,
  value,
  corner,
  label,
  placard,
}: KnobProps): React.JSX.Element {
  const step = (direction: Step): void =>
    dispatchControls({ type: "knob", knob, step: direction });
  const onWheel = useWheelSteps(KNOB_WHEEL_STEP_PX, step);
  const onKeyDown = (event: React.KeyboardEvent): void => {
    const direction = ARROW_STEPS[event.key];
    if (direction !== undefined) {
      event.preventDefault();
      step(direction);
    }
  };
  const sign = corner === "left" ? 1 : -1;
  return (
    <div
      className={`ddi-knob ddi-knob-${corner}`}
      role="group"
      aria-label={label}
      onWheel={onWheel}
    >
      <svg
        className="ddi-control-art"
        viewBox={`${-RADIUS} ${-RADIUS} ${KNOB_DIAMETER} ${KNOB_DIAMETER}`}
        aria-hidden="true"
      >
        <g className="ddi-placard">
          <circle r={PLACARD_COLLAR} />
          <rect
            x={corner === "left" ? 0 : -PLACARD_END}
            y={-PLACARD.height / 2}
            width={PLACARD_END}
            height={PLACARD.height}
            rx={PLACARD.height / 2}
          />
        </g>
        <text
          className="ddi-placard-label"
          x={(sign * (PLACARD_COLLAR + PLACARD_END)) / 2}
          y={PLACARD.capHeight / 2}
          textAnchor="middle"
        >
          {placard}
        </text>
        <KnobBody
          radius={RADIUS}
          pointerVariable={`--ddi-${knob}-angle`}
          ring
        />
      </svg>
      <output className="ddi-control-value" data-testid={`ddi-${knob}`}>
        {value} of {KNOB_STEPS}
      </output>
      <button
        type="button"
        className="ddi-half ddi-half-left"
        aria-label={`Decrease ${label.toLowerCase()}`}
        onClick={() => step(-1)}
        onKeyDown={onKeyDown}
      />
      <button
        type="button"
        className="ddi-half ddi-half-right"
        aria-label={`Increase ${label.toLowerCase()}`}
        onClick={() => step(1)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
