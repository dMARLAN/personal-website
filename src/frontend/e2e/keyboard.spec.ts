import { expect, test } from "@playwright/test";

test("the keyboard reaches the skip link, the OSBs, the knobs, then the theme toggle", async ({
  page,
}) => {
  await page.goto("/");
  // The semantic layer's links come first (design section 10.2). It is visually hidden in DDI mode, so its links take
  // focus off screen; the OSBs follow in PB order.
  const semanticLink = page
    .locator("#content")
    .getByRole("link", { name: "Radar, simulated" });
  const order = [
    page.getByRole("link", { name: "Text view" }),
    semanticLink,
    page
      .getByRole("navigation", { name: "Display pushbuttons" })
      .getByRole("link", { name: "Radar, simulated" }),
    page.getByRole("button", { name: "Support menu" }),
    page.getByRole("slider", { name: "Brightness" }),
    page.getByRole("slider", { name: "Contrast" }),
    page.getByRole("button", { name: "Night mode" }),
  ];
  for (const target of order) {
    await page.keyboard.press("Tab");
    await expect(target).toBeFocused();
    if (target !== semanticLink) {
      await expect(target).toBeInViewport();
    }
  }
});

test("Enter on PB18 switches the menu in place and keeps focus", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Support menu" }).focus();
  await page.keyboard.press("Enter");
  const toTac = page.getByRole("button", { name: "Tactical menu" });
  await expect(toTac).toBeFocused();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Support menu" }),
  ).toBeFocused();
  await expect(page).toHaveURL(/\/$/);
});

test("arrow keys, Home and End turn a knob", async ({ page }) => {
  await page.goto("/");
  const contrast = page.getByRole("slider", { name: "Contrast" });
  await contrast.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(contrast).toHaveAttribute("aria-valuenow", "30");
  await page.keyboard.press("ArrowRight");
  await expect(contrast).toHaveAttribute("aria-valuetext", "40%");
  await page.keyboard.press("End");
  await expect(contrast).toHaveAttribute("aria-valuenow", "100");
  await page.keyboard.press("Home");
  await expect(contrast).toHaveAttribute("aria-valuenow", "0");
});

test("the skip link opens the plain view", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/\?view=plain$/);
  await expect(page.locator("html")).toHaveAttribute("data-view", "plain");
});
