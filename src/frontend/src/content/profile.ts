import { getSiteContent } from "./source";
import type { Profile } from "./types";

/** About → TGT DATA OWNSHIP. */
export async function getProfile(): Promise<Profile> {
  return (await getSiteContent()).profile;
}
