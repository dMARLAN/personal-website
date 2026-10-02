import type { Resume } from "./types";

// PLACEHOLDER: every row below is a stand-in until Chad writes the real resume (design section 18). The PDF in
// public/resume.pdf is a placeholder too.
export const RESUME: Resume = {
  title: ["S/W CONFIGURATION", "PLACEHOLDER"],
  left: {
    heading: "Skills",
    rows: [
      { name: "Python", value: "Expert 10 yr" },
      { name: "TS", value: "Advanced 7 yr" },
      { name: "Go", value: "Working 3 yr" },
      { name: "SQL", value: "Advanced 9 yr" },
      { name: "React", value: "Advanced 6 yr" },
      { name: "APIs", value: "Expert 9 yr" },
      { name: "K8s", value: "Advanced 5 yr" },
      { name: "AWS", value: "Advanced 7 yr" },
      { name: "Docker", value: "Expert 8 yr" },
      { name: "Linux", value: "Expert 12 yr" },
      { name: "CI/CD", value: "Advanced 7 yr" },
      { name: "LLM", value: "Working 2 yr" },
    ],
  },
  right: {
    heading: "Qualifications",
    rows: [
      { name: "Degree", value: "BS Comp Sci" },
      { name: "School", value: "Placeholder" },
      { name: "Grad", value: "2014" },
      { name: "Cert", value: "AWS SA Pro" },
      { name: "Cert", value: "CKA" },
      { name: "Lead", value: "Team of 6" },
      { name: "Domain", value: "Platforms" },
      { name: "Domain", value: "Data eng" },
      { name: "Domain", value: "Dev tools" },
      { name: "Remote", value: "Yes" },
      { name: "Langs", value: "English" },
      { name: "Hobby", value: "DCS F/A-18C" },
    ],
  },
  pdfPath: "/resume.pdf",
};
