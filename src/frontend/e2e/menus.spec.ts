import { expect, test } from "@playwright/test";

test("PB18 toggles TAC and SUPT in place on press, and the URL stays /", async ({
  page,
}) => {
  await page.goto("/");
  const historyLength = await page.evaluate(() => history.length);
  const pb18 = page.locator(".ddi-osb[data-pb='18']");
  await expect(pb18).toHaveAccessibleName("Support menu");

  // The action fires on pointerdown, before the button is released.
  await pb18.hover();
  await page.mouse.down();
  await expect(pb18).toHaveAccessibleName("Tactical menu");
  await page.mouse.up();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);

  await pb18.click();
  await expect(pb18).toHaveAccessibleName("Support menu");
  await expect(page).toHaveURL(/\/$/);
});

test("the page opens on TAC every time, including after a reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Support menu" }).click();
  await expect(
    page.getByRole("button", { name: "Tactical menu" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Support menu" }),
  ).toBeVisible();
});

test("the menus show MENU and the shipped pages' legends only", async ({
  page,
}) => {
  await page.goto("/");
  const legends = page.locator(".ddi-osb:not([aria-hidden='true'])");
  const count = await legends.count();
  expect(count).toBeGreaterThanOrEqual(1);
  await expect(page.locator(".ddi-osb[aria-hidden='true']")).toHaveCount(
    20 - count,
  );
  await expect(page.locator(".ddi-osb[data-pb='18']")).toHaveAccessibleName(
    "Support menu",
  );
});

test("/supt no longer exists", async ({ request }) => {
  expect((await request.get("/supt")).status()).toBe(404);
});

test("serves both menus' semantic content without JavaScript", async ({
  request,
}) => {
  const html = await (await request.get("/")).text();
  expect(html).toContain('<main id="content"');
  expect(html).toContain("<h2>Tactical menu</h2>");
  expect(html).toContain("<h2>Support menu</h2>");
  expect(html).toMatch(
    /<button(?=[^>]*data-action="state")(?=[^>]*data-pb="18")[^>]*>/,
  );
  expect(html).toContain('rel="canonical"');
});

test("the plain view lists both menus and hides the state OSB", async ({
  page,
}) => {
  await page.goto("/?view=plain");
  await expect(
    page.getByRole("heading", { level: 2, name: "Tactical menu" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Support menu" }),
  ).toBeVisible();
  await expect(page.locator(".ddi-osb[data-pb='18']")).toBeHidden();
});

test("lists only / in the sitemap", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<loc>https://chad.hambley.org/</loc>");
  expect(sitemap).not.toContain("/supt");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap: https://chad.hambley.org/sitemap.xml");
});
