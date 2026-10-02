import type { Profile } from "@/content/types";
import { wrapWords } from "../font/wrapWords";
import {
  FREE_TEXT_CHARS,
  TgtDataOwnship,
  type TgtDataOwnshipProps,
} from "../formats/tgtDataOwnship";
import type { DdiScreens } from "../frame/types";
import { RETURN_TO_MENU } from "./returnToMenu";

/** The profile in TGT DATA OWNSHIP's slots (docs/pages/about.md). */
export function aboutFormatProps(profile: Profile): TgtDataOwnshipProps {
  return {
    topLeft: profile.header,
    topRight: profile.badge,
    status: profile.status,
    stores: profile.loadout,
    footer: profile.footer,
    iff: profile.tags.map(({ label, value }) => `${label} ${value}`),
    freeText: wrapWords(profile.bio, FREE_TEXT_CHARS),
  };
}

/** About has one screen and only the `MENU` legend. */
export function aboutScreens(profile: Profile): DdiScreens {
  return {
    initial: "ABOUT",
    screens: {
      ABOUT: {
        legends: [RETURN_TO_MENU],
        symbology: <TgtDataOwnship {...aboutFormatProps(profile)} />,
      },
    },
  };
}
