import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LegendSpec } from "../frame/types";
import { FullViewportFrame } from "../frame/FullViewportFrame";
import { textPath } from "../font/layout";
import { LEGEND_FONT } from "../frame/legend";
import {
  DATA_ROW_CHARS,
  PROG_COLUMNS,
  PROG_ROWS,
  SELECTION_BOX,
  STATION_LOADS,
  STORES_FONT,
} from "../formats/storesWingform";
import { measure } from "../geometry";
import {
  CATEGORY_PBS,
  DATA_PB,
  STEP_PB,
  descriptionRows,
  projectState,
  projectsByCategory,
  projectsScreens,
} from "./projects";
import { SNAPSHOT_CONTENT } from "@/content/snapshot";

const PROJECT_CATEGORIES = SNAPSHOT_CONTENT.projects.categories;
const PROJECTS = SNAPSHOT_CONTENT.projects.projects;

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const SCREENS = projectsScreens(SNAPSHOT_CONTENT.projects);
const BY_CATEGORY = projectsByCategory(PROJECTS, PROJECT_CATEGORIES);
const [[firstCategory, firstMembers], [secondCategory, secondMembers]] = [
  ...BY_CATEGORY,
];
/** The clear gap (ours) between a PROG column's text and the next column. */
const COLUMN_GAP = 8;

function width(text: string): number {
  return measure(text, STORES_FONT).width;
}

function legendAt(state: string, pb: number): LegendSpec {
  const legend = SCREENS.screens[state].legends.find(
    (candidate) => candidate.pb === pb,
  );
  if (legend === undefined) {
    throw new Error(`no legend at PB${pb} on ${state}`);
  }
  return legend;
}

function stateTarget(legend: LegendSpec): string {
  if (legend.action.kind !== "state") {
    throw new Error(`PB${legend.pb} is not a state OSB`);
  }
  return legend.action.state;
}

describe("the projects content", () => {
  it("has 6–9 projects in 2–4 categories, each project on its own station", () => {
    expect(PROJECTS.length).toBeGreaterThanOrEqual(6);
    expect(PROJECTS.length).toBeLessThanOrEqual(9);
    expect(PROJECT_CATEGORIES.length).toBeGreaterThanOrEqual(2);
    expect(PROJECT_CATEGORIES.length).toBeLessThanOrEqual(4);
    expect(new Set(PROJECTS.map((project) => project.station)).size).toBe(
      PROJECTS.length,
    );
    expect(new Set(PROJECTS.map((project) => project.slug)).size).toBe(
      PROJECTS.length,
    );
  });

  it("files every project under a category, and leaves no category empty", () => {
    const legends = PROJECT_CATEGORIES.map((category) => category.legend);
    for (const project of PROJECTS) {
      expect(legends, project.slug).toContain(project.category);
    }
    for (const [category, members] of BY_CATEGORY) {
      expect(members.length, category.legend).toBeGreaterThan(0);
    }
  });

  it("loads each station only with a store its Lua can draw", () => {
    for (const project of PROJECTS) {
      expect(STATION_LOADS[project.station], project.slug).toContain(
        project.store.kind,
      );
    }
  });

  it("fits every string in its slot, in characters the stroke font has", () => {
    for (const category of PROJECT_CATEGORIES) {
      expect(category.legend.length).toBeLessThanOrEqual(7);
      expect(measure(category.legend, LEGEND_FONT).width).toBeLessThan(169);
      textPath(category.legend, LEGEND_FONT, "CenterTop", [0, 0]);
    }
    for (const project of PROJECTS) {
      const { left, right } = project.fields;
      const strings = [
        project.name,
        project.code,
        ...[...left, ...right].flatMap(({ label, value }) => [label, value]),
        ...descriptionRows(project),
      ];
      for (const text of strings) {
        expect(
          () => textPath(text, STORES_FONT, "LeftCenter", [0, 0]),
          text,
        ).not.toThrow();
      }
      expect(project.name.length, project.slug).toBeLessThanOrEqual(22);
      expect(project.code.length, project.slug).toBeLessThanOrEqual(6);
      expect(width(project.code), project.slug).toBeLessThan(
        SELECTION_BOX.width,
      );
      expect(left.length).toBeLessThanOrEqual(PROG_ROWS);
      expect(right.length).toBeLessThanOrEqual(PROG_ROWS);
      for (const { label, value } of left) {
        expect(
          PROG_COLUMNS.leftLabel + width(label) + COLUMN_GAP,
          label,
        ).toBeLessThanOrEqual(PROG_COLUMNS.leftValue);
        expect(
          PROG_COLUMNS.leftValue + width(value) + COLUMN_GAP,
          value,
        ).toBeLessThanOrEqual(PROG_COLUMNS.rightLabel);
      }
      for (const { label, value } of right) {
        expect(
          PROG_COLUMNS.rightLabel + width(label) + COLUMN_GAP,
          label,
        ).toBeLessThanOrEqual(PROG_COLUMNS.rightValue);
        expect(value.length, value).toBeLessThanOrEqual(15);
      }
      if (project.store.kind === "rack") {
        expect(project.store.amount).toBeLessThan(100);
      }
      expect(new Set(project.links.map((link) => link.kind)).size).toBe(
        project.links.length,
      );
      for (const link of project.links) {
        expect(link.url).toMatch(/^https:\/\//);
      }
    }
  });

  it("wraps every description to at most 7 rows of 47 characters", () => {
    for (const project of PROJECTS) {
      const rows = descriptionRows(project);
      expect(rows.length, project.slug).toBeLessThanOrEqual(7);
      expect(Math.max(...rows.map((row) => row.length))).toBeLessThanOrEqual(
        DATA_ROW_CHARS,
      );
    }
  });
});

describe("the projects screens", () => {
  it("open on the first category's first station, on the main page", () => {
    expect(SCREENS.initial).toBe(projectState(firstMembers[0], false));
    expect(legendAt(SCREENS.initial, CATEGORY_PBS[0])).toMatchObject({
      lines: [firstCategory.legend],
      boxed: true,
    });
  });

  it("have a main page and a DATA sublevel for every project", () => {
    expect(Object.keys(SCREENS.screens).toSorted()).toEqual(
      PROJECTS.flatMap((project) => [
        projectState(project, false),
        projectState(project, true),
      ]).toSorted(),
    );
  });

  it("only ever switch to states that exist, and never share an OSB", () => {
    for (const [state, { legends }] of Object.entries(SCREENS.screens)) {
      const pbs = legends.map((legend) => legend.pb);
      expect(new Set(pbs).size, state).toBe(pbs.length);
      for (const legend of legends) {
        if (legend.action.kind === "state") {
          expect(SCREENS.screens, `${state} PB${legend.pb}`).toHaveProperty([
            legend.action.state,
          ]);
        }
      }
    }
  });

  it("box the selected category, and select a category's first station on its OSB", () => {
    const legend = legendAt(SCREENS.initial, CATEGORY_PBS[1]);
    expect(legend).toMatchObject({
      lines: [secondCategory.legend],
      boxed: false,
    });
    const target = stateTarget(legend);
    expect(target).toBe(projectState(secondMembers[0], false));
    expect(legendAt(target, CATEGORY_PBS[1]).boxed).toBe(true);
    expect(legendAt(target, CATEGORY_PBS[0]).boxed).toBe(false);
  });

  it("STEP through every station in the category in order, wrapping to the first", () => {
    for (const [, members] of BY_CATEGORY) {
      let state = projectState(members[0], false);
      const visited = [state];
      for (let step = 0; step < members.length; step += 1) {
        state = stateTarget(legendAt(state, STEP_PB));
        visited.push(state);
      }
      expect(visited).toEqual(
        [...members, members[0]].map((project) => projectState(project, false)),
      );
    }
  });

  it("toggle the DATA sublevel with DATA, boxed while open, and keep STEP inside it", () => {
    const project = firstMembers[0];
    const main = projectState(project, false);
    const data = stateTarget(legendAt(main, DATA_PB));
    expect(data).toBe(projectState(project, true));
    expect(legendAt(main, DATA_PB).boxed).toBe(false);
    expect(legendAt(data, DATA_PB).boxed).toBe(true);
    expect(stateTarget(legendAt(data, DATA_PB))).toBe(main);
    expect(stateTarget(legendAt(data, STEP_PB))).toBe(
      projectState(firstMembers[1], true),
    );
  });

  it("show a project's link-outs only on its DATA sublevel", () => {
    for (const project of PROJECTS) {
      const external = (state: string): LegendSpec[] =>
        SCREENS.screens[state].legends.filter(
          (legend) => legend.action.kind === "external",
        );
      expect(external(projectState(project, false))).toEqual([]);
      expect(
        external(projectState(project, true)).map((legend) => [
          legend.lines,
          legend.action,
        ]),
      ).toEqual(
        project.links.map((link) => [
          [link.kind],
          { kind: "external", href: link.url },
        ]),
      );
    }
  });

  it("put MENU on PB18 as a link to /", () => {
    for (const { legends } of Object.values(SCREENS.screens)) {
      expect(legends.find((legend) => legend.pb === 18)).toMatchObject({
        lines: ["MENU"],
        action: { kind: "link", href: "/ddi" },
      });
    }
  });
});

describe("the projects page in the frame", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("steps, switches category and opens DATA on press, and opens a link-out in a new tab", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const { container } = render(<FullViewportFrame screens={SCREENS} />);
    const [, second] = firstMembers;

    fireEvent.pointerDown(
      screen.getByRole("button", { name: `Step to ${second.name}` }),
      { button: 0 },
    );
    fireEvent.pointerDown(
      screen.getByRole("button", { name: `${second.name} details` }),
      { button: 0 },
    );
    expect(
      container.querySelector(".ddi-osb[data-pb='17']"),
    ).toHaveAccessibleName(`Close ${second.name} details`);

    fireEvent.pointerDown(
      screen.getByRole("button", { name: `${secondCategory.name} projects` }),
      { button: 0 },
    );
    expect(
      container.querySelector(".ddi-osb[data-pb='17']"),
    ).toHaveAccessibleName(`Close ${secondMembers[0].name} details`);

    const [link] = secondMembers[0].links;
    expect(link).toBeDefined();
    const osb = screen.getByRole("link", {
      name: `${secondMembers[0].name} repository`,
    });
    expect(osb).toHaveAttribute("href", link.url);
    fireEvent.pointerDown(osb, { button: 0 });
    expect(open).toHaveBeenCalledWith(
      link.url,
      "_blank",
      "noopener,noreferrer",
    );
  });
});
