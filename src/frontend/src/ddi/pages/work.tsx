import type { Employer } from "@/content/types";
import {
  WORK_HISTORY,
  WorkHistory,
  WorkRoleStepper,
} from "../formats/workHistory";
import type { DdiScreen, DdiScreens, LegendSpec } from "../frame/types";
import type { Pb } from "../geometry";
import { MENU_LEGEND } from "./menuLegend";

/** Employer tabs fill the top row from PB6, as the HSI DATA tab strip does [pgB §9]. */
export const WORK_TAB_PBS: readonly Pb[] = [6, 7, 8, 9, 10];

/** HSI DATA pads its tab legends so the boxes match (`"  A/C  "`, `" WYPT "`) [pgB §9]; we pad to the longest tab. */
function padTab(tab: string, width: number): string {
  const left = Math.floor((width - tab.length) / 2);
  return " ".repeat(left) + tab + " ".repeat(width - tab.length - left);
}

/** The in-section state for one employer and role: local client state, never a URL (design section 9.4). */
export function workState(employer: Employer, roleIndex: number): string {
  return `${employer.id}/${roleIndex + 1}`;
}

function stateLegend(
  pb: Pb,
  lines: readonly string[],
  label: string,
  state: string,
  boxed = false,
): LegendSpec {
  return { pb, lines, label, boxed, action: { kind: "state", state } };
}

function workScreen(
  employers: readonly Employer[],
  employerIndex: number,
  roleIndex: number,
): DdiScreen {
  const employer = employers[employerIndex];
  const roleCount = employer.roles.length;
  const tabWidth = Math.max(...employers.map(({ tab }) => tab.length));
  const tabs = employers.map((other, index) =>
    stateLegend(
      WORK_TAB_PBS[index],
      [padTab(other.tab, tabWidth)],
      other.name,
      workState(other, 0),
      index === employerIndex,
    ),
  );
  const stepper =
    roleCount > 1
      ? [
          stateLegend(
            WORK_HISTORY.stepper.up,
            [],
            "Previous role",
            workState(employer, (roleIndex - 1 + roleCount) % roleCount),
          ),
          stateLegend(
            WORK_HISTORY.stepper.down,
            [],
            "Next role",
            workState(employer, (roleIndex + 1) % roleCount),
          ),
        ]
      : [];
  const role = employer.roles[roleIndex];
  return {
    legends: [...tabs, ...stepper, MENU_LEGEND],
    symbology: (
      <WorkHistory
        name={employer.name}
        location={employer.location}
        span={employer.span}
        roles={employer.roles}
        selected={roleIndex}
        bullets={role.bullets}
      />
    ),
    edges:
      roleCount > 1
        ? { right: <WorkRoleStepper number={roleIndex + 1} /> }
        : undefined,
  };
}

/**
 * Work history: one screen per employer and role. The tabs pick an employer (its newest role first); the arrows
 * step through its roles and wrap (docs/pages/work.md). The page opens on the newest employer.
 */
export function workScreens(employers: readonly Employer[]): DdiScreens {
  if (employers.length === 0 || employers.length > WORK_TAB_PBS.length) {
    throw new Error(
      `Work history takes 1 to ${WORK_TAB_PBS.length} employers, got ${employers.length}`,
    );
  }
  return {
    initial: workState(employers[0], 0),
    screens: Object.fromEntries(
      employers.flatMap((employer, employerIndex) =>
        employer.roles.map((_, roleIndex) => [
          workState(employer, roleIndex),
          workScreen(employers, employerIndex, roleIndex),
        ]),
      ),
    ),
  };
}
