import type {
  Project,
  ProjectCategory,
  ProjectLink,
  Projects,
} from "@/content/types";
import type { DdiScreen, DdiScreens, LegendSpec } from "../frame/types";
import {
  DATA_ROW_CHARS,
  DATA_ROWS,
  DataBlock,
  ProgBlock,
  StationStore,
  Wingform,
} from "../formats/storesWingform";
import { wrapText } from "../font/wrap";
import type { Pb } from "../geometry";
import { MENU_LEGEND } from "./menuLegend";

/** The top row holds the categories, in order, as STORES holds the weapon types [pgA §1.4]. */
export const CATEGORY_PBS: readonly Pb[] = [6, 7, 8, 9, 10];
/** STORES `STEP` [pgA §1.4]. */
export const STEP_PB: Pb = 13;
/** STORES `DATA`, boxed while its sublevel is open [pgA §1.4]. */
export const DATA_PB: Pb = 17;
/** (ours) The DATA sublevel's link-outs, on the bottom row either side of `MENU` and `DATA`. */
export const LINK_PBS: Readonly<Record<ProjectLink["kind"], Pb>> = {
  REPO: 16,
  DEMO: 19,
};

/** A project's in-section state: its station selected, on the main page or the DATA sublevel. */
export function projectState(project: Project, data: boolean): string {
  return data ? `${project.slug}/data` : project.slug;
}

/** Each category's projects, in station order: the order `STEP` cycles through. */
export function projectsByCategory(
  projects: readonly Project[],
  categories: readonly ProjectCategory[],
): Map<ProjectCategory, Project[]> {
  return new Map(
    categories.map((category) => [
      category,
      projects
        .filter((project) => project.category === category.legend)
        .toSorted((a, b) => a.station - b.station),
    ]),
  );
}

/** The DATA sublevel's text rows. Throws when the description outgrows the block. */
export function descriptionRows(project: Project): string[] {
  const rows = wrapText(project.description, DATA_ROW_CHARS);
  if (rows.length > DATA_ROWS - 1) {
    throw new Error(
      `${project.slug}: the description wraps to ${rows.length} rows; the DATA block holds ${DATA_ROWS - 1}`,
    );
  }
  return rows;
}

interface Selection {
  project: Project;
  category: ProjectCategory;
  /** The project `STEP` moves to: the next in the category, wrapping. */
  next: Project;
  data: boolean;
}

function legends(
  { project, category, next, data }: Selection,
  byCategory: Map<ProjectCategory, Project[]>,
): LegendSpec[] {
  const categoryLegends = [...byCategory].map(
    ([candidate, members], index): LegendSpec => ({
      pb: CATEGORY_PBS[index],
      lines: [candidate.legend],
      boxed: candidate === category,
      label: `${candidate.name} projects`,
      action: { kind: "state", state: projectState(members[0], data) },
    }),
  );
  const linkLegends = data
    ? project.links.map((link): LegendSpec => ({
        pb: LINK_PBS[link.kind],
        lines: [link.kind],
        label: `${project.name} ${link.kind === "REPO" ? "repository" : "demo"}`,
        action: { kind: "external", href: link.url },
      }))
    : [];
  return [
    ...categoryLegends,
    {
      pb: STEP_PB,
      lines: ["STEP"],
      label: `Step to ${next.name}`,
      action: { kind: "state", state: projectState(next, data) },
    },
    {
      pb: DATA_PB,
      lines: ["DATA"],
      boxed: data,
      label: data ? `Close ${project.name} details` : `${project.name} details`,
      action: { kind: "state", state: projectState(project, !data) },
    },
    ...linkLegends,
    MENU_LEGEND,
  ];
}

function screen(
  selection: Selection,
  projects: readonly Project[],
  byCategory: Map<ProjectCategory, Project[]>,
): DdiScreen {
  const { project, data } = selection;
  return {
    legends: legends(selection, byCategory),
    symbology: (
      <>
        <Wingform />
        {projects.map((candidate) => (
          <StationStore
            key={candidate.station}
            station={candidate.station}
            load={candidate.store}
            code={candidate.code}
            status={candidate.status}
            selected={candidate === project}
          />
        ))}
        {data ? (
          <DataBlock title={project.name} rows={descriptionRows(project)} />
        ) : (
          <ProgBlock
            title={project.name}
            left={project.fields.left}
            right={project.fields.right}
          />
        )}
      </>
    ),
  };
}

/**
 * `/projects` on the STORES format (design sections 9.1 and 9.4). Every in-section state is a selected project, on
 * the main page or its DATA sublevel. A category OSB selects the category's first station, `STEP` the next station in
 * the category, and `DATA` toggles the sublevel. None of them changes the URL.
 */
export function projectsScreens({
  categories,
  projects,
}: Projects): DdiScreens {
  const byCategory = projectsByCategory(projects, categories);
  const screens: Record<string, DdiScreen> = {};
  for (const [category, members] of byCategory) {
    members.forEach((project, index) => {
      const next = members[(index + 1) % members.length];
      for (const data of [false, true]) {
        screens[projectState(project, data)] = screen(
          { project, category, next, data },
          projects,
          byCategory,
        );
      }
    });
  }
  const [first] = byCategory.values();
  return { initial: projectState(first[0], false), screens };
}
