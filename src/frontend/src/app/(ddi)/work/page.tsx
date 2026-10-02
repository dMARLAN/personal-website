import { getEmployers } from "@/content/work";
import { DdiPage } from "@/ddi/pages/DdiPage";
import { pageMetadata } from "@/ddi/pages/metadata";
import { PAGES } from "@/ddi/pages/registry";
import { workScreens } from "@/ddi/pages/work";
import { SITE_NAME } from "@/lib/site";
import { SemanticPage } from "@/semantic/SemanticPage";
import { WorkSemantic } from "@/semantic/WorkSemantic";

const DESCRIPTION = `The work history of ${SITE_NAME}: employers, roles and highlights.`;

export const metadata = pageMetadata("work", DESCRIPTION);

export default async function WorkPage(): Promise<React.JSX.Element> {
  const employers = await getEmployers();
  return (
    <DdiPage
      screens={workScreens(employers)}
      semantic={
        <SemanticPage heading={PAGES.work.label}>
          <p>{DESCRIPTION}</p>
          <WorkSemantic employers={employers} />
        </SemanticPage>
      }
    />
  );
}
