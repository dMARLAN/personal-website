import { PROFILE } from "@/content/profile";
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

export default function AboutPage(): React.JSX.Element {
  return (
    <DdiPage
      screens={aboutScreens(PROFILE)}
      semantic={
        <SemanticPage heading={PAGES.about.label}>
          <AboutSemantic profile={PROFILE} />
        </SemanticPage>
      }
    />
  );
}
