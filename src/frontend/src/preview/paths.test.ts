import { describe, expect, test } from "vitest";
import { PAGES } from "@/ddi/pages/registry";
import {
  isPreviewPath,
  isRenderedMessage,
  livePageUrl,
  previewUrl,
  RENDERED_MESSAGE,
} from "./paths";

describe("the preview path allowlist", () => {
  test("allows every registry route", () => {
    for (const page of Object.values(PAGES)) {
      expect(isPreviewPath(page.path)).toBe(true);
    }
  });

  test.each([
    "",
    "about",
    "//evil.example",
    "/\\evil.example",
    "https://evil.example/about",
    "/about/",
    "/about?view=plain",
    "/about#x",
    "/about/../admin",
    "/admin",
    "/api/admin/drafts",
    "/revalidate",
    "/ABOUT",
  ])("refuses %j", (path) => {
    expect(isPreviewPath(path)).toBe(false);
  });

  test("builds the enable and disable URLs with the path as a query value", () => {
    expect(previewUrl("/about")).toBe("/admin/preview/enable?path=%2Fabout");
    expect(livePageUrl("/")).toBe("/admin/preview/disable?path=%2F");
  });
});

describe("the frame's rendered message", () => {
  test("accepts a well-formed message", () => {
    expect(
      isRenderedMessage({
        type: RENDERED_MESSAGE,
        state: "draft",
        renderId: "r1",
      }),
    ).toBe(true);
  });

  test.each([
    null,
    "pw-preview:rendered",
    { type: RENDERED_MESSAGE, state: "published", renderId: "r1" },
    { type: RENDERED_MESSAGE, state: "draft" },
    { type: "other", state: "draft", renderId: "r1" },
  ])("refuses %j", (data) => {
    expect(isRenderedMessage(data)).toBe(false);
  });
});
