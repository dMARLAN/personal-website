import { getSiteContent } from "./source";
import type { Resume } from "./types";

/** The résumé PDF. The API serves it (`GET /api/resume.pdf`); the admin uploads it separately from the text. */
export const RESUME_PDF_URL = "/api/resume.pdf";

/** Resume → S/W CONFIGURATION. */
export async function getResume(): Promise<Resume> {
  return (await getSiteContent()).resume;
}
