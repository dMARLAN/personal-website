import { getSiteContent } from "./source";
import type { Contact } from "./types";

/** Contact → MIDS. */
export async function getContact(): Promise<Contact> {
  return (await getSiteContent()).contact;
}
