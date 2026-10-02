import { getSiteContent } from "./source";
import type { RadarScene } from "./types";

/** /radar → RDR ATTK; fake contacts. */
export async function getRadarScene(): Promise<RadarScene> {
  return (await getSiteContent()).radar;
}
