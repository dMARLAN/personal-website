import { getLinks } from "@/content/links";
import { DdiPage } from "@/ddi/pages/DdiPage";
import { linksScreens } from "@/ddi/pages/links";
import { pageMetadata } from "@/ddi/pages/metadata";
import { PAGES } from "@/ddi/pages/registry";
import { SITE_NAME } from "@/lib/site";
import { LinksSemantic } from "@/semantic/LinksSemantic";
import { SemanticPage } from "@/semantic/SemanticPage";

export const metadata = pageMetadata(
  "links",
  `${SITE_NAME} elsewhere on the web.`,
);

export default async function LinksPage(): Promise<React.JSX.Element> {
  const links = await getLinks();
  return (
    <DdiPage
      screens={linksScreens(links)}
      semantic={
        <SemanticPage heading={PAGES.links.label}>
          <LinksSemantic links={links} />
        </SemanticPage>
      }
    />
  );
}
