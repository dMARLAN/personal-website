import { expect, test } from "@playwright/test";

const GLASS_SHORT = 1089.6;
const LIP_RING = 8;

interface Box {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
  { width: 390, height: 844 },
]) {
  test(`at ${viewport.width}×${viewport.height} the bands are equal and every OSB clears the lip ring by 6–8 DI`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const { glass, caps } = await page.evaluate(() => {
      const box = (element: Element): Box => {
        const { top, left, bottom, right } = element.getBoundingClientRect();
        return { top, left, bottom, right };
      };
      const screen = document.querySelector(".ddi-screen");
      if (screen === null) {
        throw new Error("no screen");
      }
      return {
        glass: box(screen),
        caps: [...document.querySelectorAll<HTMLElement>(".ddi-osb")].map(
          (cap) => ({ edge: cap.dataset.edge ?? "", box: box(cap) }),
        ),
      };
    });
    const k =
      Math.min(glass.right - glass.left, glass.bottom - glass.top) /
      GLASS_SHORT;

    const bands = [
      glass.top,
      glass.left,
      viewport.width - glass.right,
      viewport.height - glass.bottom,
    ];
    for (const band of bands) {
      expect(band).toBeCloseTo(bands[0], 0);
    }

    // The lip ring's outer edge is LIP_RING DI outside the glass.
    const lip = LIP_RING * k;
    const ring: Box = {
      top: glass.top - lip,
      left: glass.left - lip,
      bottom: glass.bottom + lip,
      right: glass.right + lip,
    };
    expect(caps).toHaveLength(20);
    for (const { edge, box } of caps) {
      const gaps: Record<string, number> = {
        top: ring.top - box.bottom,
        bottom: box.top - ring.bottom,
        left: ring.left - box.right,
        right: box.left - ring.right,
      };
      const gap = gaps[edge] / k;
      expect(gap, `cap on ${edge}`).toBeGreaterThanOrEqual(6);
      expect(gap, `cap on ${edge}`).toBeLessThanOrEqual(8);
    }
  });
}
