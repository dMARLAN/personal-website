import { PAGES, type PageId } from "@/ddi/pages/registry";
import type { SectionId } from "./api";

export interface SectionInfo {
  id: SectionId;
  label: string;
  /** The public page that shows the section, for "View live". */
  page: PageId;
  /** A form for the simple sections; the rest are edited as JSON. */
  editor: "form" | "json";
}

export const SECTIONS: readonly SectionInfo[] = [
  { id: "profile", label: "About (profile)", page: "about", editor: "form" },
  { id: "contact", label: "Contact", page: "contact", editor: "form" },
  { id: "links", label: "Links", page: "links", editor: "form" },
  { id: "resume", label: "Resume (text)", page: "resume", editor: "json" },
  { id: "work", label: "Work", page: "work", editor: "json" },
  { id: "projects", label: "Projects", page: "projects", editor: "json" },
  { id: "server", label: "Server", page: "server", editor: "json" },
  { id: "fuel", label: "Fuel", page: "fuel", editor: "json" },
  { id: "fcs", label: "FCS", page: "fcs", editor: "json" },
  { id: "checklist", label: "Checklist", page: "chklst", editor: "json" },
  { id: "bit", label: "BIT", page: "bit", editor: "json" },
  { id: "radar", label: "Radar", page: "radar", editor: "json" },
  { id: "mumi", label: "MUMI", page: "mumi", editor: "json" },
];

export function livePath(section: SectionInfo): string {
  return PAGES[section.page].path;
}
