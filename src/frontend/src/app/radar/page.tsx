import { RADAR_SCENE } from "@/content/radar";
import { DdiPage } from "@/ddi/pages/DdiPage";
import { pageMetadata } from "@/ddi/pages/metadata";
import { PAGES } from "@/ddi/pages/registry";
import { radarScreens } from "@/ddi/pages/radar/screens";
import { RadarSemantic } from "@/semantic/RadarSemantic";
import { SemanticPage } from "@/semantic/SemanticPage";

export const metadata = pageMetadata(
  "radar",
  "A simulated F/A-18C attack radar (RDR ATTK) in range-while-search mode, with moving fake contacts.",
);

export default function RadarPage(): React.JSX.Element {
  return (
    <DdiPage
      screens={radarScreens(RADAR_SCENE)}
      semantic={
        <SemanticPage heading={PAGES.radar.label}>
          <RadarSemantic scene={RADAR_SCENE} />
        </SemanticPage>
      }
    />
  );
}
