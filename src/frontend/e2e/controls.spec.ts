import { expect, test } from "@playwright/test";
import { STORAGE_KEY, drawnControls, storedControls } from "./helpers";

test("the controls change the display and persist across a reload", async ({
  page,
}) => {
  await page.goto("/");
  expect(await drawnControls(page)).toMatchObject({
    mode: "DAY",
    gain: "1",
    halo: "0.5",
  });

  await page.getByRole("button", { name: "Decrease brightness" }).click();
  await page.getByRole("button", { name: "Increase contrast" }).click();
  await page.getByRole("button", { name: "Turn toward OFF" }).click();
  expect(await drawnControls(page)).toMatchObject({
    mode: "NIGHT",
    gain: "0.1007",
    halo: "0.45",
    selectorAngle: "-25deg",
  });
  expect(await storedControls(page)).toEqual({
    mode: "NIGHT",
    brt: 9,
    cont: 6,
  });

  await page.reload();
  expect(await drawnControls(page)).toMatchObject({
    mode: "NIGHT",
    gain: "0.1007",
    halo: "0.45",
  });
  await expect(page.getByTestId("ddi-brt")).toHaveText("9 of 10");
  await expect(page.getByTestId("ddi-mode")).toHaveText("NIGHT");
});

test("the wheel steps the selector and BRT", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("group", { name: "Brightness" }).hover();
  await page.mouse.wheel(0, 150);
  await expect(page.getByTestId("ddi-brt")).toHaveText("7 of 10");
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
      JSON.stringify({ mode: "OFF", brt: 10, cont: 5 }),
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
