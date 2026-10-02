import { House } from "lucide-react";
import { CORNER_PLACEMENT } from "@/theme/corner";
import { PAGES } from "./pages/registry";

/**
 * The way out of the DDI: a corner button just left of the theme toggle, in its style, that opens the standard
 * homepage (docs/design.md section 9.4). It is a plain link: the homepage has its own root layout, so the browser
 * loads it fresh.
 */
export function HomeLink(): React.JSX.Element {
  return (
    <nav className="ddi-home-region" aria-label="Site">
      <a
        className="ddi-home-link"
        href={PAGES.home.path}
        style={CORNER_PLACEMENT}
        aria-label="Exit to the standard homepage"
        title="Exit to the standard homepage"
      >
        <House className="theme-toggle-icon" aria-hidden="true" />
      </a>
    </nav>
  );
}
