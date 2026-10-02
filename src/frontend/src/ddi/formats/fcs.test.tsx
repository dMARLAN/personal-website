import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { measure } from "../geometry";
import {
  FcsCellError,
  FcsFormat,
  fcsCellCentre,
  fcsCellExists,
  type FcsFormatProps,
} from "./fcs";
import { SNAPSHOT_CONTENT } from "@/content/snapshot";

const FLIGHT_CONTROLS = SNAPSHOT_CONTENT.fcs;

const CHANNELS = [1, 2, 3, 4] as const;

function renderFcs(props: FcsFormatProps): SVGSVGElement {
  const { container } = render(
    <svg>
      <FcsFormat {...props} />
    </svg>,
  );
  const svg = container.querySelector("svg");
  if (svg === null) {
    throw new Error("no svg");
  }
  return svg;
}

describe("the FCS format", () => {
  it("places the channel cells as FCS.lua does", () => {
    expect(fcsCellCentre("left", 0, 1)).toEqual([-300, 440]);
    expect(fcsCellCentre("left", 6, 4)).toEqual([-204, 152]);
    // The right tables run channel 1 at x = 204 to channel 4 at x = 300.
    expect(fcsCellCentre("right", 1, 1)).toEqual([204, 392]);
    expect(fcsCellCentre("right", 0, 2)).toEqual([236, 440]);
    expect(fcsCellCentre("bottom", 0, 1)).toEqual([204, 56]);
    expect(fcsCellCentre("bottom", 10, 4)).toEqual([300, -344]);
  });

  it("gives LEF, AIL and RUD two channels: 1 and 4 on the left, 2 and 3 on the right", () => {
    for (const row of [0, 3, 4]) {
      expect(
        CHANNELS.map((channel) => fcsCellExists("left", row, channel)),
      ).toEqual([true, false, false, true]);
      expect(
        CHANNELS.map((channel) => fcsCellExists("right", row, channel)),
      ).toEqual([false, true, true, false]);
    }
    expect(fcsCellExists("bottom", 11, 1)).toBe(false);
  });

  it("draws one X per failure", () => {
    const svg = renderFcs({ ...FLIGHT_CONTROLS, failures: [] });
    const withFailures = renderFcs(FLIGHT_CONTROLS);
    const pathCount = (element: SVGSVGElement): number =>
      element.querySelectorAll("path").length;
    expect(pathCount(withFailures) - pathCount(svg)).toBe(
      FLIGHT_CONTROLS.failures.length,
    );
  });

  it("fails clearly on an X in a cell that does not exist", () => {
    expect(() =>
      renderFcs({
        ...FLIGHT_CONTROLS,
        failures: [{ table: "left", row: 0, channel: 2 }],
      }),
    ).toThrow(FcsCellError);
  });
});

describe("the FCS content", () => {
  it("has five surfaces and eleven status rows", () => {
    expect(FLIGHT_CONTROLS.surfaces.map(({ label }) => label)).toEqual([
      "LEF",
      "TEF",
      "AIL",
      "RUD",
      "STAB",
    ]);
    expect(FLIGHT_CONTROLS.statusRows).toHaveLength(11);
  });

  it("fits each status label between x = 88 and the table at 188", () => {
    for (const { label } of FLIGHT_CONTROLS.statusRows) {
      expect(measure(label, "F120").width, label).toBeLessThanOrEqual(100);
    }
  });

  it("fits the surface values and G-LIM in their slots", () => {
    for (const { left, right } of FLIGHT_CONTROLS.surfaces) {
      expect(left.value.length).toBeLessThanOrEqual(3);
      expect(right.value.length).toBeLessThanOrEqual(3);
    }
    // The value fills the gap in "G-LIM    G": three cells, from x = −206.
    expect(FLIGHT_CONTROLS.gLimit.length).toBeLessThanOrEqual(3);
  });

  it("puts every X on a real cell, and draws every string from the font", () => {
    expect(() => renderFcs(FLIGHT_CONTROLS)).not.toThrow();
  });
});
