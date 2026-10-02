import { DdiPage } from "@/ddi/pages/DdiPage";
import { pageMetadata } from "@/ddi/pages/metadata";
import { mumiScreens } from "@/ddi/pages/mumi/screens";
import { PAGES } from "@/ddi/pages/registry";
import { MumiSemantic } from "@/semantic/MumiSemantic";
import { SemanticPage } from "@/semantic/SemanticPage";

export const metadata = pageMetadata(
  "mumi",
  "The Hornet's mission initialization page, loading the site's deployment.",
);

export default function MumiPage(): React.JSX.Element {
  return (
    <DdiPage
      screens={mumiScreens()}
      semantic={
        <SemanticPage heading={PAGES.mumi.label}>
          <MumiSemantic />
        </SemanticPage>
      }
    />
  );
}
