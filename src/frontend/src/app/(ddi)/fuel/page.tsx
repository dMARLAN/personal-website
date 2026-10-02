import { getFuelReserves } from "@/content/fuel";
import { DdiPage } from "@/ddi/pages/DdiPage";
import { fuelScreens } from "@/ddi/pages/fuel";
import { pageMetadata } from "@/ddi/pages/metadata";
import { PAGES } from "@/ddi/pages/registry";
import { FuelSemantic } from "@/semantic/FuelSemantic";
import { SemanticPage } from "@/semantic/SemanticPage";

export const metadata = pageMetadata(
  "fuel",
  "The Hornet's fuel page, with coffee, sleep and focus in place of fuel.",
);

export default async function FuelPage(): Promise<React.JSX.Element> {
  const reserves = await getFuelReserves();
  return (
    <DdiPage
      screens={fuelScreens(reserves)}
      semantic={
        <SemanticPage heading={PAGES.fuel.label}>
          <FuelSemantic reserves={reserves} />
        </SemanticPage>
      }
    />
  );
}
