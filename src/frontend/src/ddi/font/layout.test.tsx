import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FONTS } from "../constants";
import { STROKE_FONT } from "../generated/strokeFont";
import { StrokeText } from "../primitives/StrokeText";
import { strokesPath } from "../strokes";
import { glyph, UnmappedCharacterError } from "./glyphs";
import { layoutText, textPath } from "./layout";

describe("the stroke font", () => {
  it("has the 55 DCS glyphs", () => {
    expect(Object.keys(STROKE_FONT)).toHaveLength(55);
  });

  it.each([
    ["A", "M0,20 L0,3 L3,0 L9,0 L12,3 L12,20 M0,10 L12,10"],
    [
      "S",
      "M12,3 L9,0 L3,0 L0,3 L0,7 L3,10 L9,10 L12,13 L12,17 L9,20 L3,20 L0,17",
    ],
    ["/", "M14,-3 L-2,23"],
  ])("draws %s as the research path", (character, expected) => {
    expect(strokesPath(STROKE_FONT[character], [0, 0])).toBe(expected);
  });

  it("resolves every character of a sample string, including our @", () => {
    const sample =
      "THE QUICK BROWN FOX: 0123456789 -+'()*%,°./\\\"?#=_^ chad@example.com";
    for (const character of sample.toUpperCase().replaceAll(" ", "")) {
      expect(glyph(character, sample).length).toBeGreaterThan(0);
    }
    expect(() => textPath(sample, "F120", "LeftTop", [0, 0])).not.toThrow();
  });

  it("throws on an unmapped character", () => {
    expect(() => textPath("A[B", "F100", "LeftTop", [0, 0])).toThrow(
      UnmappedCharacterError,
    );
    expect(() =>
      renderToStaticMarkup(
        <StrokeText text="HI!" font="F120" align="CenterCenter" pos={[0, 0]} />,
      ),
    ).toThrow('No stroke glyph for "!"');
  });
});

describe("layoutText", () => {
  it("advances W + interchar per character and skips spaces", () => {
    const { width, interchar } = FONTS.F120;
    const placed = layoutText("A B", "F120", "LeftTop", [10, 50]);
    expect(placed).toEqual([
      { character: "A", x: 10, y: -50 },
      { character: "B", x: 10 + 2 * (width + interchar), y: -50 },
    ]);
  });

  it("upper-cases text", () => {
    expect(
      layoutText("ab", "F100", "LeftTop", [0, 0]).map((p) => p.character),
    ).toEqual(["A", "B"]);
  });

  it("aligns the bounding box to pos", () => {
    // MENU at 150 %: 4·18 + 3·6 = 90 wide, 30 high, centred on the title position (0, −446).
    const placed = layoutText("MENU", "F150", "CenterCenter", [0, -446]);
    expect(placed[0]).toEqual({ character: "M", x: -45, y: 446 - 15 });
    expect(placed[3].x).toBe(-45 + 3 * 24);

    const right = layoutText("XMIT", "F120", "RightBottom", [500, -500]);
    expect(right[3].x + FONTS.F120.width).toBe(500);
    expect(right[0].y).toBe(500 - FONTS.F120.height);
  });

  it("stacks lines at H + interline and aligns each line within the block", () => {
    // A side legend: one letter per line, LeftCenter at the PB anchor.
    const { height, interline } = FONTS.F120;
    const placed = layoutText("R\nD\nR", "F120", "LeftCenter", [-500, -27]);
    const blockHeight = 3 * height + 2 * interline;
    expect(placed.map((p) => [p.x, p.y])).toEqual([
      [-500, 27 - blockHeight / 2],
      [-500, 27 - blockHeight / 2 + height + interline],
      [-500, 27 - blockHeight / 2 + 2 * (height + interline)],
    ]);

    const centred = layoutText("AB\nC", "F100", "CenterTop", [0, 0]);
    expect(centred.map((p) => p.x)).toEqual([-14, 2, -6]);
  });

  it("renders one path per string, scaled from the 12 × 20 cell", () => {
    const markup = renderToStaticMarkup(
      <StrokeText text="L" font="F200" align="LeftTop" pos={[0, 0]} />,
    );
    expect(markup).toBe(
      '<path d="M0,0 L0,40 L24,40" vector-effect="non-scaling-stroke"></path>',
    );
  });
});
