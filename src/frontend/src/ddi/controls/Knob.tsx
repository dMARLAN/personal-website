"use client";

import {
  KNOB_COLLAR_RADIUS,
  KNOB_DIAMETER,
  KNOB_WHEEL_STEP_PX,
  PLACARD,
} from "../constants";
import { type Knob as KnobName, type Step } from "./state";
import { dispatchControls } from "./store";
import { useKnobDrag } from "./useKnobDrag";
import { useWheelSteps } from "./useWheelSteps";

const RADIUS = KNOB_DIAMETER / 2;
const PLACARD_END = KNOB_COLLAR_RADIUS + PLACARD.width;

/**
 * The baked knob (docs/design.md section 4.5), bottom to top: the cast shadow, the knurled body and the index line,
 * which turn with `--knob-angle`, then the painted ring and the key light, which stay put so the highlight never
 * turns with the knob. `frame.css` gives each layer its theme's image.
 */
function KnobLayers(): React.JSX.Element {
  return (
    <span className="ddi-knob-art" aria-hidden="true">
      <i className="ddi-knob-base" />
      <i className="ddi-knob-body" />
      <i className="ddi-knob-index" />
      <i className="ddi-knob-ring" />
      <i className="ddi-knob-light" />
    </span>
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

/** The pre-paint script and the controls store set each knob's angle on <html>; the knob's layers read it here. */
const KNOB_ANGLE: Readonly<Record<KnobName, React.CSSProperties>> = {
  brt: { "--knob-angle": "var(--ddi-brt-angle)" },
  cont: { "--knob-angle": "var(--ddi-cont-angle)" },
};

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
      style={KNOB_ANGLE[knob]}
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
          <circle r={KNOB_COLLAR_RADIUS} />
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
          x={(sign * (KNOB_COLLAR_RADIUS + PLACARD_END)) / 2}
          y={PLACARD.capHeight / 2}
          textAnchor="middle"
        >
          {placard}
        </text>
      </svg>
      <KnobLayers />
    </div>
  );
}
