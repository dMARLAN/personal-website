import { describe, expect, it } from "vitest";
import { FONT_IDS, FONTS } from "./constants";
import {
  align,
  lineEnd,
  measure,
  polylinePath,
  toSvg,
  type Align,
} from "./geometry";

describe("toSvg", () => {
  it("flips y and keeps x", () => {
    expect(toSvg([-500, 307])).toEqual([-500, -307]);
    expect(toSvg([12, -446])).toEqual([12, 446]);
  });

  it("writes path data in SVG coordinates", () => {
    expect(
      polylinePath([
        [0, 10],
        [5, -2.5],
      ]),
    ).toBe("M0,-10 L5,2.5");
    expect(
      polylinePath(
        [
          [0, 0],
          [1, 0],
          [1, 1],
        ],
        true,
      ),
    ).toBe("M0,0 L1,0 L1,-1 Z");
  });
});

describe("align", () => {
  const size = { width: 40, height: 20 };
  const cases: [Align, { left: number; bottom: number }][] = [
    ["LeftTop", { left: 100, bottom: 180 }],
    ["LeftCenter", { left: 100, bottom: 190 }],
    ["LeftBottom", { left: 100, bottom: 200 }],
    ["CenterTop", { left: 80, bottom: 180 }],
    ["CenterCenter", { left: 80, bottom: 190 }],
    ["CenterBottom", { left: 80, bottom: 200 }],
    ["RightTop", { left: 60, bottom: 180 }],
    ["RightCenter", { left: 60, bottom: 190 }],
    ["RightBottom", { left: 60, bottom: 200 }],
  ];

  it.each(cases)(
    "puts the %s point of the box at pos",
    (alignment, { left, bottom }) => {
      expect(align(size, alignment, [100, 200])).toEqual({
        left,
        right: left + 40,
        bottom,
        top: bottom + 20,
      });
    },
  );
});

describe("measure", () => {
  it.each(FONT_IDS)(
    "gives n·W + (n − 1)·interchar for one line in %s",
    (font) => {
      const { width, height, interchar } = FONTS[font];
      for (const n of [1, 2, 7, 24]) {
        expect(measure("A".repeat(n), font)).toEqual({
          width: n * width + (n - 1) * interchar,
          height,
        });
      }
    },
  );

  it.each(FONT_IDS)("stacks lines at H + interline in %s", (font) => {
    const { width, height, interchar, interline } = FONTS[font];
    expect(measure("AB\nCDEF\nG", font)).toEqual({
      width: 4 * width + 3 * interchar,
      height: 3 * height + 2 * interline,
    });
  });

  it("counts spaces as cells and treats an empty string as zero width", () => {
    expect(measure("A B", "F100").width).toBe(3 * 12 + 2 * 4);
    expect(measure("", "F100").width).toBe(0);
  });

  it("gives the CONTACT legend width from the design (134 DI)", () => {
    expect(measure("CONTACT", "F120").width).toBe(134);
  });
});

describe("lineEnd", () => {
  it("measures rot counter-clockwise from up", () => {
    const [upX, upY] = lineEnd([0, 0], 10, 0);
    expect(upX).toBeCloseTo(0);
    expect(upY).toBeCloseTo(10);
    const [leftX, leftY] = lineEnd([0, 0], 10, 90);
    expect(leftX).toBeCloseTo(-10);
    expect(leftY).toBeCloseTo(0);
    const [rightX] = lineEnd([5, 5], 10, -90);
    expect(rightX).toBeCloseTo(15);
  });
});
