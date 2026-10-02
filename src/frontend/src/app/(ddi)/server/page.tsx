import { getServerStats } from "@/content/server";
import { DdiPage } from "@/ddi/pages/DdiPage";
import { pageMetadata } from "@/ddi/pages/metadata";
import { PAGES } from "@/ddi/pages/registry";
import { ServerReadingsProvider } from "@/ddi/pages/server/islands";
import { serverScreens } from "@/ddi/pages/server/screens";
import { SemanticPage } from "@/semantic/SemanticPage";
import { ServerSemantic } from "@/semantic/ServerSemantic";

export const metadata = pageMetadata(
  "server",
  "Simulated home-server metrics drawn on the F/A-18C engine (ENG) display page.",
);

export default async function ServerPage(): Promise<React.JSX.Element> {
  const stats = await getServerStats();
  return (
    <ServerReadingsProvider stats={stats}>
      <DdiPage
        screens={serverScreens(stats)}
        semantic={
          <SemanticPage heading={PAGES.server.label}>
            <ServerSemantic stats={stats} />
          </SemanticPage>
        }
      />
    </ServerReadingsProvider>
  );
}
