import { getSiteContent } from "./source";
import type { Projects } from "./types";

/** Projects → STORES: categories and projects. */
export async function getProjects(): Promise<Projects> {
  return (await getSiteContent()).projects;
}
