import { expect, test, type Page } from "@playwright/test";
import { THEME_KEY } from "./helpers";

function toggle(page: Page): ReturnType<Page["getByRole"]> {
  return page.getByRole("button", { name: "Night mode" });
}

/** WCAG relative luminance of a computed `rgb(r, g, b)` colour. */
function luminance(rgb: string): number {
  const channels = rgb
    .match(/\d+(\.\d+)?/g)
    ?.slice(0, 3)
    .map(Number);
  if (channels?.length !== 3) {
    throw new Error(`not an rgb colour: ${rgb}`);
  }
  const [r, g, b] = channels.map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** The toggle's ink and the bezel colour behind it (the face's mean paint colour, which the tile is matched to). */
async function toggleColours(
  page: Page,
): Promise<{ ink: string; bezel: string }> {
  return page.evaluate(() => {
    const button = document.querySelector(".theme-toggle");
    if (button === null) {
      throw new Error("no theme toggle");
    }
    const probe = document.createElement("div");
    probe.style.color = "var(--bezel-face)";
    document.body.append(probe);
    const bezel = getComputedStyle(probe).color;
    probe.remove();
    return { ink: getComputedStyle(button).color, bezel };
  });
}

for (const [scheme, theme] of [
  ["light", "day"],
  ["dark", "night"],
] as const) {
  test(`follows the OS by default: ${scheme} draws ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/ddi");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(toggle(page)).toHaveAttribute(
      "aria-pressed",
      String(theme === "night"),
    );
    await expect(
      page.locator(
        theme === "night" ? ".theme-toggle-moon" : ".theme-toggle-sun",
      ),
    ).toBeVisible();
    await expect(
      page.locator(
        theme === "night" ? ".theme-toggle-sun" : ".theme-toggle-moon",
      ),
    ).toBeHidden();
  });

  test(`the toggle contrasts with the ${theme} bezel behind it`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/ddi");
    const { ink, bezel } = await toggleColours(page);
    expect(contrast(ink, bezel)).toBeGreaterThanOrEqual(4.5);
  });
}

test("tracks an OS change while there is no override", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/ddi");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
});

test("the override flips the theme, persists across a reload and beats the OS", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/ddi");
  await toggle(page).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate((key) => localStorage.getItem(key), THEME_KEY),
  ).toBe("night");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await page.emulateMedia({ colorScheme: "dark" });
  await toggle(page).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  expect(
    await page.evaluate((key) => localStorage.getItem(key), THEME_KEY),
  ).toBe("day");
});

test("the toggle works from the keyboard", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/ddi");
  await toggle(page).focus();
  await page.keyboard.press("Space");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
});

test("a stored override is drawn before any app JavaScript runs, so a reload never flashes", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(
    (key) => localStorage.setItem(key, "night"),
    THEME_KEY,
  );
  // Block every app and framework script: only the inline pre-paint script in <head> can run.
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.goto("/ddi");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  const drawn = await page.evaluate(() => ({
    background: getComputedStyle(document.documentElement).backgroundColor,
    sun: getComputedStyle(
      document.querySelector(".theme-toggle-sun") ?? document.body,
    ).display,
  }));
  expect(drawn).toEqual({ background: "rgb(20, 22, 21)", sun: "none" });
});

test("an invalid stored override is ignored and the OS decides", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(
    (key) => localStorage.setItem(key, "<script>"),
    THEME_KEY,
  );
  await page.goto("/ddi");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
});
