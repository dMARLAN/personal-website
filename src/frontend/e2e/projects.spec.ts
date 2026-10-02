import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { PROJECT_CATEGORIES, PROJECTS } from "../src/content/projects";

const byStation = PROJECTS.toSorted((a, b) => a.station - b.station);
const [firstCategory, secondCategory] = PROJECT_CATEGORIES;
const firstMembers = byStation.filter(
  (project) => project.category === firstCategory.legend,
);
const secondMembers = byStation.filter(
  (project) => project.category === secondCategory.legend,
);

function osb(page: Page, pb: number): ReturnType<Page["locator"]> {
  return page.locator(`.ddi-osb[data-pb='${pb}']`);
}

/** Presses an OSB and releases it: the action fires on the press. */
async function press(page: Page, pb: number): Promise<void> {
  await osb(page, pb).hover();
  await page.mouse.down();
  await page.mouse.up();
}

test("TAC PB10 PROJECTS opens /projects, and MENU returns to TAC", async ({
  page,
}) => {
  await page.goto("/");
  const projects = osb(page, 10);
  await expect(projects).toHaveAccessibleName("Projects");
  await projects.click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
  await expect(osb(page, 13)).toHaveAccessibleName(
    `Step to ${firstMembers[1].name}`,
  );

  await press(page, 18);
  await expect(page).toHaveURL(/\/$/);
  await expect(osb(page, 18)).toHaveAccessibleName("Support menu");
});

test("categories, STEP and DATA change the selection in place, and the URL never changes", async ({
  page,
}) => {
  await page.goto("/projects");
  const historyLength = await page.evaluate(() => history.length);

  // STEP cycles the category's stations and wraps.
  for (const project of [...firstMembers.slice(1), firstMembers[0]]) {
    await press(page, 13);
    await expect(osb(page, 17)).toHaveAccessibleName(`${project.name} details`);
  }

  // A category selects its first station.
  await expect(osb(page, 7)).toHaveAccessibleName(
    `${secondCategory.name} projects`,
  );
  await press(page, 7);
  await expect(osb(page, 17)).toHaveAccessibleName(
    `${secondMembers[0].name} details`,
  );

  // DATA opens the sublevel, STEP works inside it, and DATA closes it.
  await press(page, 17);
  await expect(osb(page, 17)).toHaveAccessibleName(
    `Close ${secondMembers[0].name} details`,
  );
  await press(page, 13);
  await expect(osb(page, 17)).toHaveAccessibleName(
    `Close ${secondMembers[1].name} details`,
  );
  await press(page, 17);
  await expect(osb(page, 17)).toHaveAccessibleName(
    `${secondMembers[1].name} details`,
  );

  await expect(page).toHaveURL(/\/projects$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
});

test("the DATA sublevel's REPO opens the repository in a new tab on press", async ({
  page,
  context,
}) => {
  const [project] = firstMembers;
  const [repo] = project.links;
  await context.route(repo.url, (route) =>
    route.fulfill({ contentType: "text/html", body: "<title>repo</title>" }),
  );
  await page.goto("/projects");
  await expect(osb(page, 16)).toHaveAttribute("aria-hidden", "true");
  await press(page, 17);

  const link = osb(page, 16);
  await expect(link).toHaveAccessibleName(`${project.name} repository`);
  await link.hover();
  const popup = context.waitForEvent("page");
  await page.mouse.down();
  expect((await popup).url()).toBe(repo.url);
  await page.mouse.up();
  await expect(page).toHaveURL(/\/projects$/);
});

test("serves every project's content and links without JavaScript", async ({
  request,
}) => {
  const html = await (await request.get("/projects")).text();
  expect(html).toContain("<h1>Projects</h1>");
  for (const project of PROJECTS) {
    expect(html).toContain(`<h3>${project.name}</h3>`);
    for (const link of project.links) {
      expect(html).toContain(`href="${link.url}"`);
    }
  }
  expect(html).toContain(
    '<link rel="canonical" href="https://chad.hambley.org/projects"/>',
  );
});

test("lists /projects in the sitemap", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<loc>https://chad.hambley.org/projects</loc>");
});

for (const { scheme, theme } of [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: scheme });

    for (const sublevel of ["main page", "DATA sublevel"] as const) {
      test(`/projects on the ${sublevel} has no axe violations`, async ({
        page,
      }) => {
        await page.goto("/projects");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        if (sublevel === "DATA sublevel") {
          await press(page, 17);
          await expect(osb(page, 17)).toHaveAccessibleName(/^Close /);
        }
        const { violations } = await new AxeBuilder({ page }).analyze();
        expect(violations).toEqual([]);
      });
    }

    test("/projects in plain view has no axe violations", async ({ page }) => {
      await page.goto("/projects?view=plain");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(
        page.getByRole("heading", { level: 2, name: firstCategory.name }),
      ).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });
  });
}
