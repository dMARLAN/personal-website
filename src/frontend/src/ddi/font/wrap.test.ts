import { describe, expect, it } from "vitest";
import { WordTooLongError, wrapText } from "./wrap";

describe("wrapText", () => {
  it("fills each line greedily up to the limit", () => {
    expect(wrapText("one two three four", 9)).toEqual([
      "one two",
      "three",
      "four",
    ]);
  });

  it("keeps a line of exactly the limit", () => {
    expect(wrapText("abc def", 7)).toEqual(["abc def"]);
  });

  it("collapses runs of whitespace", () => {
    expect(wrapText("  a   b \n c ", 10)).toEqual(["a b c"]);
  });

  it("throws on a word longer than a line", () => {
    expect(() => wrapText("a supercalifragilistic word", 10)).toThrow(
      WordTooLongError,
    );
  });
});
