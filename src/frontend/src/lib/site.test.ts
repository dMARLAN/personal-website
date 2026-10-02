import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SITE_NAME } from "./site";

const SOURCE_ROOT = path.resolve(import.meta.dirname, "..");
const SITE_FILE = path.join(SOURCE_ROOT, "lib", "site.ts");
const THIS_FILE = path.join(SOURCE_ROOT, "lib", "site.test.ts");

describe("the site name", () => {
  it("lives only in site.ts: the surname is going to change", () => {
    const surname = SITE_NAME.split(" ").at(-1);
    expect(surname).toBeTruthy();
    const offenders = readdirSync(SOURCE_ROOT, {
      recursive: true,
      encoding: "utf8",
    })
      .map((file) => path.join(SOURCE_ROOT, file))
      .filter(
        (file) =>
          /\.(ts|tsx|css)$/.test(file) &&
          file !== SITE_FILE &&
          file !== THIS_FILE,
      )
      .filter((file) => readFileSync(file, "utf8").includes(String(surname)));
    expect(offenders).toEqual([]);
  });
});
