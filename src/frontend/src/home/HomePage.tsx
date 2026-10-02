import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Download,
  Gauge,
  Mail,
} from "lucide-react";
import { RESUME_PDF_URL } from "@/content/resume";
import type { LabelValue, SiteContent } from "@/content/types";
import { PAGES, type PageId } from "@/ddi/pages/registry";
import { SITE_NAME } from "@/lib/site";
import { ThemeToggleButton } from "@/theme/ThemeToggle";
import { DdiPreview } from "./DdiPreview";
import {
  PROJECT_STATUS,
  categoryName,
  currentPosition,
  formatSpan,
  initials,
  plainLabel,
  projectFacts,
  projectLinkLabel,
  yearsOfExperience,
} from "./model";
import { StrokeLabel } from "./StrokeLabel";

const DDI_PATH = PAGES.menu.path;

/** The homepage's sections, each with the DDI page that shows the same content. */
const SECTIONS = {
  experience: { title: "Experience", ddi: "work" },
  projects: { title: "Projects", ddi: "projects" },
  skills: { title: "Skills", ddi: "resume" },
  contact: { title: "Contact", ddi: "contact" },
} as const satisfies Record<string, { title: string; ddi: PageId }>;

type SectionId = keyof typeof SECTIONS;

const SECTION_ORDER: readonly SectionId[] = [
  "experience",
  "projects",
  "skills",
  "contact",
];

/** The DDI menu legend that opens a section's page, for example "PB7 WORK". */
interface ContentProps {
  content: SiteContent;
}

function legendOf(id: PageId): string {
  const { menu } = PAGES[id];
  if (menu === undefined) {
    throw new Error(`${id} has no menu legend`);
  }
  return `PB${menu.pb} ${menu.legend.join(" ")}`;
}

function SiteHeader(): React.JSX.Element {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href="#top" aria-label={SITE_NAME}>
          <span className="brand-mark" aria-hidden="true">
            {initials(SITE_NAME)}
          </span>
          <span className="brand-name">{SITE_NAME}</span>
        </a>
        <nav className="site-nav" aria-label="Sections">
          <ul>
            {SECTION_ORDER.map((id) => (
              <li key={id}>
                <a href={`#${id}`}>{SECTIONS[id].title}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-actions">
          <a className="button button-outline button-small" href={DDI_PATH}>
            <Gauge aria-hidden="true" />
            Launch DDI
          </a>
          <ThemeToggleButton className="icon-button" />
        </div>
      </div>
    </header>
  );
}

function DdiCard(): React.JSX.Element {
  return (
    <aside className="ddi-card" aria-labelledby="ddi-card-title">
      <div className="ddi-card-screen">
        <DdiPreview />
      </div>
      <div className="ddi-card-body">
        <StrokeLabel text="COCKPIT MODE" />
        <h2 id="ddi-card-title">Explore it from the cockpit</h2>
        <p>
          The same site, drawn as a working F/A-18C Hornet display. Navigate
          with the bezel buttons, just like the real jet.
        </p>
        <a className="button button-accent ddi-card-link" href={DDI_PATH}>
          Enter cockpit mode
          <ArrowRight aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}

function Hero({ content }: ContentProps): React.JSX.Element {
  const position = currentPosition(content.employers);
  const stats: LabelValue[] = [
    {
      value: String(yearsOfExperience(content.employers, new Date())),
      label: "Years in software",
    },
    { value: String(content.employers.length), label: "Companies" },
    { value: String(content.projects.projects.length), label: "Projects" },
  ];
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-copy">
          <h1 id="hero-title">{SITE_NAME}</h1>
          <p className="hero-role">
            {position.title} at <strong>{position.employer}</strong>
          </p>
          <p className="hero-bio">{content.profile.bio}</p>
          <div className="hero-actions">
            <a className="button button-primary" href={RESUME_PDF_URL}>
              <Download aria-hidden="true" />
              Download résumé
            </a>
            <a className="button button-outline" href="#contact">
              <Mail aria-hidden="true" />
              Get in touch
            </a>
          </div>
          <dl className="hero-stats">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <DdiCard />
      </div>
    </section>
  );
}

function SectionHeader({ id }: { id: SectionId }): React.JSX.Element {
  const { title, ddi } = SECTIONS[id];
  return (
    <div className="section-header">
      <div>
        <StrokeLabel text={legendOf(ddi)} />
        <h2 id={`${id}-title`}>{title}</h2>
      </div>
      <a
        className="section-ddi-link"
        href={PAGES[ddi].path}
        aria-label={`Open in the DDI: ${title}`}
      >
        Open in the DDI
        <ArrowUpRight aria-hidden="true" />
      </a>
    </div>
  );
}

function Experience({ content }: ContentProps): React.JSX.Element {
  return (
    <section
      id="experience"
      className="section"
      aria-labelledby="experience-title"
    >
      <div className="container">
        <SectionHeader id="experience" />
        <ol className="timeline">
          {content.employers.map((employer, index) => (
            <li
              key={employer.id}
              className="timeline-item"
              data-current={index === 0 ? "" : undefined}
            >
              <div className="timeline-meta">
                <h3>{employer.name}</h3>
                <p className="timeline-span">{formatSpan(employer.span)}</p>
                <p className="timeline-location">{employer.location}</p>
              </div>
              <ol className="roles">
                {employer.roles.map((role) => (
                  <li key={`${role.title}-${role.span}`} className="role">
                    <div className="role-header">
                      <h4>{role.title}</h4>
                      <span className="role-span">{formatSpan(role.span)}</span>
                    </div>
                    <ul className="role-bullets">
                      {role.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Projects({ content }: ContentProps): React.JSX.Element {
  return (
    <section id="projects" className="section" aria-labelledby="projects-title">
      <div className="container">
        <SectionHeader id="projects" />
        <ul className="project-grid">
          {content.projects.projects.map((project) => {
            const status = PROJECT_STATUS[project.status];
            return (
              <li key={project.slug}>
                <article className="project-card">
                  <div className="project-meta">
                    <span className="chip">
                      {categoryName(
                        content.projects.categories,
                        project.category,
                      )}
                    </span>
                    <span className="project-status" data-tone={status.tone}>
                      <span className="status-dot" aria-hidden="true" />
                      {status.label}
                    </span>
                  </div>
                  <h3>{project.name}</h3>
                  <p className="project-description">{project.description}</p>
                  <dl className="project-facts">
                    {projectFacts(project).map((fact) => (
                      <div key={fact.label}>
                        <dt>{fact.label}</dt>
                        <dd>{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {project.links.length > 0 && (
                    <ul className="project-links">
                      {project.links.map((link) => (
                        <li key={link.kind}>
                          <a
                            href={link.url}
                            aria-label={`${projectLinkLabel(link)} for ${project.name}`}
                          >
                            {projectLinkLabel(link)}
                            <ArrowUpRight aria-hidden="true" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function SpecTable({
  heading,
  rows,
}: {
  heading: string;
  rows: readonly { name: string; value: string }[];
}): React.JSX.Element {
  return (
    <div className="spec-panel">
      <h3>{heading}</h3>
      <dl className="spec-list">
        {rows.map((row, index) => (
          <div key={`${row.name}-${index}`}>
            <dt>{row.name}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Skills({ content }: ContentProps): React.JSX.Element {
  return (
    <section id="skills" className="section" aria-labelledby="skills-title">
      <div className="container">
        <SectionHeader id="skills" />
        <div className="spec-grid">
          <SpecTable
            heading={content.resume.left.heading}
            rows={content.resume.left.rows}
          />
          <SpecTable
            heading={content.resume.right.heading}
            rows={content.resume.right.rows}
          />
        </div>
      </div>
    </section>
  );
}

function Contact({ content }: ContentProps): React.JSX.Element {
  return (
    <section id="contact" className="section" aria-labelledby="contact-title">
      <div className="container">
        <SectionHeader id="contact" />
        <div className="contact-card">
          <div className="contact-main">
            <p className="contact-label">Email</p>
            <a
              className="contact-email"
              href={`mailto:${content.contact.email}`}
            >
              {content.contact.email}
            </a>
            <div className="contact-actions">
              <a
                className="button button-primary"
                href={`mailto:${content.contact.email}`}
              >
                <Mail aria-hidden="true" />
                Send an email
              </a>
              <a className="button button-outline" href={RESUME_PDF_URL}>
                <Download aria-hidden="true" />
                Résumé (PDF)
              </a>
            </div>
            <dl className="contact-facts">
              {content.contact.rows.map((row) => (
                <div key={row.label}>
                  <dt>{plainLabel(row.label)}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="contact-links">
            <h3>Elsewhere</h3>
            <ul>
              {content.links.map((link) => (
                <li key={link.url}>
                  <a href={link.url}>
                    <span className="contact-link-name">{link.name}</span>
                    <span className="contact-link-tag">{link.tag}</span>
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter(): React.JSX.Element {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p>
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
        <ul>
          <li>
            <a href={RESUME_PDF_URL}>Résumé</a>
          </li>
          <li>
            <a href={DDI_PATH}>Cockpit mode</a>
          </li>
          <li>
            <a href="#top">
              Back to top
              <ArrowUp aria-hidden="true" />
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}

/**
 * The standard homepage at `/`: a conventional single page for recruiters, read only from the content modules. The
 * DDI lives at `/ddi`; the header and the hero card link to it.
 */
export function HomePage({ content }: ContentProps): React.JSX.Element {
  return (
    <div className="home" id="top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero content={content} />
        <Experience content={content} />
        <Projects content={content} />
        <Skills content={content} />
        <Contact content={content} />
      </main>
      <SiteFooter />
    </div>
  );
}
