"use client";

import { useId } from "react";
import {
  SELECTOR_ANGLES,
  SELECTOR_DIAMETER,
  SELECTOR_PLATE,
  SELECTOR_WHEEL_STEP_PX,
  type DisplayMode,
} from "../constants";
import { canStepMode, type Step } from "./state";
import { dispatchControls } from "./store";
import { useWheelSteps } from "./useWheelSteps";

const RADIUS = SELECTOR_DIAMETER / 2;
const HALF_WIDTH = SELECTOR_PLATE.width / 2;
const HALF_HEIGHT = SELECTOR_PLATE.height / 2;
// (ours) Fan index lines run from the knob's rim to just inside the plate edge.
const FAN_INNER = RADIUS + 1;
const FAN_OUTER = RADIUS + 5;

/** A point `radius` from the knob centre at `degrees` clockwise from up, in SVG coordinates. */
function polar(radius: number, degrees: number): [number, number] {
  const radians = (degrees * Math.PI) / 180;
  return [radius * Math.sin(radians), -radius * Math.cos(radians)];
}

function fanLine(mode: DisplayMode): string {
  const [x1, y1] = polar(FAN_INNER, SELECTOR_ANGLES[mode]);
  const [x2, y2] = polar(FAN_OUTER, SELECTOR_ANGLES[mode]);
  return `M${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)}`;
}

/** The plate art: NIGHT upper left, OFF lower left, DAY upper right, and a fan of index lines [bzl §3]. */
function SelectorArt(): React.JSX.Element {
  return (
    <svg
      className="ddi-control-art"
      viewBox={`${-HALF_WIDTH} ${-HALF_HEIGHT} ${SELECTOR_PLATE.width} ${SELECTOR_PLATE.height}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ddi-selector-plate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#353738" />
          <stop offset="1" stopColor="#292b2c" />
        </linearGradient>
      </defs>
      <rect
        className="ddi-plate"
        x={-HALF_WIDTH + 1}
        y={-HALF_HEIGHT + 1}
        width={SELECTOR_PLATE.width - 2}
        height={SELECTOR_PLATE.height - 2}
        rx={10}
        fill="url(#ddi-selector-plate)"
      />
      <g className="ddi-placard-ink">
        <path d={`${fanLine("OFF")} ${fanLine("NIGHT")} ${fanLine("DAY")}`} />
        <text className="ddi-selector-label" x={-24} y={-15} textAnchor="end">
          NIGHT
        </text>
        <text className="ddi-selector-label" x={-38} y={10} textAnchor="end">
          OFF
        </text>
        <text className="ddi-selector-label" x={24} y={-15}>
          DAY
        </text>
      </g>
      <KnobBody radius={RADIUS} pointerVariable="--ddi-selector-angle" />
    </svg>
  );
}

/** A dark knurled knob with a white pointer that rotates with `pointerVariable` [bzl §3]. */
export function KnobBody({
  radius,
  pointerVariable,
  ring = false,
}: {
  radius: number;
  pointerVariable: `--${string}`;
  ring?: boolean;
}): React.JSX.Element {
  const gradientId = `ddi-knob-face-${useId().replace(/[^\w-]/g, "")}`;
  const knurl = Array.from({ length: 40 }, (_, index) => {
    const [x1, y1] = polar(radius * 0.78, index * 9);
    const [x2, y2] = polar(radius * (ring ? 0.86 : 0.95), index * 9);
    return `M${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)}`;
  }).join(" ");
  return (
    <g className="ddi-knob-body">
      <defs>
        <radialGradient id={gradientId} cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#3a3e43" />
          <stop offset="0.55" stopColor="#25282c" />
          <stop offset="1" stopColor="#181a1d" />
        </radialGradient>
      </defs>
      <circle className="ddi-knob-shadow" r={radius} cy={radius * 0.08} />
      <circle className="ddi-knob-skirt" r={radius} />
      {ring && <circle className="ddi-knob-ring" r={radius * 0.9} />}
      <path className="ddi-knob-knurl" d={knurl} />
      <circle
        className="ddi-knob-face"
        r={radius * 0.74}
        fill={`url(#${gradientId})`}
      />
      <g
        className="ddi-knob-pointer"
        style={{ transform: `rotate(var(${pointerVariable}))` }}
      >
        <line x1={0} y1={-radius * 0.2} x2={0} y2={-radius * 0.92} />
      </g>
    </g>
  );
}

/**
 * OFF/NIGHT/DAY (design section 5.2): 3 detents and no wrap-around. The left half steps toward OFF and the right
 * half toward DAY; the wheel steps too. A half at its end stop is disabled.
 */
export function Selector({ mode }: { mode: DisplayMode }): React.JSX.Element {
  const step = (direction: Step): void =>
    dispatchControls({ type: "mode", step: direction });
  const onWheel = useWheelSteps(SELECTOR_WHEEL_STEP_PX, step);
  const half = (direction: Step, label: string): React.JSX.Element => {
    const disabled = !canStepMode(mode, direction);
    return (
      <button
        type="button"
        className={`ddi-half ddi-half-${direction < 0 ? "left" : "right"}`}
        aria-label={label}
        aria-disabled={disabled}
        onClick={() => {
          if (!disabled) {
            step(direction);
          }
        }}
      />
    );
  };
  return (
    <div
      className="ddi-selector"
      role="group"
      aria-label="Display mode"
      onWheel={onWheel}
    >
      <SelectorArt />
      <output className="ddi-control-value" data-testid="ddi-mode">
        {mode}
      </output>
      {half(-1, "Turn toward OFF")}
      {half(1, "Turn toward DAY")}
    </div>
  );
}
