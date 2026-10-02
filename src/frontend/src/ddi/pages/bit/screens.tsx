import {
  BIT_CHECKS,
  BIT_LEGEND_NAMES,
  SW_CONFIG,
  type BitItemKey,
} from "@/content/bit";
import {
  BIT,
  BitBracketLegend,
  BitGroupBlock,
  BitItemLegend,
  BitRow,
  BitText,
  BitTitle,
  SwConfigTable,
  type StatusSlot,
} from "../../formats/bitFormat";
import type { DdiScreen, DdiScreens, LegendSpec } from "../../frame/types";
import { pbEdge, type Edge, type Pb } from "../../geometry";
import { PBLabel } from "../../primitives/PBLabel";
import { MENU_PB, PAGES } from "../registry";
import {
  BitOsbButton,
  LiveFcsOption,
  LiveStatus,
  type BitCommand,
} from "./islands";
import { isPassing, reachableStatuses, type LiveCheck } from "./status";
import {
  EQUIP_ORDER,
  FCS_OPTIONS,
  SUBLEVELS,
  type ItemLegend,
  type Sublevel,
} from "./structure";

/** The in-section states of `/bit`: the BIT FAILURES pages, the eight sublevels and S/W CONFIGURATION. */
export const MAIN_STATE = "MAIN-1";
export const CONFIG_STATE = "CONFIG";

export function mainState(page: number): string {
  return `MAIN-${page}`;
}

export function liveCheck(item: BitItemKey): LiveCheck {
  const { status, afterTest } = BIT_CHECKS[item];
  return { id: item, status, afterTest };
}

/** The checks on BIT FAILURES: every listed item that is not passing before any test, in `EquipItems` order. */
export function failingItems(): BitItemKey[] {
  return EQUIP_ORDER.filter((item) => !isPassing(BIT_CHECKS[item].status));
}

/** A status cell showing one check, or a group's summary of several. */
function liveStatus(
  checks: readonly LiveCheck[],
  summary: "check" | "group",
): StatusSlot {
  return function LiveStatusSlot(place) {
    return (
      <LiveStatus
        checks={checks}
        summary={summary}
        options={Object.fromEntries(
          reachableStatuses(checks, summary).map((status) => [
            status,
            <BitText key={status} text={status} {...place} />,
          ]),
        )}
      />
    );
  };
}

function menuLegend(): LegendSpec {
  return {
    pb: MENU_PB,
    lines: ["MENU"],
    label: "Tactical menu",
    action: { kind: "link", href: PAGES.menu.path },
  };
}

function inertLegend(pb: Pb, text: string, label: string): LegendSpec {
  return { pb, lines: [text], label, action: { kind: "inert" } };
}

function stateLegend(
  pb: Pb,
  lines: readonly string[],
  label: string,
  state: string,
): LegendSpec {
  return { pb, lines, label, action: { kind: "state", state } };
}

function commandLegend(
  pb: Pb,
  lines: readonly string[],
  label: string,
  command: BitCommand,
): LegendSpec {
  return {
    pb,
    lines,
    label,
    action: {
      kind: "island",
      render: <BitOsbButton label={label} command={command} />,
    },
  };
}

/** BIT_COMMON: PB9 `MI` (memory inspect, inert here) and PB10 `STOP`, on every BIT page. */
function commonLegends(): LegendSpec[] {
  return [
    inertLegend(9, "MI", "Memory inspect"),
    commandLegend(10, ["STOP"], "Stop tests", { kind: "stop" }),
    menuLegend(),
  ];
}

/** Groups edge content by the edge strip it belongs in. */
function byEdge(
  parts: readonly { pb: Pb; node: React.ReactNode }[],
): Partial<Record<Edge, React.ReactNode>> {
  const edges: Partial<Record<Edge, React.ReactNode[]>> = {};
  for (const { pb, node } of parts) {
    (edges[pbEdge(pb)] ??= []).push(<g key={pb}>{node}</g>);
  }
  return edges;
}

function testCommand(items: readonly BitItemKey[]): BitCommand {
  return { kind: "test", ids: items };
}

function mainScreen(page: number, pageCount: number): DdiScreen {
  const failures = failingItems().slice(
    (page - 1) * BIT.rowsPerPage,
    page * BIT.rowsPerPage,
  );
  const legends: LegendSpec[] = [
    commandLegend(6, ["AUTO"], "Run every test", testCommand(EQUIP_ORDER)),
    stateLegend(7, ["CONFIG"], "Software configuration", CONFIG_STATE),
    inertLegend(8, "SELBIT", "Select BIT"),
    ...commonLegends(),
    ...SUBLEVELS.map((sublevel) =>
      stateLegend(sublevel.groupPb, [], `${sublevel.title} tests`, sublevel.id),
    ),
  ];
  if (pageCount > 1) {
    legends.push(
      stateLegend(
        16,
        ["PAGE"],
        "Next page of failures",
        mainState((page % pageCount) + 1),
      ),
    );
  }
  return {
    legends,
    symbology: (
      <>
        <BitTitle text="BIT FAILURES" />
        {failures.map((item, index) => (
          <BitRow
            key={item}
            index={index}
            name={BIT_CHECKS[item].name}
            status={liveStatus([liveCheck(item)], "check")}
          />
        ))}
      </>
    ),
    edges: byEdge(
      SUBLEVELS.map((sublevel) => ({
        pb: sublevel.groupPb,
        node: (
          <BitGroupBlock
            pb={sublevel.groupPb}
            label={sublevel.groupLabel}
            status={liveStatus(sublevel.rows.map(liveCheck), "group")}
          />
        ),
      })),
    ),
  };
}

function itemLegendName(item: ItemLegend): string {
  return "item" in item
    ? BIT_CHECKS[item.item].name
    : BIT_LEGEND_NAMES[item.legend];
}

function itemLegendSpec(item: ItemLegend): LegendSpec {
  const name = itemLegendName(item);
  const tests = "item" in item ? [item.item] : item.tests;
  // Item legends draw themselves in the edge strip (BitItemLegend), so the frame draws no lines for them.
  return tests.length === 0
    ? { pb: item.pb, lines: [], label: name, action: { kind: "inert" } }
    : commandLegend(item.pb, [], `Test ${name}`, testCommand(tests));
}

function sublevelScreen(sublevel: Sublevel): DdiScreen {
  const { bracket, extraRows = [] } = sublevel;
  const allItems = [...sublevel.rows, ...extraRows.map(({ item }) => item)];
  const legends: LegendSpec[] = [
    commandLegend(
      6,
      ["ALL"],
      `Test all ${sublevel.title}`,
      testCommand(allItems),
    ),
    stateLegend(8, ["BIT"], "BIT failures", MAIN_STATE),
    ...commonLegends(),
    ...sublevel.items.map(itemLegendSpec),
    ...sublevel.fixed.map(({ pb, text, label }) =>
      inertLegend(pb, text, label),
    ),
  ];
  const edgeParts = sublevel.items.map((item) => ({
    pb: item.pb,
    node: <BitItemLegend pb={item.pb} name={itemLegendName(item)} />,
  }));
  if (bracket !== undefined) {
    const [group, middle, bottom] = bracket.labels;
    const names = [
      BIT_LEGEND_NAMES[group],
      BIT_CHECKS[middle].name,
      BIT_CHECKS[bottom].name,
    ] as const;
    legends.push(
      commandLegend(
        bracket.pb,
        [],
        `Test ${names.join(", ")}`,
        testCommand(bracket.tests),
      ),
    );
    edgeParts.push({
      pb: bracket.pb,
      node: <BitBracketLegend pb={bracket.pb} names={names} />,
    });
  }
  if (sublevel.id === "FCS-MC") {
    legends.push(
      commandLegend(16, ["FCS\nOPTION"], "Next FCS option", {
        kind: "fcs-option",
        count: FCS_OPTIONS.length,
      }),
      { pb: 17, lines: [], label: "FCS option", action: { kind: "inert" } },
    );
    edgeParts.push({
      pb: 17,
      node: (
        <LiveFcsOption
          options={FCS_OPTIONS.map((text) => (
            <PBLabel key={text} pb={17} lines={[text]} />
          ))}
        />
      ),
    });
  }
  return {
    legends,
    symbology: (
      <>
        <BitTitle text={sublevel.title} />
        {sublevel.rows.map((item, index) => (
          <BitRow
            key={item}
            index={index}
            name={BIT_CHECKS[item].name}
            status={liveStatus([liveCheck(item)], "check")}
          />
        ))}
        {extraRows.map(({ index, item }) => (
          <BitRow
            key={item}
            index={index}
            name={BIT_CHECKS[item].name}
            status={liveStatus([liveCheck(item)], "check")}
          />
        ))}
      </>
    ),
    edges: byEdge(edgeParts),
  };
}

function configScreen(): DdiScreen {
  return {
    legends: [
      stateLegend(8, ["BIT"], "BIT failures", MAIN_STATE),
      ...commonLegends(),
      inertLegend(20, "OVRD", "Override"),
    ],
    symbology: <SwConfigTable left={SW_CONFIG.left} right={SW_CONFIG.right} />,
  };
}

/**
 * Every BIT level as one in-section state of `/bit` (design section 9.4): the paged BIT FAILURES list, the eight
 * sublevels and S/W CONFIGURATION. The page opens on BIT FAILURES, page 1. Tests are a shared client store, not
 * states, so a running test survives a level change.
 */
export function bitScreens(): DdiScreens {
  const pageCount = Math.max(
    1,
    Math.ceil(failingItems().length / BIT.rowsPerPage),
  );
  const screens: Record<string, DdiScreen> = {};
  for (let page = 1; page <= pageCount; page++) {
    screens[mainState(page)] = mainScreen(page, pageCount);
  }
  for (const sublevel of SUBLEVELS) {
    screens[sublevel.id] = sublevelScreen(sublevel);
  }
  screens[CONFIG_STATE] = configScreen();
  return { initial: MAIN_STATE, screens };
}
