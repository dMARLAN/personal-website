"use client";

import { useCallback, useEffect, useState } from "react";
import { LoginForm } from "./LoginForm";
import { ResumeUpload } from "./ResumeUpload";
import { SectionEditor } from "./SectionEditor";
import { getSession, logout, type SessionInfo } from "./api";
import { SECTIONS } from "./sections";
import type { Session } from "./useSection";

const RESUME_PDF = "resume-pdf";

type Panel = (typeof SECTIONS)[number]["id"] | typeof RESUME_PDF;

type AuthState =
  | { kind: "checking" }
  | { kind: "signed-out"; notice: string | null }
  | { kind: "signed-in"; csrfToken: string };

/**
 * The admin console (docs/design.md section 13.8). It runs in the browser: the session cookie is scoped to
 * `/api/admin`, so the Next server never sees it. The CSRF token from login (or, after a reload, from
 * `GET /api/admin/session`) goes on every write.
 */
export function AdminApp(): React.JSX.Element {
  const [auth, setAuth] = useState<AuthState>({ kind: "checking" });
  const [panel, setPanel] = useState<Panel>("profile");

  useEffect(() => {
    void getSession().then((result) => {
      setAuth(
        result.kind === "ok"
          ? { kind: "signed-in", csrfToken: result.data.csrfToken }
          : { kind: "signed-out", notice: null },
      );
    });
  }, []);

  const onSignedOut = useCallback(() => {
    setAuth({
      kind: "signed-out",
      notice: "Your session ended. Sign in again.",
    });
  }, []);

  switch (auth.kind) {
    case "checking":
      return <p>Checking the session…</p>;
    case "signed-out":
      return (
        <LoginForm
          notice={auth.notice}
          onSignedIn={(session: SessionInfo) =>
            setAuth({ kind: "signed-in", csrfToken: session.csrfToken })
          }
        />
      );
    case "signed-in":
      return (
        <Console
          session={{ csrfToken: auth.csrfToken, onSignedOut }}
          panel={panel}
          onPanel={setPanel}
          onLogout={async () => {
            await logout(auth.csrfToken);
            setAuth({ kind: "signed-out", notice: "Signed out." });
          }}
        />
      );
  }
}

function Console({
  session,
  panel,
  onPanel,
  onLogout,
}: {
  session: Session;
  panel: Panel;
  onPanel(panel: Panel): void;
  onLogout(): Promise<void>;
}): React.JSX.Element {
  const section = SECTIONS.find(({ id }) => id === panel);
  return (
    <div className="admin-console">
      <nav aria-label="Sections">
        <ul>
          {SECTIONS.map(({ id, label }) => (
            <li key={id}>
              <button
                type="button"
                aria-pressed={panel === id}
                onClick={() => onPanel(id)}
              >
                {label}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              aria-pressed={panel === RESUME_PDF}
              onClick={() => onPanel(RESUME_PDF)}
            >
              Résumé PDF
            </button>
          </li>
        </ul>
        <p>
          <button type="button" onClick={() => void onLogout()}>
            Sign out
          </button>
        </p>
      </nav>
      <div className="admin-panel">
        {section === undefined ? (
          <ResumeUpload session={session} />
        ) : (
          <SectionEditor key={section.id} section={section} session={session} />
        )}
      </div>
    </div>
  );
}
