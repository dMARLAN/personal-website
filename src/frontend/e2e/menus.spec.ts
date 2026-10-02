import { expect, test } from "@playwright/test";

test("PB18 toggles TAC and SUPT on press", async ({ page }) => {
  await page.goto("/");
  const toSupt = page.getByRole("link", { name: "Support menu" });
  await expect(toSupt).toHaveAttribute("data-pb", "18");

  // The action fires on pointerdown, before the button is released.
  await toSupt.hover();
  await page.mouse.down();
  await expect(page).toHaveURL(/\/supt$/);
  await page.mouse.up();
  await expect(page).toHaveTitle(/^Support menu · /);
  await expect(
    page.getByRole("heading", { level: 1, name: "Support menu" }),
  ).toBeAttached();

  await page.getByRole("link", { name: "Tactical menu" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Support menu" })).toBeAttached();

  await page.goBack();
  await expect(page).toHaveURL(/\/supt$/);
});

test("the menus show their boxed titles and only MENU until pages ship", async ({
  page,
}) => {
  await page.goto("/supt");
  const legends = page.locator(".ddi-osb:not([aria-hidden='true'])");
  await expect(legends).toHaveCount(1);
  await expect(page.locator(".ddi-osb[aria-hidden='true']")).toHaveCount(19);
});

test("serves the semantic content and OSB links without JavaScript", async ({
  request,
}) => {
  for (const [path, heading, href] of [
    ["/", null, "/supt"],
    ["/supt", "Support menu", "/"],
  ] as const) {
    const html = await (await request.get(path)).text();
    expect(html).toContain('<main id="content"');
    if (heading !== null) {
      expect(html).toContain(`<h1>${heading}</h1>`);
    }
    expect(html).toMatch(
      new RegExp(
        `<a[^>]+href="${href}"[^>]*class="ddi-osb"|<a[^>]+class="ddi-osb"[^>]*href="${href}"`,
      ),
    );
    expect(html).toContain('rel="canonical"');
  }
});

test("lists the shipped routes in the sitemap", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<loc>https://chad.hambley.org/</loc>");
  expect(sitemap).toContain("<loc>https://chad.hambley.org/supt</loc>");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap: https://chad.hambley.org/sitemap.xml");
});
