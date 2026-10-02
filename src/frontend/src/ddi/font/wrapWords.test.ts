import { describe, expect, it } from "vitest";
import { wrapWords } from "./wrapWords";

describe("wrapWords", () => {
  it("fills each line greedily without passing the limit", () => {
    expect(wrapWords("one two three four", 9)).toEqual([
      "one two",
      "three",
      "four",
    ]);
  });

  it("collapses whitespace runs and trims the ends", () => {
    expect(wrapWords("  a \n b   c ", 20)).toEqual(["a b c"]);
  });

  it("fits a word exactly as long as a line", () => {
    expect(wrapWords("abcde fghij", 5)).toEqual(["abcde", "fghij"]);
  });

  it("throws on a word longer than a line", () => {
    expect(() => wrapWords("short extraordinarily", 8)).toThrow(
      /extraordinarily/,
    );
  });
});
