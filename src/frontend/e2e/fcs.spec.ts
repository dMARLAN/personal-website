import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("SUPT PB15 FCS opens /fcs, and MENU returns to TAC", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Support menu" }).click();
  const fcs = page.locator(".ddi-osb[data-pb='15']");
  await expect(fcs).toHaveAccessibleName("Flight controls, simulated");
  await fcs.click();
  await expect(page).toHaveURL(/\/fcs$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Flight controls, simulated" }),
  ).toBeAttached();

  await page.getByRole("link", { name: "Tactical menu" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("button", { name: "Support menu" }),
  ).toBeVisible();
});

test("draws the real legends: BLIN and AOA are inert and keep the URL", async ({
  page,
}) => {
  await page.goto("/fcs");
  const historyLength = await page.evaluate(() => history.length);
  const blin = page.locator(".ddi-osb[data-pb='2']");
  const aoa = page.locator(".ddi-osb[data-pb='16']");
  await expect(blin).toHaveAttribute("aria-disabled", "true");
  await expect(aoa).toHaveAttribute("aria-disabled", "true");
  await blin.click({ force: true });
  await aoa.click({ force: true });
  await expect(page).toHaveURL(/\/fcs$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  // BLIN, AOA and MENU; the other 17 OSBs are blank.
  await expect(page.locator(".ddi-osb[aria-hidden='true']")).toHaveCount(17);
});

test("serves the system-health table without JavaScript", async ({
  request,
}) => {
  const html = await (await request.get("/fcs")).text();
  expect(html).toContain("<h2>System health</h2>");
  expect(html).toContain("DNS (it is always DNS)");
  expect(html).toContain('rel="canonical" href="https://chad.hambley.org/fcs"');
});

for (const { scheme, theme } of [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const) {
  test(`/fcs has no axe violations by ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/fcs");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}
