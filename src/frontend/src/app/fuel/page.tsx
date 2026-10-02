import { FUEL_RESERVES } from "@/content/fuel";
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

export default function FuelPage(): React.JSX.Element {
  return (
    <DdiPage
      screens={fuelScreens()}
      semantic={
        <SemanticPage heading={PAGES.fuel.label}>
          <FuelSemantic reserves={FUEL_RESERVES} />
        </SemanticPage>
      }
    />
  );
}
