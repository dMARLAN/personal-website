import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPLOYERS } from "@/content/work";
import type { Employer } from "@/content/types";
import {
  WORK_BULLET_CHARS,
  WORK_HISTORY,
  WorkHistory,
  bulletCapacity,
  bulletRowY,
  bulletRows,
  lowerRuleY,
  roleRowY,
} from "../formats/workHistory";
import { FullViewportFrame } from "../frame/FullViewportFrame";
import { LEGEND_FONT, legendBounds, pbLabelLayout } from "../frame/legend";
import { measure } from "../geometry";
import { WORK_TAB_PBS, workScreens, workState } from "./work";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  push.mockClear();
});

const { half, roles, bullets } = WORK_HISTORY;
const width = (text: string, font = LEGEND_FONT): number =>
  measure(text, font).width;

describe("the work history content", () => {
  it("has 1 to 5 employers with unique ids, each with 1 to 4 roles", () => {
    expect(EMPLOYERS.length).toBeGreaterThanOrEqual(1);
    expect(EMPLOYERS.length).toBeLessThanOrEqual(WORK_TAB_PBS.length);
    expect(new Set(EMPLOYERS.map(({ id }) => id)).size).toBe(EMPLOYERS.length);
    for (const employer of EMPLOYERS) {
      expect(employer.roles.length).toBeGreaterThanOrEqual(1);
      expect(employer.roles.length).toBeLessThanOrEqual(roles.max);
    }
  });

  it.each(EMPLOYERS)("fits $id's header and role list", (employer) => {
    expect(width(employer.name, WORK_HISTORY.header.font)).toBeLessThanOrEqual(
      2 * half,
    );
    expect(width(employer.location) + width(employer.span)).toBeLessThanOrEqual(
      2 * half - 40,
    );
    for (const role of employer.roles) {
      expect(roles.spanX + width(role.span), role.span).toBeLessThan(
        roles.titleX - 20,
      );
      expect(roles.titleX + width(role.title), role.title).toBeLessThan(
        roles.box.width / 2 - 6,
      );
    }
  });

  it.each(EMPLOYERS)(
    "fits each of $id's roles' highlights under its role list",
    (employer) => {
      for (const role of employer.roles) {
        expect(bulletRows(role.bullets).length, role.title).toBeLessThanOrEqual(
          bulletCapacity(employer.roles.length),
        );
      }
    },
  );

  it("fits 14 highlight rows under the longest role list, clear of the bottom legends", () => {
    expect(bulletCapacity(roles.max)).toBe(14);
    const lastRow = bulletRowY(roles.max, bulletCapacity(roles.max) - 1);
    expect(lastRow).toBeGreaterThanOrEqual(bullets.lowestY);
    expect(lastRow - 12).toBeGreaterThan(-476);
  });

  it("wraps highlights to x = +400", () => {
    expect(
      bullets.textX + width("X".repeat(WORK_BULLET_CHARS)),
    ).toBeLessThanOrEqual(half);
    expect(
      bullets.textX + width("X".repeat(WORK_BULLET_CHARS + 1)),
    ).toBeGreaterThan(half);
  });

  it.each([1, 2, 3, 4])(
    "keeps %i roles, selection box included, between the rules",
    (count) => {
      const top = roleRowY(0) + roles.box.height / 2;
      const bottom = roleRowY(count - 1) - roles.box.height / 2;
      expect(top).toBeLessThan(WORK_HISTORY.rules.topY);
      expect(bottom).toBeGreaterThan(lowerRuleY(count));
    },
  );

  it("draws every employer with the stroke font", () => {
    for (const employer of EMPLOYERS) {
      employer.roles.forEach((role, index) => {
        expect(() =>
          renderToStaticMarkup(
            <svg>
              <WorkHistory
                name={employer.name}
                location={employer.location}
                span={employer.span}
                roles={employer.roles}
                selected={index}
                bullets={role.bullets}
              />
            </svg>,
          ),
        ).not.toThrow();
      });
    }
  });
});

describe("the work history screens", () => {
  const screens = workScreens(EMPLOYERS);
  const roleCount = EMPLOYERS.reduce(
    (total, employer) => total + employer.roles.length,
    0,
  );

  it("has one screen per role and opens on the newest employer's newest role", () => {
    expect(Object.keys(screens.screens)).toHaveLength(roleCount);
    expect(screens.initial).toBe(workState(EMPLOYERS[0], 0));
  });

  it("boxes only the current employer's tab, padded so the boxes match", () => {
    EMPLOYERS.forEach((employer, employerIndex) => {
      const { legends } = screens.screens[workState(employer, 0)];
      const tabs = legends.filter(({ pb }) => WORK_TAB_PBS.includes(pb));
      expect(tabs.map(({ boxed }) => boxed)).toEqual(
        EMPLOYERS.map((_, index) => index === employerIndex),
      );
      expect(new Set(tabs.map(({ lines }) => lines[0].length)).size).toBe(1);
    });
  });

  it("fits the tab boxes in the 169 DI pitch without touching", () => {
    const { legends } = screens.screens[screens.initial];
    const tabs = legends.filter(({ pb }) => WORK_TAB_PBS.includes(pb));
    const boxes = tabs.map(
      (legend) => legendBounds(pbLabelLayout(legend.pb, legend.lines, true))[1],
    );
    boxes.slice(1).forEach((box, index) => {
      expect(box.left).toBeGreaterThan(boxes[index].right);
    });
  });

  it("points every state OSB at a screen that exists", () => {
    for (const screen of Object.values(screens.screens)) {
      for (const { action } of screen.legends) {
        if (action.kind === "state") {
          expect(screens.screens).toHaveProperty([action.state]);
        }
      }
    }
  });

  it("steps roles with PB12 and PB13 and wraps", () => {
    const employer = EMPLOYERS.find(({ roles: list }) => list.length > 1);
    if (employer === undefined) {
      throw new Error("the content needs an employer with several roles");
    }
    const last = employer.roles.length - 1;
    const actions = (roleIndex: number): unknown[] =>
      screens.screens[workState(employer, roleIndex)].legends
        .filter(({ pb }) => pb === 12 || pb === 13)
        .map(({ action }) => action);
    expect(actions(0)).toEqual([
      { kind: "state", state: workState(employer, last) },
      { kind: "state", state: workState(employer, 1) },
    ]);
    expect(actions(last)).toEqual([
      { kind: "state", state: workState(employer, last - 1) },
      { kind: "state", state: workState(employer, 0) },
    ]);
  });

  it("hides the stepper for an employer with one role", () => {
    const single: Employer = {
      ...EMPLOYERS[0],
      roles: [EMPLOYERS[0].roles[0]],
    };
    const screen = workScreens([single]).screens[workState(single, 0)];
    expect(screen.legends.map(({ pb }) => pb)).toEqual([6, 18]);
    expect(screen.edges).toBeUndefined();
  });

  it("refuses more employers than there are tabs", () => {
    expect(() => workScreens([...EMPLOYERS, ...EMPLOYERS])).toThrow();
  });
});

describe("the work history OSBs", () => {
  it("switch employer and role in place, without navigating", () => {
    const { container } = render(
      <FullViewportFrame screens={workScreens(EMPLOYERS)} />,
    );
    const glass = (): string =>
      container.querySelector(".ddi-square")?.innerHTML ?? "";
    const press = (name: string): void => {
      fireEvent.pointerDown(screen.getByRole("button", { name }), {
        button: 0,
      });
    };
    const first = glass();
    press(EMPLOYERS[1].name);
    const secondEmployer = glass();
    expect(secondEmployer).not.toBe(first);
    press("Next role");
    expect(glass()).not.toBe(secondEmployer);
    press("Previous role");
    expect(glass()).toBe(secondEmployer);
    press(EMPLOYERS[0].name);
    expect(glass()).toBe(first);
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Menu" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
