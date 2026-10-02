import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ADMIN_PASSWORD } from "./stack";

// These tests change the stored content, so the "admin" project runs them after every other spec (playwright.config).
test.describe.configure({ mode: "serial" });

const BIO_LABEL = "Bio (wrapped to 9 rows of 18)";

async function signIn(page: Page): Promise<void> {
  await page.goto("/admin");
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "About (profile)" }),
  ).toBeVisible();
}

/** The API answer to a direct call, with the browser's session cookie and CSRF token. */
async function csrfToken(page: Page): Promise<string> {
  const response = await page.request.get("/api/admin/session");
  expect(response.status()).toBe(200);
  const { csrfToken } = await response.json();
  return csrfToken;
}

test("login fails with a wrong password", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.locator(".admin-error")).toHaveText("Wrong password.");
  await expect(page.getByLabel("Password")).toBeVisible();
});

test("login succeeds and lists every section", async ({ page }) => {
  await signIn(page);

  const nav = page.getByRole("navigation", { name: "Sections" });
  for (const name of [
    "About (profile)",
    "Contact",
    "Links",
    "Work",
    "Résumé PDF",
  ]) {
    await expect(nav.getByRole("button", { name })).toBeVisible();
  }
  await expect(
    page.getByRole("link", { name: "View live: /about" }),
  ).toHaveAttribute("href", "/about");
});

test("saving the About bio revalidates /about, which shows the new text", async ({
  page,
}) => {
  const bio = "Bio saved by the e2e admin test.";
  await signIn(page);

  await page.getByLabel(BIO_LABEL).fill(bio);
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.locator(".admin-ok")).toContainText("Revalidation: done");
  await page.goto("/about");
  await expect(page.locator("main")).toContainText(bio);
});

test("a value the glass cannot draw is refused with the field's message", async ({
  page,
}) => {
  await signIn(page);

  await page.getByLabel("Status 1 value").fill("FAR TOO LONG");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.locator(".admin-error").first()).toContainText(
    "status › 1 › value",
  );
  await expect(page.getByLabel("Status 1 value")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
});

test("a save over a newer save is refused (412) until the editor reloads", async ({
  page,
}) => {
  await signIn(page);
  // Someone else saves the section after this editor loaded it.
  const token = await csrfToken(page);
  const current = await (
    await page.request.get("/api/admin/content/profile")
  ).json();
  const theirs = { ...current.document, footer: "SAVED ELSEWHERE" };
  const put = await page.request.put("/api/admin/content/profile", {
    data: theirs,
    headers: { "X-CSRF-Token": token, "If-Match": `"${current.etag}"` },
  });
  expect(put.status()).toBe(200);

  await page.getByLabel("Footer (≤ 19)").fill("MY EDIT");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.locator(".admin-error")).toContainText(
    "this section changed since you loaded it",
  );
  await expect(page.getByLabel("Footer (≤ 19)")).toHaveValue("MY EDIT");
  await page.getByRole("button", { name: "Reload the latest version" }).click();
  await expect(page.getByLabel("Footer (≤ 19)")).toHaveValue("SAVED ELSEWHERE");
});

test("uploading a résumé PDF replaces the one the site serves", async ({
  page,
}) => {
  const pdf = Buffer.from(
    "%PDF-1.4\n% e2e upload\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n",
  );
  await signIn(page);
  await page.getByRole("button", { name: "Résumé PDF" }).click();

  await page.getByLabel("PDF file (at most 10 MB)").setInputFiles({
    name: "resume.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await page.getByRole("button", { name: "Upload" }).click();

  await expect(page.locator(".admin-ok")).toContainText(
    `Uploaded: ${pdf.length} bytes.`,
  );
  await expect(page.locator(".admin-ok")).toContainText("Revalidation: done.");
  const served = await page.request.get("/api/resume.pdf");
  expect(served.status()).toBe(200);
  expect(Buffer.from(await served.body())).toEqual(pdf);
});

test("signing out ends the session", async ({ page }) => {
  await signIn(page);

  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page.getByText("Signed out.")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  expect((await page.request.get("/api/admin/session")).status()).toBe(401);
});

test("the admin pages have no axe violations", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByLabel("Password")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await signIn(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole("button", { name: "Work" }).click();
  await expect(page.getByLabel("Work (JSON)")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("/admin is not indexed and not in the sitemap", async ({
  page,
  request,
}) => {
  await page.goto("/admin");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain(
    "/admin",
  );
});
