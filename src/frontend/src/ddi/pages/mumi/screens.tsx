import {
  MumiInformation,
  MumiMuLoad,
  errorsText,
  muIdText,
} from "../../formats/mumi";
import { PlacedTexts } from "../../formats/placedText";
import { pbLabelLayout } from "../../frame/legend";
import type { MissionData } from "@/content/types";
import type { DdiScreen, DdiScreens, LegendSpec } from "../../frame/types";
import { MenuTitle } from "../../primitives/MenuTitle";
import { StrokeBox } from "../../primitives/StrokeBox";
import { MENU_LEGEND } from "../menuLegend";
import { LoadOsb, LoadSlot } from "./islands";
import {
  LOAD_LEGEND,
  LOAD_PB,
  MAIN_LEGENDS,
  MORE_LEGENDS,
  SUBLEVEL_PB,
  type MumiLegend,
} from "./structure";

/** The in-section states of `/mumi`: the two legend sets. */
export const MAIN_STATE = "MAIN";
export const MORE_STATE = "MORE";

function dataLegend({ pb, lines, label }: MumiLegend): LegendSpec {
  return { pb, lines, label, action: { kind: "inert" } };
}

const LOAD: LegendSpec = {
  ...LOAD_LEGEND,
  action: { kind: "island", render: <LoadOsb label={LOAD_LEGEND.label} /> },
};

/**
 * MUMI draws `MENU` with `addMenuLabel`, unboxed at the title position (0, −446), and gives PB18 no legend of its
 * own [pgB §5]. So the PB18 cap keeps MENU's action, and the text is drawn as the title.
 */
const MENU_AT_TITLE: LegendSpec = { ...MENU_LEGEND, lines: [] };

/** The `LOAD` box: boxed while the load runs and once it has loaded, as MUMI boxes a selected legend. */
function loadBox(): React.JSX.Element {
  const [box] = pbLabelLayout(LOAD_PB, LOAD_LEGEND.lines, true).boxes;
  const drawn = (
    <StrokeBox w={box.width} h={box.height} align={box.align} pos={box.pos} />
  );
  return (
    <LoadSlot idle={null} loading={drawn} blink={drawn} complete={drawn} />
  );
}

/** The MU ID, the ERRORS list and the blinking `MU LOAD` cue: what a load changes in the information block. */
function liveInformation(data: MissionData): React.JSX.Element {
  const muId = <PlacedTexts texts={[muIdText(data.muId.value)]} />;
  return (
    <>
      <LoadSlot
        idle={muId}
        loading={muId}
        blink={muId}
        complete={<PlacedTexts texts={[muIdText(data.loadedMuId)]} />}
      />
      <LoadSlot
        idle={<PlacedTexts texts={[errorsText(data.errors.value)]} />}
        loading={null}
        blink={null}
        complete={null}
      />
      <LoadSlot
        idle={null}
        loading={<MumiMuLoad />}
        blink={null}
        complete={null}
      />
    </>
  );
}

function screen(
  data: MissionData,
  legends: readonly LegendSpec[],
  right?: React.ReactNode,
): DdiScreen {
  return {
    legends: [...legends, MENU_AT_TITLE],
    symbology: (
      <MumiInformation
        idFields={[data.idFields[0].value, data.idFields[1].value]}
        mc={data.mc.value}
        sms={data.sms.value}
      />
    ),
    live: liveInformation(data),
    edges: { bottom: <MenuTitle name="MENU" />, right },
  };
}

/**
 * /mumi: the real MUMI format with the site's "mission data" from the API. `MORE` and `RETURN` switch the legend sets
 * in place. `LOAD` (ours, PB12 of the More set) runs the load and then opens the admin console. The real legends are
 * inert (docs/pages/mumi.md).
 */
export function mumiScreens(data: MissionData): DdiScreens {
  return {
    initial: MAIN_STATE,
    screens: {
      [MAIN_STATE]: screen(data, [
        ...MAIN_LEGENDS.map(dataLegend),
        {
          pb: SUBLEVEL_PB,
          lines: ["MORE"],
          label: "More data types",
          action: { kind: "state", state: MORE_STATE },
        },
      ]),
      [MORE_STATE]: screen(
        data,
        [
          ...MORE_LEGENDS.map(dataLegend),
          LOAD,
          {
            pb: SUBLEVEL_PB,
            lines: ["RETURN"],
            label: "Main data types",
            action: { kind: "state", state: MAIN_STATE },
          },
        ],
        loadBox(),
      ),
    },
  };
}
