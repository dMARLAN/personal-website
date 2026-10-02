import type { LinkEntry } from "@/content/types";

/**
 * Links as real HTML: every link, since the glass shows one selection at a time (design section 10.2). They open in
 * a new tab, as `ENT` does.
 */
export function LinksSemantic({
  links,
}: {
  links: readonly LinkEntry[];
}): React.JSX.Element {
  return (
    <ul>
      {links.map((link) => (
        <li key={link.url}>
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            {link.name}
          </a>{" "}
          ({link.tag.toLowerCase()})
        </li>
      ))}
    </ul>
  );
}
