import { getBit } from "@/content/bit";
import { DdiPage } from "@/ddi/pages/DdiPage";
import { bitScreens } from "@/ddi/pages/bit/screens";
import { pageMetadata } from "@/ddi/pages/metadata";
import { BitSemantic } from "@/semantic/BitSemantic";

export const metadata = pageMetadata(
  "bit",
  "A mock F/A-18C built-in test page: a software engineer's checks, from lint to DNS, with their test status.",
);

export default async function BitPage(): Promise<React.JSX.Element> {
  const bit = await getBit();
  return (
    <DdiPage screens={bitScreens(bit)} semantic={<BitSemantic bit={bit} />} />
  );
}
