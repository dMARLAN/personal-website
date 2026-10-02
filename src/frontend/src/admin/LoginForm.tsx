"use client";

import { useState } from "react";
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
    <section aria-labelledby="login-heading">
      <h2 id="login-heading">Sign in</h2>
      {notice === null ? null : <p role="status">{notice}</p>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="admin-field">
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <p>
          <button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </p>
      </form>
      {error === null ? null : (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
    </section>
  );
}
