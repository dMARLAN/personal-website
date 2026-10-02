import { getProjects } from "@/content/projects";
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

export default async function ProjectsPage(): Promise<React.JSX.Element> {
  const projects = await getProjects();
  return (
    <DdiPage
      screens={projectsScreens(projects)}
      semantic={
        <SemanticPage heading={PAGES.projects.label}>
          <ProjectsSemantic projects={projects} />
        </SemanticPage>
      }
    />
  );
}
