// The FUEL format's tanks [pgA §3] and the pure maths that moves their levels (ours). No React here.

import type { Point } from "../geometry";

export type FuelTankId =
  | "tk1"
  | "leftFeed"
  | "rightFeed"
  | "tk4"
  | "leftWing"
  | "rightWing"
  | "leftExternal"
  | "centreline"
  | "rightExternal";

export interface FuelTankGeometry {
  centre: Point;
  width: number;
  height: number;
  /** External tanks count toward TOTAL but not INTERNAL. */
  external: boolean;
}

const FEED_WIDTH = 350;
const WING = { x: 350, y: 110, width: 150, height: 100 } as const;
const EXTERNAL = { x: 300, y: -300, width: FEED_WIDTH / 2 + 50, height: 70 };

/** FUEL.lua: every box is `CenterCenter`. */
export const FUEL_TANKS: Readonly<Record<FuelTankId, FuelTankGeometry>> = {
  tk1: { centre: [0, 385], width: FEED_WIDTH, height: 160, external: false },
  leftFeed: {
    centre: [0, 215],
    width: FEED_WIDTH,
    height: 100,
    external: false,
  },
  rightFeed: {
    centre: [0, 90],
    width: FEED_WIDTH,
    height: 70,
    external: false,
  },
  tk4: { centre: [0, -85], width: FEED_WIDTH, height: 200, external: false },
  leftWing: {
    centre: [-WING.x, WING.y],
    width: WING.width,
    height: WING.height,
    external: false,
  },
  rightWing: {
    centre: [WING.x, WING.y],
    width: WING.width,
    height: WING.height,
    external: false,
  },
  leftExternal: {
    centre: [-EXTERNAL.x, EXTERNAL.y],
    width: EXTERNAL.width,
    height: EXTERNAL.height,
    external: true,
  },
  centreline: {
    centre: [0, EXTERNAL.y],
    width: EXTERNAL.width,
    height: EXTERNAL.height,
    external: true,
  },
  rightExternal: {
    centre: [EXTERNAL.x, EXTERNAL.y],
    width: EXTERNAL.width,
    height: EXTERNAL.height,
    external: true,
  },
};

/** The tank label sits 20 DI above the box (FUEL.lua). */
export const FUEL_LABEL_GAP = 20;
/** `addFuelAmountPointer`: two 30 DI lines at 30° either side of rightward, so a "<" at the box's right edge. */
export const FUEL_CARET = { length: 30, angle: 30 } as const;
/** TOTAL and INTERNAL: 200 % values under their 150 % labels, rows 45 DI apart (FUEL.lua). */
export const FUEL_TOTALS = { x: -380, labelY: 430, rowStep: 45 } as const;
/** DCS shows pounds to the nearest 10. */
const DISPLAY_STEP = 10;

export type FuelMotion =
  | { kind: "wave"; level: number; swing: number; periodSeconds: number }
  | { kind: "drain"; low: number; periodSeconds: number };

export interface FuelTankSpec {
  id: FuelTankId;
  label: string;
  capacity: number;
  motion: FuelMotion;
}

export interface TankReading {
  id: FuelTankId;
  /** 0 to 1: where the caret sits on the box's right edge. */
  fraction: number;
  /** Shown in the box, to the nearest 10 lb. */
  pounds: number;
}

export interface FuelReading {
  tanks: TankReading[];
  total: number;
  internal: number;
}

function clampFraction(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** A tank's level, as a fraction of its capacity, `seconds` after the page started moving. */
export function tankFraction(motion: FuelMotion, seconds: number): number {
  switch (motion.kind) {
    case "wave":
      return clampFraction(
        motion.level +
          motion.swing *
            Math.sin((2 * Math.PI * seconds) / motion.periodSeconds),
      );
    case "drain": {
      const progress = (seconds % motion.periodSeconds) / motion.periodSeconds;
      return clampFraction(1 - (1 - motion.low) * progress);
    }
  }
}

function displayPounds(pounds: number): number {
  return Math.round(pounds / DISPLAY_STEP) * DISPLAY_STEP;
}

/** Every tank's caret and quantity, plus TOTAL (all tanks) and INTERNAL (all but the externals). */
export function fuelReading(
  tanks: readonly FuelTankSpec[],
  seconds: number,
): FuelReading {
  const readings = tanks.map((tank): TankReading => {
    const fraction = tankFraction(tank.motion, seconds);
    return {
      id: tank.id,
      fraction,
      pounds: displayPounds(tank.capacity * fraction),
    };
  });
  const sum = (filter: (reading: TankReading) => boolean): number =>
    readings
      .filter(filter)
      .reduce((total, reading) => total + reading.pounds, 0);
  return {
    tanks: readings,
    total: sum(() => true),
    internal: sum((reading) => !FUEL_TANKS[reading.id].external),
  };
}

/** The caret's tip: the box's bottom-right corner, raised by the fill fraction of the box height. */
export function caretTip(id: FuelTankId, fraction: number): Point {
  const { centre, width, height } = FUEL_TANKS[id];
  return [centre[0] + width / 2, centre[1] - height / 2 + fraction * height];
}
