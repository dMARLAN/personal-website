import { RESUME_PDF_URL } from "@/content/resume";
import type { Resume } from "@/content/types";

/** The resume as real HTML (design section 10.2): both columns of the table, and the PDF link. */
export function ResumeSemantic({
  resume,
}: {
  resume: Resume;
}): React.JSX.Element {
  return (
    <>
      {[resume.left, resume.right].map(({ heading, rows }) => (
        <section key={heading}>
          <h2>{heading}</h2>
          <dl>
            {rows.map(({ name, value }, index) => (
              <div key={`${index}-${name}`}>
                <dt>{name}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <p>
        <a href={RESUME_PDF_URL} download>
          Download the resume (PDF)
        </a>
      </p>
    </>
  );
}
