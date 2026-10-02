import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("SUPT PB11 CHKLST opens /chklst, and MENU returns to TAC", async ({
  page,
}) => {
  await page.goto("/ddi");
  await page.getByRole("button", { name: "Support menu" }).click();
  const checklist = page.locator(".ddi-osb[data-pb='11']");
  await expect(checklist).toHaveAccessibleName("Pre-flight checklist");
  await checklist.click();
  await expect(page).toHaveURL(/\/chklst$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Pre-flight checklist" }),
  ).toBeAttached();

  await page.getByRole("link", { name: "Tactical menu" }).click();
  await expect(page).toHaveURL(/\/ddi$/);
});

test("has no legend but MENU, as in DCS, so a press elsewhere keeps the URL", async ({
  page,
}) => {
  await page.goto("/chklst");
  await expect(page.locator(".ddi-osb[aria-hidden='true']")).toHaveCount(19);
  await page.locator(".ddi-osb[data-pb='11']").click({ force: true });
  await expect(page).toHaveURL(/\/chklst$/);
});

test("lists both checklists in the plain view", async ({ page }) => {
  await page.goto("/chklst?view=plain");
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "T.O.: Start of the working day",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "LAND: End of the working day",
    }),
  ).toBeVisible();
});

for (const { scheme, theme } of [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const) {
  test(`/chklst has no axe violations by ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/chklst");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}
