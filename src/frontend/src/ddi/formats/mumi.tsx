import type { FontId } from "../constants";
import type { Point } from "../geometry";
import { StrokeLine } from "../primitives/StrokeLine";
import { PlacedTexts, type PlacedText } from "./placedText";

// MUMI: MUMI.lua [pgB §5], the `MUMI_Information` block and the root's `MU LOAD` cue. Lines use `addStrokeLine`
// rotations: −90 points right, −180 points down.
const F150: FontId = "F150";
const F120: FontId = "F120";

/** `MU ID ` (with its trailing space, as the Lua writes it) and the MU ID value. */
const MU_LABEL: PlacedText = {
  text: "MU ID ",
  font: F150,
  align: "CenterCenter",
  pos: [-180, 370],
};
const MU_ID_POS: Point = [-100, 370];
const MU_ID_RULE = { len: 570, pos: [-300, 340] as Point };

/** The two ID fields, each centred over a 200 DI rule. */
const ID_FIELD_POS: readonly [Point, Point] = [
  [-190, 250],
  [100, 250],
];
const ID_RULES: readonly Point[] = [
  [-290, 220],
  [0, 220],
];
const ID_RULE_LEN = 200;
const VERTICAL_RULE = { len: 290, pos: [-50, 220] as Point };

const LABEL_X = -350;
const VALUE_X = -200;
const MC_Y = 170;
const SMS_Y = 100;

/** `MPD_MUMI_DATA_Text`: the data transfer line. */
const DATA_XFER: PlacedText = {
  text: "DATA XFER",
  font: F120,
  align: "CenterCenter",
  pos: [-210, 10],
};

/** The ERRORS band: two 750 DI rules 150 DI apart, with the label and the list between them. */
const BAND_RULES: readonly Point[] = [
  [-400, -100],
  [-400, -250],
];
const BAND_RULE_LEN = 750;
const ERRORS_LABEL: PlacedText = {
  text: "ERRORS: ",
  font: F120,
  align: "CenterCenter",
  pos: [-300, -140],
};
const ERRORS_POS: Point = [-70, -140];

/** `MPD_MUMI_MU_LOAD_Label`: the load cue, parented to the page root, not the information block. */
const MU_LOAD: PlacedText = {
  text: "MU LOAD",
  font: F150,
  align: "CenterCenter",
  pos: [-320, -330],
};

/**
 * (ours) Content limits in characters. Each keeps its string inside what frames it: the MU ID value ends at the
 * 570 DI rule's end, an ID field stays over its 200 DI rule, an MC or SMS value keeps one character clear of its
 * label and of the vertical rule, and the ERRORS list keeps one character clear of `ERRORS:`. `mumi.test.tsx`
 * checks each with `measure`.
 */
export const MUMI_LIMITS = {
  muId: 15,
  idField: 10,
  version: 10,
  errors: 15,
} as const;

export function muIdText(value: string): PlacedText {
  return { text: value, font: F150, align: "LeftCenter", pos: MU_ID_POS };
}

export function idFieldText(value: string, field: 0 | 1): PlacedText {
  return {
    text: value,
    font: F120,
    align: "CenterCenter",
    pos: ID_FIELD_POS[field],
  };
}

export function versionText(value: string, row: "MC" | "SMS"): PlacedText {
  return {
    text: value,
    font: F120,
    align: "CenterCenter",
    pos: [VALUE_X, row === "MC" ? MC_Y : SMS_Y],
  };
}

export function versionLabel(row: "MC" | "SMS"): PlacedText {
  return {
    text: row,
    font: F120,
    align: "CenterCenter",
    pos: [LABEL_X, row === "MC" ? MC_Y : SMS_Y],
  };
}

export function errorsText(list: string): PlacedText {
  return { text: list, font: F120, align: "CenterCenter", pos: ERRORS_POS };
}

/** What frames each text: the ERRORS label, the rules' ends and the vertical rule, for the limit tests. */
export const MUMI_FRAME = {
  errorsLabel: ERRORS_LABEL,
  muIdRuleEnd: MU_ID_RULE.pos[0] + MU_ID_RULE.len,
  idRuleSpans: ID_RULES.map(([x]) => [x, x + ID_RULE_LEN] as const),
  verticalRuleX: VERTICAL_RULE.pos[0],
} as const;

export interface MumiInformationProps {
  /** `MPD_MUMI_MU_ID_1_Text` and `_2_Text`; DCS samples `ABCD`. */
  idFields: readonly [string, string];
  /** `MPD_MUMI_MC_Text`; DCS samples `15C-XXXU`. */
  mc: string;
  /** `MPD_MUMI_SMS_Text`; DCS samples `15C-XXXU`. */
  sms: string;
}

/**
 * The static part of the information block: labels, rules, the ID fields, the MC and SMS versions and `DATA XFER`.
 * The MU ID value, the ERRORS list and `MU LOAD` change during a load, so the page draws them in its live layer.
 */
export function MumiInformation({
  idFields,
  mc,
  sms,
}: MumiInformationProps): React.JSX.Element {
  return (
    <>
      <PlacedTexts
        texts={[
          MU_LABEL,
          idFieldText(idFields[0], 0),
          idFieldText(idFields[1], 1),
          versionLabel("MC"),
          versionText(mc, "MC"),
          versionLabel("SMS"),
          versionText(sms, "SMS"),
          DATA_XFER,
          ERRORS_LABEL,
        ]}
      />
      <StrokeLine len={MU_ID_RULE.len} pos={MU_ID_RULE.pos} rot={-90} />
      {ID_RULES.map((pos) => (
        <StrokeLine key={pos.join()} len={ID_RULE_LEN} pos={pos} rot={-90} />
      ))}
      <StrokeLine len={VERTICAL_RULE.len} pos={VERTICAL_RULE.pos} rot={-180} />
      {BAND_RULES.map((pos) => (
        <StrokeLine key={pos.join()} len={BAND_RULE_LEN} pos={pos} rot={-90} />
      ))}
    </>
  );
}

/** The `MU LOAD` cue. */
export function MumiMuLoad(): React.JSX.Element {
  return <PlacedTexts texts={[MU_LOAD]} />;
}
