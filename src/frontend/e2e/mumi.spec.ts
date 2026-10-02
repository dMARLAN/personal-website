import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const ADMIN_URL = /\/admin$/;

/** The load ends on the admin console: its URL, then its sign-in form once the console has rendered. */
async function expectAdminConsole(page: Page): Promise<void> {
  await page.waitForURL(ADMIN_URL);
  await expect(
    page.getByRole("heading", { level: 2, name: "Sign in" }),
  ).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
}

const LOAD_NAME = "Load the admin console";

/** The `LOAD` legend (ours), on PB12 of the More set. */
async function showLoad(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: "More data types" }).click();
  const load = page.locator(".ddi-osb-island[data-pb='12'] a");
  await expect(load).toBeVisible();
  return load;
}

function loadPhase(page: Page): Promise<string | null> {
  return page
    .locator("[data-mumi-load]")
    .first()
    .getAttribute("data-mumi-load");
}

test("SUPT PB10 MUMI opens /mumi", async ({ page }) => {
  await page.goto("/ddi");
  await page.getByRole("button", { name: "Support menu" }).click();
  const mumi = page.locator(".ddi-osb[data-pb='10']");
  await expect(mumi).toHaveAccessibleName("Mission initialization, simulated");
  await mumi.click();
  await expect(page).toHaveURL(/\/mumi$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Mission initialization, simulated",
    }),
  ).toBeAttached();
});

test("LOAD runs the load on the glass, then opens /admin", async ({ page }) => {
  await page.goto("/mumi");
  const historyLength = await page.evaluate(() => history.length);
  expect(await loadPhase(page)).toBe("idle");

  // ID (PB11) is back to its real, inert role.
  const id = page.locator(".ddi-osb[data-pb='11']");
  await expect(id).toHaveAccessibleName("Identification data");
  await expect(id).toHaveAttribute("aria-disabled", "true");

  // MORE and RETURN switch the legend sets in place; LOAD is on the More set.
  const load = await showLoad(page);
  await expect(page.locator(".ddi-osb[data-pb='10']")).toHaveAccessibleName(
    "Main data types",
  );
  await expect(load).toHaveAccessibleName(LOAD_NAME);
  await expect(load).toHaveAttribute("href", "/admin");
  const started = Date.now();
  await load.click();

  // The load runs on the glass while the URL stays put.
  await expect.poll(() => loadPhase(page)).toBe("loading");
  await expect(page).toHaveURL(/\/mumi$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  // "complete" lasts 400 ms before the navigation, so poll fast enough to see it.
  await expect
    .poll(() => loadPhase(page), { intervals: [50] })
    .toBe("complete");
  await expect(page).toHaveURL(/\/mumi$/);

  await page.waitForURL(ADMIN_URL);
  expect(Date.now() - started).toBeGreaterThanOrEqual(1500);
  await expectAdminConsole(page);
});

test("Enter on LOAD runs the same load", async ({ page }) => {
  await page.goto("/mumi");
  await (await showLoad(page)).focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => loadPhase(page)).toBe("loading");
  await expectAdminConsole(page);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("LOAD opens /admin at once, with no load on the glass", async ({
    page,
  }) => {
    await page.goto("/mumi");
    const load = await showLoad(page);
    const started = Date.now();
    await load.click();
    await page.waitForURL(ADMIN_URL);
    expect(Date.now() - started).toBeLessThan(1500);
    await expectAdminConsole(page);
  });
});

test("serves the mission data and a plain admin link without JavaScript, noindexed", async ({
  request,
}) => {
  const html = await (await request.get("/mumi")).text();
  expect(html).toContain("<h1>Mission initialization, simulated</h1>");
  expect(html).toContain(`<a href="/admin">${LOAD_NAME}</a>`);
  expect(html).toContain("HOMELAB-01");
  expect(html).toContain('<meta name="robots" content="noindex, nofollow"/>');
});

for (const { scheme, theme } of [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const) {
  test(`/mumi has no axe violations by ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/mumi");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}
