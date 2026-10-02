import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { measure, pbEdge } from "../../geometry";
import { FullViewportFrame } from "../../frame/FullViewportFrame";
import { BIT } from "../../formats/bitFormat";
import { bitScreens, failingItems } from "./screens";
import { bitTests, TEST_DURATION_MS } from "./store";
import { SUBLEVELS } from "./structure";
import { SNAPSHOT_CONTENT } from "@/content/snapshot";

const BIT_CHECKS = SNAPSHOT_CONTENT.bit.checks;
const BIT_LEGEND_NAMES = SNAPSHOT_CONTENT.bit.legendNames;

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

let reducedMotion = false;

beforeEach(() => {
  vi.useFakeTimers();
  reducedMotion = false;
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reducedMotion && query.includes("reduce"),
  }));
});

afterEach(() => {
  act(() => bitTests.reset());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function renderBit(): HTMLElement {
  return render(
    <FullViewportFrame screens={bitScreens(SNAPSHOT_CONTENT.bit)} />,
  ).container;
}

function press(name: string): void {
  act(() => {
    fireEvent.pointerDown(screen.getByRole("button", { name }), { button: 0 });
  });
}

function cell(container: HTMLElement, checks: string): Element {
  const found = container.querySelector(`[data-bit-checks="${checks}"]`);
  if (found === null) {
    throw new Error(`no status cell for ${checks}`);
  }
  return found;
}

describe("the BIT screens", () => {
  it("give no two legends the same OSB on any level, and MENU opens TAC", () => {
    for (const [state, page] of Object.entries(
      bitScreens(SNAPSHOT_CONTENT.bit).screens,
    )) {
      const pbs = page.legends.map((legend) => legend.pb);
      expect(new Set(pbs).size, state).toBe(pbs.length);
      expect(page.legends.find((legend) => legend.pb === 18)).toMatchObject({
        lines: ["MENU"],
        action: { kind: "link", href: "/ddi" },
      });
    }
  });

  it("page the failures 17 rows at a time", () => {
    const { screens } = bitScreens(SNAPSHOT_CONTENT.bit);
    const pages = Object.keys(screens).filter((state) =>
      state.startsWith("MAIN-"),
    );
    expect(pages).toHaveLength(
      Math.ceil(failingItems(BIT_CHECKS).length / BIT.rowsPerPage),
    );
  });

  it("keep item legends clear of the list columns", () => {
    const statusRight = BIT.statusX + measure("DEGD+OVRHT", "BIT").width;
    for (const sublevel of SUBLEVELS) {
      for (const item of sublevel.items) {
        const name =
          "item" in item
            ? BIT_CHECKS[item.item].name
            : BIT_LEGEND_NAMES[item.legend];
        const text = `${BIT.itemSpace}${name}`;
        if (pbEdge(item.pb) === "left") {
          expect(-500 + measure(text, "BIT").width).toBeLessThan(BIT.nameX);
        } else {
          expect(500 - measure(text, "BIT").width).toBeGreaterThan(statusRight);
        }
      }
    }
  });
});

describe("the BIT page", () => {
  it("opens on BIT FAILURES with the real top-row legends", () => {
    renderBit();
    for (const name of [
      "Run every test",
      "Software configuration",
      "Stop tests",
      "Next page of failures",
      "NAV tests",
      "STATUS MONITOR tests",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "Tactical menu" })).toHaveAttribute(
      "href",
      "/ddi",
    );
  });

  it("opens a sublevel from its group OSB and returns with BIT", () => {
    renderBit();
    press("NAV tests");
    expect(
      screen.getByRole("button", { name: "Test DNS" }).closest("[data-pb]"),
    ).toHaveAttribute("data-pb", "2");
    expect(screen.getByRole("button", { name: "Test all NAV" })).toBeVisible();
    press("BIT failures");
    expect(
      screen.getByRole("button", { name: "Run every test" }),
    ).toBeVisible();
  });

  it("shows IN TEST, then the result, when a check's legend is pressed", () => {
    const container = renderBit();
    press("NAV tests");
    expect(cell(container, "ADC")).toHaveAttribute(
      "data-bit-status",
      "MUX FAIL",
    );
    press("Test MERGE");
    expect(cell(container, "ADC")).toHaveAttribute(
      "data-bit-status",
      "IN TEST",
    );
    act(() => vi.advanceTimersByTime(TEST_DURATION_MS));
    expect(cell(container, "ADC")).toHaveAttribute("data-bit-status", "GO");
  });

  it("keeps results across levels and updates the group block", () => {
    const container = renderBit();
    const nav = "INS ADC ILS RALT TCN AUG BCN GPS";
    expect(cell(container, nav)).toHaveAttribute("data-bit-status", "MUX FAIL");
    press("NAV tests");
    press("Test all NAV");
    act(() => vi.advanceTimersByTime(TEST_DURATION_MS));
    press("BIT failures");
    // It's always DNS: the one NAV check a retest does not fix.
    expect(cell(container, nav)).toHaveAttribute("data-bit-status", "DEGD");
  });

  it("STOP aborts a running test", () => {
    const container = renderBit();
    press("Run every test");
    expect(cell(container, "ADC")).toHaveAttribute(
      "data-bit-status",
      "IN TEST",
    );
    press("Stop tests");
    expect(cell(container, "ADC")).toHaveAttribute(
      "data-bit-status",
      "MUX FAIL",
    );
  });

  it("resolves at once under reduced motion", () => {
    reducedMotion = true;
    const container = renderBit();
    press("Run every test");
    expect(cell(container, "ADC")).toHaveAttribute("data-bit-status", "GO");
  });

  it("pages with PAGE and opens S/W CONFIGURATION with CONFIG", () => {
    const container = renderBit();
    const firstRow = failingItems(BIT_CHECKS)[0];
    expect(cell(container, firstRow)).toBeInTheDocument();
    press("Next page of failures");
    expect(
      container.querySelector(`[data-bit-checks="${firstRow}"]`),
    ).toBeNull();
    press("Next page of failures");
    expect(cell(container, firstRow)).toBeInTheDocument();
    press("Software configuration");
    expect(screen.getByRole("button", { name: "Override" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("cycles the FCS-MC PB17 label with FCS OPTION", () => {
    renderBit();
    press("FCS-MC tests");
    press("Next FCS option");
    expect(bitTests.getSnapshot().fcsOption).toBe(1);
  });
});
