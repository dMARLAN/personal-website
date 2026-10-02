"use client";

import { Knob } from "./Knob";
import { useDisplayControls } from "./store";

/** The one client island for the bezel controls (design section 8). */
export function ControlsIsland(): React.JSX.Element {
  const { brt, cont } = useDisplayControls();
  return (
    <section className="ddi-controls" aria-label="Display controls">
      <Knob
        knob="brt"
        value={brt}
        corner="left"
        label="Brightness"
        placard="BRT"
      />
      <Knob
        knob="cont"
        value={cont}
        corner="right"
        label="Contrast"
        placard="CONT"
      />
    </section>
  );
}
