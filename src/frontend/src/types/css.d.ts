import "react";

declare module "react" {
  interface CSSProperties {
    /** CSS custom properties, which the frame uses for its DI geometry and the controls' state. */
    [property: `--${string}`]: string | number | undefined;
  }
}
