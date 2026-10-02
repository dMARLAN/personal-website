import { RESUME } from "./resume";
import type { LinkEntry } from "./types";

// PLACEHOLDER: example.com links stand in until Chad lists the real ones (design section 18). The resume link is
// the site's own PDF.
export const LINKS: readonly LinkEntry[] = [
  { name: "GitHub", tag: "CODE", url: "https://example.com/github" },
  { name: "LinkedIn", tag: "WORK", url: "https://example.com/linkedin" },
  { name: "Resume", tag: "PDF", url: RESUME.pdfPath },
  { name: "Blog", tag: "TEXT", url: "https://example.com/blog" },
  { name: "Mastodon", tag: "SOCIAL", url: "https://example.com/mastodon" },
];
