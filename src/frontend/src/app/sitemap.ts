import type { MetadataRoute } from "next";
import { ALL_PAGES } from "@/ddi/pages/registry";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ALL_PAGES.filter((page) => page.available).map((page) => ({
    url: new URL(page.path, SITE_URL).toString(),
  }));
}
