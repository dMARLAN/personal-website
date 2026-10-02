import { expect, test } from "@playwright/test";

test("the keyboard reaches the skip link, the OSBs, then the controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Text view" })).toBeFocused();
  await expect(page.getByRole("link", { name: "Text view" })).toBeInViewport();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Support menu" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Turn toward OFF" }),
  ).toBeFocused();
});

test("Enter on an OSB navigates, and arrow keys turn a knob", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Support menu" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/supt$/);

  await page.getByRole("button", { name: "Increase contrast" }).focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByTestId("ddi-cont")).toHaveText("3 of 10");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("ddi-cont")).toHaveText("4 of 10");
});

test("the selector keeps focus at its end stop", async ({ page }) => {
  await page.goto("/");
  const toOff = page.getByRole("button", { name: "Turn toward OFF" });
  await toOff.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(page.getByTestId("ddi-mode")).toHaveText("OFF");
  await expect(toOff).toBeFocused();
});

test("the skip link opens the plain view", async ({ page }) => {
  await page.goto("/supt");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/supt\?view=plain$/);
  await expect(page.locator("html")).toHaveAttribute("data-view", "plain");
});
