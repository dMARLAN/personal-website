import type { Locator, Page } from "@playwright/test";

export const STORAGE_KEY = "ddi:controls:v3";
export const THEME_KEY = "site:theme:v1";

export interface StoredControls {
  brt: number;
  cont: number;
}

/** What the page draws: the custom properties the controls set on <html>, and the emissive layer's opacity. */
export async function drawnControls(page: Page): Promise<{
  gain: string;
  halo: string;
  emissiveOpacity: string;
}> {
  return page.evaluate(() => {
    const root = document.documentElement;
    const emissive = document.querySelector(".ddi-emissive");
    if (emissive === null) {
      throw new Error("no emissive layer");
    }
    return {
      gain: root.style.getPropertyValue("--ddi-gain"),
      halo: root.style.getPropertyValue("--ddi-halo"),
      emissiveOpacity: getComputedStyle(emissive).opacity,
    };
  });
}

/** The pointer position during a knob drag: x is CSS px right of the knob centre where the drag started. */
export interface KnobDrag {
  page: Page;
  centreX: number;
  centreY: number;
  x: number;
}

/** Presses the primary button on the centre of a knob. */
export async function pressKnob(page: Page, knob: Locator): Promise<KnobDrag> {
  const box = await knob.boundingBox();
  if (box === null) {
    throw new Error("knob not visible");
  }
  const centreX = box.x + box.width / 2;
  const centreY = box.y + box.height / 2;
  await page.mouse.move(centreX, centreY);
  await page.mouse.down();
  return { page, centreX, centreY, x: 0 };
}

/** Moves a pressed pointer sideways by `deltaX` CSS px, in moves of at most 10 px. */
export async function dragBy(drag: KnobDrag, deltaX: number): Promise<void> {
  const target = drag.x + deltaX;
  while (drag.x !== target) {
    drag.x += Math.sign(deltaX) * Math.min(10, Math.abs(target - drag.x));
    await drag.page.mouse.move(drag.centreX + drag.x, drag.centreY);
  }
}

export async function storedControls(
  page: Page,
): Promise<StoredControls | null> {
  const raw = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEY,
  );
  return raw === null ? null : (JSON.parse(raw) as StoredControls);
}
