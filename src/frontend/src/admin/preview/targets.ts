import { PAGES } from "@/ddi/pages/registry";
import { livePath, type SectionInfo } from "../sections";

export type PreviewTargetId = "ddi" | "home";

/** A page the preview can show for a section. */
export interface PreviewTarget {
  id: PreviewTargetId;
  label: string;
  path: string;
}

/**
 * The pages a section's edits change: its DDI page, and for the site content (About to Links) the homepage too, which
 * shows every one of them (docs/design.md section 10.3). The first is the default.
 */
export function previewTargets(section: SectionInfo): readonly PreviewTarget[] {
  const ddi: PreviewTarget = {
    id: "ddi",
    label: "DDI page",
    path: livePath(section),
  };
  if (section.group === "DDI showcase") {
    return [ddi];
  }
  return [ddi, { id: "home", label: "Homepage", path: PAGES.home.path }];
}

/** A preset size for the preview frame. `fit` sizes the page to the pane; the others render it at that size, scaled. */
export interface Viewport {
  id: string;
  label: string;
  size: { width: number; height: number } | null;
}

export const VIEWPORTS: readonly Viewport[] = [
  { id: "fit", label: "Fit to pane", size: null },
  {
    id: "1920x1080",
    label: "1920 × 1080",
    size: { width: 1920, height: 1080 },
  },
  { id: "1440x900", label: "1440 × 900", size: { width: 1440, height: 900 } },
  {
    id: "390x844",
    label: "390 × 844 phone",
    size: { width: 390, height: 844 },
  },
];

export const DEFAULT_VIEWPORT_ID = "1440x900";

export function viewportById(id: string): Viewport | null {
  return VIEWPORTS.find((viewport) => viewport.id === id) ?? null;
}

/** Where the frame sits in the pane: its own size, the scale that fits it in, and its offset to centre it. */
export interface FrameBox {
  width: number;
  height: number;
  scale: number;
  left: number;
  top: number;
}

/** Fits `viewport` into a `pane` with `gutter` px around it. It scales down only: a page never draws larger than life. */
export function fitFrame(
  viewport: Viewport,
  pane: { width: number; height: number },
  gutter: number,
): FrameBox {
  if (viewport.size === null) {
    return { ...pane, scale: 1, left: 0, top: 0 };
  }
  const { width, height } = viewport.size;
  const room = {
    width: Math.max(pane.width - 2 * gutter, 1),
    height: Math.max(pane.height - 2 * gutter, 1),
  };
  const scale = Math.min(room.width / width, room.height / height, 1);
  return {
    width,
    height,
    scale,
    left: (pane.width - width * scale) / 2,
    top: (pane.height - height * scale) / 2,
  };
}
