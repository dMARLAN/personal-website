import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { LINKS } from "../src/content/links";

function osb(page: Page, pb: number): ReturnType<Page["locator"]> {
  return page.locator(`.ddi-osb[data-pb='${pb}']`);
}

test("TAC PB9 opens Links on press", async ({ page }) => {
  await page.goto("/");
  await expect(osb(page, 9)).toHaveAccessibleName("Links");
  await osb(page, 9).hover();
  await page.mouse.down();
  await expect(page).toHaveURL(/\/links$/);
  await page.mouse.up();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Links");
});

test("the keypad, arrows and CLR change the selection, never the URL", async ({
  page,
}) => {
  await page.goto("/links");
  const historyLength = await page.evaluate(() => history.length);
  const ent = osb(page, 19);
  await expect(ent).toHaveAccessibleName(`Open ${LINKS[0].name}`);

  await osb(page, 9).click();
  await expect(ent).toHaveAccessibleName(`Open ${LINKS[1].name}`);
  await expect(ent).toHaveAttribute("href", LINKS[1].url);

  await page.getByRole("button", { name: "Next link" }).click();
  await expect(ent).toHaveAccessibleName(`Open ${LINKS[2].name}`);
  await page.getByRole("button", { name: "Previous link" }).click();
  await page.getByRole("button", { name: "Previous link" }).click();
  await expect(ent).toHaveAccessibleName(`Open ${LINKS[0].name}`);
  await page.getByRole("button", { name: "Previous link" }).click();
  await expect(ent).toHaveAccessibleName(`Open ${LINKS.at(-1)?.name}`);

  await page.getByRole("button", { name: "Clear selection" }).click();
  await expect(ent).toHaveAttribute("aria-disabled", "true");

  await expect(page).toHaveURL(/\/links$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
});

test("ENT opens the selected link in a new tab with no opener, on press", async ({
  page,
  context,
}) => {
  await context.route("https://example.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<title>stub</title>" }),
  );
  await page.goto("/links");
  await osb(page, 8).click();
  const popupPromise = context.waitForEvent("page");
  await osb(page, 19).hover();
  await page.mouse.down();
  const popup = await popupPromise;
  await page.mouse.up();
  await popup.waitForLoadState();
  expect(popup.url()).toBe(LINKS[0].url);
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  await expect(page).toHaveURL(/\/links$/);
  expect(context.pages()).toHaveLength(2);
});

test("serves every link without JavaScript", async ({ request }) => {
  const html = await (await request.get("/links")).text();
  for (const link of LINKS) {
    expect(html).toContain(`href="${link.url}"`);
  }
  expect(html).toMatch(
    /<a(?=[^>]*data-pb="19")(?=[^>]*target="_blank")(?=[^>]*rel="noopener noreferrer")[^>]*>/,
  );
});

for (const { scheme, theme } of [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: scheme });

    test("/links has no axe violations, with and without a selection", async ({
      page,
    }) => {
      await page.goto("/links");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.getByRole("button", { name: "Clear selection" }).click();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });

    test("/links in plain view has no axe violations", async ({ page }) => {
      await page.goto("/links?view=plain");
      await expect(
        page.getByRole("link", { name: LINKS[0].name, exact: true }),
      ).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });
  });
}
