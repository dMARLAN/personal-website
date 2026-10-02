import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** The path data of every string in the symbology square: headers and labels first, then the values. */
async function squarePaths(page: Page): Promise<string[]> {
  return page
    .locator("#ddi-square path")
    .evaluateAll((paths) => paths.map((path) => path.getAttribute("d") ?? ""));
}

test("SUPT PB12 ENG opens /server", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Support menu" }).click();
  const eng = page.locator(".ddi-osb[data-pb='12']");
  await expect(eng).toHaveAccessibleName("Home server, simulated");
  await eng.click();
  await expect(page).toHaveURL(/\/server$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Home server, simulated" }),
  ).toBeAttached();
  await expect(page.locator("#ddi-square path")).toHaveCount(2 + 13 + 26);
});

test("the readings drift in place: the URL and history stay put", async ({
  page,
}) => {
  await page.goto("/server");
  const historyLength = await page.evaluate(() => history.length);
  const before = await squarePaths(page);
  await expect
    .poll(async () => (await squarePaths(page)).slice(15), { timeout: 10_000 })
    .not.toEqual(before.slice(15));
  expect((await squarePaths(page)).slice(0, 15)).toEqual(before.slice(0, 15));

  const record = page.getByRole("button", { name: "Record" });
  await expect(record).toHaveAttribute("aria-disabled", "true");
  await record.click({ force: true });
  await expect(page).toHaveURL(/\/server$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
});

test.describe("under reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the readings stay static", async ({ page }) => {
    await page.goto("/server");
    const before = await squarePaths(page);
    await page.waitForTimeout(3500);
    expect(await squarePaths(page)).toEqual(before);
  });
});

test("PB18 MENU returns to / on TAC", async ({ page }) => {
  await page.goto("/server");
  await page.getByRole("link", { name: "Tactical menu" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("button", { name: "Support menu" }),
  ).toBeVisible();
});

test("serves the metrics table and the MENU link without JavaScript", async ({
  request,
}) => {
  const html = await (await request.get("/server")).text();
  expect(html).toContain("<caption>Host metrics</caption>");
  expect(html).toContain("Load average (1 minute)");
  expect(html).toContain("3.40");
  expect(html).toMatch(/<a(?=[^>]*data-pb="18")(?=[^>]*href="\/")[^>]*>/);
  expect(html).toContain(
    '<link rel="canonical" href="https://chad.hambley.org/server"',
  );
});

test("lists /server in the sitemap", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<loc>https://chad.hambley.org/server</loc>");
});

const SCHEMES = [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const;

for (const { scheme, theme } of SCHEMES) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: scheme });

    for (const path of ["/server", "/server?view=plain"]) {
      test(`${path} has no axe violations`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const { violations } = await new AxeBuilder({ page }).analyze();
        expect(violations).toEqual([]);
      });
    }
  });
}
