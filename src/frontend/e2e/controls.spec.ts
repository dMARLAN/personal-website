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
  await page.goto("/");
  expect(await drawnControls(page)).toMatchObject({
    mode: "DAY",
    gain: "1",
    halo: "0.5",
  });
  const brightness = page.getByRole("slider", { name: "Brightness" });
  const contrast = page.getByRole("slider", { name: "Contrast" });
  await expect(brightness).toHaveAttribute("aria-valuetext", "50%");

  // A click on the left half steps down 0.1 and on the right half up 0.1.
  await brightness.click({ position: { x: 5, y: 30 } });
  const contrastBox = await contrast.boundingBox();
  await contrast.click({
    position: { x: (contrastBox?.width ?? 0) - 5, y: 30 },
  });
  await page.getByRole("button", { name: "Turn toward OFF" }).click();
  expect(await drawnControls(page)).toMatchObject({
    mode: "NIGHT",
    gain: "0.1021",
    halo: "0.45",
    selectorAngle: "-25deg",
  });
  expect(await storedControls(page)).toEqual({
    mode: "NIGHT",
    brt: 0.4,
    cont: 0.6,
  });

  await page.reload();
  expect(await drawnControls(page)).toMatchObject({
    mode: "NIGHT",
    gain: "0.1021",
    halo: "0.45",
  });
  await expect(brightness).toHaveAttribute("aria-valuenow", "40");
  await expect(contrast).toHaveAttribute("aria-valuetext", "60%");
  await expect(page.getByTestId("ddi-mode")).toHaveText("NIGHT");
});

test("dragging a knob sideways turns it, stops at the end stops and reverses at once", async ({
  page,
}) => {
  await page.goto("/");
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

test("a dragged value persists across a reload, pointer included", async ({
  page,
}) => {
  await page.goto("/");
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

test("the wheel steps the selector and BRT", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("slider", { name: "Brightness" }).hover();
  await page.mouse.wheel(0, 150);
  await expect(
    page.getByRole("slider", { name: "Brightness" }),
  ).toHaveAttribute("aria-valuenow", "20");
  await page.getByRole("group", { name: "Display mode" }).hover();
  await page.mouse.wheel(0, 100);
  await expect(page.getByTestId("ddi-mode")).toHaveText("NIGHT");
  await page.mouse.wheel(0, 100);
  await page.mouse.wheel(0, 100);
  await expect(page.getByTestId("ddi-mode")).toHaveText("OFF");
  await page.mouse.wheel(0, -100);
  await expect(page.getByTestId("ddi-mode")).toHaveText("NIGHT");
});

test("the selector stops at OFF and removes the emissive layer", async ({
  page,
}) => {
  await page.goto("/");
  const toOff = page.getByRole("button", { name: "Turn toward OFF" });
  await toOff.click();
  await toOff.click();
  await expect(toOff).toHaveAttribute("aria-disabled", "true");
  // Playwright refuses to click an aria-disabled element; the press must still do nothing.
  await toOff.click({ force: true });
  expect(await drawnControls(page)).toMatchObject({
    mode: "OFF",
    emissiveDisplay: "none",
  });
});

test("a stored OFF is drawn before any app JavaScript runs, so it never flashes lit", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({ mode: "OFF", brt: 1, cont: 0.5 }),
    );
  }, STORAGE_KEY);
  // Block every app and framework script: only the inline pre-paint script in <head> can run.
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.goto("/");
  expect(await drawnControls(page)).toMatchObject({
    mode: "OFF",
    emissiveDisplay: "none",
  });
});

test("a v1 value (integer tenths) is ignored and reads as the defaults", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "ddi:controls:v1",
      JSON.stringify({ mode: "OFF", brt: 3, cont: 9 }),
    ),
  );
  await page.goto("/");
  expect(await drawnControls(page)).toMatchObject({
    mode: "DAY",
    gain: "1",
    halo: "0.5",
  });
  await expect(
    page.getByRole("slider", { name: "Brightness" }),
  ).toHaveAttribute("aria-valuenow", "50");
});

test("invalid stored state reads as the defaults", async ({ page }) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, '{"mode":"ON","brt":"x"}'),
    STORAGE_KEY,
  );
  await page.goto("/");
  expect(await drawnControls(page)).toMatchObject({
    mode: "DAY",
    gain: "1",
    halo: "0.5",
  });
});

test("the plain view is set by ?view=plain, persists, and is left by ?view=ddi", async ({
  page,
}) => {
  await page.goto("/?view=plain");
  await expect(page.locator("html")).toHaveAttribute("data-view", "plain");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".ddi-screen")).toBeHidden();

  await page.goto("/supt");
  await expect(page.locator("html")).toHaveAttribute("data-view", "plain");
  await page.getByRole("link", { name: "Display view" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-view", "plain");
  await expect(page.locator(".ddi-screen")).toBeVisible();
});
