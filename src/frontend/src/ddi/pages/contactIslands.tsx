"use client";

import { useSyncExternalStore } from "react";
import { useOsbPress } from "../frame/Osb";

/** What the cautions line shows after a COPY press. */
export type CopyStatus = "idle" | "copied" | "failed";

/** (ours) How long the cautions line shows the COPY result (docs/design.md section 12). */
export const COPY_FEEDBACK_MS = 2000;

// The COPY button and the cautions line are separate islands (an OSB and the glass), so they share this store.
let status: CopyStatus = "idle";
let clearTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function setStatus(next: CopyStatus): void {
  status = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function useCopyStatus(): CopyStatus {
  return useSyncExternalStore(
    subscribe,
    () => status,
    () => "idle",
  );
}

function show(next: CopyStatus): void {
  clearTimeout(clearTimer);
  setStatus(next);
  clearTimer = setTimeout(() => setStatus("idle"), COPY_FEEDBACK_MS);
}

/** Copies `text` and reports the result on the cautions line. A refused clipboard write shows as a failure. */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // The browser may refuse clipboard access (permissions, an insecure origin): tell the visitor on the glass.
    console.error("COPY failed", error);
    show("failed");
    return;
  }
  show("copied");
}

const STATUS_MESSAGES: Readonly<Record<CopyStatus, string>> = {
  idle: "",
  copied: "Email address copied",
  failed: "Could not copy the email address",
};

/** PB16 `COPY`: copies the email address on press, as every OSB fires (design section 5.1). */
export function CopyOsb({
  text,
  label,
}: {
  text: string;
  label: string;
}): React.JSX.Element {
  const copyStatus = useCopyStatus();
  // A button has no native action, so a click with no press before it must copy too.
  const { pressed, handlers } = useOsbPress(
    () => void copyToClipboard(text),
    true,
  );
  return (
    <>
      <button
        type="button"
        className="ddi-osb"
        data-pressed={pressed || undefined}
        {...handlers}
      >
        <span className="ddi-osb-label">{label}</span>
      </button>
      <span role="status" className="ddi-osb-label">
        {STATUS_MESSAGES[copyStatus]}
      </span>
    </>
  );
}

/** PB17 `MAIL`: opens the visitor's mail client on press. Without JavaScript it is a plain `mailto:` link. */
export function MailOsb({
  href,
  label,
}: {
  href: string;
  label: string;
}): React.JSX.Element {
  const { pressed, handlers } = useOsbPress(() => {
    window.location.href = href;
  }, false);
  return (
    <a
      href={href}
      className="ddi-osb"
      data-pressed={pressed || undefined}
      {...handlers}
    >
      <span className="ddi-osb-label">{label}</span>
    </a>
  );
}

/** The cautions line: the server-rendered `COPIED` or `COPY FAILED` text while the COPY result shows. */
export function CopyCautions({
  copied,
  failed,
}: {
  copied: React.ReactNode;
  failed: React.ReactNode;
}): React.ReactNode {
  const copyStatus = useCopyStatus();
  if (copyStatus === "copied") {
    return copied;
  }
  return copyStatus === "failed" ? failed : null;
}
