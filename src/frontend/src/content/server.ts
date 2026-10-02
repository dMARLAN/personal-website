import { getSiteContent } from "./source";
import type { ServerStats } from "./types";

/** /server → ENG; fake hosts and readings. */
export async function getServerStats(): Promise<ServerStats> {
  return (await getSiteContent()).server;
}
