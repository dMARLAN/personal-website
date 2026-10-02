import { describe, expect, it } from "vitest";
import { legendBounds, menuTitleBox, pbLabelLayout } from "./legend";

describe("pbLabelLayout", () => {
  it("boxes a row legend 22n × 36 with its outer edge 6 DI beyond the text (NCTR → 88 wide)", () => {
    const { texts, boxes } = pbLabelLayout(16, ["NCTR"], true);
    expect(texts).toEqual([
      { text: "NCTR", align: "CenterBottom", pos: [340, -500] },
    ]);
    expect(boxes).toEqual([
      { width: 88, height: 36, align: "CenterBottom", pos: [340, -506] },
    ]);
  });

  it("stacks extra row lines 35 DI inward (TGT above DATA at PB20)", () => {
    const { texts } = pbLabelLayout(20, ["DATA", "TGT"], false);
    expect(texts.map(({ pos }) => pos)).toEqual([
      [-336, -500],
      [-336, -465],
    ]);
  });

  it("puts each side word in its own upright column, 25 DI inward (RDR, ATTK at PB4)", () => {
    const { texts } = pbLabelLayout(4, ["RDR", "ATTK"], false);
    expect(texts).toEqual([
      { text: "R\nD\nR", align: "LeftCenter", pos: [-500, 140] },
      { text: "A\nT\nT\nK", align: "LeftCenter", pos: [-475, 140] },
    ]);
  });

  it("boxes a side legend 26 × 32n from 6 DI outside the text", () => {
    const { boxes } = pbLabelLayout(13, ["SA"], true);
    expect(boxes).toEqual([
      { width: 26, height: 64, align: "RightCenter", pos: [506, -27] },
    ]);
    const [, box] = legendBounds(pbLabelLayout(2, ["HSI"], true));
    expect(box).toEqual({ left: -506, right: -480, bottom: -242, top: -146 });
  });

  it("measures a side column at 30 DI per letter, centred on the PB", () => {
    // PROJECTS at PB5 spans y 190–424 (design section 9.3).
    const [bounds] = legendBounds(pbLabelLayout(5, ["PROJECTS"], false));
    expect(bounds).toEqual({ left: -500, right: -486, bottom: 190, top: 424 });
  });
});

describe("menuTitleBox", () => {
  it("runs from y −469 to −423 [fnd §5.5]", () => {
    expect(menuTitleBox()).toEqual({
      left: -55,
      right: 55,
      bottom: -469,
      top: -423,
    });
  });
});
