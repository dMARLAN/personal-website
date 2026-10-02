import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { CONTACT } from "../src/content/contact";

test("TAC PB8 opens Contact on press", async ({ page }) => {
  await page.goto("/");
  const contact = page.locator(".ddi-osb[data-pb='8']");
  await expect(contact).toHaveAccessibleName("Contact");
  await contact.hover();
  await page.mouse.down();
  await expect(page).toHaveURL(/\/contact$/);
  await page.mouse.up();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact");
});

test("COPY copies the address on press and keeps the URL", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/contact");
  const historyLength = await page.evaluate(() => history.length);
  const copy = page.getByRole("button", { name: "Copy email address" });
  await copy.hover();
  await page.mouse.down();
  await expect(page.getByRole("status")).toHaveText("Email address copied");
  await page.mouse.up();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    CONTACT.email,
  );
  await expect(page).toHaveURL(/\/contact$/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  // The cautions line clears after 2 s.
  await expect(page.getByRole("status")).toHaveText("", { timeout: 4000 });
});

test("XMIT MAIL is a mailto link on PB17", async ({ page }) => {
  await page.goto("/contact");
  const mail = page.locator(".ddi-osb-island[data-pb='17'] a");
  await expect(mail).toHaveAccessibleName("Send email");
  await expect(mail).toHaveAttribute("href", `mailto:${CONTACT.email}`);
});

test("serves the address without JavaScript", async ({ request }) => {
  const html = await (await request.get("/contact")).text();
  expect(html).toContain(`href="mailto:${CONTACT.email}"`);
  expect(html).toContain("<h1>Contact</h1>");
});

for (const { scheme, theme } of [
  { scheme: "light", theme: "day" },
  { scheme: "dark", theme: "night" },
] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: scheme });

    test("/contact has no axe violations", async ({ page }) => {
      await page.goto("/contact");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });

    test("/contact in plain view has no axe violations", async ({ page }) => {
      await page.goto("/contact?view=plain");
      await expect(
        page.getByRole("link", { name: CONTACT.email }),
      ).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });
  });
}
