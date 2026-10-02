import {
  MumiInformation,
  MumiMuLoad,
  errorsText,
  muIdText,
} from "../../formats/mumi";
import { PlacedTexts } from "../../formats/placedText";
import { pbLabelLayout } from "../../frame/legend";
import type { DdiScreen, DdiScreens, LegendSpec } from "../../frame/types";
import { MenuTitle } from "../../primitives/MenuTitle";
import { StrokeBox } from "../../primitives/StrokeBox";
import { MENU_LEGEND } from "../menuLegend";
import { MISSION_DATA } from "./data";
import { LoadOsb, LoadSlot } from "./islands";
import {
  LOAD_PB,
  MAIN_LEGENDS,
  MORE_LEGENDS,
  SUBLEVEL_PB,
  type MumiLegend,
} from "./structure";

/** The in-section states of `/mumi`: the two legend sets. */
export const MAIN_STATE = "MAIN";
export const MORE_STATE = "MORE";

const LOAD_LABEL = "Admin console";

function dataLegend({ pb, lines, label }: MumiLegend): LegendSpec {
  if (pb === LOAD_PB) {
    return {
      pb,
      lines,
      label: LOAD_LABEL,
      action: { kind: "island", render: <LoadOsb label={LOAD_LABEL} /> },
    };
  }
  return { pb, lines, label, action: { kind: "inert" } };
}

/**
 * MUMI draws `MENU` with `addMenuLabel`, unboxed at the title position (0, −446), and gives PB18 no legend of its
 * own [pgB §5]. So the PB18 cap keeps MENU's action, and the text is drawn as the title.
 */
const MENU_AT_TITLE: LegendSpec = { ...MENU_LEGEND, lines: [] };

/** The load OSB's box: boxed while its data loads and once it has loaded (`MPD_MUMI_ID_Box`). */
function loadBox(): React.JSX.Element {
  const [box] = pbLabelLayout(LOAD_PB, ["ID"], true).boxes;
  const drawn = (
    <StrokeBox w={box.width} h={box.height} align={box.align} pos={box.pos} />
  );
  return (
    <LoadSlot idle={null} loading={drawn} blink={drawn} complete={drawn} />
  );
}

/** The MU ID, the ERRORS list and the blinking `MU LOAD` cue: what a load changes in the information block. */
function liveInformation(): React.JSX.Element {
  const muId = <PlacedTexts texts={[muIdText(MISSION_DATA.muId.value)]} />;
  return (
    <>
      <LoadSlot
        idle={muId}
        loading={muId}
        blink={muId}
        complete={<PlacedTexts texts={[muIdText(MISSION_DATA.loadedMuId)]} />}
      />
      <LoadSlot
        idle={<PlacedTexts texts={[errorsText(MISSION_DATA.errors.value)]} />}
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
  legends: readonly LegendSpec[],
  right?: React.ReactNode,
): DdiScreen {
  return {
    legends: [...legends, MENU_AT_TITLE],
    symbology: (
      <MumiInformation
        idFields={[
          MISSION_DATA.idFields[0].value,
          MISSION_DATA.idFields[1].value,
        ]}
        mc={MISSION_DATA.mc.value}
        sms={MISSION_DATA.sms.value}
      />
    ),
    live: liveInformation(),
    edges: { bottom: <MenuTitle name="MENU" />, right },
  };
}

/**
 * /mumi: the real MUMI format with the site's "mission data". `MORE` and `RETURN` switch the legend sets in place.
 * `ID` (PB11) runs the load and then opens the admin console. The other legends are inert (docs/pages/mumi.md).
 */
export function mumiScreens(): DdiScreens {
  return {
    initial: MAIN_STATE,
    screens: {
      [MAIN_STATE]: screen(
        [
          ...MAIN_LEGENDS.map(dataLegend),
          {
            pb: SUBLEVEL_PB,
            lines: ["MORE"],
            label: "More data types",
            action: { kind: "state", state: MORE_STATE },
          },
        ],
        loadBox(),
      ),
      [MORE_STATE]: screen([
        ...MORE_LEGENDS.map(dataLegend),
        {
          pb: SUBLEVEL_PB,
          lines: ["RETURN"],
          label: "Main data types",
          action: { kind: "state", state: MAIN_STATE },
        },
      ]),
    },
  };
}
