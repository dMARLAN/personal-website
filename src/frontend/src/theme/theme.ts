/** The site's appearance (docs/design.md section 4.8): a dark-charcoal bezel by day, a dark cockpit by night. */
export const THEMES = ["day", "night"] as const;
export type Theme = (typeof THEMES)[number];

/** The visitor's manual override. With none stored, the theme follows the OS colour scheme. */
export const THEME_STORAGE_KEY = "site:theme:v1";
/** The OS asks for night through this media query. */
export const NIGHT_QUERY = "(prefers-color-scheme: dark)";

/** Reads a stored override. Storage is untrusted input, so anything but an exact theme name means no override. */
export function parseThemeOverride(raw: string | null): Theme | null {
  return THEMES.find((theme) => theme === raw) ?? null;
}

/** The override wins; otherwise the OS colour scheme decides. */
export function resolveTheme(
  override: Theme | null,
  systemPrefersNight: boolean,
): Theme {
  return override ?? (systemPrefersNight ? "night" : "day");
}

export function otherTheme(theme: Theme): Theme {
  return theme === "day" ? "night" : "day";
}

/** Writes the theme onto `element` (the `<html>` element) as `data-theme`, which selects the CSS tokens. */
export function applyTheme(element: HTMLElement, theme: Theme): void {
  element.dataset.theme = theme;
}
