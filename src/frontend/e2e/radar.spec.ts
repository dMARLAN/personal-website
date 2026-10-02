import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SCHEMES = [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const;

function sweepTransform(page: Page): Promise<string | null> {
  return page.getByTestId("radar-sweep").getAttribute("transform");
}

test("RDR ATTK opens from TAC PB4 and MENU returns to TAC", async ({
  page,
}) => {
  await page.goto("/ddi");
  const pb4 = page.locator(".ddi-osb[data-pb='4']");
  await expect(pb4).toHaveAccessibleName("Radar, simulated");
  await pb4.click();
  await expect(page).toHaveURL(/\/radar$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Radar, simulated" }),
  ).toBeAttached();

  await page.getByRole("link", { name: "Tactical menu" }).click();
  await expect(page).toHaveURL(/\/ddi$/);
  await expect(
    page.getByRole("button", { name: "Support menu" }),
  ).toBeVisible();
});

test("the range arrows step the scale in place, without a URL change", async ({
  page,
}) => {
  await page.goto("/radar");
  const scope = page.getByTestId("radar-scope");
  const up = page.getByRole("button", { name: "Increase range scale" });
  const down = page.getByRole("button", { name: "Decrease range scale" });
  const historyLength = await page.evaluate(() => history.length);
  await expect(scope).toHaveAttribute("data-range", "40");

  // Fires on pointerdown, before release, like every OSB.
  await up.hover();
  await page.mouse.down();
  await expect(scope).toHaveAttribute("data-range", "80");
  await page.mouse.up();
  await expect(scope).toHaveAttribute("data-range", "80");

  await up.click();
  await up.click();
  await expect(scope).toHaveAttribute("data-range", "160");

  await down.focus();
  for (const expected of ["80", "40", "20", "10", "5", "5"]) {
    await page.keyboard.press("Enter");
    await expect(scope).toHaveAttribute("data-range", expected);
  }
  await expect(page).toHaveURL(/\/radar$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
});

test("the other legends are drawn but inert", async ({ page }) => {
  await page.goto("/radar");
  for (const pb of [6, 7, 8, 13, 14, 15, 16, 17, 19, 20]) {
    await expect(page.locator(`.ddi-osb[data-pb='${pb}']`)).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  }
  await page.locator(".ddi-osb[data-pb='20']").click({ force: true });
  await expect(page).toHaveURL(/\/radar$/);
});

test("the scope animates at about 20 Hz, outside the bloom", async ({
  page,
}) => {
  await page.goto("/radar");
  const first = await sweepTransform(page);
  await expect.poll(() => sweepTransform(page)).not.toBe(first);

  const updates = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const sweep = document.querySelector("[data-testid='radar-sweep']");
        if (sweep === null) {
          throw new Error("no sweep line");
        }
        let count = 0;
        const observer = new MutationObserver(() => {
          count += 1;
        });
        observer.observe(sweep, { attributes: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(count);
        }, 2000);
      }),
  );
  expect(updates).toBeGreaterThanOrEqual(30);
  expect(updates).toBeLessThanOrEqual(42);

  await expect(page.locator("use.ddi-bloom[href='#ddi-live']")).toHaveCount(0);
  await expect(page.locator("use.ddi-core[href='#ddi-live']")).toHaveCount(1);
});

test("the scope pauses while the tab is hidden", async ({ page }) => {
  await page.goto("/radar");
  await expect.poll(() => sweepTransform(page)).not.toBe(null);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const paused = await sweepTransform(page);
  await page.waitForTimeout(400);
  expect(await sweepTransform(page)).toBe(paused);

  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => sweepTransform(page)).not.toBe(paused);
});

test.describe("under reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the scope shows the static t = 0 frame", async ({ page }) => {
    await page.goto("/radar");
    const sweep = page.getByTestId("radar-sweep");
    // t = 0: the antenna at the left edge of the scope, x = −409.5.
    await expect(sweep).toHaveAttribute("transform", "translate(-409.5 0)");
    await page.waitForTimeout(400);
    await expect(sweep).toHaveAttribute("transform", "translate(-409.5 0)");
    await expect(page.getByTestId("radar-hit").first()).toBeAttached();
  });
});

test("serves the radar's semantic content without JavaScript", async ({
  request,
}) => {
  const html = await (await request.get("/radar")).text();
  expect(html).toContain("<h1>Radar, simulated</h1>");
  expect(html).toContain("range-while-search");
  expect(html).toContain(
    'rel="canonical" href="https://chad.hambley.org/radar"',
  );
});

for (const { scheme, theme } of SCHEMES) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: scheme });

    test("/radar has no axe violations", async ({ page }) => {
      await page.goto("/radar");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });

    test("/radar in plain view has no axe violations", async ({ page }) => {
      await page.goto("/radar?view=plain");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(
        page.getByRole("button", { name: "Increase range scale" }),
      ).toBeHidden();
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });
  });
}
