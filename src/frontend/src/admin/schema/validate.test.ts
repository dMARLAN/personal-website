import { describe, expect, test } from "vitest";
import snapshot from "@/content/snapshot.json";
import { DDI_GLYPHS } from "@/ddi/font/glyphs";
import type { JsonValue } from "./jsonSchema";
import { setAt } from "./pointer";
import { describePointer, locToPointer } from "./serverIssues";
import { sectionModel } from "./sectionModel";
import { characterCount, counterTone, invalidCharacters } from "./text";
import { valuesAt } from "./validate";

// Round-tripped: the JSON import types optional union fields as `undefined`, which JSON never holds.
const SEED: Record<string, JsonValue> = JSON.parse(JSON.stringify(snapshot));

function seed(section: string): JsonValue {
  const document = SEED[section];
  if (document === undefined) {
    throw new Error(`no seed for ${section}`);
  }
  return structuredClone(document);
}

function issuesAfter(
  section: string,
  pointer: string,
  value: JsonValue,
): { pointer: string; message: string }[] {
  return sectionModel(section).validate(setAt(seed(section), pointer, value));
}

describe("client validation", () => {
  test("the seed content passes every check of every section", () => {
    for (const section of Object.keys(SEED)) {
      expect([section, sectionModel(section).validate(seed(section))]).toEqual([
        section,
        [],
      ]);
    }
  });

  test("a value over its maxLength is reported on the field", () => {
    expect(issuesAfter("profile", "/status/0/value", "FAR TOO LONG")).toEqual([
      {
        pointer: "/status/0/value",
        message: "Too long: at most 9 characters.",
      },
    ]);
  });

  test("a character the stroke font lacks names it, instead of the glyph pattern", () => {
    expect(issuesAfter("profile", "/badge", "HI~THERE!")).toEqual([
      { pointer: "/badge", message: 'The glass cannot draw "~" "!".' },
    ]);
  });

  test("an empty required string", () => {
    expect(issuesAfter("profile", "/footer", "")).toEqual([
      { pointer: "/footer", message: "Required." },
    ]);
  });

  test("wrapped text that overflows its rows, or has a word too long to wrap", () => {
    expect(
      issuesAfter("profile", "/bio", "WORD ".repeat(28).trim()),
    ).toContainEqual({
      pointer: "/bio",
      message: "Wraps to 10 rows; the slot fits 9 rows of 18 characters.",
    });
    expect(issuesAfter("profile", "/bio", "SUPERCALIFRAGILISTIC")).toEqual([
      {
        pointer: "/bio",
        message:
          "“SUPERCALIFRAGILISTIC” is longer than 18 characters, so it cannot wrap.",
      },
    ]);
  });

  test("a row whose fields together overflow it is reported on its last field, as the API does", () => {
    expect(
      issuesAfter("profile", "/tags/0", {
        label: "SIMULATOR:",
        value: "DCS F/A-18C",
      }),
    ).toEqual([
      {
        pointer: "/tags/0/value",
        message: "label and value together are 22 characters; the row fits 18.",
      },
    ]);
  });

  test("a duplicate of a unique key is reported on the later item", () => {
    const issues = sectionModel("work").validate(
      setAt(seed("work"), "/employers/1/id", "northwind"),
    );
    expect(issues).toEqual([
      {
        pointer: "/employers/1/id",
        message: "Must be unique: item 1 has it too.",
      },
    ]);
  });

  test("a value that must come from elsewhere in the document", () => {
    expect(issuesAfter("projects", "/projects/0/category", "NOPE")).toEqual([
      expect.objectContaining({ pointer: "/projects/0/category" }),
    ]);
    expect(
      valuesAt(
        { categories: [{ legend: "A" }, { legend: "B" }] },
        "categories/*/legend",
      ),
    ).toEqual(["A", "B"]);
  });

  test("a URL that is neither https nor a site path", () => {
    expect(issuesAfter("links", "/links/0/url", "ftp://example.com")).toEqual([
      expect.objectContaining({ pointer: "/links/0/url" }),
    ]);
  });

  test("too many items, a number out of bounds, a wrong union field", () => {
    const tooMany = Array.from({ length: 11 }, () => ({
      name: "A",
      tag: "B",
      url: "/",
    }));
    expect(sectionModel("links").validate({ links: tooMany })).toEqual([
      { pointer: "/links", message: "At most 10 items." },
    ]);
    expect(issuesAfter("radar", "/ownship/heading", 400)).toEqual([
      { pointer: "/ownship/heading", message: "Must be <= 359." },
    ]);
    expect(issuesAfter("profile", "/extra", "x")).toEqual([
      { pointer: "/extra", message: "Not a field of this section." },
    ]);
  });
});

describe("the API's 422 loc → the field", () => {
  const profile = sectionModel("profile").fields;
  const projects = sectionModel("projects").fields;
  const fuel = sectionModel("fuel").fields;

  test("drops body and walks objects and tuples", () => {
    expect(locToPointer(profile, ["body", "status", 0, "value"])).toBe(
      "/status/0/value",
    );
    expect(locToPointer(profile, ["body", "bio"])).toBe("/bio");
    expect(locToPointer(projects, ["body", "projects", 1, "station"])).toBe(
      "/projects/1/station",
    );
  });

  test("skips a tagged union's tag segment", () => {
    expect(
      locToPointer(fuel, ["body", "tanks", 2, "motion", "drain", "low"]),
    ).toBe("/tanks/2/motion/low");
  });

  test("stops at the deepest field it knows", () => {
    expect(
      locToPointer(profile, ["body", "tags", 0, "function-after[fits_row()]"]),
    ).toBe("/tags/0");
    expect(locToPointer(profile, ["body"])).toBe("");
  });

  test("names a field for people", () => {
    expect(describePointer(profile, "/status/0/value")).toBe(
      "Status rows › 1 › Value",
    );
    expect(describePointer(profile, "")).toBe("The document");
  });
});

describe("counters and the charset", () => {
  test("the counter turns amber near the limit and red past it", () => {
    expect(counterTone(5, 9)).toBe("ok");
    expect(counterTone(8, 9)).toBe("near");
    expect(counterTone(9, 9)).toBe("near");
    expect(counterTone(10, 9)).toBe("over");
    expect(counterTone(14, 18)).toBe("ok");
    expect(counterTone(16, 18)).toBe("near");
    expect(counterTone(0, 1)).toBe("ok");
  });

  test("characters are counted as the API counts them", () => {
    expect(characterCount("90°")).toBe(3);
    expect(characterCount("😀")).toBe(1);
  });

  test("invalid characters: lower case is fine, the rest are listed once", () => {
    expect(invalidCharacters("Hello, world", DDI_GLYPHS)).toEqual([]);
    expect(invalidCharacters("a~b~c!", DDI_GLYPHS)).toEqual(["~", "!"]);
  });
});
