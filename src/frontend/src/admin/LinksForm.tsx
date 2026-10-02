"use client";

import type { SectionDocuments, ValidationIssue } from "./api";
import { TextField, withItem } from "./fields";

type Links = SectionDocuments["links"];
type LinkEntry = Links["links"][number];

const MAX_LINKS = 10;
const NEW_LINK: LinkEntry = { name: "", tag: "", url: "https://" };

/** Links → UFC BU: one row per keypad digit, in order. */
export function LinksForm({
  links,
  onChange,
  issues,
}: {
  links: Links;
  onChange(links: Links): void;
  issues: readonly ValidationIssue[];
}): React.JSX.Element {
  const rows = links.links;
  const setRows = (next: LinkEntry[]): void => onChange({ links: next });
  const move = (from: number, to: number): void => {
    const next = [...rows];
    next.splice(to, 0, ...next.splice(from, 1));
    setRows(next);
  };
  return (
    <>
      {rows.map((link, index) => (
        <fieldset key={index}>
          <legend>Link {index + 1}</legend>
          <div className="admin-row">
            <TextField
              label={`Link ${index + 1} name (≤ 8)`}
              value={link.name}
              onChange={(name) =>
                setRows(withItem(rows, index, { ...link, name }))
              }
              issues={issues}
              path={["links", index, "name"]}
            />
            <TextField
              label={`Link ${index + 1} tag (≤ 6)`}
              value={link.tag}
              onChange={(tag) =>
                setRows(withItem(rows, index, { ...link, tag }))
              }
              issues={issues}
              path={["links", index, "tag"]}
            />
            <TextField
              label={`Link ${index + 1} URL (https:// or a site path)`}
              value={link.url}
              onChange={(url) =>
                setRows(withItem(rows, index, { ...link, url }))
              }
              issues={issues}
              path={["links", index, "url"]}
            />
          </div>
          <p>
            <button
              type="button"
              disabled={index === 0}
              onClick={() => move(index, index - 1)}
            >
              Move link {index + 1} up
            </button>{" "}
            <button
              type="button"
              disabled={index === rows.length - 1}
              onClick={() => move(index, index + 1)}
            >
              Move link {index + 1} down
            </button>{" "}
            <button
              type="button"
              disabled={rows.length === 1}
              onClick={() => setRows(rows.filter((_, i) => i !== index))}
            >
              Remove link {index + 1}
            </button>
          </p>
        </fieldset>
      ))}
      <p>
        <button
          type="button"
          disabled={rows.length >= MAX_LINKS}
          onClick={() => setRows([...rows, NEW_LINK])}
        >
          Add a link
        </button>
      </p>
    </>
  );
}
