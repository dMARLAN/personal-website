import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { PAGES } from "../src/ddi/pages/registry";
import { TUTORIAL_OSB } from "../src/ddi/tutorial/highlight";
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

test("never shows on the standard homepage, only in the DDI", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-tutorial");
  await expect(tutorial(page)).toHaveCount(0);
  expect(await storedFlag(page)).toBeNull();
  await page.goto(PAGES.projects.path);
  await expect(tutorial(page)).toBeVisible();
});

test("a press on the glass, the dimmed backdrop or empty bezel leaves it open", async ({
  page,
}) => {
  await page.goto(MENU);
  await expect(tutorial(page)).toBeVisible();
  // The glass left of the panel, the dimmed bezel between PB8 and PB9, and a corner of the backdrop over the glass.
  for (const [x, y] of [
    [600, 700],
    [1037, 28],
    [300, 300],
  ] as const) {
    await page.mouse.click(x, y);
  }
  await page.keyboard.press("a");
  await page.keyboard.press("Enter");
  await expect(tutorial(page)).toBeVisible();
  expect(await storedFlag(page)).toBeNull();
});

test("pressing an OSB that is not highlighted closes it and also does the OSB's job", async ({
  page,
}) => {
  expect(PAGES.about.menu?.pb).not.toBe(TUTORIAL_OSB);
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

test("Enter on a focused OSB closes it and also does the OSB's job", async ({
  page,
}) => {
  await page.goto(MENU);
  await page
    .getByRole("navigation", { name: "Display pushbuttons" })
    .getByRole("link", { name: PAGES.work.label })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(PAGES.work.path);
  await expect(tutorial(page)).toBeHidden();
});

test("pressing a knob closes it and also turns the knob", async ({ page }) => {
  await page.goto(MENU);
  const brightness = page.getByRole("slider", { name: "Brightness" });
  await brightness.click({ position: { x: 2, y: 10 } });
  await expect(tutorial(page)).toBeHidden();
  await expect(brightness).toHaveAttribute("aria-valuenow", "40");
});

test("dragging a knob closes it and also turns the knob", async ({ page }) => {
  await page.goto(MENU);
  const contrast = page.getByRole("slider", { name: "Contrast" });
  const box = await contrast.boundingBox();
  if (box === null) {
    throw new Error("the Contrast knob has no box");
  }
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 60, y, { steps: 6 });
  await page.mouse.up();
  await expect(tutorial(page)).toBeHidden();
  expect(Number(await contrast.getAttribute("aria-valuenow"))).toBeLessThan(50);
});

test("pressing the theme toggle closes it and also switches the theme", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(MENU);
  await expect(tutorial(page)).toBeVisible();
  await page.getByRole("button", { name: "Night mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await expect(tutorial(page)).toBeHidden();
});

test("Got it closes it", async ({ page }) => {
  await page.goto(MENU);
  await page.getByRole("button", { name: "Got it" }).click();
  await expect(tutorial(page)).toBeHidden();
  expect(await storedFlag(page)).toBe(TUTORIAL_DONE);
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
