import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/supt"];
const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
];

for (const route of ROUTES) {
  for (const viewport of VIEWPORTS) {
    test(`${route} at ${viewport.width}×${viewport.height} has no axe violations`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(route);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });
  }

  test(`${route} in plain view has no axe violations`, async ({ page }) => {
    await page.goto(`${route}?view=plain`);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}
