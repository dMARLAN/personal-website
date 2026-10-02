import { describe, expect, test } from "vitest";
import { isPreviewPath } from "@/preview/paths";
import { SECTIONS, sectionInfo } from "../sections";
import { frameStateFromMeta } from "./draftMode";
import { fitFrame, previewTargets, viewportById } from "./targets";

describe("the pages each section previews", () => {
  test.each([
    ["profile", ["/about", "/"]],
    ["resume", ["/resume", "/"]],
    ["work", ["/work", "/"]],
    ["projects", ["/projects", "/"]],
    ["contact", ["/contact", "/"]],
    ["links", ["/links", "/"]],
    ["bit", ["/bit"]],
    ["fuel", ["/fuel"]],
    ["fcs", ["/fcs"]],
    ["checklist", ["/chklst"]],
    ["server", ["/server"]],
    ["radar", ["/radar"]],
    ["mumi", ["/mumi"]],
  ] as const)("%s → %j", (id, paths) => {
    expect(
      previewTargets(sectionInfo(id)).map((target) => target.path),
    ).toEqual(paths);
  });

  test("the DDI page comes first, labelled for the toggle", () => {
    expect(
      previewTargets(sectionInfo("profile")).map((target) => target.label),
    ).toEqual(["DDI page", "Homepage"]);
  });

  test("every target is a path the enable route accepts", () => {
    for (const section of SECTIONS) {
      for (const target of previewTargets(section)) {
        expect(isPreviewPath(target.path)).toBe(true);
      }
    }
  });
});

describe("fitting a viewport into the pane", () => {
  const pane = { width: 600, height: 800 };

  test("fit fills the pane at full scale", () => {
    const fit = viewportById("fit");
    if (fit === null) {
      throw new Error("no fit viewport");
    }
    expect(fitFrame(fit, pane, 16)).toEqual({
      width: 600,
      height: 800,
      scale: 1,
      left: 0,
      top: 0,
    });
  });

  test("a desktop size scales down to the pane's width and centres", () => {
    const desktop = viewportById("1440x900");
    if (desktop === null) {
      throw new Error("no 1440x900 viewport");
    }
    const box = fitFrame(desktop, pane, 16);
    expect(box.width).toBe(1440);
    expect(box.height).toBe(900);
    expect(box.scale).toBeCloseTo(568 / 1440);
    expect(box.left).toBeCloseTo(16);
    expect(box.top).toBeCloseTo((800 - 900 * box.scale) / 2);
  });

  test("never scales up", () => {
    const phone = viewportById("390x844");
    if (phone === null) {
      throw new Error("no phone viewport");
    }
    expect(fitFrame(phone, { width: 2000, height: 2000 }, 16).scale).toBe(1);
  });
});

describe("reading the frame's state", () => {
  test.each([
    ["draft", "draft"],
    ["signed-out", "signed-out"],
    ["error", "error"],
    ["something else", "error"],
    [null, "error"],
  ] as const)("%j → %s", (meta, state) => {
    expect(frameStateFromMeta(meta)).toBe(state);
  });
});
