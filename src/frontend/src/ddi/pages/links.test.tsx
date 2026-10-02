import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LINKS } from "@/content/links";
import type { LinkEntry } from "@/content/types";
import { measure } from "../geometry";
import { placedTextBounds } from "../formats/placedText";
import {
  UFC_BU_SCRATCHPAD,
  UFC_BU_SELECTION_BOX,
  ufcBuRowY,
  ufcBuTableTexts,
} from "../formats/ufcBu";
import { FullViewportFrame } from "../frame/FullViewportFrame";
import { KEYPAD, NO_SELECTION, linksScreens } from "./links";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const THREE: readonly LinkEntry[] = [
  { name: "One", tag: "A", url: "https://example.com/1" },
  { name: "Two", tag: "B", url: "https://example.com/2" },
  { name: "Three", tag: "C", url: "https://example.com/3" },
];

const BOTTOM_RULE_Y = -350;

describe("the UFC BU format", () => {
  it("centres the columns where UFC_BU.lua does [pgB §12]", () => {
    const [number, name, tag] = ufcBuTableTexts([
      { number: "1", name: "A", tag: "B" },
    ]);
    expect([number.pos, name.pos, tag.pos]).toEqual([
      [-200, 300],
      [-20, 300],
      [180, 300],
    ]);
    expect(number).toMatchObject({ font: "F120", align: "CenterCenter" });
  });

  it("fits the 10 keypad rows above the bottom rule", () => {
    expect(
      ufcBuRowY(KEYPAD.length - 1) - UFC_BU_SELECTION_BOX.height / 2,
    ).toBeGreaterThan(BOTTOM_RULE_Y);
  });
});

describe("the Links content", () => {
  it("has 1 to 10 rows, one per keypad digit", () => {
    expect(LINKS.length).toBeGreaterThan(0);
    expect(LINKS.length).toBeLessThanOrEqual(KEYPAD.length);
  });

  it("keeps every cell inside the selection box and clear of its neighbours", () => {
    const halfBox = UFC_BU_SELECTION_BOX.width / 2;
    const rows = LINKS.map((link, index) => ({
      number: KEYPAD[index].digit,
      name: link.name,
      tag: link.tag,
    }));
    const texts = ufcBuTableTexts(rows);
    for (let index = 0; index < texts.length; index += 3) {
      const [number, name, tag] = texts
        .slice(index, index + 3)
        .map(placedTextBounds);
      expect(number.left).toBeGreaterThanOrEqual(-halfBox);
      expect(tag.right, texts[index + 2].text).toBeLessThanOrEqual(halfBox);
      expect(name.left, texts[index + 1].text).toBeGreaterThan(number.right);
      expect(tag.left, texts[index + 2].text).toBeGreaterThan(name.right);
    }
  });

  it("fits every name in the scratchpad", () => {
    for (const link of LINKS) {
      expect(measure(link.name, "F100").width, link.name).toBeLessThan(
        UFC_BU_SCRATCHPAD.width,
      );
    }
  });

  it("draws with the stroke font: every character is mapped", () => {
    for (const screen of Object.values(linksScreens(LINKS).screens)) {
      expect(() =>
        renderToStaticMarkup(<svg>{screen.symbology}</svg>),
      ).not.toThrow();
    }
  });
});

describe("the Links screens", () => {
  const { initial, screens } = linksScreens(THREE);

  it("opens with row 1 selected and has one screen per row, plus none", () => {
    expect(initial).toBe("1");
    expect(Object.keys(screens)).toEqual(["1", "2", "3", NO_SELECTION]);
  });

  it("puts a digit on PB8 onward for each row, and ENT on PB19 opens the selection in a new tab", () => {
    const legends = screens["2"].legends;
    expect(
      legends
        .filter(({ pb }) => pb >= 8 && pb <= 17)
        .map(({ pb, lines }) => [pb, lines]),
    ).toEqual([
      [8, ["1"]],
      [9, ["2"]],
      [10, ["3"]],
    ]);
    expect(legends.find(({ pb }) => pb === 19)).toEqual({
      pb: 19,
      lines: ["ENT"],
      label: "Open Two",
      action: { kind: "external", href: "https://example.com/2" },
    });
  });

  it("steps with the PB4 and PB5 arrows and wraps at both ends", () => {
    const step = (state: string, pb: number): unknown =>
      screens[state].legends.find((legend) => legend.pb === pb)?.action;
    expect(step("3", 4)).toEqual({ kind: "state", state: "1" });
    expect(step("1", 5)).toEqual({ kind: "state", state: "3" });
    expect(step(NO_SELECTION, 4)).toEqual({ kind: "state", state: "1" });
    expect(step(NO_SELECTION, 5)).toEqual({ kind: "state", state: "3" });
  });

  it("clears with CLR, after which ENT is inert", () => {
    expect(screens["1"].legends.find(({ pb }) => pb === 20)?.action).toEqual({
      kind: "state",
      state: NO_SELECTION,
    });
    expect(
      screens[NO_SELECTION].legends.find(({ pb }) => pb === 19)?.action,
    ).toEqual({ kind: "inert" });
  });

  it("rejects more rows than the keypad has digits", () => {
    const eleven = Array.from({ length: 11 }, (_, index) => ({
      ...THREE[0],
      url: `https://example.com/${index}`,
    }));
    expect(() => linksScreens(eleven)).toThrow(/1 to 10/);
  });

  it("selects on press without navigating: ENT follows the selection", () => {
    render(<FullViewportFrame screens={linksScreens(THREE)} />);
    expect(screen.getByRole("link", { name: "Open One" })).toHaveAttribute(
      "href",
      "https://example.com/1",
    );
    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Select Three" }),
      { button: 0 },
    );
    const ent = screen.getByRole("link", { name: "Open Three" });
    expect(ent).toHaveAttribute("href", "https://example.com/3");
    expect(ent).toHaveAttribute("target", "_blank");
    expect(ent).toHaveAttribute("rel", "noopener noreferrer");
    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Clear selection" }),
      { button: 0 },
    );
    expect(screen.queryByRole("link", { name: /^Open/ })).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });
});
