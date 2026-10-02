import { DdiPage } from "@/ddi/pages/DdiPage";
import { menuScreens } from "@/ddi/pages/menus";
import { pageMetadata } from "@/ddi/pages/metadata";
import { SITE_NAME } from "@/lib/site";
import { MenuSemantic } from "@/semantic/MenuSemantic";
import { SemanticPage } from "@/semantic/SemanticPage";

const DESCRIPTION = `The personal website of ${SITE_NAME}, drawn as an F/A-18C Hornet digital display indicator.`;

export const metadata = pageMetadata("menu", DESCRIPTION);

export default function MenuPage(): React.JSX.Element {
  return (
    <DdiPage
      screens={menuScreens()}
      semantic={
        <SemanticPage heading={SITE_NAME}>
          <p>{DESCRIPTION}</p>
          <MenuSemantic />
        </SemanticPage>
      }
    />
  );
}
