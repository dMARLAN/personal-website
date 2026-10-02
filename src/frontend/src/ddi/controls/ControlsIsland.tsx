"use client";

import { Knob } from "./Knob";
import { Selector } from "./Selector";
import { useDisplayControls } from "./store";

/** The one client island for the bezel controls (design section 8). */
export function ControlsIsland(): React.JSX.Element {
  const { mode, brt, cont } = useDisplayControls();
  return (
    <section className="ddi-controls" aria-label="Display controls">
      <Selector mode={mode} />
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
