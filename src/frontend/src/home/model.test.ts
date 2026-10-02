import { describe, expect, it } from "vitest";
import type { Employer } from "@/content/types";
import {
  categoryName,
  currentPosition,
  externalLinks,
  formatSpan,
  initials,
  inlineJson,
  personJsonLd,
  plainLabel,
  spanStartYear,
  yearsOfExperience,
} from "./model";
import { RESUME_PDF_URL } from "@/content/resume";
import { SNAPSHOT_CONTENT } from "@/content/snapshot";

const CONTACT = SNAPSHOT_CONTENT.contact;
const LINKS = SNAPSHOT_CONTENT.links;
const PROFILE = SNAPSHOT_CONTENT.profile;
const PROJECT_CATEGORIES = SNAPSHOT_CONTENT.projects.categories;
const RESUME = SNAPSHOT_CONTENT.resume;
const EMPLOYERS = SNAPSHOT_CONTENT.employers;

function employer(span: string, roleTitles: string[]): Employer {
  return {
    id: span,
    tab: "TAB",
    name: `Employer ${span}`,
    location: "Remote",
    span,
    roles: roleTitles.map((title) => ({ title, span, bullets: [] })),
  };
}

describe("the homepage model", () => {
  it("takes the current position from the newest role at the newest employer", () => {
    expect(
      currentPosition([
        employer("2021-NOW", ["Staff", "Senior"]),
        employer("2018-2021", ["Junior"]),
      ]),
    ).toEqual({ title: "Staff", employer: "Employer 2021-NOW" });
    expect(currentPosition(EMPLOYERS).title).toBe(EMPLOYERS[0].roles[0].title);
  });

  it("fails clearly on an empty work history", () => {
    expect(() => currentPosition([])).toThrow("no employers");
    expect(() => currentPosition([employer("2020", [])])).toThrow("no roles");
  });

  it("counts years from the earliest employer's start", () => {
    const today = new Date(2026, 9, 2);
    expect(
      yearsOfExperience(
        [employer("2021-NOW", ["A"]), employer("2012-2014", ["B"])],
        today,
      ),
    ).toBe(14);
  });

  it("rejects a span that does not start with a year", () => {
    expect(spanStartYear("2019-2023")).toBe(2019);
    expect(() => spanStartYear("NOW")).toThrow("does not start with a year");
  });

  it("writes spans as prose", () => {
    expect(formatSpan("2021-NOW")).toBe("2021 – Present");
    expect(formatSpan("2012-2014")).toBe("2012 – 2014");
    expect(formatSpan("2014")).toBe("2014");
  });

  it("names every project category and fails on an unknown one", () => {
    expect(categoryName(PROJECT_CATEGORIES, "WEB")).toBe("Web");
    expect(() => categoryName(PROJECT_CATEGORIES, "NOPE")).toThrow("NOPE");
  });

  it("drops the DDI colon from labels", () => {
    expect(plainLabel("LOCATION:")).toBe("LOCATION");
    expect(plainLabel("TIME ZONE")).toBe("TIME ZONE");
  });

  it("keeps only off-site links as profiles", () => {
    expect(
      externalLinks([
        { name: "Code", tag: "CODE", url: "https://example.com/code" },
        { name: "Resume", tag: "PDF", url: "/api/resume.pdf" },
      ]).map((link) => link.name),
    ).toEqual(["Code"]);
  });

  it("makes initials from a name", () => {
    expect(initials("Ada  Lovelace")).toBe("AL");
  });

  it("builds a schema.org Person from the content modules", () => {
    const person = personJsonLd({
      name: "Ada Lovelace",
      siteUrl: "https://example.org",
      profile: PROFILE,
      employers: EMPLOYERS,
      resume: RESUME,
      contact: CONTACT,
      links: LINKS,
    });
    expect(person).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Ada Lovelace",
      url: "https://example.org",
      jobTitle: EMPLOYERS[0].roles[0].title,
      worksFor: { "@type": "Organization", name: EMPLOYERS[0].name },
      description: PROFILE.bio,
      email: `mailto:${CONTACT.email}`,
    });
    expect(person.knowsAbout).toEqual(RESUME.left.rows.map((row) => row.name));
    expect(person.sameAs).not.toContain(RESUME_PDF_URL);
  });

  it("escapes < so inline JSON cannot close its script", () => {
    const json = inlineJson({ bio: "</script><script>alert(1)" });
    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toEqual({ bio: "</script><script>alert(1)" });
  });
});
