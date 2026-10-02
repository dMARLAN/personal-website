"use client";

import {
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  UploadIcon,
} from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadResume, type SavedResume } from "./api";
import type { Session } from "./useConsole";

const RESUME_PDF_PATH = "/api/resume.pdf";
const MAX_BYTES = 10 * 1024 * 1024;

/** What the site serves now, from the PDF's response headers. */
interface CurrentPdf {
  size: number;
  lastModified: string | null;
}

type Current =
  { kind: "loading" } | { kind: "none" } | { kind: "served"; pdf: CurrentPdf };

type UploadStatus =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "uploaded"; saved: SavedResume; name: string }
  | { kind: "failed"; message: string };

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function fetchCurrent(): Promise<Current> {
  // The route answers GET only, so this reads the headers and drops the body.
  const response = await fetch(RESUME_PDF_PATH, { cache: "no-store" });
  await response.body?.cancel();
  if (response.status === 404) {
    return { kind: "none" };
  }
  if (!response.ok) {
    throw new Error(`GET ${RESUME_PDF_PATH} answered ${response.status}`);
  }
  return {
    kind: "served",
    pdf: {
      size: Number(response.headers.get("Content-Length")),
      lastModified: response.headers.get("Last-Modified"),
    },
  };
}

/** Replaces the résumé PDF that every PDF link on the site downloads. */
export function ResumePdf({
  session,
}: {
  session: Session;
}): React.JSX.Element {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [current, setCurrent] = useState<Current>({ kind: "loading" });
  const [status, setStatus] = useState<UploadStatus>({ kind: "idle" });

  const refresh = useCallback(async () => setCurrent(await fetchCurrent()), []);
  useEffect(() => {
    // Reading the served PDF's headers is synchronising with the API; the state arrives later.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  function choose(chosen: File | undefined): void {
    if (chosen === undefined) {
      return;
    }
    setStatus({ kind: "idle" });
    if (chosen.size > MAX_BYTES) {
      setFile(null);
      setStatus({
        kind: "failed",
        message: `${chosen.name} is ${formatBytes(chosen.size)}; the limit is 10 MB.`,
      });
      return;
    }
    setFile(chosen);
  }

  async function upload(chosen: File): Promise<void> {
    setStatus({ kind: "uploading" });
    const result = await uploadResume(chosen, session.csrfToken);
    switch (result.kind) {
      case "ok":
        setStatus({ kind: "uploaded", saved: result.data, name: chosen.name });
        setFile(null);
        toast.success(`Uploaded ${chosen.name}.`);
        await refresh();
        return;
      case "signed-out":
        session.onSignedOut();
        return;
      case "conflict":
      case "invalid":
        setStatus({
          kind: "failed",
          message: `the API answered ${result.kind}.`,
        });
        return;
      case "failed":
        setStatus({ kind: "failed", message: result.message });
        toast.error(`Not uploaded: ${result.message}`);
        return;
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex min-h-14 shrink-0 items-center gap-4 border-b px-5 py-2">
        <div className="mr-auto">
          <h2 className="text-base font-semibold tracking-tight">Résumé PDF</h2>
          <p className="text-xs text-muted-foreground">
            The file every “PDF” link on the site downloads.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <a href={RESUME_PDF_PATH} target="_blank" rel="noreferrer">
            View live
            <ExternalLinkIcon aria-hidden />
            <span className="sr-only">
              {RESUME_PDF_PATH} (opens in a new tab)
            </span>
          </a>
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-5 p-5">
          <section
            aria-labelledby="current-pdf"
            className="rounded-lg border bg-card p-4 shadow-xs"
          >
            <h3 id="current-pdf" className="mb-3 text-sm font-medium">
              Current file
            </h3>
            {current.kind === "loading" ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : current.kind === "none" ? (
              <p className="text-sm text-muted-foreground">
                No PDF is uploaded yet.
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted">
                  <FileTextIcon
                    aria-hidden
                    className="size-5 text-muted-foreground"
                  />
                </div>
                <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
                  <dt className="text-muted-foreground">File</dt>
                  <dd className="font-mono">resume.pdf</dd>
                  <dt className="text-muted-foreground">Size</dt>
                  <dd>{formatBytes(current.pdf.size)}</dd>
                  <dt className="text-muted-foreground">Uploaded</dt>
                  <dd>
                    {current.pdf.lastModified === null
                      ? "unknown"
                      : new Date(current.pdf.lastModified).toLocaleString()}
                  </dd>
                </dl>
                <Button variant="outline" size="sm" asChild>
                  <a href={RESUME_PDF_PATH} target="_blank" rel="noreferrer">
                    Open current PDF
                  </a>
                </Button>
              </div>
            )}
          </section>

          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (file !== null) {
                void upload(file);
              }
            }}
          >
            <label
              htmlFor={inputId}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                choose(event.dataTransfer.files[0]);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors has-[:focus-visible]:border-ring has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                dragging ? "border-primary bg-accent" : "hover:bg-accent/50",
              )}
            >
              <UploadIcon
                aria-hidden
                className="size-6 text-muted-foreground"
              />
              <span className="text-sm font-medium">
                PDF file (at most 10 MB)
              </span>
              <span className="text-xs text-muted-foreground">
                Drop it here, or click to choose one.
              </span>
              <input
                id={inputId}
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(event) => choose(event.target.files?.[0])}
              />
            </label>
            {file === null ? null : (
              <p className="flex items-center gap-2 text-sm">
                <FileTextIcon
                  aria-hidden
                  className="size-4 text-muted-foreground"
                />
                <span className="font-mono">{file.name}</span>
                <span className="text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
              </p>
            )}
            <div>
              <Button
                type="submit"
                disabled={file === null || status.kind === "uploading"}
              >
                {status.kind === "uploading" ? (
                  <Loader2Icon aria-hidden className="animate-spin" />
                ) : null}
                {status.kind === "uploading" ? "Uploading…" : "Upload"}
              </Button>
            </div>
          </form>
          {status.kind === "uploaded" ? (
            <div
              role="status"
              className="rounded-md border border-emerald-600/30 bg-emerald-600/5 p-3 text-sm"
            >
              <p>
                Uploaded {status.name}: {status.saved.size.toLocaleString()}{" "}
                bytes.
              </p>
              <p className="text-muted-foreground">
                {status.saved.revalidation === "done"
                  ? "Revalidation: done."
                  : "Revalidation: failed. The PDF is saved; upload again to retry."}
              </p>
            </div>
          ) : null}
          {status.kind === "failed" ? (
            <p role="alert" className="text-sm text-destructive">
              Not uploaded: {status.message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
