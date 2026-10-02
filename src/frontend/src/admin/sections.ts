import { PAGES, type PageId } from "@/ddi/pages/registry";
import type { SectionId } from "./api";

export type SectionGroup = "Site content" | "DDI showcase";

export interface SectionInfo {
  id: SectionId;
  label: string;
  group: SectionGroup;
  /** The public page that shows the section, for "View live". */
  page: PageId;
}

/** The sidebar, in order. Every section is edited with the schema-driven form. */
export const SECTIONS: readonly SectionInfo[] = [
  { id: "profile", label: "About", group: "Site content", page: "about" },
  { id: "resume", label: "Resume", group: "Site content", page: "resume" },
  { id: "work", label: "Work", group: "Site content", page: "work" },
  {
    id: "projects",
    label: "Projects",
    group: "Site content",
    page: "projects",
  },
  { id: "contact", label: "Contact", group: "Site content", page: "contact" },
  { id: "links", label: "Links", group: "Site content", page: "links" },
  { id: "bit", label: "BIT", group: "DDI showcase", page: "bit" },
  { id: "fuel", label: "FUEL", group: "DDI showcase", page: "fuel" },
  { id: "fcs", label: "FCS", group: "DDI showcase", page: "fcs" },
  { id: "checklist", label: "CHKLST", group: "DDI showcase", page: "chklst" },
  {
    id: "server",
    label: "ENG / server",
    group: "DDI showcase",
    page: "server",
  },
  { id: "radar", label: "Radar", group: "DDI showcase", page: "radar" },
  { id: "mumi", label: "MUMI", group: "DDI showcase", page: "mumi" },
];

export const SECTION_GROUPS: readonly SectionGroup[] = [
  "Site content",
  "DDI showcase",
];

export function sectionInfo(id: SectionId): SectionInfo {
  const info = SECTIONS.find((section) => section.id === id);
  if (info === undefined) {
    throw new Error(`no section ${id}`);
  }
  return info;
}

export function livePath(section: SectionInfo): string {
  return PAGES[section.page].path;
}

export function isSectionId(value: string): value is SectionId {
  return SECTIONS.some((section) => section.id === value);
}
