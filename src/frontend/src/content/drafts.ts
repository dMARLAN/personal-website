import type { components } from "@/lib/api/schema";
import type { ApiSiteContent } from "./adapt";

/** `GET /api/admin/drafts`: the stored draft of each section that has one. */
export type ApiDrafts = components["schemas"]["Drafts"];

/** The content a draft-mode page renders: each section's stored draft where it has one, else its published document. */
export function withDrafts(
  live: ApiSiteContent,
  drafts: ApiDrafts,
): ApiSiteContent {
  return {
    profile: drafts.profile?.content ?? live.profile,
    resume: drafts.resume?.content ?? live.resume,
    work: drafts.work?.content ?? live.work,
    projects: drafts.projects?.content ?? live.projects,
    contact: drafts.contact?.content ?? live.contact,
    links: drafts.links?.content ?? live.links,
    server: drafts.server?.content ?? live.server,
    fuel: drafts.fuel?.content ?? live.fuel,
    fcs: drafts.fcs?.content ?? live.fcs,
    checklist: drafts.checklist?.content ?? live.checklist,
    bit: drafts.bit?.content ?? live.bit,
    radar: drafts.radar?.content ?? live.radar,
    mumi: drafts.mumi?.content ?? live.mumi,
  };
}
