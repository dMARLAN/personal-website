import type { Employer } from "./types";

// PLACEHOLDER: a stand-in employer until Chad writes the real work history (design section 18). Newest first.
export const EMPLOYERS: readonly Employer[] = [
  {
    id: "placeholder-co",
    short: "PLACEHOLDR",
    name: "PLACEHOLDER COMPANY",
    span: "2020-2026",
    roles: [
      {
        code: "ENG",
        title: "ENGINEER",
        span: "2020-2026",
        location: "Placeholder city",
        bullets: ["Placeholder accomplishment.", "Placeholder accomplishment."],
      },
    ],
  },
];
