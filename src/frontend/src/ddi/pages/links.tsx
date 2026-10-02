import type { LinkEntry } from "@/content/types";
import {
  UFC_BU_DOWN_PB,
  UFC_BU_UP_PB,
  UfcBu,
  UfcBuChannelStep,
} from "../formats/ufcBu";
import type { DdiScreen, DdiScreens, LegendSpec } from "../frame/types";
import type { Pb } from "../geometry";
import { RETURN_TO_MENU } from "./returnToMenu";

/** UFC BU's keypad: digits `1`–`9` then `0` on PB8–PB17 [pgB §12]. Row i is selected by key i. */
export const KEYPAD: readonly { pb: Pb; digit: string }[] = [
  { pb: 8, digit: "1" },
  { pb: 9, digit: "2" },
  { pb: 10, digit: "3" },
  { pb: 11, digit: "4" },
  { pb: 12, digit: "5" },
  { pb: 13, digit: "6" },
  { pb: 14, digit: "7" },
  { pb: 15, digit: "8" },
  { pb: 16, digit: "9" },
  { pb: 17, digit: "0" },
];
const ENT_PB: Pb = 19;
const CLR_PB: Pb = 20;

/** The in-section state with no row selected. The others are the selected row's digit. */
export const NO_SELECTION = "none";

function stateOf(index: number | null): string {
  return index === null ? NO_SELECTION : KEYPAD[index].digit;
}

function selectionLegends(
  links: readonly LinkEntry[],
  selected: number | null,
): LegendSpec[] {
  const last = links.length - 1;
  const next = selected === null || selected === last ? 0 : selected + 1;
  const previous = selected === null || selected === 0 ? last : selected - 1;
  const selectedLink = selected === null ? null : links[selected];
  return [
    {
      pb: UFC_BU_DOWN_PB,
      lines: [],
      label: "Next link",
      action: { kind: "state", state: stateOf(next) },
    },
    {
      pb: UFC_BU_UP_PB,
      lines: [],
      label: "Previous link",
      action: { kind: "state", state: stateOf(previous) },
    },
    ...links.map((link, index): LegendSpec => ({
      pb: KEYPAD[index].pb,
      lines: [KEYPAD[index].digit],
      label: `Select ${link.name}`,
      action: { kind: "state", state: stateOf(index) },
    })),
    selectedLink === null
      ? {
          pb: ENT_PB,
          lines: ["ENT"],
          label: "Open link",
          action: { kind: "inert" },
        }
      : {
          pb: ENT_PB,
          lines: ["ENT"],
          label: `Open ${selectedLink.name}`,
          action: { kind: "external", href: selectedLink.url },
        },
    {
      pb: CLR_PB,
      lines: ["CLR"],
      label: "Clear selection",
      action: { kind: "state", state: NO_SELECTION },
    },
    RETURN_TO_MENU,
  ];
}

function linksScreen(
  links: readonly LinkEntry[],
  selected: number | null,
): DdiScreen {
  return {
    legends: selectionLegends(links, selected),
    symbology: (
      <UfcBu
        rows={links.map((link, index) => ({
          number: KEYPAD[index].digit,
          name: link.name,
          tag: link.tag,
        }))}
        selected={selected}
        scratchpad={selected === null ? null : links[selected].name}
      />
    ),
    edges: { left: <UfcBuChannelStep /> },
  };
}

/**
 * Links: one screen per selection, plus none (docs/pages/links.md). The selection is in-section state, so it never
 * changes the URL. The page opens with row 1 selected, so `ENT` opens a link even before JavaScript loads.
 */
export function linksScreens(links: readonly LinkEntry[]): DdiScreens {
  if (links.length === 0 || links.length > KEYPAD.length) {
    throw new Error(
      `Links holds 1 to ${KEYPAD.length} rows, not ${links.length}`,
    );
  }
  const selections: (number | null)[] = [...links.keys(), null];
  return {
    initial: stateOf(0),
    screens: Object.fromEntries(
      selections.map((selected) => [
        stateOf(selected),
        linksScreen(links, selected),
      ]),
    ),
  };
}
