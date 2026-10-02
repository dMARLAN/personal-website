import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
];
const SCHEMES = [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const;

for (const { scheme, theme } of SCHEMES) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: scheme });

    for (const viewport of VIEWPORTS) {
      for (const menu of ["TAC", "SUPT"] as const) {
        test(`/ddi on ${menu} at ${viewport.width}×${viewport.height} has no axe violations`, async ({
          page,
        }) => {
          await page.setViewportSize(viewport);
          await page.goto("/ddi");
          await expect(page.locator("html")).toHaveAttribute(
            "data-theme",
            theme,
          );
          if (menu === "SUPT") {
            await page.getByRole("button", { name: "Support menu" }).click();
          }
          const { violations } = await new AxeBuilder({ page }).analyze();
          expect(violations).toEqual([]);
        });
      }
    }

    test("/ddi in plain view has no axe violations", async ({ page }) => {
      await page.goto("/ddi?view=plain");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });
  });
}
