import type { FuelReserves } from "./types";

// PLACEHOLDER: playful "energy" reserves until Chad reviews them. TOTAL, INTERNAL and BINGO keep their DCS labels.
export const FUEL_RESERVES: FuelReserves = {
  tanks: [
    {
      id: "tk1",
      label: "COFFEE",
      name: "Coffee",
      capacity: 2800,
      motion: { kind: "drain", low: 0.15, periodSeconds: 180 },
    },
    {
      id: "leftFeed",
      label: "FOCUS",
      name: "Focus",
      capacity: 1200,
      motion: { kind: "wave", level: 0.8, swing: 0.15, periodSeconds: 70 },
    },
    {
      id: "rightFeed",
      label: "PATIENCE",
      name: "Patience",
      capacity: 1200,
      motion: { kind: "wave", level: 0.65, swing: 0.1, periodSeconds: 110 },
    },
    {
      id: "tk4",
      label: "MOTIVATION",
      name: "Motivation",
      capacity: 3700,
      motion: { kind: "wave", level: 0.85, swing: 0.1, periodSeconds: 150 },
    },
    {
      id: "leftWing",
      label: "SLEEP",
      name: "Sleep",
      capacity: 1900,
      motion: { kind: "wave", level: 0.55, swing: 0.2, periodSeconds: 240 },
    },
    {
      id: "rightWing",
      label: "SNACKS",
      name: "Snacks",
      capacity: 1900,
      motion: { kind: "wave", level: 0.7, swing: 0.25, periodSeconds: 90 },
    },
    {
      id: "leftExternal",
      label: "MUSIC",
      name: "Music",
      capacity: 2200,
      motion: { kind: "wave", level: 0.9, swing: 0.08, periodSeconds: 60 },
    },
    {
      id: "centreline",
      label: "PTO",
      name: "Paid time off",
      capacity: 2200,
      motion: { kind: "wave", level: 0.4, swing: 0.05, periodSeconds: 300 },
    },
    {
      id: "rightExternal",
      label: "HOBBIES",
      name: "Hobbies",
      capacity: 2200,
      motion: { kind: "wave", level: 0.6, swing: 0.12, periodSeconds: 130 },
    },
  ],
  bingo: 2000,
};
