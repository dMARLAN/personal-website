import { expect, test } from "@playwright/test";

test("the keyboard reaches the skip link, the OSBs, the knobs, then the theme toggle", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Text view" })).toBeFocused();
  // The visually hidden semantic layer's links to shipped pages come next, in DOM order (section 10.2).
  for (const link of await page.locator("main a").all()) {
    await page.keyboard.press("Tab");
    await expect(link).toBeFocused();
  }
  const order = [
    page.getByRole("button", { name: "Support menu" }),
    page.getByRole("slider", { name: "Brightness" }),
    page.getByRole("slider", { name: "Contrast" }),
    page.getByRole("button", { name: "Night mode" }),
  ];
  for (const target of order) {
    await page.keyboard.press("Tab");
    await expect(target).toBeFocused();
    await expect(target).toBeInViewport();
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
