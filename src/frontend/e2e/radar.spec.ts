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
  await page.goto("/");
  const pb4 = page.locator(".ddi-osb[data-pb='4']");
  await expect(pb4).toHaveAccessibleName("Radar, simulated");
  await pb4.click();
  await expect(page).toHaveURL(/\/radar$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Radar, simulated" }),
  ).toBeAttached();

  await page.getByRole("link", { name: "Tactical menu" }).click();
  await expect(page).toHaveURL(/\/$/);
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
  await expect(scope).toHaveAttribute("data-range", "160");
  // "When at maximum range, the increment arrow is no longer displayed" (DCS guide): the OSB goes blank.
  await expect(up).toHaveCount(0);

  await down.focus();
  for (const expected of ["80", "40", "20", "10", "5", "5"]) {
    await page.keyboard.press("Enter");
    await expect(scope).toHaveAttribute("data-range", expected);
  }
  await expect(page).toHaveURL(/\/radar$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
});

test("RDR/PRI, CHAN and MODE are drawn but inert", async ({ page }) => {
  await page.goto("/radar");
  for (const name of ["Radar priority", "Channel", "Mode"]) {
    const osb = page.locator(".ddi-osb", { hasText: new RegExp(`^${name}$`) });
    await expect(osb).toHaveAttribute("aria-disabled", "true");
  }
  await page.locator(".ddi-osb", { hasText: /^Mode$/ }).click({ force: true });
  await expect(page).toHaveURL(/\/radar$/);
});

test("each scan control cycles in place, without a URL change", async ({
  page,
}) => {
  await page.goto("/radar");
  const scope = page.getByTestId("radar-scope");
  const historyLength = await page.evaluate(() => history.length);
  const press = (name: string | RegExp) =>
    page.getByRole("button", { name }).click();

  for (const bars of ["6", "1", "2", "4"]) {
    await press(/^Elevation bars/);
    await expect(scope).toHaveAttribute("data-bars", bars);
  }
  await expect(
    page.getByRole("button", { name: "Elevation bars, 4B" }),
  ).toBeVisible();

  for (const azimuth of ["80", "60", "40", "20", "140"]) {
    await press(/^Azimuth scan/);
    await expect(scope).toHaveAttribute("data-azimuth", azimuth);
  }

  for (const prf of ["HI", "MED", "INTL"]) {
    await press(/^Pulse repetition frequency/);
    await expect(scope).toHaveAttribute("data-prf", prf);
  }

  // SET saves 80°; RSET returns to it after another change.
  await press(/^Azimuth scan/);
  await press("Save scan settings");
  await press(/^Azimuth scan/);
  await expect(scope).toHaveAttribute("data-azimuth", "60");
  await press("Reset scan settings");
  await expect(scope).toHaveAttribute("data-azimuth", "80");

  const nctr = page.getByRole("button", { name: "Target recognition" });
  await expect(nctr).toHaveAttribute("aria-pressed", "true");
  await nctr.click();
  await expect(nctr).toHaveAttribute("aria-pressed", "false");

  await expect(page).toHaveURL(/\/radar$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
});

test("SIL stops the sweep, ACTIVE scans a frame and ERASE clears the hits", async ({
  page,
}) => {
  await page.goto("/radar");
  const scope = page.getByTestId("radar-scope");
  const sweep = page.getByTestId("radar-sweep");
  const visibleHits = page.locator(
    "[data-testid='radar-hit'][visibility='visible']",
  );
  await expect(visibleHits.first()).toBeAttached();

  await page.getByRole("button", { name: "Erase" }).click();
  await expect(visibleHits).toHaveCount(0);

  const silent = page.getByRole("button", { name: "Silent" });
  await silent.click();
  await expect(silent).toHaveAttribute("aria-pressed", "true");
  await expect(scope).toHaveAttribute("data-silent", "true");
  const stopped = await sweep.getAttribute("transform");
  await page.waitForTimeout(300);
  await expect(sweep).toHaveAttribute("transform", stopped ?? "");

  await page.getByRole("button", { name: "Active: scan one frame" }).click();
  await expect(sweep).not.toHaveAttribute("transform", stopped ?? "");

  await silent.click();
  await expect(scope).toHaveAttribute("data-silent", "false");
  await expect(
    page.getByRole("button", { name: "Active: scan one frame" }),
  ).toHaveCount(0);
});

test("TWS shows ranked trackfiles and its own legends", async ({ page }) => {
  await page.goto("/radar");
  const scope = page.getByTestId("radar-scope");
  await page.getByRole("button", { name: "Radar mode, RWS" }).click();
  await expect(scope).toHaveAttribute("data-mode", "TWS");
  await expect(scope).toHaveAttribute("data-azimuth", "40");
  await expect(
    page.locator("[data-testid='radar-track'][data-rank='1']"),
  ).toBeAttached();
  await expect(page.getByRole("button", { name: "Erase" })).toHaveCount(0);

  const hits = page.getByRole("button", { name: "Raw hits" });
  await expect(hits).toHaveAttribute("aria-pressed", "true");
  await hits.click();
  await expect(hits).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("button", { name: "Scan centring, MAN" }).click();
  await expect(
    page.getByRole("button", { name: "Scan centring, AUTO" }),
  ).toBeVisible();

  // TWS 4-bar allows only 40° and 20°.
  await page.getByRole("button", { name: /^Azimuth scan/ }).click();
  await expect(scope).toHaveAttribute("data-azimuth", "20");
  await page.getByRole("button", { name: /^Azimuth scan/ }).click();
  await expect(scope).toHaveAttribute("data-azimuth", "40");

  await page.getByRole("button", { name: "Radar mode, TWS" }).click();
  await expect(scope).toHaveAttribute("data-mode", "RWS");
  await expect(page).toHaveURL(/\/radar$/);
});

test("DATA opens the data sublevel and its options cycle", async ({ page }) => {
  await page.goto("/radar");
  const data = page.getByRole("button", { name: "Data" });
  await data.click();
  await expect(data).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: /^Elevation bars/ }),
  ).toHaveCount(0);

  for (const aging of ["16", "32", "2", "4", "8"]) {
    await page.getByRole("button", { name: /^Target aging/ }).click();
    await expect(
      page.getByRole("button", { name: `Target aging, ${aging} seconds` }),
    ).toBeVisible();
  }
  for (const level of ["level 1", "level 2", "off"]) {
    await page.getByRole("button", { name: /^Declutter/ }).click();
    await expect(
      page.getByRole("button", { name: `Declutter, ${level}` }),
    ).toBeVisible();
  }
  for (const name of [
    "Bearing and range to the cursor",
    "Colour",
    "Multi-sensor integration",
    "Latent track while scan",
    "One-look raid",
  ]) {
    const option = page.getByRole("button", { name });
    const before = await option.getAttribute("aria-pressed");
    await option.click();
    await expect(option).not.toHaveAttribute("aria-pressed", before ?? "");
  }
  await page.getByRole("button", { name: "Speed gate, NORM" }).click();
  await expect(
    page.getByRole("button", { name: "Speed gate, WIDE" }),
  ).toBeVisible();

  await data.click();
  await expect(data).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("button", { name: "Elevation bars, 4B" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/radar$/);
});

test("the semantic layer lists the current settings", async ({ page }) => {
  await page.goto("/radar");
  const settings = page.locator("main dl").first();
  await expect(settings).toContainText("140°");
  await page.getByRole("button", { name: /^Azimuth scan/ }).click();
  await expect(settings).toContainText("80°");
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

    test("/radar in TWS and DATA has no axe violations", async ({ page }) => {
      await page.goto("/radar");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.getByRole("button", { name: "Radar mode, RWS" }).click();
      await page.getByRole("button", { name: "Silent" }).click();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.getByRole("button", { name: "Data" }).click();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
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
