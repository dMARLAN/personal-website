import { getContact } from "@/content/contact";
import { contactScreens } from "@/ddi/pages/contact";
import { DdiPage } from "@/ddi/pages/DdiPage";
import { pageMetadata } from "@/ddi/pages/metadata";
import { PAGES } from "@/ddi/pages/registry";
import { SITE_NAME } from "@/lib/site";
import { ContactSemantic } from "@/semantic/ContactSemantic";
import { SemanticPage } from "@/semantic/SemanticPage";

export const metadata = pageMetadata("contact", `How to reach ${SITE_NAME}.`);

export default async function ContactPage(): Promise<React.JSX.Element> {
  const contact = await getContact();
  return (
    <DdiPage
      screens={contactScreens(contact)}
      semantic={
        <SemanticPage heading={PAGES.contact.label}>
          <ContactSemantic contact={contact} />
        </SemanticPage>
      }
    />
  );
}
