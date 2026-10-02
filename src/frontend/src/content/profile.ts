import { SITE_NAME } from "@/lib/site";
import type { Profile } from "./types";

// PLACEHOLDER: every value below is a stand-in until Chad writes the real profile (design section 18).
export const PROFILE: Profile = {
  header: SITE_NAME,
  status: [
    { label: "ROLE:", value: "ENGINEER" },
    { label: "BASE:", value: "TBD" },
    { label: "YRS:", value: "00" },
    { label: "LANG:", value: "TBD" },
    { label: "STAT:", value: "TBD" },
  ],
  list: [
    "PLACEHOLDER ITEM 1",
    "PLACEHOLDER ITEM 2",
    "PLACEHOLDER ITEM 3",
    "PLACEHOLDER ITEM 4",
    "PLACEHOLDER ITEM 5",
  ],
  footer: "PLACEHOLDER FOOTER",
  tags: [
    { label: "M1", value: "TBD" },
    { label: "M2", value: "TBD" },
    { label: "M3", value: "TBD" },
  ],
  bio: "Placeholder bio. The real one replaces this text.",
};
