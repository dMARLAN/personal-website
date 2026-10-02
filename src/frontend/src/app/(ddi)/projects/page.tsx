import { DdiPage } from "@/ddi/pages/DdiPage";
import { pageMetadata } from "@/ddi/pages/metadata";
import { projectsScreens } from "@/ddi/pages/projects";
import { PAGES } from "@/ddi/pages/registry";
import { ProjectsSemantic } from "@/semantic/ProjectsSemantic";
import { SemanticPage } from "@/semantic/SemanticPage";

export const metadata = pageMetadata(
  "projects",
  "Side projects, loaded on the wing of an F/A-18C STORES page: one project per station.",
);

export default function ProjectsPage(): React.JSX.Element {
  return (
    <DdiPage
      screens={projectsScreens()}
      semantic={
        <SemanticPage heading={PAGES.projects.label}>
          <ProjectsSemantic />
        </SemanticPage>
      }
    />
  );
}
