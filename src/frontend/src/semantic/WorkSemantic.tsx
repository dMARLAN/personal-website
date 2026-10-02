import type { Employer } from "@/content/types";

/**
 * Every employer and role as real HTML (design section 10.2). The glass shows one role at a time as in-section state,
 * so the semantic layer lists them all.
 */
export function WorkSemantic({
  employers,
}: {
  employers: readonly Employer[];
}): React.JSX.Element {
  return (
    <>
      {employers.map((employer) => (
        <section key={employer.id}>
          <h2>{employer.name}</h2>
          <p>
            {employer.location}, {employer.span}
          </p>
          {employer.roles.map((role, index) => (
            <article key={`${index}-${role.title}`}>
              <h3>
                {role.title}, {role.span}
              </h3>
              <ul>
                {role.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      ))}
    </>
  );
}
