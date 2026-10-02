import {
  MENU_LABELS,
  MENU_NAMES,
  menuPages,
  type MenuName,
} from "@/ddi/pages/registry";

const SUMMARIES: Readonly<Record<MenuName, string>> = {
  TAC: "Opens the site's sections as each one ships.",
  SUPT: "Opens the showcase pages as each one ships.",
};

/**
 * Both menus as real HTML (design section 10.2). TAC and SUPT share `/ddi` and the glass shows one at a time, so the
 * semantic layer lists both: SUPT's pages stay reachable without pressing PB18.
 */
export function MenuSemantic(): React.JSX.Element {
  return (
    <>
      {MENU_NAMES.map((menu) => {
        const pages = menuPages(menu);
        return (
          <section key={menu}>
            <h2>{MENU_LABELS[menu]}</h2>
            <p>{SUMMARIES[menu]}</p>
            {pages.length > 0 && (
              <ul>
                {pages.map((page) => (
                  <li key={page.id}>
                    <a href={page.path}>{page.label}</a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
