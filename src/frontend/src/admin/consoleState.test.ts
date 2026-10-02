import { describe, expect, test } from "vitest";
import {
  consoleReducer,
  isDirty,
  visibleServerIssues,
  type Sections,
} from "./consoleState";
import { diffDocuments } from "./schema/diff";
import { getAt, jsonEqual, pointerFromPath, setAt } from "./schema/pointer";

const LIVE = {
  document: { footer: "LIVE", rows: [{ a: 1 }] },
  etag: "e1",
  updatedAt: "2026-10-01T00:00:00Z",
};

function loaded(
  draft: { footer: string } | null = null,
  stashed: { footer: string } | null = null,
): Sections {
  return consoleReducer(
    {},
    {
      type: "loaded",
      section: "profile",
      live: LIVE,
      draft:
        draft === null
          ? null
          : { content: draft, updatedAt: "2026-10-02T00:00:00Z" },
      stashed,
    },
  );
}

function profile(sections: Sections): NonNullable<Sections["profile"]> {
  const edit = sections.profile;
  if (edit === undefined) {
    throw new Error("profile not loaded");
  }
  return edit;
}

describe("the console's section state", () => {
  test("opens the live copy, clean", () => {
    const edit = profile(loaded());
    expect(edit.value).toEqual(LIVE.document);
    expect(isDirty(edit)).toBe(false);
    expect(edit.draftSavedAt).toBeNull();
  });

  test("opens a stored draft, clean against the draft", () => {
    const edit = profile(loaded({ footer: "DRAFT" }));
    expect(edit.value).toEqual({ footer: "DRAFT" });
    expect(edit.draftSavedAt).toBe("2026-10-02T00:00:00Z");
    expect(isDirty(edit)).toBe(false);
  });

  test("restores stashed edits as unsaved", () => {
    const edit = profile(loaded(null, { footer: "STASHED" }));
    expect(edit.value).toEqual({ footer: "STASHED" });
    expect(isDirty(edit)).toBe(true);
  });

  test("a field edit, then a draft save, then a publish", () => {
    let sections = consoleReducer(loaded(), {
      type: "field-edited",
      section: "profile",
      pointer: "/footer",
      value: "MINE",
    });
    expect(isDirty(profile(sections))).toBe(true);
    const sent = profile(sections).value;
    sections = consoleReducer(sections, {
      type: "draft-saved",
      section: "profile",
      content: sent,
      updatedAt: "2026-10-02T01:00:00Z",
    });
    expect(isDirty(profile(sections))).toBe(false);
    expect(profile(sections).draftSavedAt).toBe("2026-10-02T01:00:00Z");
    sections = consoleReducer(sections, {
      type: "published",
      section: "profile",
      sent,
      live: { document: sent, etag: "e2", updatedAt: "2026-10-02T02:00:00Z" },
      revalidation: "done",
    });
    expect(profile(sections)).toMatchObject({
      draftSavedAt: null,
      live: { etag: "e2" },
      lastPublish: { revalidation: "done" },
    });
    expect(isDirty(profile(sections))).toBe(false);
  });

  test("discarding changes returns to the baseline; discarding the draft to the live copy", () => {
    let sections = loaded({ footer: "DRAFT" });
    sections = consoleReducer(sections, {
      type: "edited",
      section: "profile",
      value: { footer: "X" },
    });
    sections = consoleReducer(sections, {
      type: "changes-discarded",
      section: "profile",
    });
    expect(profile(sections).value).toEqual({ footer: "DRAFT" });
    sections = consoleReducer(sections, {
      type: "draft-discarded",
      section: "profile",
    });
    expect(profile(sections).value).toEqual(LIVE.document);
    expect(profile(sections).draftSavedAt).toBeNull();
  });

  test("a conflict keeps the edits until the newer copy is taken", () => {
    const theirs = {
      document: { footer: "THEIRS", rows: [] },
      etag: "e9",
      updatedAt: "2026-10-02T03:00:00Z",
    };
    let sections = consoleReducer(loaded(), {
      type: "edited",
      section: "profile",
      value: { footer: "MINE" },
    });
    sections = consoleReducer(sections, {
      type: "conflict",
      section: "profile",
      theirs,
    });
    expect(profile(sections).value).toEqual({ footer: "MINE" });
    sections = consoleReducer(sections, {
      type: "took-theirs",
      section: "profile",
    });
    expect(profile(sections)).toMatchObject({
      value: theirs.document,
      live: { etag: "e9" },
      conflict: null,
    });
  });

  test("an API message shows until its field changes", () => {
    let sections = consoleReducer(loaded(), {
      type: "refused",
      section: "profile",
      issues: [{ pointer: "/footer", message: "Too long." }],
    });
    expect(visibleServerIssues(profile(sections), new Set())).toEqual([
      { pointer: "/footer", message: "Too long." },
    ]);
    expect(
      visibleServerIssues(profile(sections), new Set(["/footer"])),
    ).toEqual([]);
    sections = consoleReducer(sections, {
      type: "field-edited",
      section: "profile",
      pointer: "/footer",
      value: "OK",
    });
    expect(visibleServerIssues(profile(sections), new Set())).toEqual([]);
  });
});

describe("pointers and diffs", () => {
  test("set and get keep untouched branches", () => {
    const document = { a: { b: [1, 2] }, c: { d: 1 } };
    const next = setAt(document, "/a/b/1", 5);
    expect(getAt(next, "/a/b/1")).toBe(5);
    expect(
      typeof next === "object" &&
        next !== null &&
        !Array.isArray(next) &&
        next.c,
    ).toBe(document.c);
    expect(pointerFromPath(["a~b", "c/d", 0])).toBe("/a~0b/c~1d/0");
  });

  test("structural equality", () => {
    expect(jsonEqual({ a: [1, { b: null }] }, { a: [1, { b: null }] })).toBe(
      true,
    );
    expect(jsonEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  test("the conflict diff lists changed leaves", () => {
    expect(
      diffDocuments({ a: "x", rows: [1, 2] }, { a: "y", rows: [1] }),
    ).toEqual([
      { pointer: "/a", before: "x", after: "y" },
      { pointer: "/rows/1", before: 2, after: undefined },
    ]);
  });
});
