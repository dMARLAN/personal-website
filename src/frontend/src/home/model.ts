import type {
  Contact,
  Employer,
  LabelValue,
  LinkEntry,
  Profile,
  Project,
  ProjectCategory,
  ProjectLink,
  ProjectStatus,
  Resume,
} from "@/content/types";

/**
 * What the standard homepage derives from the content modules. Everything here is a pure function of their exports,
 * so the homepage never holds content of its own and follows wherever the modules get their data.
 */

export interface Position {
  title: string;
  employer: string;
}

/** The newest role at the newest employer: both lists are newest first (content/types.ts). */
export function currentPosition(employers: readonly Employer[]): Position {
  const [employer] = employers;
  if (employer === undefined) {
    throw new Error("the work history has no employers");
  }
  const [role] = employer.roles;
  if (role === undefined) {
    throw new Error(`${employer.name} has no roles`);
  }
  return { title: role.title, employer: employer.name };
}

/** The year a span such as "2019-2023" or "2021-NOW" starts. */
export function spanStartYear(span: string): number {
  const match = /^(\d{4})/.exec(span);
  if (match === null) {
    throw new Error(`span "${span}" does not start with a year`);
  }
  return Number(match[1]);
}

/** Whole years since the earliest employer's span starts. */
export function yearsOfExperience(
  employers: readonly Employer[],
  today: Date,
): number {
  if (employers.length === 0) {
    throw new Error("the work history has no employers");
  }
  const start = Math.min(
    ...employers.map((employer) => spanStartYear(employer.span)),
  );
  return today.getFullYear() - start;
}

/** A role span as prose: "2021-NOW" reads "2021 – Present". */
export function formatSpan(span: string): string {
  return span.replace("-", " – ").replace("NOW", "Present");
}

/** The DCS status words as a recruiter reads them. */
export const PROJECT_STATUS: Readonly<
  Record<ProjectStatus, { label: string; tone: "live" | "idle" | "warn" }>
> = {
  RDY: { label: "Active", tone: "live" },
  STBY: { label: "Paused", tone: "idle" },
  DEGD: { label: "Partly working", tone: "warn" },
  HUNG: { label: "On hold", tone: "warn" },
};

export function categoryName(
  categories: readonly ProjectCategory[],
  legend: string,
): string {
  const category = categories.find((candidate) => candidate.legend === legend);
  if (category === undefined) {
    throw new Error(`no project category "${legend}"`);
  }
  return category.name;
}

export function projectLinkLabel(link: ProjectLink): string {
  return link.kind === "REPO" ? "Source" : "Live demo";
}

/** A project's facts, both PROG columns, for the card's spec line. */
export function projectFacts(project: Project): LabelValue[] {
  return [...project.fields.left, ...project.fields.right];
}

/** A DDI label such as "LOCATION:" without its colon. */
export function plainLabel(label: string): string {
  return label.replace(/:$/, "");
}

/** Links that leave the site: the profiles a person schema can list as `sameAs`. */
export function externalLinks(links: readonly LinkEntry[]): LinkEntry[] {
  return links.filter((link) => /^https?:\/\//.test(link.url));
}

/** The initials of a name, for the header monogram. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => word !== "")
    .map((word) => word[0].toUpperCase())
    .join("");
}

export interface PersonInput {
  name: string;
  siteUrl: string;
  profile: Profile;
  employers: readonly Employer[];
  resume: Resume;
  contact: Contact;
  links: readonly LinkEntry[];
}

/** schema.org `Person` JSON-LD (https://schema.org/Person). */
export interface PersonSchema {
  "@context": "https://schema.org";
  "@type": "Person";
  name: string;
  url: string;
  jobTitle: string;
  worksFor: { "@type": "Organization"; name: string };
  description: string;
  email: string;
  knowsAbout: string[];
  sameAs: string[];
}

export function personJsonLd({
  name,
  siteUrl,
  profile,
  employers,
  resume,
  contact,
  links,
}: PersonInput): PersonSchema {
  const position = currentPosition(employers);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: siteUrl,
    jobTitle: position.title,
    worksFor: { "@type": "Organization", name: position.employer },
    description: profile.bio,
    email: `mailto:${contact.email}`,
    knowsAbout: resume.left.rows.map((row) => row.name),
    sameAs: externalLinks(links).map((link) => link.url),
  };
}

/** JSON for an inline `<script>`: `<` is escaped so content can never close the script element. */
export function inlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
