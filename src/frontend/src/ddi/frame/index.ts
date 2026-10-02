import { FullViewportFrame } from "./FullViewportFrame";
import type { DdiFrame } from "./types";

/**
 * The frame every page renders in. Swap this one import to change frames (design section 4.6). It lives here, not in
 * the root layout, because the layout receives each page as rendered children, not as a `DdiScreen`.
 */
export const Frame: DdiFrame = FullViewportFrame;
