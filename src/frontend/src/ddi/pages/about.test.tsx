import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PROFILE } from "@/content/profile";
import type { Rect } from "../geometry";
import {
  FREE_TEXT,
  TGT_DATA_QUADRANTS,
  tgtDataOwnshipTexts,
  type TgtDataOwnshipProps,
} from "../formats/tgtDataOwnship";
import { placedTextBounds, type PlacedText } from "../formats/placedText";
import { aboutFormatProps, aboutScreens } from "./about";

const DCS_SAMPLE: TgtDataOwnshipProps = {
  topLeft: "EMERG",
  topRight: "EXER",
  status: [
    { label: "VC:", value: "XXXX" },
    { label: "TYPE:", value: "FA-18C" },
    { label: "STRGTH:", value: "1" },
    { label: "ACTVTY:", value: "XXXXXX" },
    { label: "PRI TN:", value: "XXXXX" },
  ],
  stores: ["X - XXXX", "X - XXXX", "X - XXXXXX", "X - XXXX", "X - XXXX"],
  footer: "XX.X",
  iff: ["IFF 1:", "IFF 2:", "IFF 3:"],
  freeText: [],
};

function inside(inner: Rect, outer: Rect): boolean {
  return (
    inner.left >= outer.left &&
    inner.right <= outer.right &&
    inner.bottom >= outer.bottom &&
    inner.top <= outer.top
  );
}

function at(texts: readonly PlacedText[], text: string): PlacedText {
  const found = texts.find((placed) => placed.text === text);
  if (found === undefined) {
    throw new Error(`${text} is not placed`);
  }
  return found;
}

describe("the TGT DATA OWNSHIP format", () => {
  const texts = tgtDataOwnshipTexts(DCS_SAMPLE);

  it("places the DCS sample strings where TGT_DATA_OWNSHIP.lua does [pgB §11]", () => {
    expect(at(texts, "EMERG")).toMatchObject({
      align: "LeftBottom",
      pos: [-385, 410],
    });
    expect(at(texts, "EXER")).toMatchObject({
      align: "RightBottom",
      pos: [385, 410],
    });
    expect(at(texts, "VC:")).toMatchObject({
      align: "RightBottom",
      pos: [-210, 335],
    });
    expect(at(texts, "XXXX")).toMatchObject({
      align: "LeftBottom",
      pos: [-185, 335],
    });
    expect(at(texts, "PRI TN:").pos).toEqual([-210, 171]);
    expect(at(texts, "X - XXXXXX").pos).toEqual([43, 253]);
    expect(at(texts, "XX.X").pos).toEqual([-385, -10]);
    expect(at(texts, "IFF 3:").pos).toEqual([35, -175]);
    expect(texts.every((placed) => placed.font === "F120")).toBe(true);
  });

  it("fits 9 free-text rows in the bottom-left quadrant", () => {
    const rows = tgtDataOwnshipTexts({
      ...DCS_SAMPLE,
      freeText: Array.from({ length: 9 }, () => "X".repeat(18)),
    });
    const freeText = rows.filter(
      (placed) =>
        placed.pos[0] === FREE_TEXT.x && placed.pos[1] <= FREE_TEXT.firstY,
    );
    expect(freeText).toHaveLength(9);
    for (const placed of freeText) {
      expect(
        inside(placedTextBounds(placed), TGT_DATA_QUADRANTS.bottomLeft),
      ).toBe(true);
    }
  });
});

describe("the About content", () => {
  const props = aboutFormatProps(PROFILE);

  it("keeps every slot inside its quadrant", () => {
    const placed = tgtDataOwnshipTexts(props);
    const quadrantOf = (text: PlacedText): Rect => {
      const [x, y] = text.pos;
      if (y > TGT_DATA_QUADRANTS.topLeft.top) {
        // EMERG and EXER sit above the box, each in its own half.
        return x < 0
          ? { ...TGT_DATA_QUADRANTS.topLeft, top: Infinity, right: -15 }
          : { ...TGT_DATA_QUADRANTS.topRight, top: Infinity, left: 15 };
      }
      const top = y > TGT_DATA_QUADRANTS.bottomLeft.top;
      if (x < 0) {
        return top ? TGT_DATA_QUADRANTS.topLeft : TGT_DATA_QUADRANTS.bottomLeft;
      }
      return top ? TGT_DATA_QUADRANTS.topRight : TGT_DATA_QUADRANTS.bottomRight;
    };
    for (const text of placed) {
      expect(inside(placedTextBounds(text), quadrantOf(text)), text.text).toBe(
        true,
      );
    }
  });

  it("wraps the bio to at most 9 rows of 18 characters", () => {
    expect(props.freeText.length).toBeGreaterThan(0);
    expect(props.freeText.length).toBeLessThanOrEqual(FREE_TEXT.rows);
    expect(props.freeText.every((row) => row.length <= 18)).toBe(true);
  });

  it("draws with the stroke font: every character is mapped", () => {
    const { screens } = aboutScreens(PROFILE);
    for (const screen of Object.values(screens)) {
      expect(() =>
        renderToStaticMarkup(<svg>{screen.symbology}</svg>),
      ).not.toThrow();
    }
  });

  it("has one screen whose only legend is MENU, back to /", () => {
    const { initial, screens } = aboutScreens(PROFILE);
    expect(Object.keys(screens)).toEqual([initial]);
    expect(screens[initial].legends).toEqual([
      {
        pb: 18,
        lines: ["MENU"],
        label: "Menu",
        action: { kind: "link", href: "/" },
      },
    ]);
  });
});
