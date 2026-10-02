import { expect, test, type Page } from "@playwright/test";
import { THEME_KEY } from "./helpers";

/** Every `/materials/` response the page gets while it loads and settles, as [path, status]. */
async function loadMaterials(
  page: Page,
  theme: string,
): Promise<Map<string, number>> {
  const responses = new Map<string, number>();
  page.on("response", (response) => {
    const { pathname } = new URL(response.url());
    if (pathname.startsWith("/materials/")) {
      responses.set(pathname, response.status());
    }
  });
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [THEME_KEY, theme],
  );
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  return responses;
}

for (const [theme, other] of [
  ["day", "night"],
  ["night", "day"],
] as const) {
  test(`the ${theme} bezel materials all load, as AVIF, and none of the ${other} set`, async ({
    page,
  }) => {
    const responses = await loadMaterials(page, theme);
    const paths = [...responses.keys()];
    const expected = [
      `bezel-tile-${theme}.avif`,
      `lip-9slice-${theme}@2x.avif`,
      `osb-up-${theme}@2x.avif`,
      `osb-down-${theme}@2x.avif`,
      `knob-base-${theme}@2x.avif`,
      `knob-body-${theme}@2x.avif`,
      `knob-light-${theme}@2x.avif`,
      "knob-index-mask@3x.avif",
      "knob-ring-mask@3x.avif",
      ...(theme === "night" ? ["osb-glow-mask@3x.avif"] : []),
    ].map((file) => `/materials/${file}`);
    expect(paths.sort()).toEqual(expected.sort());
    for (const [path, status] of responses) {
      expect(status, path).toBeLessThan(400);
    }
  });
}

test("switching theme draws the other theme's materials, with no failed request", async ({
  page,
}) => {
  const responses = await loadMaterials(page, "day");
  await page.getByRole("button", { name: "Night mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await page.waitForLoadState("networkidle");
  expect([...responses.keys()]).toContain("/materials/bezel-tile-night.avif");
  for (const [path, status] of responses) {
    expect(status, path).toBeLessThan(400);
  }
});
