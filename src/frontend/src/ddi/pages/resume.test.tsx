import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  SW_CONFIG,
  SW_CONFIG_RIGHT_LIMIT,
  SwConfig,
  swConfigRowY,
} from "../formats/swConfig";
import { measure } from "../geometry";
import { resumeLegends, resumeScreens } from "./resume";
import { SNAPSHOT_CONTENT } from "@/content/snapshot";

const RESUME = SNAPSHOT_CONTENT.resume;

const width = (text: string): number => measure(text, SW_CONFIG.font).width;

describe("the S/W CONFIGURATION format", () => {
  it("puts its 12 rows at y = 180 − 37k, as the Lua does", () => {
    expect([0, 1, 11].map(swConfigRowY)).toEqual([180, 143, -227]);
  });

  it("centres the two title lines at y ≈ 326 and 274", () => {
    const { height } = measure("A\nB", SW_CONFIG.title.font);
    expect(height).toBe(92);
    expect(SW_CONFIG.title.pos[1] + height / 2 - 20).toBe(326);
  });
});

describe("the resume content", () => {
  const { left, right, title } = RESUME;

  it("fits 12 rows a column", () => {
    expect(left.rows.length).toBeLessThanOrEqual(SW_CONFIG.rows);
    expect(right.rows.length).toBeLessThanOrEqual(SW_CONFIG.rows);
  });

  it("keeps at least one character of space between each name and its value", () => {
    for (const { name } of [...left.rows, ...right.rows]) {
      expect(width(name) + 20, name).toBeLessThanOrEqual(SW_CONFIG.valueOffset);
    }
  });

  it("keeps left values clear of the right column, and right values clear of the side legends", () => {
    const leftValueX = SW_CONFIG.columnX.left + SW_CONFIG.valueOffset;
    const rightValueX = SW_CONFIG.columnX.right + SW_CONFIG.valueOffset;
    for (const { value } of left.rows) {
      expect(leftValueX + width(value), value).toBeLessThan(
        SW_CONFIG.columnX.right,
      );
    }
    for (const { value } of right.rows) {
      expect(rightValueX + width(value), value).toBeLessThanOrEqual(
        SW_CONFIG_RIGHT_LIMIT,
      );
    }
  });

  it("fits each title line in 24 characters", () => {
    for (const line of title) {
      expect(line.length).toBeLessThanOrEqual(24);
    }
  });

  it("draws with the stroke font: every character has a glyph", () => {
    expect(() =>
      renderToStaticMarkup(
        <svg>
          <SwConfig title={title} left={left.rows} right={right.rows} />
        </svg>,
      ),
    ).not.toThrow();
  });
});

describe("the resume page", () => {
  it("downloads the PDF from PB20 and returns to the menu from PB18", () => {
    expect(
      resumeLegends().map(({ pb, lines, action }) => [pb, lines, action]),
    ).toEqual([
      [20, ["PDF"], { kind: "download", href: "/api/resume.pdf" }],
      [18, ["MENU"], { kind: "link", href: "/ddi" }],
    ]);
  });

  it("has one screen and no in-section state", () => {
    const screens = resumeScreens(RESUME);
    expect(Object.keys(screens.screens)).toEqual([screens.initial]);
  });
});
