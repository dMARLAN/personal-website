import { VIEW_PARAM } from "../controls/state";
import { Frame } from "../frame";
import type { DdiScreens } from "../frame/types";

export interface DdiPageProps {
  screens: DdiScreens;
  /** The page's semantic layer, a `SemanticPage`. */
  semantic: React.ReactNode;
}

/**
 * One route: the skip links, the semantic `<main>`, then the frame with its OSBs and controls, in that DOM order
 * (design section 10.2). The view links reload the page, so the pre-paint script applies the view before paint.
 */
export function DdiPage({
  screens,
  semantic,
}: DdiPageProps): React.JSX.Element {
  return (
    <>
      <header>
        <a className="ddi-skip ddi-skip-to-plain" href={`?${VIEW_PARAM}=plain`}>
          Text view
        </a>
        <a className="ddi-skip ddi-skip-to-ddi" href={`?${VIEW_PARAM}=ddi`}>
          Display view
        </a>
      </header>
      {semantic}
      <Frame screens={screens} />
    </>
  );
}
