import { getChecklist } from "@/content/checklist";
import { DdiPage } from "@/ddi/pages/DdiPage";
import { chklstScreens } from "@/ddi/pages/chklst";
import { pageMetadata } from "@/ddi/pages/metadata";
import { PAGES } from "@/ddi/pages/registry";
import { ChecklistSemantic } from "@/semantic/ChecklistSemantic";
import { SemanticPage } from "@/semantic/SemanticPage";

export const metadata = pageMetadata(
  "chklst",
  "The Hornet's checklist page, as a pre-flight checklist for a software engineer's day.",
);

export default async function ChecklistPage(): Promise<React.JSX.Element> {
  const checklist = await getChecklist();
  return (
    <DdiPage
      screens={chklstScreens(checklist)}
      semantic={
        <SemanticPage heading={PAGES.chklst.label}>
          <ChecklistSemantic checklist={checklist} />
        </SemanticPage>
      }
    />
  );
}
