import { getProfile } from "@/content/profile";
import { aboutScreens } from "@/ddi/pages/about";
import { DdiPage } from "@/ddi/pages/DdiPage";
import { pageMetadata } from "@/ddi/pages/metadata";
import { PAGES } from "@/ddi/pages/registry";
import { SITE_NAME } from "@/lib/site";
import { AboutSemantic } from "@/semantic/AboutSemantic";
import { SemanticPage } from "@/semantic/SemanticPage";

export const metadata = pageMetadata(
  "about",
  `Who ${SITE_NAME} is, drawn as an F/A-18C target data card.`,
);

export default async function AboutPage(): Promise<React.JSX.Element> {
  const profile = await getProfile();
  return (
    <DdiPage
      screens={aboutScreens(profile)}
      semantic={
        <SemanticPage heading={PAGES.about.label}>
          <AboutSemantic profile={profile} />
        </SemanticPage>
      }
    />
  );
}
