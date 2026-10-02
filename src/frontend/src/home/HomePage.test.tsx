import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeLink } from "@/ddi/HomeLink";
import { SITE_NAME } from "@/lib/site";
import { HomePage } from "./HomePage";
import { RESUME_PDF_URL } from "@/content/resume";
import { SNAPSHOT_CONTENT } from "@/content/snapshot";

const CONTACT = SNAPSHOT_CONTENT.contact;
const LINKS = SNAPSHOT_CONTENT.links;
const PROFILE = SNAPSHOT_CONTENT.profile;
const PROJECTS = SNAPSHOT_CONTENT.projects.projects;
const RESUME = SNAPSHOT_CONTENT.resume;
const EMPLOYERS = SNAPSHOT_CONTENT.employers;

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the standard homepage", () => {
  it("has one h1, the site name, then a heading per section", () => {
    render(<HomePage content={SNAPSHOT_CONTENT} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      SITE_NAME,
    );
    for (const title of ["Experience", "Projects", "Skills", "Contact"]) {
      expect(
        screen.getByRole("heading", { level: 2, name: title }),
      ).toBeInTheDocument();
    }
  });

  it("offers the resume, contact and the DDI from the hero", () => {
    render(<HomePage content={SNAPSHOT_CONTENT} />);
    const hero = screen.getByRole("region", { name: SITE_NAME });
    expect(
      within(hero).getByRole("link", { name: "Download résumé" }),
    ).toHaveAttribute("href", RESUME_PDF_URL);
    expect(
      within(hero).getByRole("link", { name: "Get in touch" }),
    ).toHaveAttribute("href", "#contact");
    expect(
      within(hero).getByRole("link", { name: "Enter cockpit mode" }),
    ).toHaveAttribute("href", "/ddi");
    expect(screen.getByRole("link", { name: "Launch DDI" })).toHaveAttribute(
      "href",
      "/ddi",
    );
    expect(within(hero).getByText(PROFILE.bio)).toBeInTheDocument();
  });

  it("draws every employer, role, project, skill and link from the content modules", () => {
    render(<HomePage content={SNAPSHOT_CONTENT} />);
    for (const employer of EMPLOYERS) {
      expect(
        screen.getByRole("heading", { level: 3, name: employer.name }),
      ).toBeInTheDocument();
    }
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(
      EMPLOYERS.flatMap((employer) => employer.roles).length,
    );
    for (const project of PROJECTS) {
      expect(
        screen.getByRole("heading", { level: 3, name: project.name }),
      ).toBeInTheDocument();
    }
    for (const row of RESUME.left.rows) {
      expect(screen.getAllByText(row.name).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole("link", { name: CONTACT.email })).toHaveAttribute(
      "href",
      `mailto:${CONTACT.email}`,
    );
    for (const link of LINKS) {
      expect(
        screen.getByRole("link", { name: new RegExp(`^${link.name}`) }),
      ).toHaveAttribute("href", link.url);
    }
  });

  it("names each project link after its project", () => {
    render(<HomePage content={SNAPSHOT_CONTENT} />);
    const [project] = PROJECTS;
    expect(
      screen.getByRole("link", { name: `Source for ${project.name}` }),
    ).toBeInTheDocument();
  });

  it("has the theme toggle in the header", () => {
    render(<HomePage content={SNAPSHOT_CONTENT} />);
    expect(
      within(screen.getByRole("banner")).getByRole("button", {
        name: "Night mode",
      }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});

describe("the DDI's homepage link", () => {
  it("leads back to /", () => {
    render(<HomeLink />);
    expect(
      screen.getByRole("link", { name: "Exit to the standard homepage" }),
    ).toHaveAttribute("href", "/");
  });
});
