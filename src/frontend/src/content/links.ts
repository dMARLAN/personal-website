import { getSiteContent } from "./source";
import type { LinkEntry } from "./types";

/** Links → UFC BU. The API stores them as `links.links`. */
export async function getLinks(): Promise<readonly LinkEntry[]> {
  return (await getSiteContent()).links;
}
