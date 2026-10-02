import type { Checklist } from "./types";

// PLACEHOLDER: a playful pre-flight checklist until Chad writes the real one. The headings, A/C WT, MAX NZ and
// STAB POS keep their DCS text (Checklists.lua and guide p81).
export const CHECKLIST: Checklist = {
  left: {
    title: "LAND",
    meaning: "End of the working day",
    items: [
      "TESTS PASS",
      "GIT PUSH",
      "PR OPENED",
      "NOTES SAVED",
      "LAPTOP SHUT",
      "DESK CLEAR",
    ],
  },
  right: {
    title: "T.O.",
    meaning: "Start of the working day",
    items: [
      "COFFEE",
      "KEYBOARD",
      "DUAL MONITORS",
      "CHAIR HEIGHT",
      "HEADPHONES",
      "GIT PULL",
      "CI GREEN",
      "PINGS LO",
      "FOCUS MODE",
    ],
  },
  weight: { label: "A/C WT", value: "36533" },
  maxNz: "MAX NZ",
  stab: { label: "STAB POS", left: " 1° NU", right: " 1° NU" },
};
