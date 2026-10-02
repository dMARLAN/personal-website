import { expect, test } from "@playwright/test";
import { ALL_PAGES } from "../src/ddi/pages/registry";

// Every route renders: a 200, a heading in <main>, and no uncaught script error. It catches a page whose server render
// or hydration throws, which the per-page specs may not open.
const ROUTES = [
  ...ALL_PAGES.filter((page) => page.available).map((page) => page.path),
  "/admin",
];

for (const route of ROUTES) {
  test(`${route} renders`, async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", (error) => errors.push(error));

    const response = await page.goto(route);

    expect(response?.status()).toBe(200);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.getByText("Application error")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
