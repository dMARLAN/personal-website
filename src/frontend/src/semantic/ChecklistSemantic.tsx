import type { Checklist } from "@/content/types";

/** The CHKLST page as HTML (design section 10.2): both checklists, in display order (T.O. first reads better). */
export function ChecklistSemantic({
  checklist,
}: {
  checklist: Checklist;
}): React.JSX.Element {
  return (
    <>
      <p>The checklist page, drawn as in the Hornet.</p>
      {[checklist.right, checklist.left].map((column) => (
        <section key={column.title}>
          <h2>
            {column.title}: {column.meaning}
          </h2>
          <ul>
            {column.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
