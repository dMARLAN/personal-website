import { getSiteContent } from "./source";
import type { MissionData } from "./types";

/** /mumi → MUMI; the site's deployment as fake mission data. */
export async function getMissionData(): Promise<MissionData> {
  return (await getSiteContent()).mumi;
}
