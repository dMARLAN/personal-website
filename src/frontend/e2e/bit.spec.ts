import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

function statusOf(page: Page, checks: string): Promise<string | null> {
  return page
    .locator(`.ddi-square [data-bit-checks="${checks}"]`)
    .getAttribute("data-bit-status");
}

async function expectStatus(
  page: Page,
  checks: string,
  status: string,
): Promise<void> {
  await expect(
    page.locator(`.ddi-square [data-bit-checks="${checks}"]`),
  ).toHaveAttribute("data-bit-status", status);
}

test("SUPT PB8 BIT opens /bit, and PB18 MENU returns to TAC", async ({
  page,
}) => {
  await page.goto("/ddi");
  await page.getByRole("button", { name: "Support menu" }).click();
  const bit = page.locator(".ddi-osb[data-pb='8']");
  await expect(bit).toHaveAccessibleName("Built-in test, simulated");
  await bit.click();
  await expect(page).toHaveURL(/\/bit$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Built-in test, simulated",
  );
  await page.getByRole("link", { name: "Tactical menu" }).click();
  await expect(page).toHaveURL(/\/ddi$/);
  await expect(
    page.getByRole("button", { name: "Support menu" }),
  ).toBeVisible();
});

test("levels, paging and tests change the glass but never the URL", async ({
  page,
}) => {
  await page.goto("/bit");
  const historyLength = await page.evaluate(() => history.length);

  // PAGE cycles the failure list.
  const firstRow = page.locator('.ddi-square [data-bit-checks="FCSB"]');
  await expect(firstRow).toHaveCount(1);
  await page.getByRole("button", { name: "Next page of failures" }).click();
  await expect(firstRow).toHaveCount(0);
  await page.getByRole("button", { name: "Next page of failures" }).click();
  await expect(firstRow).toHaveCount(1);

  // A group OSB opens its sublevel; a check's legend runs its test.
  await page.getByRole("button", { name: "NAV tests" }).click();
  await expect(page.getByRole("button", { name: "Test DNS" })).toBeVisible();
  await expectStatus(page, "ADC", "MUX FAIL");
  await page.getByRole("button", { name: "Test MERGE" }).click();
  await expectStatus(page, "ADC", "IN TEST");
  await expectStatus(page, "ADC", "GO");

  // STOP aborts a running test.
  await page.getByRole("button", { name: "Test VPN" }).click();
  await expectStatus(page, "TCN", "IN TEST");
  await page.getByRole("button", { name: "Stop tests" }).click();
  await expectStatus(page, "TCN", "NOT RDY");

  // BIT returns to BIT FAILURES, which keeps the result; CONFIG opens S/W CONFIGURATION.
  await page.getByRole("button", { name: "BIT failures" }).click();
  await expectStatus(page, "ADC", "GO");
  await page.getByRole("button", { name: "Software configuration" }).click();
  await expect(page.getByRole("button", { name: "Override" })).toBeAttached();
  await page.getByRole("button", { name: "BIT failures" }).click();

  await expect(page).toHaveURL(/\/bit$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("a test resolves at once, with no IN TEST", async ({ page }) => {
    await page.goto("/bit");
    await page.getByRole("button", { name: "Run every test" }).click();
    expect(await statusOf(page, "ADC")).toBe("GO");
  });
});

test("the tests start fresh each time the page mounts", async ({ page }) => {
  await page.goto("/bit");
  await page.getByRole("button", { name: "Run every test" }).click();
  await expectStatus(page, "ADC", "GO");
  await page.getByRole("link", { name: "Tactical menu" }).click();
  await expect(page).toHaveURL(/\/ddi$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/bit$/);
  await expectStatus(page, "ADC", "MUX FAIL");
});

test("serves every level's content without JavaScript", async ({ request }) => {
  const html = await (await request.get("/bit")).text();
  expect(html).toContain("<h1>Built-in test, simulated</h1>");
  expect(html).toContain("<h2>STATUS MONITOR</h2>");
  expect(html).toContain("<h2>Software configuration</h2>");
  expect(html).toContain("NPM AUDIT");
});

for (const { scheme, theme } of [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: scheme });

    test("/bit has no axe violations on BIT FAILURES and a sublevel", async ({
      page,
    }) => {
      await page.goto("/bit");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.getByRole("button", { name: "DISPLAYS tests" }).click();
      await expect(
        page.getByRole("button", { name: "Test CSS, HTML, JS" }),
      ).toBeVisible();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });

    test("/bit in plain view has no axe violations", async ({ page }) => {
      await page.goto("/bit?view=plain");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(
        page.getByRole("heading", { level: 2, name: "NAV" }),
      ).toBeVisible();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
  });
}
