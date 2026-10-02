import { getSiteContent } from "./source";
import type { Checklist } from "./types";

/** /chklst → CHKLST. */
export async function getChecklist(): Promise<Checklist> {
  return (await getSiteContent()).checklist;
}
