import { getRadarScene } from "@/content/radar";
import { DdiPage } from "@/ddi/pages/DdiPage";
import { pageMetadata } from "@/ddi/pages/metadata";
import { PAGES } from "@/ddi/pages/registry";
import { radarScreens } from "@/ddi/pages/radar/screens";
import { RadarSemantic } from "@/semantic/RadarSemantic";
import { SemanticPage } from "@/semantic/SemanticPage";

export const metadata = pageMetadata(
  "radar",
  "A simulated F/A-18C attack radar (RDR ATTK) in range-while-search and track-while-scan modes, with moving fake contacts.",
);

export default async function RadarPage(): Promise<React.JSX.Element> {
  const scene = await getRadarScene();
  return (
    <DdiPage
      screens={radarScreens(scene)}
      semantic={
        <SemanticPage heading={PAGES.radar.label}>
          <RadarSemantic scene={scene} />
        </SemanticPage>
      }
    />
  );
}
