"use client";

import { useId } from "react";
import { KNOB_DIAMETER, KNOB_WHEEL_STEP_PX, PLACARD } from "../constants";
import { type Knob as KnobName, type Step } from "./state";
import { dispatchControls } from "./store";
import { useKnobDrag } from "./useKnobDrag";
import { useWheelSteps } from "./useWheelSteps";

const RADIUS = KNOB_DIAMETER / 2;
// (ours) The placard is a collar round the knob with a tab that points inward along the bottom band, the teardrop
// shape of the DCS bezel [bzl §3].
const PLACARD_COLLAR = RADIUS + 3;
const PLACARD_END = PLACARD_COLLAR + PLACARD.width;

/** A point `radius` from the knob centre at `degrees` clockwise from up, in SVG coordinates. */
function polar(radius: number, degrees: number): [number, number] {
  const radians = (degrees * Math.PI) / 180;
  return [radius * Math.sin(radians), -radius * Math.cos(radians)];
}

/**
 * A dark knurled knob with a white ring on the skirt and a pointer that rotates with `pointerVariable` [bzl §3]. Its
 * colours are theme tokens (`--knob-*`).
 */
function KnobBody({
  pointerVariable,
}: {
  pointerVariable: `--${string}`;
}): React.JSX.Element {
  const gradientId = `ddi-knob-face-${useId().replace(/[^\w-]/g, "")}`;
  const knurl = Array.from({ length: 40 }, (_, index) => {
    const [x1, y1] = polar(RADIUS * 0.78, index * 9);
    const [x2, y2] = polar(RADIUS * 0.86, index * 9);
    return `M${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)}`;
  }).join(" ");
  return (
    <g className="ddi-knob-body">
      <defs>
        <radialGradient id={gradientId} cx="0.38" cy="0.3" r="0.8">
          <stop className="ddi-knob-face-light" offset="0" />
          <stop className="ddi-knob-face-mid" offset="0.55" />
          <stop className="ddi-knob-face-dark" offset="1" />
        </radialGradient>
      </defs>
      <circle className="ddi-knob-shadow" r={RADIUS} cy={RADIUS * 0.08} />
      <circle className="ddi-knob-skirt" r={RADIUS} />
      <circle className="ddi-knob-ring" r={RADIUS * 0.9} />
      <path className="ddi-knob-knurl" d={knurl} />
      <circle
        className="ddi-knob-face"
        r={RADIUS * 0.74}
        fill={`url(#${gradientId})`}
      />
      <g
        className="ddi-knob-pointer"
        style={{ transform: `rotate(var(${pointerVariable}))` }}
      >
        <line x1={0} y1={-RADIUS * 0.2} x2={0} y2={-RADIUS * 0.92} />
      </g>
    </g>
  );
}

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

const END_STOPS: Readonly<Record<string, number>> = { Home: 0, End: 1 };

/**
 * BRT or CONT (design sections 5.3 and 5.4): a slider from 0 to 1. Dragging right turns it up and left turns it
 * down, continuously between the end stops, with a detent at 12 o'clock. A click on the left half steps down 0.1 and
 * on the right half up 0.1; the wheel and the arrow keys step 0.1 too, and Home and End go to the end stops.
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
  const set = (next: number): void =>
    dispatchControls({ type: "setKnob", knob, value: next });
  const onWheel = useWheelSteps(KNOB_WHEEL_STEP_PX, step);
  const drag = useKnobDrag(value, set);
  const onKeyDown = (event: React.KeyboardEvent): void => {
    const direction = ARROW_STEPS[event.key];
    const endStop = END_STOPS[event.key];
    if (direction !== undefined) {
      step(direction);
    } else if (endStop !== undefined) {
      set(endStop);
    } else {
      return;
    }
    event.preventDefault();
  };
  const onClick = (event: React.MouseEvent<HTMLElement>): void => {
    if (drag.wasDragged()) {
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    step(event.clientX < box.left + box.width / 2 ? -1 : 1);
  };
  const percent = Math.round(value * 100);
  const sign = corner === "left" ? 1 : -1;
  return (
    <div
      className={`ddi-knob ddi-knob-${corner}`}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}%`}
      data-dragging={drag.dragging || undefined}
      data-testid={`ddi-${knob}`}
      onWheel={onWheel}
      onKeyDown={onKeyDown}
      onClick={onClick}
      {...drag.handlers}
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
        <KnobBody pointerVariable={`--ddi-${knob}-angle`} />
      </svg>
    </div>
  );
}
