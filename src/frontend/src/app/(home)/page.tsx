import type { Metadata } from "next";
import { CONTACT } from "@/content/contact";
import { LINKS } from "@/content/links";
import { PROFILE } from "@/content/profile";
import { RESUME } from "@/content/resume";
import { EMPLOYERS } from "@/content/work";
import { PAGES } from "@/ddi/pages/registry";
import { HomePage } from "@/home/HomePage";
import { currentPosition, inlineJson, personJsonLd } from "@/home/model";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = `${SITE_NAME} · ${currentPosition(EMPLOYERS).title}`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: PROFILE.bio,
  alternates: { canonical: PAGES.home.path },
  openGraph: {
    type: "profile",
    url: PAGES.home.path,
    siteName: SITE_NAME,
    title: TITLE,
    description: PROFILE.bio,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: PROFILE.bio,
  },
};

const PERSON = personJsonLd({
  name: SITE_NAME,
  siteUrl: SITE_URL,
  profile: PROFILE,
  employers: EMPLOYERS,
  resume: RESUME,
  contact: CONTACT,
  links: LINKS,
});

export default function Home(): React.JSX.Element {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: inlineJson(PERSON) }}
      />
      <HomePage />
    </>
  );
}
