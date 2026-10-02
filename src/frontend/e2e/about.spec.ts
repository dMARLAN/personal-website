import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("TAC PB20 opens About on press, and PB18 MENU returns to TAC", async ({
  page,
}) => {
  await page.goto("/");
  const about = page.locator(".ddi-osb[data-pb='20']");
  await expect(about).toHaveAccessibleName("About");
  await about.hover();
  await page.mouse.down();
  await expect(page).toHaveURL(/\/about$/);
  await page.mouse.up();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About");

  const menu = page.locator(".ddi-osb[data-pb='18']");
  await expect(menu).toHaveAccessibleName("Menu");
  await menu.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("button", { name: "Support menu" }),
  ).toBeVisible();
});

test("About shows only MENU: every other OSB is blank", async ({ page }) => {
  await page.goto("/about");
  await expect(page.locator(".ddi-osb:not([aria-hidden='true'])")).toHaveCount(
    1,
  );
});

test("serves the profile without JavaScript", async ({ request }) => {
  const html = await (await request.get("/about")).text();
  expect(html).toContain("<h1>About</h1>");
  expect(html).toContain("<h2>Loadout</h2>");
  expect(html).toMatch(/<a(?=[^>]*data-pb="18")(?=[^>]*href="\/")[^>]*>/);
  expect(html).toContain(
    '<link rel="canonical" href="https://chad.hambley.org/about"/>',
  );
});

for (const { scheme, theme } of [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: scheme });

    test("/about has no axe violations", async ({ page }) => {
      await page.goto("/about");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });

    test("/about in plain view has no axe violations", async ({ page }) => {
      await page.goto("/about?view=plain");
      await expect(
        page.getByRole("heading", { name: "Loadout" }),
      ).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });
  });
}
