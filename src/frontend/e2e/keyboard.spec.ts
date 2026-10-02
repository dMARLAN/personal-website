import { expect, test } from "@playwright/test";

test("the keyboard reaches the skip link, the OSBs, the knobs, then the theme toggle", async ({
  page,
}) => {
  await page.goto("/");
  // DOM order (design section 10.2): the skip link, the semantic layer's links to shipped pages, their legends in PB
  // order and PB18, the knobs, then the toggle. The semantic layer is visually hidden in DDI mode, so its links take
  // focus out of view: an open question for Chad (docs/pages/resume.md).
  const semanticLinks = page.locator("main a");
  const osbs = page.locator(".ddi-osbs .ddi-osb:not([tabindex='-1'])");
  await expect(osbs.last()).toHaveAccessibleName("Support menu");
  const all = async (locator: typeof osbs): Promise<(typeof osbs)[]> =>
    Array.from({ length: await locator.count() }, (_, index) =>
      locator.nth(index),
    );
  const visible = [
    ...(await all(osbs)),
    page.getByRole("slider", { name: "Brightness" }),
    page.getByRole("slider", { name: "Contrast" }),
    page.getByRole("button", { name: "Night mode" }),
  ];
  const order = [
    page.getByRole("link", { name: "Text view" }),
    ...(await all(semanticLinks)),
    ...visible,
  ];
  for (const target of order) {
    await page.keyboard.press("Tab");
    await expect(target).toBeFocused();
    if (visible.includes(target) || order[0] === target) {
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
