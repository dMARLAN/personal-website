import { act, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FUEL_RESERVES } from "@/content/fuel";
import { measure } from "../geometry";
import { FuelFormat } from "./fuel";
import { FUEL_TICK_MS } from "./fuelClock";
import {
  FUEL_TANKS,
  caretTip,
  fuelReading,
  tankFraction,
  type FuelTankSpec,
} from "./fuelModel";

const TANK: FuelTankSpec = {
  id: "tk1",
  label: "TK 1",
  capacity: 2000,
  motion: { kind: "wave", level: 0.5, swing: 0.25, periodSeconds: 40 },
};

describe("the fuel model", () => {
  it("starts a wave at its level and swings it by a quarter period", () => {
    expect(tankFraction(TANK.motion, 0)).toBe(0.5);
    expect(tankFraction(TANK.motion, 10)).toBeCloseTo(0.75);
    expect(tankFraction(TANK.motion, 30)).toBeCloseTo(0.25);
  });

  it("drains from full to its low mark, then refills", () => {
    const drain = { kind: "drain", low: 0.2, periodSeconds: 100 } as const;
    expect(tankFraction(drain, 0)).toBe(1);
    expect(tankFraction(drain, 50)).toBeCloseTo(0.6);
    expect(tankFraction(drain, 99.9)).toBeCloseTo(0.2, 2);
    expect(tankFraction(drain, 100)).toBe(1);
  });

  it("clamps a level to 0–1", () => {
    const wild = {
      kind: "wave",
      level: 0.9,
      swing: 0.5,
      periodSeconds: 4,
    } as const;
    expect(tankFraction(wild, 1)).toBe(1);
    expect(tankFraction(wild, 3)).toBeCloseTo(0.4);
  });

  it("shows pounds to the nearest 10, and totals all tanks and the internal ones", () => {
    const reading = fuelReading(
      [
        { ...TANK, capacity: 1234 },
        { ...TANK, id: "centreline", capacity: 1000 },
      ],
      0,
    );
    expect(reading.tanks.map(({ pounds }) => pounds)).toEqual([620, 500]);
    expect(reading.total).toBe(1120);
    expect(reading.internal).toBe(620);
  });

  it("puts the caret at the box's bottom-right corner when empty and its top-right when full", () => {
    // TK 1 is 350 × 160 at (0, 385).
    expect(caretTip("tk1", 0)).toEqual([175, 305]);
    expect(caretTip("tk1", 1)).toEqual([175, 465]);
    expect(caretTip("leftWing", 0.5)).toEqual([-275, 110]);
  });
});

describe("the fuel content", () => {
  it("fills each of the nine tanks once", () => {
    expect(FUEL_RESERVES.tanks.map(({ id }) => id).sort()).toEqual(
      Object.keys(FUEL_TANKS).sort(),
    );
  });

  it("fits each label and its fullest value inside its box", () => {
    for (const { id, label, capacity } of FUEL_RESERVES.tanks) {
      const { width } = FUEL_TANKS[id];
      expect(measure(label, "F100").width, label).toBeLessThanOrEqual(width);
      expect(measure(String(capacity), "F200").width, label).toBeLessThan(
        width,
      );
    }
    expect(String(FUEL_RESERVES.bingo).length).toBeLessThanOrEqual(4);
  });

  it("keeps TOTAL to 5 digits, so it stays clear of the left edge", () => {
    const full = FUEL_RESERVES.tanks.reduce(
      (sum, { capacity }) => sum + capacity,
      0,
    );
    expect(String(full).length).toBeLessThanOrEqual(5);
  });
});

function drawnTotal(container: HTMLElement): string | null {
  return (
    container
      .querySelector("[data-fuel-total]")
      ?.getAttribute("data-fuel-total") ?? null
  );
}

function stubReducedMotion(reduce: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("reduce"),
  }));
}

describe("the fuel readouts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function renderFuel(): HTMLElement {
    return render(
      <svg>
        <FuelFormat tanks={FUEL_RESERVES.tanks} bingo={FUEL_RESERVES.bingo} />
      </svg>,
    ).container;
  }

  it("draws the t = 0 levels on the server", () => {
    const html = renderToStaticMarkup(
      <svg>
        <FuelFormat tanks={FUEL_RESERVES.tanks} bingo={FUEL_RESERVES.bingo} />
      </svg>,
    );
    expect(html).toContain(
      `data-fuel-total="${fuelReading(FUEL_RESERVES.tanks, 0).total}"`,
    );
  });

  it("moves the levels gently over time", () => {
    stubReducedMotion(false);
    const container = renderFuel();
    const start = drawnTotal(container);
    act(() => {
      vi.advanceTimersByTime(40 * FUEL_TICK_MS);
    });
    expect(drawnTotal(container)).not.toBe(start);
  });

  it("holds still under reduced motion", () => {
    stubReducedMotion(true);
    const container = renderFuel();
    const start = drawnTotal(container);
    act(() => {
      vi.advanceTimersByTime(40 * FUEL_TICK_MS);
    });
    expect(drawnTotal(container)).toBe(start);
  });
});
