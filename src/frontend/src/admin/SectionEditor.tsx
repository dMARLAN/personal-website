"use client";

import { useState } from "react";
import { ContactForm } from "./ContactForm";
import { EditorFrame } from "./EditorFrame";
import { LinksForm } from "./LinksForm";
import { ProfileForm } from "./ProfileForm";
import type { SectionDocuments, SectionId, ValidationIssue } from "./api";
import type { SectionInfo } from "./sections";
import { useSection, type EditorStatus, type Session } from "./useSection";

/** The editor for one section: a form for the simple ones, validated JSON for the rest. */
export function SectionEditor({
  section,
  session,
}: {
  section: SectionInfo;
  session: Session;
}): React.JSX.Element {
  switch (section.id) {
    case "profile":
      return (
        <FormEditor
          id="profile"
          section={section}
          session={session}
          form={(profile, onChange, issues) => (
            <ProfileForm
              profile={profile}
              onChange={onChange}
              issues={issues}
            />
          )}
        />
      );
    case "contact":
      return (
        <FormEditor
          id="contact"
          section={section}
          session={session}
          form={(contact, onChange, issues) => (
            <ContactForm
              contact={contact}
              onChange={onChange}
              issues={issues}
            />
          )}
        />
      );
    case "links":
      return (
        <FormEditor
          id="links"
          section={section}
          session={session}
          form={(links, onChange, issues) => (
            <LinksForm links={links} onChange={onChange} issues={issues} />
          )}
        />
      );
    default:
      return <JsonEditor section={section} session={session} />;
  }
}

function issuesOf(status: EditorStatus): ValidationIssue[] {
  return status.kind === "invalid" ? status.issues : [];
}

function FormEditor<S extends SectionId>({
  id,
  section,
  session,
  form,
}: {
  id: S;
  section: SectionInfo;
  session: Session;
  form(
    document: SectionDocuments[S],
    onChange: (document: SectionDocuments[S]) => void,
    issues: readonly ValidationIssue[],
  ): React.ReactNode;
}): React.JSX.Element {
  const { draft, setDraft, status, save, reload } = useSection(id, session);
  return (
    <EditorFrame
      section={section}
      status={status}
      onSave={() => void save(draft)}
      onReload={() => void reload()}
    >
      {draft === null ? null : form(draft, setDraft, issuesOf(status))}
    </EditorFrame>
  );
}

/** The whole document as JSON. The API checks it on save and lists what is wrong. */
function JsonEditor({
  section,
  session,
}: {
  section: SectionInfo;
  session: Session;
}): React.JSX.Element {
  const { draft, version, status, save, reload, fail } = useSection(
    section.id,
    session,
  );
  // Edits belong to one loaded version; a load or save replaces the text with the API's copy.
  const [edit, setEdit] = useState<{ version: number; text: string } | null>(
    null,
  );
  const text =
    edit !== null && edit.version === version
      ? edit.text
      : JSON.stringify(draft, null, 2);
  return (
    <EditorFrame
      section={section}
      status={status}
      onSave={() => {
        let document: unknown;
        try {
          document = JSON.parse(text);
        } catch (error) {
          fail(
            `the JSON does not parse (${error instanceof Error ? error.message : String(error)}).`,
          );
          return;
        }
        void save(document);
      }}
      onReload={() => void reload()}
    >
      <div className="admin-field">
        <label htmlFor="json-document">{section.label} (JSON)</label>
        <textarea
          id="json-document"
          className="admin-json"
          rows={30}
          spellCheck={false}
          value={text}
          onChange={(event) => setEdit({ version, text: event.target.value })}
        />
      </div>
    </EditorFrame>
  );
}
