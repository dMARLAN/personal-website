import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SERVER_METRICS } from "@/content/types";
import { SYMBOLOGY_HALF } from "../constants";
import { textPath } from "../font/layout";
import { measure } from "../geometry";
import { FAKE_BAND } from "../pages/server/provider";
import { formatReading } from "../pages/server/readings";
import {
  ENG_FONT,
  ENG_HEADER_POS,
  ENG_LIMITS,
  ENG_ROW_COUNT,
  ENG_VALUE_X,
  EngLabels,
  EngValues,
  engRowY,
} from "./eng";
import { SNAPSHOT_CONTENT } from "@/content/snapshot";

const SERVER_STATS = SNAPSHOT_CONTENT.server;

/** A gap between a value and its row label narrower than this would read as one word. */
const MIN_GAP = 20;

function width(text: string): number {
  return measure(text, ENG_FONT).width;
}

describe("the ENG format", () => {
  it("places the rows and headers where ENG.lua does", () => {
    expect(
      Array.from({ length: ENG_ROW_COUNT }, (_, index) => engRowY(index)),
    ).toEqual([
      343, 283, 223, 163, 103, 43, -17, -77, -137, -197, -257, -317, -377,
    ]);
    expect(ENG_HEADER_POS).toEqual([
      [-250, 413],
      [250, 413],
    ]);
    expect(ENG_VALUE_X).toEqual([-180, 260]);
  });

  it("draws one path per header, label and value", () => {
    const { container } = render(
      <svg>
        <EngLabels headers={["LEFT EPE", "RIGHT EPE"]} labels={["EGT", "FF"]} />
        <EngValues
          values={[
            ["673", "677"],
            ["2430", "2410"],
          ]}
        />
      </svg>,
    );
    expect(container.querySelectorAll("path")).toHaveLength(8);
  });

  it("fits the DCS strings within the limits", () => {
    expect(width("INLET TEMP")).toBe(width("X".repeat(ENG_LIMITS.label)));
    expect("RIGHT EPE").toHaveLength(ENG_LIMITS.header);
  });
});

describe("the server content on ENG", () => {
  it("has exactly one row per metric, in order", () => {
    expect(SERVER_STATS.rows.map((row) => row.metric)).toEqual([
      ...SERVER_METRICS,
    ]);
    expect(SERVER_STATS.rows).toHaveLength(ENG_ROW_COUNT);
  });

  it("fits the headers in their slots, inside the drawable square", () => {
    SERVER_STATS.hosts.forEach(({ header }, side) => {
      expect(header.length).toBeLessThanOrEqual(ENG_LIMITS.header);
      const [x] = ENG_HEADER_POS[side];
      expect(Math.abs(x) + width(header) / 2).toBeLessThan(SYMBOLOGY_HALF);
      expect(() =>
        textPath(header, ENG_FONT, "CenterCenter", [x, 0]),
      ).not.toThrow();
    });
  });

  it.each(SERVER_STATS.rows.map((row) => [row.label, row] as const))(
    "keeps %s and its values apart at every fake reading",
    (_, row) => {
      expect(row.label.length).toBeLessThanOrEqual(ENG_LIMITS.label);
      expect(() =>
        textPath(row.label, ENG_FONT, "CenterCenter", [0, 0]),
      ).not.toThrow();
      const labelHalf = width(row.label) / 2;
      SERVER_STATS.baseline.hosts.forEach((host, side) => {
        const centre = host[row.metric];
        const band = FAKE_BAND[row.metric];
        for (const value of [
          Math.max(0, centre - band),
          centre,
          centre + band,
        ]) {
          const text = formatReading(value, row);
          expect(text.length, text).toBeLessThanOrEqual(ENG_LIMITS.value);
          expect(() =>
            textPath(text, ENG_FONT, "RightCenter", [0, 0]),
          ).not.toThrow();
          const right = ENG_VALUE_X[side];
          const left = right - width(text);
          if (side === 0) {
            expect(right + MIN_GAP, text).toBeLessThanOrEqual(-labelHalf);
            expect(left, text).toBeGreaterThan(-SYMBOLOGY_HALF);
          } else {
            expect(left - MIN_GAP, text).toBeGreaterThanOrEqual(labelHalf);
          }
        }
      });
    },
  );
});
