import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CHECKLIST } from "@/content/checklist";
import { measure } from "../geometry";
import {
  CHECKLIST_ITEM_SPAN,
  CHECKLIST_LAYOUT,
  ChecklistFormat,
} from "./checklist";

const FONT = "F150";
/** One inter-character gap, so a column never touches the next. */
const GAP = 6;

function fits(text: string, span: { from: number; to: number }): boolean {
  return span.from + measure(text, FONT).width + GAP <= span.to;
}

describe("the CHKLST format", () => {
  it("uses the Checklists.lua layout", () => {
    const { rowPitch, topY, leftHeadingX, rightHeadingX, indent } =
      CHECKLIST_LAYOUT;
    expect([rowPitch, topY, leftHeadingX, rightHeadingX, indent]).toEqual([
      46.5, 408, -289.5, 60, 25,
    ]);
    // A/C WT on row 9, MAX NZ on row 12 and STAB POS on row 14 [pgB §2].
    expect(topY - rowPitch * CHECKLIST_LAYOUT.weightRow).toBe(-10.5);
    expect(topY - rowPitch * CHECKLIST_LAYOUT.maxNzRow).toBe(-150);
    expect(topY - rowPitch * CHECKLIST_LAYOUT.stabRow).toBe(-243);
    expect(CHECKLIST_ITEM_SPAN.weightValue.from).toBe(-79.5);
  });

  it("draws one path per string", () => {
    const { container } = render(
      <svg>
        <ChecklistFormat {...CHECKLIST} />
      </svg>,
    );
    const strings =
      2 +
      CHECKLIST.left.items.length +
      CHECKLIST.right.items.length +
      2 +
      1 +
      3;
    expect(container.querySelectorAll("path")).toHaveLength(strings);
  });
});

describe("the checklist content", () => {
  it("fits the rows DCS has: 6 on the left and 9 on the right", () => {
    expect(CHECKLIST.left.items.length).toBeLessThanOrEqual(6);
    expect(CHECKLIST.right.items.length).toBeLessThanOrEqual(9);
  });

  it("keeps the left items clear of the right column", () => {
    for (const item of CHECKLIST.left.items) {
      expect(fits(item, CHECKLIST_ITEM_SPAN.left), item).toBe(true);
    }
  });

  it("keeps the right items inside the glass", () => {
    for (const item of CHECKLIST.right.items) {
      expect(fits(item, CHECKLIST_ITEM_SPAN.right), item).toBe(true);
    }
  });

  it("keeps the A/C WT value clear of the right column", () => {
    expect(fits(CHECKLIST.weight.value, CHECKLIST_ITEM_SPAN.weightValue)).toBe(
      true,
    );
  });
});
