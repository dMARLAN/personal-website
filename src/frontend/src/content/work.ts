import { getSiteContent } from "./source";
import type { Employer } from "./types";

/** Work → the tabbed BIT layout, newest employer first. The API stores them as `work.employers`. */
export async function getEmployers(): Promise<readonly Employer[]> {
  return (await getSiteContent()).employers;
}
