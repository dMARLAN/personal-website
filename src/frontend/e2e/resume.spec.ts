import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("TAC PB6 RESUME opens /resume on press", async ({ page }) => {
  await page.goto("/");
  const pb6 = page.locator(".ddi-osb[data-pb='6']");
  await expect(pb6).toHaveAccessibleName("Resume");
  await pb6.hover();
  await page.mouse.down();
  await expect(page).toHaveURL(/\/resume$/);
  await page.mouse.up();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Resume");
});

test("PB20 downloads the PDF on press, and the URL stays /resume", async ({
  page,
}) => {
  await page.goto("/resume");
  const pb20 = page.locator(".ddi-osb[data-pb='20']");
  await expect(pb20).toHaveAccessibleName("Download the resume (PDF)");
  const historyLength = await page.evaluate(() => history.length);
  await pb20.hover();
  const download = page.waitForEvent("download");
  await page.mouse.down();
  expect((await download).suggestedFilename()).toBe("resume.pdf");
  await page.mouse.up();
  await expect(page).toHaveURL(/\/resume$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
});

test("PB18 MENU returns to TAC", async ({ page }) => {
  await page.goto("/resume");
  await page.locator(".ddi-osb[data-pb='18']").click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("button", { name: "Support menu" }),
  ).toBeVisible();
});

test("serves the PDF and the semantic content without JavaScript", async ({
  request,
}) => {
  const pdf = await request.get("/resume.pdf");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  const html = await (await request.get("/resume")).text();
  expect(html).toContain("<h2>Skills</h2>");
  expect(html).toContain("<h2>Qualifications</h2>");
  expect(html).toMatch(/<a[^>]*href="\/resume.pdf"[^>]*download/);
});

for (const { scheme, theme } of [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const) {
  test(`/resume has no axe violations by ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/resume");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });

  test(`/resume in plain view has no axe violations by ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/resume?view=plain");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}
