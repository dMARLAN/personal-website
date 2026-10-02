import { getSiteContent } from "./source";
import type { FuelReserves } from "./types";

/** /fuel → FUEL; fake reserves. */
export async function getFuelReserves(): Promise<FuelReserves> {
  return (await getSiteContent()).fuel;
}
