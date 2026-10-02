import { getFlightControls } from "@/content/fcs";
import { DdiPage } from "@/ddi/pages/DdiPage";
import { fcsScreens } from "@/ddi/pages/fcs";
import { pageMetadata } from "@/ddi/pages/metadata";
import { PAGES } from "@/ddi/pages/registry";
import { FcsSemantic } from "@/semantic/FcsSemantic";
import { SemanticPage } from "@/semantic/SemanticPage";

export const metadata = pageMetadata(
  "fcs",
  "The Hornet's flight control system page, with mock system-health data.",
);

export default async function FcsPage(): Promise<React.JSX.Element> {
  const controls = await getFlightControls();
  return (
    <DdiPage
      screens={fcsScreens(controls)}
      semantic={
        <SemanticPage heading={PAGES.fcs.label}>
          <FcsSemantic controls={controls} />
        </SemanticPage>
      }
    />
  );
}
