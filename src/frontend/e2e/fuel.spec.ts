import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function drawnTotal(page: Page): Promise<string | null> {
  return page.locator("[data-fuel-total]").getAttribute("data-fuel-total");
}

test("SUPT PB20 FUEL opens /fuel, and MENU returns to TAC", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Support menu" }).click();
  const fuel = page.locator(".ddi-osb[data-pb='20']");
  await expect(fuel).toHaveAccessibleName("Fuel, simulated");
  await fuel.click();
  await expect(page).toHaveURL(/\/fuel$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Fuel, simulated" }),
  ).toBeAttached();

  await page.getByRole("link", { name: "Tactical menu" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("FLBIT boxes for 13 s, then returns, and the URL never changes", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/fuel");
  const historyLength = await page.evaluate(() => history.length);
  const flbit = page.locator(".ddi-osb[data-pb='20']");
  await expect(flbit).toHaveAccessibleName("Fuel low warning test");

  await flbit.click();
  await expect(flbit).toHaveAccessibleName("Fuel low warning test, running");
  await expect(page).toHaveURL(/\/fuel$/);

  await page.clock.fastForward(12_000);
  await expect(flbit).toHaveAccessibleName("Fuel low warning test, running");
  await page.clock.fastForward(1_000);
  await expect(flbit).toHaveAccessibleName("Fuel low warning test");
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
});

test("RESET SDC is a real, inert legend", async ({ page }) => {
  await page.goto("/fuel");
  const reset = page.locator(".ddi-osb[data-pb='10']");
  await expect(reset).toHaveAttribute("aria-disabled", "true");
  await reset.click({ force: true });
  await expect(page).toHaveURL(/\/fuel$/);
});

test("the reserves move gently over time", async ({ page }) => {
  await page.clock.install();
  await page.goto("/fuel");
  const start = await drawnTotal(page);
  await page.clock.fastForward(30_000);
  await expect.poll(() => drawnTotal(page)).not.toBe(start);
});

test("the reserves hold still under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/fuel");
  const start = await drawnTotal(page);
  await page.clock.fastForward(30_000);
  expect(await drawnTotal(page)).toBe(start);
});

test("serves the reserves without JavaScript", async ({ request }) => {
  const html = await (await request.get("/fuel")).text();
  expect(html).toContain("<dt>Coffee</dt>");
  expect(html).toContain(
    'rel="canonical" href="https://chad.hambley.org/fuel"',
  );
});

for (const { scheme, theme } of [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const) {
  test(`/fuel has no axe violations by ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/fuel");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}
