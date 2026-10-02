import { DdiPage } from "@/ddi/pages/DdiPage";
import { menuScreen } from "@/ddi/pages/menus";
import { pageMetadata } from "@/ddi/pages/metadata";
import { PAGES } from "@/ddi/pages/registry";
import { SemanticPage } from "@/semantic/SemanticPage";

const DESCRIPTION =
  "The support menu, which holds the showcase pages as each one ships.";

export const metadata = pageMetadata("supt", DESCRIPTION);

export default function SuptPage(): React.JSX.Element {
  return (
    <DdiPage
      screen={menuScreen("SUPT")}
      semantic={
        <SemanticPage heading={PAGES.supt.label}>
          <p>{DESCRIPTION}</p>
        </SemanticPage>
      }
    />
  );
}
