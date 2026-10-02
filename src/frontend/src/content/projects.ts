import type { Project } from "./types";

// PLACEHOLDER: stand-in projects until Chad picks the real ones (design section 18, question 6).
export const PROJECTS: readonly Project[] = [
  {
    slug: "placeholder-one",
    station: 2,
    code: "PRJ1",
    status: "RDY",
    category: "WEB",
    fields: [{ label: "LANG", value: "TBD" }],
    description: "Placeholder description of the first project.",
  },
  {
    slug: "placeholder-two",
    station: 8,
    code: "PRJ2",
    status: "STBY",
    category: "TOOLS",
    fields: [{ label: "LANG", value: "TBD" }],
    description: "Placeholder description of the second project.",
  },
];
