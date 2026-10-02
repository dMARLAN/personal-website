import { describe, expect, it } from "vitest";
import {
  checkStatus,
  groupStatus,
  INITIAL_TEST_STATE,
  reachableStatuses,
  type BitTestState,
  type LiveCheck,
} from "./status";

const DNS: LiveCheck = { id: "RALT", status: "DEGD", afterTest: "DEGD" };
const MERGE: LiveCheck = { id: "ADC", status: "MUX FAIL", afterTest: "GO" };
const GREP: LiveCheck = { id: "AUG", status: "PBIT GO", afterTest: "GO" };

function state(testing: string[], tested: string[]): BitTestState {
  return {
    ...INITIAL_TEST_STATE,
    testing: new Set(testing),
    tested: new Set(tested),
  };
}

describe("a check's status", () => {
  it("rests on its status, shows IN TEST while running, then its result", () => {
    expect(checkStatus(MERGE, INITIAL_TEST_STATE)).toBe("MUX FAIL");
    expect(checkStatus(MERGE, state(["ADC"], []))).toBe("IN TEST");
    expect(checkStatus(MERGE, state([], ["ADC"]))).toBe("GO");
    expect(checkStatus(MERGE, state(["ADC"], ["ADC"]))).toBe("IN TEST");
  });
});

describe("a group's status", () => {
  it("shows its most severe failure", () => {
    expect(groupStatus([GREP, DNS, MERGE], INITIAL_TEST_STATE)).toBe(
      "MUX FAIL",
    );
    expect(groupStatus([GREP, DNS, MERGE], state([], ["ADC"]))).toBe("DEGD");
  });

  it("shows GO when every check passes, whatever pass word each uses", () => {
    expect(groupStatus([GREP], INITIAL_TEST_STATE)).toBe("GO");
    expect(groupStatus([GREP, MERGE], state([], ["ADC"]))).toBe("GO");
  });

  it("shows IN TEST while any of its checks runs", () => {
    expect(groupStatus([GREP, DNS, MERGE], state(["AUG"], []))).toBe("IN TEST");
  });
});

describe("reachableStatuses", () => {
  it("lists what one check can show", () => {
    expect(reachableStatuses([MERGE], "check")).toEqual([
      "IN TEST",
      "MUX FAIL",
      "GO",
    ]);
    expect(reachableStatuses([GREP], "check")).toEqual([
      "IN TEST",
      "PBIT GO",
      "GO",
    ]);
  });

  it("lists what a group can show: IN TEST, GO and its checks' failures", () => {
    expect(reachableStatuses([GREP, DNS, MERGE], "group")).toEqual([
      "IN TEST",
      "GO",
      "DEGD",
      "MUX FAIL",
    ]);
  });

  it("covers every state a group can reach", () => {
    const checks = [GREP, DNS, MERGE];
    const reachable = reachableStatuses(checks, "group");
    const ids = checks.map((check) => check.id);
    for (let mask = 0; mask < 3 ** ids.length; mask++) {
      const testing: string[] = [];
      const tested: string[] = [];
      ids.forEach((id, index) => {
        const phase = Math.floor(mask / 3 ** index) % 3;
        if (phase === 1) {
          testing.push(id);
        } else if (phase === 2) {
          tested.push(id);
        }
      });
      expect(reachable).toContain(groupStatus(checks, state(testing, tested)));
    }
  });
});
