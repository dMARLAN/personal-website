import { getResume } from "@/content/resume";
import { DdiPage } from "@/ddi/pages/DdiPage";
import { pageMetadata } from "@/ddi/pages/metadata";
import { PAGES } from "@/ddi/pages/registry";
import { resumeScreens } from "@/ddi/pages/resume";
import { SITE_NAME } from "@/lib/site";
import { ResumeSemantic } from "@/semantic/ResumeSemantic";
import { SemanticPage } from "@/semantic/SemanticPage";

const DESCRIPTION = `Skills and qualifications of ${SITE_NAME}, with the resume as a PDF.`;

export const metadata = pageMetadata("resume", DESCRIPTION);

export default async function ResumePage(): Promise<React.JSX.Element> {
  const resume = await getResume();
  return (
    <DdiPage
      screens={resumeScreens(resume)}
      semantic={
        <SemanticPage heading={PAGES.resume.label}>
          <p>{DESCRIPTION}</p>
          <ResumeSemantic resume={resume} />
        </SemanticPage>
      }
    />
  );
}
