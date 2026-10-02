import { getSiteContent } from "./source";
import type { Bit } from "./types";

/** /bit → BIT; mock checks. */
export async function getBit(): Promise<Bit> {
  return (await getSiteContent()).bit;
}
