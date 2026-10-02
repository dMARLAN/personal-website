import type { Metadata } from "next";
import { getSiteContent } from "@/content/source";
import { PAGES } from "@/ddi/pages/registry";
import { HomePage } from "@/home/HomePage";
import { currentPosition, inlineJson, personJsonLd } from "@/home/model";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { profile, employers } = await getSiteContent();
  const title = `${SITE_NAME} · ${currentPosition(employers).title}`;
  return {
    title: { absolute: title },
    description: profile.bio,
    alternates: { canonical: PAGES.home.path },
    openGraph: {
      type: "profile",
      url: PAGES.home.path,
      siteName: SITE_NAME,
      title,
      description: profile.bio,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: profile.bio,
    },
  };
}

export default async function Home(): Promise<React.JSX.Element> {
  const content = await getSiteContent();
  const person = personJsonLd({
    name: SITE_NAME,
    siteUrl: SITE_URL,
    profile: content.profile,
    employers: content.employers,
    resume: content.resume,
    contact: content.contact,
    links: content.links,
  });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: inlineJson(person) }}
      />
      <HomePage content={content} />
    </>
  );
}
