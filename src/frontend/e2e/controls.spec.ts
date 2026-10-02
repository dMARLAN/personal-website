import { expect, test } from "@playwright/test";
import {
  STORAGE_KEY,
  dragBy,
  drawnControls,
  pressKnob,
  storedControls,
} from "./helpers";

test("the controls change the display and persist across a reload", async ({
  page,
}) => {
  await page.goto("/ddi");
  expect(await drawnControls(page)).toMatchObject({ gain: "1", halo: "0.5" });
  const brightness = page.getByRole("slider", { name: "Brightness" });
  const contrast = page.getByRole("slider", { name: "Contrast" });
  await expect(brightness).toHaveAttribute("aria-valuetext", "50%");

  // A click on the left half steps down 0.1 and on the right half up 0.1.
  await brightness.click({ position: { x: 3, y: 20 } });
  const contrastBox = await contrast.boundingBox();
  await contrast.click({
    position: { x: (contrastBox?.width ?? 0) - 3, y: 20 },
  });
  expect(await drawnControls(page)).toMatchObject({
    gain: "0.81",
    halo: "0.45",
    emissiveOpacity: "0.81",
  });
  expect(await storedControls(page)).toEqual({ brt: 0.4, cont: 0.6 });

  await page.reload();
  expect(await drawnControls(page)).toMatchObject({
    gain: "0.81",
    halo: "0.45",
  });
  await expect(brightness).toHaveAttribute("aria-valuenow", "40");
  await expect(contrast).toHaveAttribute("aria-valuetext", "60%");
});

test("the OFF/NIGHT/DAY selector is gone", async ({ page }) => {
  await page.goto("/ddi");
  await expect(page.getByRole("group", { name: "Display mode" })).toHaveCount(
    0,
  );
  await expect(page.locator("html")).not.toHaveAttribute("data-ddi-mode");
  await expect(
    page.getByRole("region", { name: "Display controls" }).getByRole("slider"),
  ).toHaveCount(2);
});

test("dragging a knob sideways turns it, stops at the end stops and reverses at once", async ({
  page,
}) => {
  await page.goto("/ddi");
  const brightness = page.getByRole("slider", { name: "Brightness" });
  const dragging = page.locator(".ddi-knob[data-dragging]");

  // 250 px of travel sweeps 0 to 1, so 75 px right turns 0.5 up to 0.8.
  const drag = await pressKnob(page, brightness);
  await dragBy(drag, 75);
  await expect(brightness).toHaveAttribute("aria-valuenow", "80");
  await expect(dragging).toHaveCount(1);

  // Another 200 px right stops at 100 % and never wraps.
  await dragBy(drag, 200);
  await expect(brightness).toHaveAttribute("aria-valuenow", "100");

  // Reversing moves it straight away: no overshoot to travel back through.
  await dragBy(drag, -50);
  await expect(brightness).toHaveAttribute("aria-valuenow", "80");
  await dragBy(drag, -150);
  await expect(brightness).toHaveAttribute("aria-valuenow", "20");

  // The release ends the drag without a click step.
  await page.mouse.up();
  await expect(dragging).toHaveCount(0);
  await expect(brightness).toHaveAttribute("aria-valuenow", "20");
  expect(await storedControls(page)).toMatchObject({ brt: 0.2 });
  expect((await drawnControls(page)).gain).toBe("0.43");
});

test("a drag snaps to 12 o'clock and must travel through the notch to leave it", async ({
  page,
}) => {
  await page.goto("/ddi");
  const contrast = page.getByRole("slider", { name: "Contrast" });
  const drag = await pressKnob(page, contrast);
  // 8 px is 0.032: still inside the ±0.04 window, so the knob holds at 50 %.
  await dragBy(drag, 8);
  await expect(contrast).toHaveAttribute("aria-valuenow", "50");
  // 20 px in all is 0.08: out of the notch.
  await dragBy(drag, 12);
  await expect(contrast).toHaveAttribute("aria-valuenow", "58");
  // Coming back to 3 px right of centre snaps again.
  await dragBy(drag, -17);
  await expect(contrast).toHaveAttribute("aria-valuenow", "50");
  await page.mouse.up();
  expect(await storedControls(page)).toMatchObject({ cont: 0.5 });
});

test("a dragged value persists across a reload, pointer included", async ({
  page,
}) => {
  await page.goto("/ddi");
  const contrast = page.getByRole("slider", { name: "Contrast" });
  const drag = await pressKnob(page, contrast);
  await dragBy(drag, -37.5);
  await page.mouse.up();
  await expect(contrast).toHaveAttribute("aria-valuenow", "35");
  expect(await storedControls(page)).toMatchObject({ cont: 0.35 });

  await page.reload();
  await expect(contrast).toHaveAttribute("aria-valuetext", "35%");
  const angle = await page.evaluate(() =>
    document.documentElement.style.getPropertyValue("--ddi-cont-angle"),
  );
  expect(angle).toBe("-45deg");
});

test("the wheel steps BRT", async ({ page }) => {
  await page.goto("/ddi");
  await page.getByRole("slider", { name: "Brightness" }).hover();
  await page.mouse.wheel(0, 150);
  await expect(
    page.getByRole("slider", { name: "Brightness" }),
  ).toHaveAttribute("aria-valuenow", "20");
});

test("stored knobs are drawn before any app JavaScript runs, so they never flash", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({ brt: 0, cont: 0.5 }));
  }, STORAGE_KEY);
  // Block every app and framework script: only the inline pre-paint script in <head> can run.
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.goto("/ddi");
  expect(await drawnControls(page)).toMatchObject({
    gain: "0.05",
    emissiveOpacity: "0.05",
  });
});

test("an older stored value (v2, with a mode) is ignored and reads as the defaults", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "ddi:controls:v2",
      JSON.stringify({ mode: "OFF", brt: 0.1, cont: 0.9 }),
    ),
  );
  await page.goto("/ddi");
  expect(await drawnControls(page)).toMatchObject({ gain: "1", halo: "0.5" });
  await expect(
    page.getByRole("slider", { name: "Brightness" }),
  ).toHaveAttribute("aria-valuenow", "50");
});

test("invalid stored state reads as the defaults", async ({ page }) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, '{"brt":"x","cont":null}'),
    STORAGE_KEY,
  );
  await page.goto("/ddi");
  expect(await drawnControls(page)).toMatchObject({ gain: "1", halo: "0.5" });
});

test("the plain view is set by ?view=plain, persists, and is left by ?view=ddi", async ({
  page,
}) => {
  await page.goto("/ddi?view=plain");
  await expect(page.locator("html")).toHaveAttribute("data-view", "plain");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".ddi-screen")).toBeHidden();

  await page.goto("/ddi");
  await expect(page.locator("html")).toHaveAttribute("data-view", "plain");
  await page.getByRole("link", { name: "Display view" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-view", "plain");
  await expect(page.locator(".ddi-screen")).toBeVisible();
});
