import { DdiPage } from "@/ddi/pages/DdiPage";
import { pageMetadata } from "@/ddi/pages/metadata";
import { PAGES } from "@/ddi/pages/registry";
import { serverScreens } from "@/ddi/pages/server/screens";
import { SemanticPage } from "@/semantic/SemanticPage";
import { ServerSemantic } from "@/semantic/ServerSemantic";

export const metadata = pageMetadata(
  "server",
  "Simulated home-server metrics drawn on the F/A-18C engine (ENG) display page.",
);

export default function ServerPage(): React.JSX.Element {
  return (
    <DdiPage
      screens={serverScreens()}
      semantic={
        <SemanticPage heading={PAGES.server.label}>
          <ServerSemantic />
        </SemanticPage>
      }
    />
  );
}
