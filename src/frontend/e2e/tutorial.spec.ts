import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { PAGES } from "../src/ddi/pages/registry";
import { TUTORIAL_DONE, TUTORIAL_STORAGE_KEY } from "../src/ddi/tutorial/state";

const MENU = PAGES.menu.path;

// The config stores the tutorial as done for every other spec; these tests start as a first-time visitor.
test.use({ storageState: { cookies: [], origins: [] } });

function tutorial(page: Page): ReturnType<Page["getByRole"]> {
  return page.getByRole("dialog", { name: "Quick start" });
}

async function storedFlag(page: Page): Promise<string | null> {
  return page.evaluate(
    (key) => localStorage.getItem(key),
    TUTORIAL_STORAGE_KEY,
  );
}

test("shows on the first visit, decided before any app JavaScript runs", async ({
  page,
}) => {
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.goto(MENU);
  await expect(page.locator("html")).toHaveAttribute("data-tutorial", "open");
  await expect(tutorial(page)).toBeVisible();
});

test("pressing an OSB closes it and also does the OSB's job", async ({
  page,
}) => {
  await page.goto(MENU);
  await expect(tutorial(page)).toBeVisible();
  await page
    .getByRole("navigation", { name: "Display pushbuttons" })
    .getByRole("link", { name: PAGES.about.label })
    .click();
  await expect(page).toHaveURL(PAGES.about.path);
  await expect(tutorial(page)).toBeHidden();
  expect(await storedFlag(page)).toBe(TUTORIAL_DONE);
});

test("pressing a knob closes it and also turns the knob", async ({ page }) => {
  await page.goto(MENU);
  const brightness = page.getByRole("slider", { name: "Brightness" });
  await brightness.click({ position: { x: 2, y: 10 } });
  await expect(tutorial(page)).toBeHidden();
  await expect(brightness).toHaveAttribute("aria-valuenow", "40");
});

test("is not shown again after a reload, not even for a frame", async ({
  page,
}) => {
  await page.goto(MENU);
  await page.getByRole("button", { name: "Got it" }).click();
  await expect(tutorial(page)).toBeHidden();

  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.reload();
  await expect(page.locator("html")).not.toHaveAttribute("data-tutorial");
  await expect(tutorial(page)).toBeHidden();
});

test("Escape closes it", async ({ page }) => {
  await page.goto(MENU);
  await expect(tutorial(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tutorial(page)).toBeHidden();
  expect(await storedFlag(page)).toBe(TUTORIAL_DONE);
});

test("Tab does not close it, and Got it comes before the OSBs", async ({
  page,
}) => {
  await page.goto(MENU);
  const close = page.getByRole("button", { name: "Got it" });
  for (let press = 0; press < 20; press++) {
    await page.keyboard.press("Tab");
    if (await close.evaluate((element) => element === document.activeElement)) {
      break;
    }
  }
  await expect(close).toBeFocused();
  await expect(tutorial(page)).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(tutorial(page)).toBeHidden();
});

test("is absent in the plain view and stays pending for the display view", async ({
  page,
}) => {
  await page.goto(`${MENU}?view=plain`);
  await expect(page.locator("html")).toHaveAttribute("data-view", "plain");
  await expect(page.locator("html")).not.toHaveAttribute("data-tutorial");
  await expect(tutorial(page)).toBeHidden();
  await page.getByRole("link", { name: "Display view" }).click();
  await expect(tutorial(page)).toBeVisible();
});

for (const { scheme, theme } of [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const) {
  test(`has no axe violations while open, ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto(MENU);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(tutorial(page)).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}
