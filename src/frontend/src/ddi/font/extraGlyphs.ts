import type { Stroke } from "../generated/strokeFont";

/**
 * Our own glyphs for characters DCS lacks [fnd §3.2]. No DCS reference exists for them. They use the DCS
 * 12 × 20 DI cell (origin top-left, y down) and its 3 DI chamfers.
 */
export const EXTRA_GLYPHS: Readonly<Record<string, readonly Stroke[]>> = {
  // (ours) For the contact email.
  "@": [
    {
      kind: "poly",
      pts: [
        8, 14, 11, 14, 12, 13, 12, 3, 9, 0, 3, 0, 0, 3, 0, 17, 3, 20, 10, 20,
      ],
    },
    { kind: "poly", pts: [8, 6, 6, 6, 4, 8, 4, 12, 6, 14, 8, 14, 8, 6] },
  ],
};
