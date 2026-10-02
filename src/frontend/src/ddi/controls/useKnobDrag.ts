"use client";

import { useRef, useState } from "react";
import { KNOB_DRAG_THRESHOLD_PX } from "../constants";
import { dragKnob } from "./state";

interface Press {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  /** The unrounded value while dragging, or null until the press has moved far enough to be a drag. */
  value: number | null;
}

interface KnobDrag {
  dragging: boolean;
  /** True from the moment a press becomes a drag until the next press, so the click that ends a drag is ignored. */
  wasDragged: () => boolean;
  handlers: {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
  };
}

/**
 * Turns a knob by dragging sideways (design section 5.3): `onTurn` gets the new value after each move. A press that
 * moves less than `KNOB_DRAG_THRESHOLD_PX` stays a click.
 */
export function useKnobDrag(
  value: number,
  onTurn: (value: number) => void,
): KnobDrag {
  const press = useRef<Press | null>(null);
  const dragged = useRef(false);
  const [dragging, setDragging] = useState(false);

  const end = (event: React.PointerEvent<HTMLElement>): void => {
    if (press.current?.pointerId === event.pointerId) {
      press.current = null;
      setDragging(false);
    }
  };

  return {
    dragging,
    wasDragged: () => dragged.current,
    handlers: {
      onPointerDown: (event) => {
        if (event.button !== 0) {
          return;
        }
        // Captured from the press, so the release always arrives here; the click that follows still lands here.
        event.currentTarget.setPointerCapture(event.pointerId);
        press.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          lastX: event.clientX,
          value: null,
        };
        dragged.current = false;
      },
      onPointerMove: (event) => {
        const current = press.current;
        if (current?.pointerId !== event.pointerId) {
          return;
        }
        if (current.value === null) {
          const travel = Math.hypot(
            event.clientX - current.startX,
            event.clientY - current.startY,
          );
          if (travel < KNOB_DRAG_THRESHOLD_PX) {
            return;
          }
          dragged.current = true;
          setDragging(true);
        }
        current.value = dragKnob(
          current.value ?? value,
          event.clientX - current.lastX,
        );
        current.lastX = event.clientX;
        onTurn(current.value);
      },
      onPointerUp: end,
      onPointerCancel: end,
    },
  };
}
