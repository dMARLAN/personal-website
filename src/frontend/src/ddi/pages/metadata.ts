import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { PAGES, type PageId } from "./registry";

/** A route's title, description and canonical URL. The root layout's title template appends `SITE_NAME`. */
export function pageMetadata(id: PageId, description: string): Metadata {
  const page = PAGES[id];
  return {
    title: id === "menu" ? { absolute: SITE_NAME } : page.label,
    description,
    alternates: { canonical: page.path },
  };
}
