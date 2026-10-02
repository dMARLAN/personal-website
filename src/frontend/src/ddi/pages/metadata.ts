import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { PAGES, type PageId } from "./registry";

/**
 * A DDI route's title, description, canonical URL and OpenGraph card. The DDI layout's title template appends
 * `SITE_NAME` to the title; the OpenGraph title spells it out, since templates do not apply there.
 */
export function pageMetadata(id: PageId, description: string): Metadata {
  const page = PAGES[id];
  return {
    title: page.label,
    description,
    alternates: { canonical: page.path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${page.label} · ${SITE_NAME}`,
      description,
      url: page.path,
    },
  };
}
