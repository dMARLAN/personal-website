import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test,
  type FrameLocator,
  type Locator,
  type Page,
} from "@playwright/test";
import { ADMIN_PASSWORD, BASE_URL } from "./stack";

// These tests change the stored content, so the "admin" project runs them after every other spec (playwright.config).
test.describe.configure({ mode: "serial" });

function sidebar(page: Page): Locator {
  return page.getByRole("navigation", { name: "Sections" });
}

async function openSection(page: Page, label: string): Promise<void> {
  await sidebar(page)
    .getByRole("button", { name: new RegExp(`^${label}`) })
    .click();
  await expect(
    page.getByRole("heading", { level: 2, name: label, exact: true }),
  ).toBeVisible();
}

async function signIn(page: Page): Promise<void> {
  await page.goto("/admin");
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "About", exact: true }),
  ).toBeVisible();
}

/** The session's CSRF token, for direct API calls with the browser's cookie. */
async function csrfToken(page: Page): Promise<string> {
  const response = await page.request.get("/api/admin/session");
  expect(response.status()).toBe(200);
  const { csrfToken } = await response.json();
  return csrfToken;
}

/** A field's character counter: the `[data-counter]` inside the element its id names with `--counter`. */
async function counterOf(field: Locator): Promise<Locator> {
  const id = await field.getAttribute("id");
  return field.page().locator(`[id="${id}--counter"] [data-counter]`);
}

/** The names of the Links section's items, in order. */
async function linkNames(page: Page): Promise<string[]> {
  const links = page.getByRole("group", { name: /^Link \d+$/ });
  const names: string[] = [];
  for (const link of await links.all()) {
    names.push(await link.getByLabel("Name").inputValue());
  }
  return names;
}

test("sign-in fails with a wrong password", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.locator("#login-error")).toHaveText("Wrong password.");
  await expect(page.getByLabel("Password")).toBeVisible();
});

test("sign-in opens About and lists every section, grouped", async ({
  page,
}) => {
  await signIn(page);

  for (const name of ["Site content", "DDI showcase"]) {
    await expect(sidebar(page).getByRole("heading", { name })).toBeVisible();
  }
  for (const name of [
    "About",
    "Work",
    "Links",
    "Résumé PDF",
    "BIT",
    "ENG / server",
    "MUMI",
  ]) {
    await expect(
      sidebar(page).getByRole("button", { name: new RegExp(`^${name}`) }),
    ).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /^View live/ })).toHaveAttribute(
    "href",
    "/admin/preview/disable?path=%2Fabout",
  );
  await expect(page.locator("[data-preview-slot]")).toBeVisible();
});

test("About through the form: a live counter, a validation error, a draft, then a publish", async ({
  page,
}) => {
  const bio = "Bio saved by the e2e admin test.";
  await signIn(page);

  // The counter follows the typing, and the schema's limit flags the field.
  const status = page.getByRole("group", { name: "Status rows 1" });
  const value = status.getByLabel("Value");
  await value.fill("FAR TOO LONG");
  await expect(await counterOf(value)).toHaveText("12/9 characters");
  await expect(await counterOf(value)).toHaveAttribute("data-tone", "over");
  await expect(value).toHaveAttribute("aria-invalid", "true");
  await expect(status).toContainText("Too long: at most 9 characters.");
  await expect(
    sidebar(page).getByRole("button", { name: /^About.*unsaved changes/ }),
  ).toBeVisible();
  await value.fill("SW ENGR");
  await expect(value).toHaveAttribute("aria-invalid", "false");

  // Ctrl+S saves a draft, which the editor reopens after a reload.
  await page.getByLabel("Bio").fill(bio);
  await page.keyboard.press("Control+s");
  await expect(page.getByText("Draft — not published")).toBeVisible();
  const drafts = await (await page.request.get("/api/admin/drafts")).json();
  expect(drafts.profile.content.bio).toBe(bio);
  await page.reload();
  await expect(page.getByText("Draft — not published")).toBeVisible();
  await expect(page.getByLabel("Bio")).toHaveValue(bio);

  // Publishing revalidates /about and deletes the draft.
  await page.getByRole("button", { name: /^Publish/ }).click();
  await expect(page.getByText(/Revalidation: done/)).toBeVisible();
  await expect(page.getByText("Draft — not published")).toHaveCount(0);
  expect(await (await page.request.get("/api/admin/drafts")).json()).toEqual(
    {},
  );
  await page.goto("/about");
  await expect(page.locator("main")).toContainText(bio);
});

/** The preview's frame: the real page, rendered in draft mode. */
function preview(page: Page): FrameLocator {
  return page.frameLocator('iframe[title^="Preview of"]');
}

/** Signs in with no stored About draft, so About opens the published copy. */
async function signInWithoutAboutDraft(page: Page): Promise<void> {
  await signIn(page);
  const response = await page.request.delete("/api/admin/drafts/profile", {
    headers: { "X-CSRF-Token": await csrfToken(page) },
  });
  expect(response.status()).toBe(204);
  await page.reload();
  await expect(page.getByText("Draft — not published")).toHaveCount(0);
}

test("the preview shows the About draft as it is typed, and the public page does not", async ({
  page,
  browser,
}) => {
  const bio = "Bio typed into the live preview test.";
  await signInWithoutAboutDraft(page);
  await expect(preview(page).locator("main")).toContainText("About");
  const frame = page.frame({ url: /\/about$/ });
  if (frame === null) {
    throw new Error("the preview frame is not on /about");
  }
  await frame.evaluate(() => document.body.setAttribute("data-e2e", "kept"));

  await page.getByLabel("Bio").fill(bio);

  // Autosave stores the draft and the frame renders it: no Save draft, no publish.
  await expect(preview(page).locator("main")).toContainText(bio);
  // The page rendered again in place (router.refresh), not reloaded, so in-section state survives.
  await expect(preview(page).locator("body")).toHaveAttribute(
    "data-e2e",
    "kept",
  );
  await expect(page.getByText("Draft — not published")).toBeVisible();
  await expect(page.getByText("Unsaved changes", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.locator("[data-preview-status]")).toContainText(
    "Draft saved",
  );
  const published = await (await page.request.get("/api/content")).json();
  expect(published.profile.bio).not.toBe(bio);

  // A draft-mode page is private and never stored.
  const draftPage = await page.request.get("/about");
  expect(draftPage.headers()["cache-control"]).toContain("no-store");
  expect(await draftPage.text()).toContain(bio);

  // A visitor (no session, no draft-mode cookie) gets the published page.
  const visitor = await browser.newContext({ baseURL: BASE_URL });
  const visitorPage = await visitor.newPage();
  await visitorPage.goto("/about");
  await expect(visitorPage.locator("main")).toContainText("About");
  await expect(visitorPage.locator("main")).not.toContainText(bio);
  await visitor.close();

  await page.getByRole("button", { name: "Discard draft" }).click();
  await expect(preview(page).locator("main")).not.toContainText(bio);
});

test("the homepage toggle previews / with the draft", async ({ page }) => {
  const bio = "Bio for the homepage preview test.";
  await signInWithoutAboutDraft(page);

  await page.getByRole("radio", { name: "Homepage" }).click();
  await expect(
    page.locator('iframe[title="Preview of / with the saved drafts"]'),
  ).toBeVisible();
  await page.getByLabel("Bio").fill(bio);
  await expect(preview(page).locator("main")).toContainText(bio);

  await page.getByRole("radio", { name: "DDI page" }).click();
  await expect(
    page.locator('iframe[title="Preview of /about with the saved drafts"]'),
  ).toBeVisible();
  await expect(preview(page).locator("main")).toContainText(bio);
  await page.getByRole("button", { name: "Discard draft" }).click();
});

test("invalid input pauses the preview on the last valid draft", async ({
  page,
}) => {
  const bio = "Bio before the invalid edit.";
  await signInWithoutAboutDraft(page);
  await page.getByLabel("Bio").fill(bio);
  await expect(preview(page).locator("main")).toContainText(bio);

  await page.getByLabel("Badge").fill("A BADGE THAT IS FAR TOO LONG");
  await page.getByLabel("Bio").fill("Bio typed while the badge is invalid.");

  await expect(page.getByText("Preview paused: fix errors")).toBeVisible();
  await expect(
    page.getByText("Unsaved changes", { exact: true }),
  ).toBeVisible();
  // Well past the autosave delay: nothing was saved, so the frame still shows the last valid draft.
  await page.waitForTimeout(1500);
  const drafts = await (await page.request.get("/api/admin/drafts")).json();
  expect(drafts.profile.content.bio).toBe(bio);
  await expect(preview(page).locator("main")).toContainText(bio);

  await page.getByRole("button", { name: "Discard changes" }).click();
  await expect(page.getByText("Preview paused: fix errors")).toHaveCount(0);
  await page.getByRole("button", { name: "Discard draft" }).click();
});

test("the preview routes refuse a visitor without a session and any path outside the site", async ({
  page,
  playwright,
}) => {
  const visitor = await playwright.request.newContext({
    baseURL: BASE_URL,
  });
  const refused = await visitor.get("/admin/preview/enable?path=/about", {
    maxRedirects: 0,
  });
  expect(refused.status()).toBe(401);
  expect(refused.headers()["set-cookie"] ?? "").not.toContain(
    "__prerender_bypass",
  );
  expect(await refused.text()).toContain("Sign in to preview");
  expect((await visitor.post("/admin/preview/enable")).status()).toBe(401);
  await visitor.dispose();

  await signIn(page);
  for (const path of [
    "//evil.example",
    "https://evil.example/",
    "/about?x=1",
    "/admin",
  ]) {
    const response = await page.request.get(
      `/admin/preview/enable?${new URLSearchParams({ path })}`,
      { maxRedirects: 0 },
    );
    expect(response.status(), path).toBe(400);
  }
  const entered = await page.request.get("/admin/preview/enable?path=/about", {
    maxRedirects: 0,
  });
  expect(entered.status()).toBe(307);
  expect(entered.headers()["location"]).toBe("/about");
  expect(entered.headers()["set-cookie"]).toContain("__prerender_bypass");
});

test("a rule only the API knows comes back as a 422 on the exact field", async ({
  page,
}) => {
  await signIn(page);
  await openSection(page, "BIT");

  // RDR has its own legend, so its name fits 7 characters, not the 9 every check allows.
  const name = page
    .getByRole("region", { name: "RDR", exact: true })
    .getByLabel("Name");
  await name.fill("RADARSET");
  await expect(name).toHaveAttribute("aria-invalid", "false");
  await page.getByRole("button", { name: /^Publish/ }).click();

  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByRole("alert").filter({ hasText: "problem" }),
  ).toContainText("RDR");
  await page.getByRole("button", { name: "Discard changes" }).click();
  await expect(name).toHaveValue("LOGS");
});

test("a publish over a newer publish shows the difference and can reload it", async ({
  page,
}) => {
  await signIn(page);
  const token = await csrfToken(page);
  const current = await (
    await page.request.get("/api/admin/content/profile")
  ).json();
  const put = await page.request.put("/api/admin/content/profile", {
    data: { ...current.document, footer: "SAVED ELSEWHERE" },
    headers: { "X-CSRF-Token": token, "If-Match": `"${current.etag}"` },
  });
  expect(put.status()).toBe(200);

  await page.getByLabel("Footer").fill("MY EDIT");
  await page.keyboard.press("Control+Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(
    "this section changed since you loaded it",
  );
  await expect(dialog.getByRole("row", { name: /Footer/ })).toContainText(
    "SAVED ELSEWHERE",
  );
  await expect(dialog.getByRole("row", { name: /Footer/ })).toContainText(
    "MY EDIT",
  );
  await dialog
    .getByRole("button", { name: "Reload the latest version" })
    .click();
  await expect(page.getByLabel("Footer")).toHaveValue("SAVED ELSEWHERE");
});

test("Links: add an item from the schema, move it, drag to reorder, publish", async ({
  page,
}) => {
  await signIn(page);
  await openSection(page, "Links");
  expect(await linkNames(page)).toEqual([
    "GitHub",
    "LinkedIn",
    "Resume",
    "Blog",
    "Mastodon",
  ]);

  await page.getByRole("button", { name: "Add link" }).click();
  const added = page.getByRole("group", { name: "Link 6" });
  await expect(added.getByLabel("Name")).toHaveValue("Name");
  await added.getByLabel("Name").fill("Forgejo");
  await added.getByLabel("URL").fill("https://example.com/forgejo");
  await page.getByRole("button", { name: "Move Link 6 up" }).click();
  expect(await linkNames(page)).toEqual([
    "GitHub",
    "LinkedIn",
    "Resume",
    "Blog",
    "Forgejo",
    "Mastodon",
  ]);

  // Drag the first link by its handle, one card down: onto the second.
  const handle = page.getByRole("button", { name: "Drag to reorder Link 1" });
  const first = await page.getByRole("group", { name: "Link 1" }).boundingBox();
  const second = await page
    .getByRole("group", { name: "Link 2" })
    .boundingBox();
  const start = await handle.boundingBox();
  if (first === null || second === null || start === null) {
    throw new Error("the links are not on screen");
  }
  const x = start.x + start.width / 2;
  const y = start.y + start.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + (second.y - first.y), { steps: 12 });
  await page.mouse.up();
  await expect
    .poll(() => linkNames(page))
    .toEqual(["LinkedIn", "GitHub", "Resume", "Blog", "Forgejo", "Mastodon"]);

  // The keyboard shortcut: dnd-kit swallows the first click straight after a drop.
  await page.keyboard.press("Control+Enter");
  await expect(page.getByText(/Revalidation: done/)).toBeVisible();
  const content = await (await page.request.get("/api/content")).json();
  expect(
    content.links.links.map((link: { name: string }) => link.name),
  ).toEqual(["LinkedIn", "GitHub", "Resume", "Blog", "Forgejo", "Mastodon"]);
});

test("the JSON escape hatch round-trips with the form and marks schema errors", async ({
  page,
}) => {
  await signIn(page);
  await page.getByLabel("Badge").fill("FROM THE FORM");
  await page.getByLabel("Advanced: JSON").click();

  const editor = page.getByRole("textbox", { name: "About JSON" });
  await expect(editor).toContainText('"badge": "FROM THE FORM"');

  // CodeMirror renders only the lines on screen, so the replacement text starts from the API's copy.
  const document = (
    await (await page.request.get("/api/admin/content/profile")).json()
  ).document;
  await editor.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.insertText(
    JSON.stringify({
      ...document,
      badge: "FROM THE JSON",
      footer: "ALSO FROM JSON",
    }),
  );
  await expect(page.locator(".cm-lint-marker-error")).toHaveCount(0);

  await page.keyboard.press("Control+a");
  await page.keyboard.insertText(
    JSON.stringify({ ...document, badge: "A BADGE THAT IS FAR TOO LONG" }),
  );
  await expect(page.locator(".cm-lint-marker-error").first()).toBeVisible();
  await page.keyboard.press("Control+a");
  await page.keyboard.insertText(
    JSON.stringify({
      ...document,
      badge: "FROM THE JSON",
      footer: "ALSO FROM JSON",
    }),
  );

  await page.getByLabel("Advanced: JSON").click();
  await expect(page.getByLabel("Badge")).toHaveValue("FROM THE JSON");
  await expect(page.getByLabel("Footer")).toHaveValue("ALSO FROM JSON");
  await page.getByRole("button", { name: "Discard changes" }).click();
});

test("an expired session keeps unsaved edits and restores them after sign-in", async ({
  page,
}) => {
  await signIn(page);
  await page.getByLabel("Footer").fill("KEPT EDIT");
  // The session ends elsewhere (expiry, or a sign-out in another tab).
  const token = await csrfToken(page);
  expect(
    (
      await page.request.post("/api/admin/logout", {
        headers: { "X-CSRF-Token": token },
      })
    ).status(),
  ).toBe(204);

  await page.getByRole("button", { name: /^Publish/ }).click();
  await expect(page.getByText(/Your session ended/)).toBeVisible();
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByLabel("Footer")).toHaveValue("KEPT EDIT");
  await expect(page.getByText("Restored unsaved edits: About.")).toBeVisible();
  await page.getByRole("button", { name: "Discard changes" }).click();
  await expect(page.getByLabel("Footer")).not.toHaveValue("KEPT EDIT");
});

test("uploading a résumé PDF replaces the one the site serves", async ({
  page,
}) => {
  const pdf = Buffer.from(
    "%PDF-1.4\n% e2e upload\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n",
  );
  await signIn(page);
  await sidebar(page)
    .getByRole("button", { name: /^Résumé PDF/ })
    .click();
  await expect(
    page.getByRole("link", { name: "Open current PDF" }),
  ).toBeVisible();

  await page.getByLabel("PDF file (at most 10 MB)").setInputFiles({
    name: "resume.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await page.getByRole("button", { name: "Upload" }).click();

  await expect(
    page.getByText(`Uploaded resume.pdf: ${pdf.length} bytes.`),
  ).toBeVisible();
  await expect(page.getByText("Revalidation: done.")).toBeVisible();
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

for (const colorScheme of ["light", "dark"] as const) {
  test(`the admin pages have no axe violations (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    const axe = async (): Promise<void> => {
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    };
    await page.goto("/admin");
    await expect(page.getByLabel("Password")).toBeVisible();
    await axe();

    await signIn(page);
    await axe();

    await openSection(page, "Work");
    await page.getByRole("button", { name: /\(Employer 1\)/ }).click();
    await expect(
      page.getByRole("group", { name: "Employer 1" }).getByLabel("Name"),
    ).toBeVisible();
    await axe();

    await page.getByLabel("Advanced: JSON").click();
    await expect(
      page.getByRole("textbox", { name: "Work JSON" }),
    ).toBeVisible();
    await axe();
  });
}

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
