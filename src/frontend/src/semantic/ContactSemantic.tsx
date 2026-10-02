import type { Contact } from "@/content/types";

/** Contact as real HTML: the email as a mail link, then the other rows (design section 10.2). */
export function ContactSemantic({
  contact,
}: {
  contact: Contact;
}): React.JSX.Element {
  return (
    <dl>
      <div>
        <dt>Email</dt>
        <dd>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </dd>
      </div>
      {contact.rows.map(({ label, value }) => (
        <div key={label}>
          <dt>{label.replace(/:$/, "")}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
