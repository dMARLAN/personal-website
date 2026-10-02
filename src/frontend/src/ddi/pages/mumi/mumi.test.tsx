import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MUMI_FRAME,
  MUMI_LIMITS,
  errorsText,
  idFieldText,
  muIdText,
  versionLabel,
  versionText,
} from "../../formats/mumi";
import { placedTextBounds } from "../../formats/placedText";
import { PAGES } from "../registry";
import { MISSION_DATA } from "./data";
import { MAIN_STATE, MORE_STATE, mumiScreens } from "./screens";
import {
  BLINK_MS,
  COMPLETE_HOLD_MS,
  LOAD_MS,
  mumiLoad,
  type MumiLoad,
} from "./store";
import { LOAD_PB, MAIN_LEGENDS, MORE_LEGENDS } from "./structure";

/** One character advance at 120 %: a 14 DI glyph and a 6 DI gap. */
const F120_ADVANCE = 20;
const FULL_LIMIT_TEXT = "W";

describe("the MUMI limits", () => {
  it("keeps a full-length MU ID value on its 570 DI rule", () => {
    const value = FULL_LIMIT_TEXT.repeat(MUMI_LIMITS.muId);
    expect(placedTextBounds(muIdText(value)).right).toBeLessThanOrEqual(
      MUMI_FRAME.muIdRuleEnd,
    );
  });

  it("keeps full-length ID fields over their 200 DI rules", () => {
    const value = FULL_LIMIT_TEXT.repeat(MUMI_LIMITS.idField);
    ([0, 1] as const).forEach((field) => {
      const bounds = placedTextBounds(idFieldText(value, field));
      const [left, right] = MUMI_FRAME.idRuleSpans[field];
      expect(bounds.left).toBeGreaterThanOrEqual(left);
      expect(bounds.right).toBeLessThanOrEqual(right);
    });
  });

  it.each(["MC", "SMS"] as const)(
    "keeps a full-length %s value a character clear of its label and the vertical rule",
    (row) => {
      const bounds = placedTextBounds(
        versionText(FULL_LIMIT_TEXT.repeat(MUMI_LIMITS.version), row),
      );
      expect(
        bounds.left - placedTextBounds(versionLabel(row)).right,
      ).toBeGreaterThanOrEqual(F120_ADVANCE);
      expect(bounds.right).toBeLessThan(MUMI_FRAME.verticalRuleX);
    },
  );

  it("keeps a full-length ERRORS list a character clear of ERRORS:", () => {
    const bounds = placedTextBounds(
      errorsText(FULL_LIMIT_TEXT.repeat(MUMI_LIMITS.errors)),
    );
    // `ERRORS: ` ends in a space, so its ink ends one advance before its box does.
    const labelInk =
      placedTextBounds(MUMI_FRAME.errorsLabel).right - F120_ADVANCE;
    expect(bounds.left - labelInk).toBeGreaterThanOrEqual(F120_ADVANCE);
  });

  it("fits the mission data in its limits", () => {
    expect(MISSION_DATA.muId.value.length).toBeLessThanOrEqual(
      MUMI_LIMITS.muId,
    );
    expect(MISSION_DATA.loadedMuId.length).toBeLessThanOrEqual(
      MUMI_LIMITS.muId,
    );
    for (const { value } of MISSION_DATA.idFields) {
      expect(value.length).toBeLessThanOrEqual(MUMI_LIMITS.idField);
    }
    expect(MISSION_DATA.mc.value.length).toBeLessThanOrEqual(
      MUMI_LIMITS.version,
    );
    expect(MISSION_DATA.sms.value.length).toBeLessThanOrEqual(
      MUMI_LIMITS.version,
    );
    expect(MISSION_DATA.errors.value.length).toBeLessThanOrEqual(
      MUMI_LIMITS.errors,
    );
  });
});

describe("the MUMI legends", () => {
  it("is SUPT PB10 MUMI, as in Menu_SUPT.lua, and stays out of search", () => {
    expect(PAGES.mumi.menu).toEqual({ on: "SUPT", pb: 10, legend: ["MUMI"] });
    expect(PAGES.mumi.noindex).toBe(true);
  });

  it("draws both MUMI.lua legend sets, PB10 switching them in place", () => {
    const { initial, screens } = mumiScreens();
    expect(initial).toBe(MAIN_STATE);
    const legendsOf = (state: string): [number, readonly string[]][] =>
      screens[state].legends.map(({ pb, lines }) => [pb, lines]);
    expect(legendsOf(MAIN_STATE)).toEqual([
      ...MAIN_LEGENDS.map(({ pb, lines }) => [pb, lines]),
      [10, ["MORE"]],
      [18, []],
    ]);
    expect(legendsOf(MORE_STATE)).toEqual([
      ...MORE_LEGENDS.map(({ pb, lines }) => [pb, lines]),
      [10, ["RETURN"]],
      [18, []],
    ]);
    const pb10 = (state: string): unknown =>
      screens[state].legends.find(({ pb }) => pb === 10)?.action;
    expect(pb10(MAIN_STATE)).toEqual({ kind: "state", state: MORE_STATE });
    expect(pb10(MORE_STATE)).toEqual({ kind: "state", state: MAIN_STATE });
  });

  it("makes ID the load, MENU (drawn at the title) the menu link and every other data legend inert", () => {
    const { screens } = mumiScreens();
    for (const { pb, action } of screens[MAIN_STATE].legends) {
      if (pb === LOAD_PB) {
        expect(action.kind).toBe("island");
      } else if (pb === 18) {
        expect(action).toEqual({ kind: "link", href: "/ddi" });
      } else if (pb !== 10) {
        expect(action).toEqual({ kind: "inert" });
      }
    }
    expect(MAIN_LEGENDS.find(({ pb }) => pb === LOAD_PB)?.lines).toEqual([
      "ID",
    ]);
  });
});

describe("the MUMI load", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    mumiLoad.reset();
    vi.useRealTimers();
  });

  it("blinks MU LOAD, completes, holds, then navigates once", () => {
    const navigate = vi.fn();
    const seen: MumiLoad[] = [];
    const unsubscribe = mumiLoad.subscribe(() =>
      seen.push(mumiLoad.getSnapshot()),
    );
    mumiLoad.start(navigate, { instant: false });
    expect(mumiLoad.getSnapshot()).toEqual({ phase: "loading", cueOn: true });
    vi.advanceTimersByTime(BLINK_MS);
    expect(mumiLoad.getSnapshot()).toEqual({ phase: "loading", cueOn: false });
    vi.advanceTimersByTime(LOAD_MS - BLINK_MS);
    expect(mumiLoad.getSnapshot()).toEqual({ phase: "complete" });
    vi.advanceTimersByTime(COMPLETE_HOLD_MS - 1);
    expect(navigate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(navigate).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(LOAD_MS);
    expect(seen.at(-1)).toEqual({ phase: "complete" });
    unsubscribe();
  });

  it("ignores a press while a load runs", () => {
    const navigate = vi.fn();
    mumiLoad.start(navigate, { instant: false });
    mumiLoad.start(navigate, { instant: false });
    vi.advanceTimersByTime(LOAD_MS + COMPLETE_HOLD_MS);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("navigates at once under reduced motion, without blinking", () => {
    const navigate = vi.fn();
    mumiLoad.start(navigate, { instant: true });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(mumiLoad.getSnapshot()).toEqual({ phase: "complete" });
  });

  it("reset abandons a running load", () => {
    const navigate = vi.fn();
    mumiLoad.start(navigate, { instant: false });
    mumiLoad.reset();
    vi.advanceTimersByTime(LOAD_MS + COMPLETE_HOLD_MS);
    expect(navigate).not.toHaveBeenCalled();
    expect(mumiLoad.getSnapshot()).toEqual({ phase: "idle" });
  });
});
