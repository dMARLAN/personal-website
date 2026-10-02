import { describe, expect, it } from "vitest";
import { FONTS } from "@/ddi/constants";
import { BIT, SW_CONFIG_LAYOUT } from "@/ddi/formats/bitFormat";
import { textPath } from "@/ddi/font/layout";
import { measure } from "@/ddi/geometry";
import { failingItems } from "@/ddi/pages/bit/screens";
import { SUBLEVELS } from "@/ddi/pages/bit/structure";
import {
  BIT_CHECKS,
  BIT_LEGEND_NAMES,
  SW_CONFIG,
  type BitItemKey,
} from "./bit";

const ADVANCE = FONTS.BIT.width + FONTS.BIT.interchar;

function width(text: string): number {
  return measure(text, "BIT").width;
}

/** Every item that has an item legend, so its name is drawn as `"   NAME"` beside a PB. */
const LEGEND_ITEMS: ReadonlySet<BitItemKey> = new Set(
  SUBLEVELS.flatMap((sublevel) =>
    sublevel.items.flatMap((item) => ("item" in item ? [item.item] : [])),
  ),
);

describe("the BIT content", () => {
  it("draws every string with the stroke font", () => {
    const strings = [
      ...Object.values(BIT_CHECKS).flatMap(({ name, status, afterTest }) => [
        name,
        status,
        afterTest,
      ]),
      ...Object.values(BIT_LEGEND_NAMES),
      ...[...SW_CONFIG.left, ...SW_CONFIG.right].flatMap((entry) =>
        entry === null ? [] : [entry.name, entry.value],
      ),
    ];
    for (const text of strings) {
      expect(
        () => textPath(text, "BIT", "LeftCenter", [0, 0]),
        text,
      ).not.toThrow();
    }
  });

  it("leaves at least one space between a list name and its status", () => {
    for (const { name } of Object.values(BIT_CHECKS)) {
      expect(width(name), name).toBeLessThanOrEqual(
        BIT.statusX - BIT.nameX - ADVANCE,
      );
    }
  });

  it("keeps item legends to 7 characters, so they clear the list", () => {
    const names = [
      ...[...LEGEND_ITEMS].map((item) => BIT_CHECKS[item].name),
      ...Object.values(BIT_LEGEND_NAMES),
    ];
    for (const name of names) {
      expect(name.length, name).toBeLessThanOrEqual(7);
      // A left legend starts at x −500 and must end before the name column.
      expect(-500 + width(`${BIT.itemSpace}${name}`), name).toBeLessThan(
        BIT.nameX,
      );
    }
  });

  it("uses NO TEST only on the fuel-low rows, as DCS does", () => {
    for (const [item, check] of Object.entries(BIT_CHECKS)) {
      const fuelLow = item === "TK2FL" || item === "TK3FL";
      if (!fuelLow) {
        expect([check.status, check.afterTest], item).not.toContain("NO TEST");
      }
    }
  });

  it("fills the S/W CONFIGURATION table like the DCS sample", () => {
    expect(SW_CONFIG.left).toHaveLength(SW_CONFIG_LAYOUT.rows);
    expect(SW_CONFIG.right).toHaveLength(SW_CONFIG_LAYOUT.rows);
    expect(SW_CONFIG.left[3]).toBeNull();
    for (const entry of [...SW_CONFIG.left, ...SW_CONFIG.right]) {
      if (entry !== null) {
        expect(entry.name.length, entry.name).toBeLessThanOrEqual(6);
        expect(entry.value.length, entry.value).toBeLessThanOrEqual(8);
      }
    }
  });

  it("fails more than one page of checks, so PAGE has work to do", () => {
    expect(failingItems().length).toBeGreaterThan(BIT.rowsPerPage);
  });
});
