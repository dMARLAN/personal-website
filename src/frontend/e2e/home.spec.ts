import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { SITE_NAME, SITE_URL } from "../src/lib/site";
import { THEME_KEY } from "./helpers";

function themeToggle(page: Page): ReturnType<Page["getByRole"]> {
  return page.getByRole("button", { name: "Night mode" });
}

test("/ is the standard homepage, with the name, sections and no DDI", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(SITE_NAME);
  for (const title of ["Experience", "Projects", "Skills", "Contact"]) {
    await expect(
      page.getByRole("heading", { level: 2, name: title }),
    ).toBeVisible();
  }
  await expect(page.locator(".ddi-frame")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Download résumé" }),
  ).toHaveAttribute("href", "/api/resume.pdf");
});

test("serves full metadata and a Person schema without JavaScript", async ({
  request,
}) => {
  const html = await (await request.get("/")).text();
  expect(html).toContain(`<link rel="canonical" href="${SITE_URL}"/>`);
  expect(html).toContain('property="og:title"');
  expect(html).toContain('property="og:image"');
  expect(html).toContain('name="twitter:card" content="summary_large_image"');
  const jsonLd = /<script type="application\/ld\+json">(.*?)<\/script>/.exec(
    html,
  );
  expect(jsonLd).not.toBeNull();
  expect(JSON.parse(jsonLd?.[1] ?? "")).toMatchObject({
    "@type": "Person",
    name: SITE_NAME,
    url: SITE_URL,
  });
});

test("the cockpit-mode button opens the DDI menu, and the DDI's home button comes back", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Enter cockpit mode" }).click();
  await expect(page).toHaveURL(/\/ddi$/);
  await expect(page.locator(".ddi-osb[data-pb='18']")).toHaveAccessibleName(
    "Support menu",
  );

  const home = page.getByRole("link", {
    name: "Exit to the standard homepage",
  });
  await expect(home).toBeVisible();
  await home.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(SITE_NAME);
});

test("the DDI's home button sits just left of the theme toggle, in its style", async ({
  page,
}) => {
  await page.goto("/ddi");
  const home = await page
    .getByRole("link", { name: "Exit to the standard homepage" })
    .boundingBox();
  const toggle = await themeToggle(page).boundingBox();
  if (home === null || toggle === null) {
    throw new Error("corner buttons not visible");
  }
  expect(home.width).toBe(toggle.width);
  expect(home.y).toBe(toggle.y);
  expect(toggle.x - (home.x + home.width)).toBe(8);
  const styles = await page.evaluate(() =>
    [".ddi-home-link", ".theme-toggle"].map((selector) => {
      const element = document.querySelector(selector);
      if (element === null) {
        throw new Error(`no ${selector}`);
      }
      const style = getComputedStyle(element);
      return [style.borderTopColor, style.borderRadius, style.color];
    }),
  );
  expect(styles[0]).toEqual(styles[1]);
});

for (const path of ["/", "/ddi"]) {
  test(`the theme toggle flips the theme on ${path} and the choice carries over`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
    await themeToggle(page).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    expect(
      await page.evaluate((key) => localStorage.getItem(key), THEME_KEY),
    ).toBe("night");
    await page.goto(path === "/" ? "/ddi" : "/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    await expect(themeToggle(page)).toHaveAttribute("aria-pressed", "true");
  });
}

test("/ follows the OS colour scheme and paints it before any app JavaScript", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  expect(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
  ).toBe("rgb(10, 13, 11)");
});

for (const { scheme, theme } of [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: scheme });

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      test(`/ at ${viewport.width}×${viewport.height} has no axe violations`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto("/");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const { violations } = await new AxeBuilder({ page }).analyze();
        expect(violations).toEqual([]);
      });
    }
  });
}

test("/ fits a 390×844 phone: one column, no sideways scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBe(0);
  await expect(page.getByRole("navigation", { name: "Sections" })).toBeHidden();
  await expect(page.getByRole("link", { name: "Launch DDI" })).toBeVisible();
  await expect(themeToggle(page)).toBeVisible();

  const copy = await page.locator(".hero-copy").boundingBox();
  const card = await page.locator(".ddi-card").boundingBox();
  if (copy === null || card === null) {
    throw new Error("hero not visible");
  }
  expect(card.y).toBeGreaterThan(copy.y + copy.height);
  expect(card.x + card.width).toBeLessThanOrEqual(390);
  const firstProject = await page
    .locator(".project-card")
    .first()
    .boundingBox();
  const secondProject = await page
    .locator(".project-card")
    .nth(1)
    .boundingBox();
  if (firstProject === null || secondProject === null) {
    throw new Error("projects not visible");
  }
  expect(secondProject.y).toBeGreaterThan(firstProject.y);
  expect(secondProject.x).toBe(firstProject.x);
});
