import type { Theme } from "./theme";

/**
 * The baked bezel materials in `public/materials/` (docs/design.md section 4.5), built by `scripts/materials`. Most
 * parts come at two densities, `@2x` (2 px per DI) and `@3x` (3 px per DI). The CSS `image-set()` in `theme.css`
 * offers `@2x` as 1x and `@3x` as 2x, so a browser takes `@3x` above DPR 1. AVIF is preferred, WebP the fallback.
 */
export const MATERIALS_PATH = "/materials";

export type Density = "@2x" | "@3x";

/** The `@3x` density serves every device pixel ratio above 1, as `image-set()` picks it. */
export function densityFor(devicePixelRatio: number): Density {
  return devicePixelRatio > 1 ? "@3x" : "@2x";
}

/** Theme-specific parts that come at both densities. */
const DENSITY_PARTS = [
  "lip-9slice",
  "osb-up",
  "knob-base",
  "knob-body",
  "knob-light",
] as const;

function avif(stem: string): string {
  return `${MATERIALS_PATH}/${stem}.avif`;
}

/**
 * The AVIF files a theme's first paint draws. The pressed OSB image is not among them: a hidden layer loads it after
 * first paint (`frame.css`). The night theme adds the OSB glow mask.
 */
export function firstPaintMaterials(theme: Theme, density: Density): string[] {
  return [
    avif(`bezel-tile-${theme}`),
    ...DENSITY_PARTS.map((part) => avif(`${part}-${theme}${density}`)),
    avif("knob-index-mask@3x"),
    avif("knob-ring-mask@3x"),
    ...(theme === "night" ? [avif("osb-glow-mask@3x")] : []),
  ];
}

/** Everything a theme draws, including the pressed OSB image. */
export function themeMaterials(theme: Theme, density: Density): string[] {
  return [
    ...firstPaintMaterials(theme, density),
    avif(`osb-down-${theme}${density}`),
  ];
}
