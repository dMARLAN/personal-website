import { getSiteContent } from "./source";
import type { FlightControls } from "./types";

/** /fcs → FCS; fake data. */
export async function getFlightControls(): Promise<FlightControls> {
  return (await getSiteContent()).fcs;
}
