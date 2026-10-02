import { DdiPage } from "@/ddi/pages/DdiPage";
import { menuScreen } from "@/ddi/pages/menus";
import { pageMetadata } from "@/ddi/pages/metadata";
import { SITE_NAME } from "@/lib/site";
import { SemanticPage } from "@/semantic/SemanticPage";

const DESCRIPTION = `The personal website of ${SITE_NAME}, drawn as an F/A-18C Hornet digital display indicator.`;

export const metadata = pageMetadata("tac", DESCRIPTION);

export default function TacPage(): React.JSX.Element {
  return (
    <DdiPage
      screen={menuScreen("TAC")}
      semantic={
        <SemanticPage heading={SITE_NAME}>
          <p>{DESCRIPTION}</p>
          <p>
            This is the tactical menu. Its pushbuttons open the site&apos;s
            sections as each one ships.
          </p>
        </SemanticPage>
      }
    />
  );
}
