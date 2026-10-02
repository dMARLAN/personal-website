import { FLIGHT_CONTROLS } from "@/content/fcs";
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

export default function FcsPage(): React.JSX.Element {
  return (
    <DdiPage
      screens={fcsScreens()}
      semantic={
        <SemanticPage heading={PAGES.fcs.label}>
          <FcsSemantic controls={FLIGHT_CONTROLS} />
        </SemanticPage>
      }
    />
  );
}
