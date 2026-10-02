import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** The glass's symbology: what the current employer and role draw. */
async function glass(page: Page): Promise<string> {
  return page.locator(".ddi-square").innerHTML();
}

test("TAC PB7 WORK opens /work on press", async ({ page }) => {
  await page.goto("/");
  const pb7 = page.locator(".ddi-osb[data-pb='7']");
  await expect(pb7).toHaveAccessibleName("Work history");
  await pb7.hover();
  await page.mouse.down();
  await expect(page).toHaveURL(/\/work$/);
  await page.mouse.up();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Work history",
  );
});

test("the tabs and the role arrows change the glass, never the URL", async ({
  page,
}) => {
  await page.goto("/work");
  const historyLength = await page.evaluate(() => history.length);
  const first = await glass(page);

  // Employer tabs fire on press, like every OSB.
  const pb8 = page.locator(".ddi-osb[data-pb='8']");
  await expect(pb8).toHaveAccessibleName("Kestrel Labs");
  await pb8.hover();
  await page.mouse.down();
  await expect.poll(() => glass(page)).not.toBe(first);
  await page.mouse.up();
  const kestrel = await glass(page);

  const next = page.getByRole("button", { name: "Next role" });
  const previous = page.getByRole("button", { name: "Previous role" });
  await next.click();
  await expect.poll(() => glass(page)).not.toBe(kestrel);
  const secondRole = await glass(page);
  await previous.click();
  await expect.poll(() => glass(page)).toBe(kestrel);
  // Up from the first role wraps to the last (Kestrel has three); down from the last wraps back to the first.
  await previous.click();
  await expect.poll(() => glass(page)).not.toBe(kestrel);
  expect(await glass(page)).not.toBe(secondRole);
  await next.click();
  await expect.poll(() => glass(page)).toBe(kestrel);

  await page.getByRole("button", { name: "Northwind Systems" }).click();
  await expect.poll(() => glass(page)).toBe(first);

  await expect(page).toHaveURL(/\/work$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
});

test("the page opens on the newest employer every time", async ({ page }) => {
  await page.goto("/work");
  const first = await glass(page);
  await page.getByRole("button", { name: "Harbor Digital" }).click();
  await expect.poll(() => glass(page)).not.toBe(first);
  await page.reload();
  await expect.poll(() => glass(page)).toBe(first);
});

test("PB18 MENU returns to TAC", async ({ page }) => {
  await page.goto("/work");
  await page.locator(".ddi-osb[data-pb='18']").click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("button", { name: "Support menu" }),
  ).toBeVisible();
});

test("serves every employer and role without JavaScript", async ({
  request,
}) => {
  const html = await (await request.get("/work")).text();
  for (const name of [
    "Northwind Systems",
    "Bluefin Analytics",
    "Kestrel Labs",
    "Harbor Digital",
  ]) {
    expect(html).toContain(`<h2>${name}</h2>`);
  }
  expect(html).toContain("Software Intern");
});

test("the plain view lists every employer and hides the state OSBs", async ({
  page,
}) => {
  await page.goto("/work?view=plain");
  await expect(
    page.getByRole("heading", { level: 2, name: "Harbor Digital" }),
  ).toBeVisible();
  await expect(page.locator(".ddi-osb[data-pb='6']")).toBeHidden();
  await expect(page.getByRole("link", { name: "Tactical menu" })).toBeVisible();
});

for (const { scheme, theme } of [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const) {
  test(`/work has no axe violations by ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/work");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });

  test(`/work in plain view has no axe violations by ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/work?view=plain");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}
