import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RADAR_SCENE } from "@/content/radar";
import { RANGE_SCALES, scopePoint } from "../../formats/rdrAttk";
import { LEGEND_FONT, legendBounds, pbLabelLayout } from "../../frame/legend";
import { measure, pbEdge, type Rect } from "../../geometry";
import { RadarScope, scopeFrame } from "./RadarScope";
import { RangeOsb } from "./islands";
import { contactPath } from "./sim";
import { radarLegends } from "./screens";
import { rangeStore, resetRadarState, steppedRange } from "./store";

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.left < b.right && b.left < a.right && a.bottom < b.top && b.bottom < a.top
  );
}

afterEach(() => {
  resetRadarState();
  vi.unstubAllGlobals();
});

describe("the RDR ATTK legends", () => {
  const legends = radarLegends();

  it("use each OSB once, with MENU at PB18", () => {
    const pbs = legends.map((legend) => legend.pb);
    expect(new Set(pbs).size).toBe(pbs.length);
    expect(legends.find((legend) => legend.pb === 18)).toMatchObject({
      lines: ["MENU"],
      action: { kind: "link", href: "/" },
    });
  });

  it("sit where add_PB_label_RDR puts them: rows 8 DI out, columns 6 DI in and 25 DI up", () => {
    const at = (pb: 13 | 16 | 18 | 6): readonly number[] => {
      const legend = legends.find((candidate) => candidate.pb === pb);
      if (legend === undefined) {
        throw new Error(`no legend at PB${pb}`);
      }
      return pbLabelLayout(pb, legend.lines, false, legend.offset).texts[0].pos;
    };
    expect(at(13)).toEqual([494, -2]);
    expect(at(16)).toEqual([340, -508]);
    expect(at(6)).toEqual([-336, 508]);
    // MENU is the base page's legend, not an RDR one.
    expect(at(18)).toEqual([2, -500]);
  });

  it("box NCTR as the reference does, 88 DI tall", () => {
    const nctr = legends.find((legend) => legend.pb === 15);
    expect(nctr?.boxed).toBe(true);
    const [box] = pbLabelLayout(15, ["NCTR"], true).boxes;
    expect(box.height).toBe(128);
    expect(box.width).toBe(26);
  });

  it("keep the legends clear of each other and fit the row pitch", () => {
    const inks = legends.map((legend) =>
      legendBounds(
        pbLabelLayout(
          legend.pb,
          legend.lines,
          legend.boxed ?? false,
          legend.offset,
        ),
      ),
    );
    inks.forEach((first, index) => {
      for (const second of inks.slice(index + 1)) {
        for (const a of first) {
          for (const b of second) {
            expect(overlaps(a, b)).toBe(false);
          }
        }
      }
    });
    for (const legend of legends) {
      if (pbEdge(legend.pb) === "top" || pbEdge(legend.pb) === "bottom") {
        for (const line of legend.lines) {
          expect(measure(line, LEGEND_FONT).width).toBeLessThan(169);
        }
      }
    }
  });

  it("make only the range arrows and MENU work", () => {
    const working = legends
      .filter((legend) => legend.action.kind !== "inert")
      .map((legend) => legend.pb);
    expect(working).toEqual([11, 12, 18]);
  });
});

describe("the B-scope", () => {
  it("maps azimuth across ±70° and range up from the bottom edge", () => {
    expect(scopePoint(0, 0, 40)).toEqual([0, -409.5]);
    expect(scopePoint(40, 70, 40)).toEqual([409.5, 409.5]);
    expect(scopePoint(20, -35, 40)).toEqual([-204.75, 0]);
  });

  it("hides hits beyond the range scale", () => {
    const paths = RADAR_SCENE.contacts.map(contactPath);
    const visible = (range: number): number =>
      scopeFrame(paths, 0, range).hits.filter((hit) => hit.visible).length;
    expect(visible(160)).toBe(RADAR_SCENE.contacts.length);
    expect(visible(5)).toBe(0);
    expect(visible(40)).toBeLessThan(visible(80));
  });

  it("steps the range scale between 5 and 160 NM", () => {
    expect(RANGE_SCALES).toEqual([5, 10, 20, 40, 80, 160]);
    expect(steppedRange(40, 1)).toBe(80);
    expect(steppedRange(160, 1)).toBe(160);
    expect(steppedRange(5, -1)).toBe(5);
  });
});

function renderScope(): void {
  render(
    <svg>
      <RadarScope contacts={RADAR_SCENE.contacts} />
    </svg>,
  );
}

describe("RadarScope", () => {
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    frames = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
  });

  function stubReducedMotion(matches: boolean): void {
    vi.stubGlobal("matchMedia", () => ({
      matches,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  }

  function runFrame(time: number): void {
    const callback = frames.shift();
    if (callback === undefined) {
      throw new Error("no frame requested");
    }
    act(() => callback(time));
  }

  it("draws the t = 0 frame, then advances at 20 Hz", () => {
    stubReducedMotion(false);
    renderScope();
    const sweep = screen.getByTestId("radar-sweep");
    expect(sweep).toHaveAttribute("transform", "translate(-409.5 0)");
    runFrame(1000);
    runFrame(1030);
    expect(sweep).toHaveAttribute("transform", "translate(-409.5 0)");
    runFrame(1050);
    // 50 ms at 60°/s is 3°: 3/70 of the half width.
    expect(sweep).toHaveAttribute("transform", "translate(-391.95 0)");
  });

  it("never starts the loop under reduced motion", () => {
    stubReducedMotion(true);
    renderScope();
    expect(frames).toHaveLength(0);
    expect(screen.getByTestId("radar-sweep")).toHaveAttribute(
      "transform",
      "translate(-409.5 0)",
    );
  });

  it("redraws the hits when a range OSB changes the scale", () => {
    stubReducedMotion(true);
    render(
      <>
        <svg>
          <RadarScope contacts={RADAR_SCENE.contacts} />
        </svg>
        <RangeOsb step={1} label="Increase range scale" />
      </>,
    );
    const scope = screen.getByTestId("radar-scope");
    const visible = (): number =>
      screen
        .getAllByTestId("radar-hit")
        .filter((hit) => hit.getAttribute("visibility") === "visible").length;
    expect(scope).toHaveAttribute("data-range", "40");
    const before = visible();
    const button = screen.getByRole("button", { name: "Increase range scale" });
    fireEvent.pointerDown(button, { button: 0 });
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    button.dispatchEvent(click);
    expect(rangeStore.get()).toBe(80);
    expect(scope).toHaveAttribute("data-range", "80");
    expect(visible()).toBeGreaterThan(before);
    fireEvent.keyDown(button, { key: "Enter" });
    expect(rangeStore.get()).toBe(160);
  });
});
