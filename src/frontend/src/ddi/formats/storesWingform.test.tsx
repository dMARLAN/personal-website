import { describe, expect, it } from "vitest";
import { lineEnd, type Point } from "../geometry";
import {
  PYLON_TICKS,
  STATION_ANCHORS,
  WINGFORM_LINES,
  dataRowY,
  progRowY,
  stationLayout,
  stationStatus,
  wrapWords,
  type StationStoreProps,
} from "./storesWingform";

function rounded([x, y]: Point): Point {
  return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
}

function layout(
  props: Partial<StationStoreProps> &
    Pick<StationStoreProps, "station" | "load">,
): {
  symbols: Point[];
  texts: [string, Point, string][];
} {
  const { symbols, texts } = stationLayout({
    code: "CODE",
    status: "RDY",
    selected: false,
    ...props,
  });
  return {
    symbols: symbols.map(({ pos }) => pos),
    texts: texts.map(({ text, pos, align }) => [text, pos, align]),
  };
}

describe("the STORES wingform", () => {
  it("reproduces the four Lua lines exactly, including the 1 DI floor asymmetry [pgA §1.1]", () => {
    expect(
      WINGFORM_LINES.map(({ pos, len, rot }) => [
        pos,
        rounded(lineEnd(pos, len, rot)),
      ]),
    ).toEqual([
      [
        [-45, 243],
        [-47.36, 198.06],
      ],
      [
        [-48, 198],
        [-365.21, 50.08],
      ],
      [
        [45, 243],
        [47.36, 198.06],
      ],
      [
        [47, 198],
        [364.21, 50.08],
      ],
    ]);
  });

  it("anchors the nine stations where the Lua steps them [pgA §1.2]", () => {
    expect(STATION_ANCHORS).toEqual({
      1: [-363, 48],
      2: [-258, 98],
      3: [-153, 148],
      4: [-45, 243],
      5: [0, 230],
      6: [45, 243],
      7: [152, 148],
      8: [257, 98],
      9: [362, 48],
    });
  });

  it("draws 5 DI pylon ticks: down on the wing pylons and outboard on the fuselage stations", () => {
    expect(
      PYLON_TICKS.map(({ pos, len, rot }) => [
        pos,
        rounded(lineEnd(pos, len, rot)),
      ]),
    ).toEqual([
      [
        [-45, 243],
        [-50, 243],
      ],
      [
        [-153, 148],
        [-153, 143],
      ],
      [
        [-258, 98],
        [-258, 93],
      ],
      [
        [45, 243],
        [50, 243],
      ],
      [
        [152, 148],
        [152, 143],
      ],
      [
        [257, 98],
        [257, 93],
      ],
    ]);
  });
});

describe("a station's slot stack", () => {
  it("stacks a rack's symbol, amount, type and status 28 DI apart below the pylon", () => {
    expect(layout({ station: 3, load: { kind: "rack", amount: 2 } })).toEqual({
      symbols: [[-153, 120]],
      texts: [
        ["2", [-153, 92], "CenterCenter"],
        ["CODE", [-153, 64], "CenterCenter"],
        ["RDY", [-153, 36], "CenterCenter"],
      ],
    });
  });

  it("puts a pair 15 DI either side of the pylon, with no amount row", () => {
    expect(layout({ station: 8, load: { kind: "pair" } })).toEqual({
      symbols: [
        [242, 70],
        [272, 70],
      ],
      texts: [
        ["CODE", [257, 42], "CenterCenter"],
        ["RDY", [257, 14], "CenterCenter"],
      ],
    });
  });

  it("draws no symbol for a tank, so its type takes the symbol row, as FUEL does on the centreline", () => {
    expect(layout({ station: 5, load: { kind: "tank" } })).toEqual({
      symbols: [],
      texts: [
        ["CODE", [0, 174], "CenterCenter"],
        ["RDY", [0, 146], "CenterCenter"],
      ],
    });
  });

  it("puts the tip labels above the tip, STA1's 10 DI further left than STA9's", () => {
    expect(layout({ station: 1, load: { kind: "missile" } })).toEqual({
      symbols: [[-371, 48]],
      texts: [
        ["CODE", [-373, 104], "CenterCenter"],
        ["RDY", [-373, 132], "CenterCenter"],
      ],
    });
    expect(layout({ station: 9, load: { kind: "missile" } }).texts[0]).toEqual([
      "CODE",
      [362, 104],
      "CenterCenter",
    ]);
  });

  it("puts the fuselage labels outboard of the symbol, aligned away from the centreline", () => {
    expect(layout({ station: 4, load: { kind: "missile" } })).toEqual({
      symbols: [[-73, 243]],
      texts: [
        ["CODE", [-101, 243], "RightCenter"],
        ["RDY", [-101, 202], "RightCenter"],
      ],
    });
    expect(layout({ station: 6, load: { kind: "missile" } }).texts[1]).toEqual([
      "RDY",
      [101, 202],
      "LeftCenter",
    ]);
  });

  it("shows SEL for a selected station that has no selection box, and the status otherwise", () => {
    expect(stationStatus(4, "STBY", true)).toBe("SEL");
    expect(stationStatus(9, "RDY", true)).toBe("SEL");
    expect(stationStatus(4, "STBY", false)).toBe("STBY");
    expect(stationStatus(3, "RDY", true)).toBe("RDY");
  });
});

describe("the PROG and DATA blocks", () => {
  it("place the PROG rows at y = −223 … −335 (PROG_BOMB is offset +15)", () => {
    expect([0, 1, 2, 3, 4].map(progRowY)).toEqual([
      -223, -251, -279, -307, -335,
    ]);
  });

  it("place the DATA rows 40 DI apart below the freeze rule at y = −100", () => {
    expect([0, 1, 7].map(dataRowY)).toEqual([-140, -180, -420]);
  });
});

describe("wrapWords", () => {
  it("fills each row greedily", () => {
    expect(wrapWords("aa bb cc dd", 5)).toEqual(["aa bb", "cc dd"]);
    expect(wrapWords("  aa\n bb  ", 10)).toEqual(["aa bb"]);
  });

  it("throws on a word longer than a row", () => {
    expect(() => wrapWords("abcdef", 5)).toThrow(
      /longer than a 5-character row/,
    );
  });
});
