import { Fragment } from "react";
import { PROJECT_CATEGORIES, PROJECTS } from "@/content/projects";
import type { ProjectStatus, ProjectStore } from "@/content/types";
import { projectsByCategory } from "@/ddi/pages/projects";

/** The DCS status words in plain English. */
const STATUS_TEXT: Readonly<Record<ProjectStatus, string>> = {
  RDY: "Ready: live and maintained",
  STBY: "Standby: paused",
  DEGD: "Degraded: runs, but partly broken",
  HUNG: "Hung: stuck until a dependency changes",
};

function storeText(store: ProjectStore): string {
  switch (store.kind) {
    case "missile":
      return "One missile";
    case "pair":
      return "A pair of missiles";
    case "rack":
      return `A rack of ${store.amount}`;
    case "tank":
      return "A tank";
  }
}

/**
 * Every project as real HTML (design section 10.2). The glass shows one selected station and either its PROG block
 * or its DATA sublevel; these are in-section state with no URL, so this lists every project's content in full.
 */
export function ProjectsSemantic(): React.JSX.Element {
  return (
    <>
      <p>
        Projects drawn as stores on the F/A-18C STORES page: each station on the
        wing carries one project.
      </p>
      {[...projectsByCategory(PROJECTS, PROJECT_CATEGORIES)].map(
        ([category, projects]) => (
          <section key={category.legend}>
            <h2>{category.name}</h2>
            {projects.map((project) => (
              <article key={project.slug}>
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                <dl>
                  <dt>Code</dt>
                  <dd>{project.code}</dd>
                  <dt>Status</dt>
                  <dd>{STATUS_TEXT[project.status]}</dd>
                  <dt>Station</dt>
                  <dd>
                    {project.station} ({storeText(project.store)})
                  </dd>
                  {[...project.fields.left, ...project.fields.right].map(
                    ({ label, value }) => (
                      <Fragment key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </Fragment>
                    ),
                  )}
                </dl>
                {project.links.length > 0 && (
                  <ul>
                    {project.links.map((link) => (
                      <li key={link.kind}>
                        <a href={link.url}>
                          {project.name}{" "}
                          {link.kind === "REPO" ? "repository" : "demo"}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </section>
        ),
      )}
    </>
  );
}
