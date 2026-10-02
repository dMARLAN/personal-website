import { SITE_NAME } from "@/lib/site";
import type { Profile } from "./types";

// PLACEHOLDER: every value below is a stand-in until Chad writes the real profile (design section 18). The header
// is real: it comes from SITE_NAME.
export const PROFILE: Profile = {
  header: SITE_NAME,
  badge: "PLACEHOLDER",
  status: [
    { label: "ROLE:", value: "SW ENGR" },
    { label: "BASE:", value: "TBD" },
    { label: "YRS:", value: "00" },
    { label: "STACK:", value: "TS/PY" },
    { label: "STAT:", value: "ACTIVE" },
  ],
  loadout: [
    "1 - TYPESCRIPT",
    "2 - PYTHON",
    "3 - REACT",
    "4 - FASTAPI",
    "5 - KUBERNETES",
  ],
  footer: "99.9 COFFEE 0 BUGS",
  tags: [
    { label: "SIM:", value: "DCS F/A-18C" },
    { label: "OS:", value: "LINUX" },
    { label: "IDE:", value: "PYCHARM" },
  ],
  bio: "Placeholder bio. A software engineer who builds web apps and APIs, and flies the Hornet in DCS after hours.",
};
