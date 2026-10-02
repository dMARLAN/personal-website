import type { Contact } from "@/content/types";
import {
  MIDS_CAUTIONS_POS,
  MIDS_FONT,
  Mids,
  type MidsRow,
} from "../formats/mids";
import type { DdiScreens } from "../frame/types";
import { StrokeText } from "../primitives/StrokeText";
import { CopyCautions, CopyOsb, MailOsb } from "./contactIslands";
import { RETURN_TO_MENU } from "./returnToMenu";

export const EMAIL_LABEL = "EMAIL:";
const COPY_LABEL = "Copy email address";
const MAIL_LABEL = "Send email";

/** The MIDS status rows: the email first, then the content rows. */
export function contactRows(contact: Contact): MidsRow[] {
  return [{ label: EMAIL_LABEL, value: contact.email }, ...contact.rows];
}

function cautionsText(text: string): React.JSX.Element {
  return (
    <StrokeText
      text={text}
      font={MIDS_FONT}
      align="LeftBottom"
      pos={MIDS_CAUTIONS_POS}
    />
  );
}

/**
 * Contact has one screen. PB17 `XMIT` `MAIL` (MIDS `XMIT`'s position) opens a mail to the address. PB16 `COPY`
 * (`RELAY`'s position) copies it, and the cautions line confirms for 2 s (docs/pages/contact.md).
 */
export function contactScreens(contact: Contact): DdiScreens {
  const mailto = `mailto:${contact.email}`;
  return {
    initial: "CONTACT",
    screens: {
      CONTACT: {
        legends: [
          {
            pb: 16,
            lines: ["COPY"],
            label: COPY_LABEL,
            action: {
              kind: "island",
              render: <CopyOsb text={contact.email} label={COPY_LABEL} />,
            },
          },
          {
            pb: 17,
            lines: ["XMIT", "MAIL"],
            label: MAIL_LABEL,
            action: {
              kind: "island",
              render: <MailOsb href={mailto} label={MAIL_LABEL} />,
            },
          },
          RETURN_TO_MENU,
        ],
        symbology: (
          <Mids
            rows={contactRows(contact)}
            cautions={
              <CopyCautions
                copied={cautionsText("COPIED")}
                failed={cautionsText("COPY FAILED")}
              />
            }
          />
        ),
      },
    },
  };
}
