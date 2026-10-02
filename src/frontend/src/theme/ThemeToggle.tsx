"use client";

import { Moon, Sun } from "lucide-react";
import { BAND, FRAME_SCALE_CSS } from "@/ddi/constants";
import { toggleTheme, useTheme } from "./store";

const SIZE_PX = 28;

/** Centres the button in the bezel's top-right corner cell, which is `BAND` DI square, but keeps it 4px from the edges. */
const PLACEMENT: React.CSSProperties = {
  "--corner-inset": `max(4px, calc((${BAND} * ${FRAME_SCALE_CSS} - ${SIZE_PX}px) / 2))`,
  width: SIZE_PX,
  height: SIZE_PX,
};

/**
 * The day/night switch in the viewport's top-right corner (docs/design.md section 4.8). It sits outside the DDI. CSS
 * picks the icon from `data-theme`, so the right one shows from first paint, before this island hydrates.
 */
export function ThemeToggle(): React.JSX.Element {
  const theme = useTheme();
  return (
    <aside className="theme-toggle-region" aria-label="Appearance">
      <button
        type="button"
        className="theme-toggle"
        style={PLACEMENT}
        aria-label="Night mode"
        aria-pressed={theme === "night"}
        onClick={toggleTheme}
      >
        <Sun
          className="theme-toggle-icon theme-toggle-sun"
          aria-hidden="true"
        />
        <Moon
          className="theme-toggle-icon theme-toggle-moon"
          aria-hidden="true"
        />
      </button>
    </aside>
  );
}
