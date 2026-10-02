"use client";

import { Moon, Sun } from "lucide-react";
import { CORNER_PLACEMENT } from "./corner";
import { toggleTheme, useTheme } from "./store";

export interface ThemeToggleButtonProps {
  className: string;
  style?: React.CSSProperties;
}

/**
 * The day/night switch itself (docs/design.md section 4.8). CSS picks the icon from `data-theme`, so the right one
 * shows from first paint, before this island hydrates. The homepage places it in its header.
 */
export function ThemeToggleButton({
  className,
  style,
}: ThemeToggleButtonProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <button
      type="button"
      className={className}
      style={style}
      aria-label="Night mode"
      aria-pressed={theme === "night"}
      onClick={toggleTheme}
    >
      <Sun className="theme-toggle-icon theme-toggle-sun" aria-hidden="true" />
      <Moon
        className="theme-toggle-icon theme-toggle-moon"
        aria-hidden="true"
      />
    </button>
  );
}

/** The DDI's switch, in the viewport's top-right corner, outside the DDI. */
export function ThemeToggle(): React.JSX.Element {
  return (
    <aside className="theme-toggle-region" aria-label="Appearance">
      <ThemeToggleButton className="theme-toggle" style={CORNER_PLACEMENT} />
    </aside>
  );
}
