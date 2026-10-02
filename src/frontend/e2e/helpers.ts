import type { Page } from "@playwright/test";

export const STORAGE_KEY = "ddi:controls:v1";

export interface StoredControls {
  mode: "OFF" | "NIGHT" | "DAY";
  brt: number;
  cont: number;
}

/** What the page draws: the mode on <html> and the custom properties the controls set. */
export async function drawnControls(page: Page): Promise<{
  mode: string | undefined;
  gain: string;
  halo: string;
  selectorAngle: string;
  emissiveDisplay: string;
}> {
  return page.evaluate(() => {
    const root = document.documentElement;
    const emissive = document.querySelector(".ddi-emissive");
    if (emissive === null) {
      throw new Error("no emissive layer");
    }
    return {
      mode: root.dataset.ddiMode,
      gain: root.style.getPropertyValue("--ddi-gain"),
      halo: root.style.getPropertyValue("--ddi-halo"),
      selectorAngle: root.style.getPropertyValue("--ddi-selector-angle"),
      emissiveDisplay: getComputedStyle(emissive).display,
    };
  });
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
