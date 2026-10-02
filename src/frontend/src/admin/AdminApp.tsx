"use client";

import { Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSession, logout, type SessionInfo } from "./api";
import { isDirty } from "./consoleState";
import { LoginForm } from "./LoginForm";
import { ResumePdf } from "./ResumePdf";
import { isSectionId, sectionInfo } from "./sections";
import {
  sectionStatus,
  SectionWorkspace,
  type EditorMode,
} from "./SectionWorkspace";
import { RESUME_PDF, Sidebar, type Panel } from "./Sidebar";
import { useConsole, type Session } from "./useConsole";

type AuthState =
  | { kind: "checking" }
  | { kind: "signed-out"; notice: string | null }
  | { kind: "signed-in"; session: SessionInfo };

const EXPIRED_NOTICE =
  "Your session ended. Sign in again: your unsaved edits are kept in this browser and come back after you sign in.";

/**
 * The admin console (docs/design.md section 13.8). It runs in the browser and calls `/api/admin/*`, which carries
 * the session cookie (`Path=/`). The CSRF token from sign-in (or, after a reload, from `GET /api/admin/session`) goes
 * on every write.
 */
export function AdminApp(): React.JSX.Element {
  const [auth, setAuth] = useState<AuthState>({ kind: "checking" });

  useEffect(() => {
    void getSession().then((result) => {
      setAuth(
        result.kind === "ok"
          ? { kind: "signed-in", session: result.data }
          : { kind: "signed-out", notice: null },
      );
    });
  }, []);

  const onSignedOut = useCallback(() => {
    setAuth({ kind: "signed-out", notice: EXPIRED_NOTICE });
  }, []);

  return (
    <TooltipProvider>
      <main>
        {auth.kind === "checking" ? (
          <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
            <h1 className="sr-only">Site admin</h1>
            <Loader2Icon aria-hidden className="size-5 animate-spin" />
            <p>Checking the session…</p>
          </div>
        ) : auth.kind === "signed-out" ? (
          <LoginForm
            notice={auth.notice}
            onSignedIn={(session) => setAuth({ kind: "signed-in", session })}
          />
        ) : (
          <Console
            session={{ csrfToken: auth.session.csrfToken, onSignedOut }}
            expiresAt={auth.session.expiresAt}
            onSignOut={async (keptEdits) => {
              await logout(auth.session.csrfToken);
              setAuth({
                kind: "signed-out",
                notice: keptEdits
                  ? "Signed out. Your unsaved edits are kept in this browser."
                  : "Signed out.",
              });
            }}
          />
        )}
      </main>
      <Toaster position="bottom-right" closeButton />
    </TooltipProvider>
  );
}

const AUTO_UPPERCASE_KEY = "admin:auto-uppercase";

function panelFromHash(): Panel {
  const hash = window.location.hash.slice(1);
  return hash === RESUME_PDF || isSectionId(hash) ? hash : "profile";
}

function Console({
  session,
  expiresAt,
  onSignOut,
}: {
  session: Session;
  expiresAt: string;
  onSignOut(keptEdits: boolean): Promise<void>;
}): React.JSX.Element {
  const api = useConsole(session);
  const [panel, setPanel] = useState<Panel>(panelFromHash);
  const [modes, setModes] = useState<Partial<Record<Panel, EditorMode>>>({});
  const [autoUppercase, setAutoUppercase] = useState(
    () => localStorage.getItem(AUTO_UPPERCASE_KEY) === "true",
  );
  const { sections, load } = api;
  const anyDirty = Object.values(sections).some(
    (edit) => edit !== undefined && isDirty(edit),
  );

  const choosePanel = (next: Panel): void => {
    setPanel(next);
    window.history.replaceState(null, "", `#${next}`);
  };

  useEffect(() => {
    if (!anyDirty) {
      return;
    }
    const warn = (event: BeforeUnloadEvent): void => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [anyDirty]);

  const active = panel === RESUME_PDF ? undefined : sections[panel];
  const { saveDraft, publish } = api;
  useEffect(() => {
    if (panel === RESUME_PDF || active === undefined) {
      return;
    }
    const status = sectionStatus(active);
    // Capture phase, so the shortcuts work inside CodeMirror, which binds Mod-Enter itself.
    const onKey = (event: KeyboardEvent): void => {
      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }
      if (event.key === "s") {
        event.preventDefault();
        event.stopPropagation();
        if (status.canSaveDraft) {
          void saveDraft(panel);
        }
      } else if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        if (status.canPublish) {
          void publish(panel);
        }
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [panel, active, saveDraft, publish]);

  return (
    <div className="grid h-dvh grid-cols-[15rem_minmax(0,1fr)] overflow-hidden">
      <Sidebar
        sections={sections}
        panel={panel}
        onPanel={choosePanel}
        autoUppercase={autoUppercase}
        onAutoUppercase={(on) => {
          setAutoUppercase(on);
          localStorage.setItem(AUTO_UPPERCASE_KEY, String(on));
        }}
        expiresAt={expiresAt}
        onSignOut={() => void onSignOut(anyDirty)}
      />
      <div className="min-h-0 min-w-0">
        {panel === RESUME_PDF ? (
          <ResumePdf session={session} />
        ) : load.kind === "failed" ? (
          <div role="alert" className="p-8 text-sm text-destructive">
            Could not load the content: {load.message}
          </div>
        ) : active === undefined ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon aria-hidden className="size-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <SectionWorkspace
            key={panel}
            section={sectionInfo(panel)}
            edit={active}
            console={api}
            mode={modes[panel] ?? "form"}
            onMode={(mode) =>
              setModes((current) => ({ ...current, [panel]: mode }))
            }
            autoUppercase={autoUppercase}
          />
        )}
      </div>
    </div>
  );
}
