import { getMissionData } from "@/content/mumi";
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

export default async function MumiPage(): Promise<React.JSX.Element> {
  const data = await getMissionData();
  return (
    <DdiPage
      screens={mumiScreens(data)}
      semantic={
        <SemanticPage heading={PAGES.mumi.label}>
          <MumiSemantic data={data} />
        </SemanticPage>
      }
    />
  );
}
