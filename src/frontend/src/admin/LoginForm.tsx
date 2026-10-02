"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type SessionInfo } from "./api";

/** Sign-in with the admin password. The API sets the session cookie and returns the CSRF token. */
export function LoginForm({
  notice,
  onSignedIn,
}: {
  /** Why the form is showing, such as an expired session. */
  notice: string | null;
  onSignedIn(session: SessionInfo): void;
}): React.JSX.Element {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(): Promise<void> {
    setBusy(true);
    const result = await login(password);
    setBusy(false);
    switch (result.kind) {
      case "ok":
        onSignedIn(result.data);
        return;
      case "failed":
        setError(result.message);
        return;
      case "signed-out":
      case "conflict":
      case "invalid":
        setError(`The API answered ${result.kind}.`);
        return;
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-sm font-medium text-muted-foreground">
          Site admin
        </h1>
        <section
          aria-labelledby="login-heading"
          className="rounded-xl border bg-card p-6 shadow-sm"
        >
          <h2
            id="login-heading"
            className="text-lg font-semibold tracking-tight"
          >
            Sign in
          </h2>
          {notice === null ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the admin password.
            </p>
          ) : (
            <p role="status" className="mt-1 text-sm text-muted-foreground">
              {notice}
            </p>
          )}
          <form
            className="mt-5 flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
                value={password}
                aria-invalid={error !== null}
                aria-describedby={error === null ? undefined : "login-error"}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error === null ? null : (
              <p
                id="login-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {busy ? (
                <Loader2Icon aria-hidden className="animate-spin" />
              ) : null}
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
