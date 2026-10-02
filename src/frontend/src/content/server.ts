import type { ServerStats } from "./types";

// PLACEHOLDER: fake metrics until Chad picks the hosts and the 13 rows (design section 18, question 7).
export const SERVER_STATS: ServerStats = {
  hosts: ["HOST1", "HOST2"],
  rows: Array.from({ length: 13 }, (_, index) => ({
    label: `METRIC ${index + 1}`,
    left: "0",
    right: "0",
  })),
};
