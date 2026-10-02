import type { BitCheck, BitStatus } from "@/content/types";

/** A check as the live status cells see it: its id and the two statuses it can rest on. */
export interface LiveCheck {
  id: string;
  status: BitCheck["status"];
  afterTest: BitCheck["afterTest"];
}

/** The page's test state: which checks are running now, and which have finished a test since the page mounted. */
export interface BitTestState {
  testing: ReadonlySet<string>;
  tested: ReadonlySet<string>;
  /** Index into the FCS-MC PB17 option labels, which PB16 `FCS OPTION` cycles. */
  fcsOption: number;
}

export const INITIAL_TEST_STATE: BitTestState = {
  testing: new Set(),
  tested: new Set(),
  fcsOption: 0,
};

/** The statuses that read as a pass. They stay off the failure list and leave a group at `GO`. */
const PASSING: ReadonlySet<BitStatus> = new Set(["GO", "OP GO", "PBIT GO"]);

/**
 * (ours) How a group block summarises its checks, most severe first. The DCS group status comes from C++
 * (`MPD_BIT_EquipGroupStatus`), so this order is our reading of the words.
 */
const SEVERITY: readonly BitStatus[] = [
  "MUX FAIL",
  "DEGD+OVRHT",
  "OVRHT",
  "DEGD",
  "NOT RDY",
  "NO TEST",
  "RESTRT",
  "SF TEST",
  "OFF",
];

export function isPassing(status: BitStatus): boolean {
  return PASSING.has(status);
}

export function checkStatus(check: LiveCheck, state: BitTestState): BitStatus {
  if (state.testing.has(check.id)) {
    return "IN TEST";
  }
  return state.tested.has(check.id) ? check.afterTest : check.status;
}

/** `IN TEST` while any check runs; otherwise the most severe failing status, or `GO` when every check passes. */
export function groupStatus(
  checks: readonly LiveCheck[],
  state: BitTestState,
): BitStatus {
  const statuses = checks.map((check) => checkStatus(check, state));
  if (statuses.includes("IN TEST")) {
    return "IN TEST";
  }
  return SEVERITY.find((status) => statuses.includes(status)) ?? "GO";
}

/**
 * Every status a cell can show, so the server can draw each one in advance and the client only picks. A group can
 * show `IN TEST`, `GO`, or any failing status its checks can rest on.
 */
export function reachableStatuses(
  checks: readonly LiveCheck[],
  summary: "check" | "group",
): BitStatus[] {
  const resting = checks.flatMap((check) => [check.status, check.afterTest]);
  const statuses: BitStatus[] =
    summary === "check"
      ? ["IN TEST", ...resting]
      : ["IN TEST", "GO", ...resting.filter((status) => !isPassing(status))];
  return [...new Set(statuses)];
}
