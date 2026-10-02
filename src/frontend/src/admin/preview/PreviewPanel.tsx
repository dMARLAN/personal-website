"use client";

import {
  AlertTriangleIcon,
  ExternalLinkIcon,
  Loader2Icon,
  LogInIcon,
  PauseIcon,
  RotateCwIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { storeTutorialDone } from "@/ddi/tutorial/state";
import { cn } from "@/lib/utils";
import {
  isRenderedMessage,
  PREVIEW_META_NAME,
  previewUrl,
  REFRESH_MESSAGE,
  type PreviewState,
} from "@/preview/paths";
import type { SectionInfo } from "../sections";
import { armPreview, frameStateFromMeta } from "./draftMode";
import {
  DEFAULT_VIEWPORT_ID,
  fitFrame,
  previewTargets,
  viewportById,
  VIEWPORTS,
  type PreviewTargetId,
  type Viewport,
} from "./targets";

/** What the preview says about the draft behind it (computed by the editor from the section's state). */
export type AutosaveStatus =
  | { kind: "saving" }
  | { kind: "saved"; at: string }
  | { kind: "live" }
  | { kind: "failed"; message: string };

/**
 * THE PREVIEW (docs/design.md sections 13.8 and 13.9): the real page, rendered by the Next server in draft mode from
 * the stored drafts, in a same-origin frame. The editor autosaves the draft; each save bumps `revision`, and the frame's
 * page renders again from the server, keeping its in-section state and scroll.
 */
export interface PreviewPanelProps {
  section: SectionInfo;
  /** Changes whenever what the API stores for the section changes: a draft saved or discarded, a publish. */
  revision: number;
  /** The editor has problems, so nothing is saved and the frame keeps the last valid draft. */
  paused: boolean;
  autosave: AutosaveStatus;
  /** The frame found the session gone: show the console's sign-in. */
  onSignIn(): void;
}

const VIEWPORT_KEY = "admin:preview-viewport";
/** The space around a scaled page in the pane, in px. */
const GUTTER = 16;
/** How long a refresh may take before the frame is reloaded instead. */
const REFRESH_TIMEOUT_MS = 6000;

type Shown = { kind: "loading" } | { kind: PreviewState };

function savedTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function storedViewport(): Viewport {
  const stored = viewportById(localStorage.getItem(VIEWPORT_KEY) ?? "");
  if (stored !== null) {
    return stored;
  }
  const preset = viewportById(DEFAULT_VIEWPORT_ID);
  if (preset === null) {
    throw new Error(`no viewport ${DEFAULT_VIEWPORT_ID}`);
  }
  return preset;
}

/** The pane's size in px, kept current as the split or the window resizes. */
function usePaneSize(): [
  React.RefObject<HTMLDivElement | null>,
  { width: number; height: number } | null,
] {
  const pane = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  useLayoutEffect(() => {
    const element = pane.current;
    if (element === null) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [pane, size];
}

export function PreviewPanel({
  section,
  revision,
  paused,
  autosave,
  onSignIn,
}: PreviewPanelProps): React.JSX.Element {
  const targets = previewTargets(section);
  const [targetId, setTargetId] = useState<PreviewTargetId>("ddi");
  const target = targets.find((candidate) => candidate.id === targetId);
  if (target === undefined) {
    throw new Error(`${section.id} has no ${targetId} preview`);
  }
  const [viewport, setViewport] = useState<Viewport>(storedViewport);
  const [paneRef, pane] = usePaneSize();
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [shown, setShown] = useState<Shown>({ kind: "loading" });
  const [updating, setUpdating] = useState(false);
  // Bumped to reload the frame from the enable route: a new `key` remounts the iframe.
  const [loadCount, setLoadCount] = useState(0);
  // The page in the frame answered a refresh before, so it is listening for one.
  const bridged = useRef(false);
  const refreshTimer = useRef<number | undefined>(undefined);
  const keptScroll = useRef(0);
  const src = previewUrl(target.path);

  // The frame shares this origin's storage: without this the first-visit tutorial would cover the DDI page.
  useEffect(() => storeTutorialDone(), []);

  const reload = useCallback(() => {
    keptScroll.current = frame.current?.contentWindow?.scrollY ?? 0;
    bridged.current = false;
    window.clearTimeout(refreshTimer.current);
    setUpdating(false);
    setShown({ kind: "loading" });
    setLoadCount((count) => count + 1);
  }, []);

  const onLoad = (): void => {
    const page = frame.current?.contentWindow ?? null;
    // Null when the frame left the site (an external link): not a preview any more.
    const frameDocument = frame.current?.contentDocument ?? null;
    const meta = frameDocument?.querySelector(
      `meta[name="${PREVIEW_META_NAME}"]`,
    );
    setShown({
      kind: frameStateFromMeta(meta?.getAttribute("content") ?? null),
    });
    if (page !== null && keptScroll.current > 0) {
      page.scrollTo(0, keptScroll.current);
      keptScroll.current = 0;
    }
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent): void => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        !isRenderedMessage(event.data)
      ) {
        return;
      }
      bridged.current = true;
      window.clearTimeout(refreshTimer.current);
      setUpdating(false);
      setShown({ kind: event.data.state });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // A saved draft (or a publish) renders the page again. The first render loads the frame; later ones refresh it.
  const shownRevision = useRef(revision);
  useEffect(() => {
    if (shownRevision.current === revision) {
      return;
    }
    shownRevision.current = revision;
    let cancelled = false;
    void armPreview().then((state) => {
      if (cancelled) {
        return;
      }
      if (state !== "draft") {
        setShown({ kind: state });
        return;
      }
      const page = frame.current?.contentWindow ?? null;
      if (!bridged.current || page === null) {
        reload();
        return;
      }
      setUpdating(true);
      page.postMessage(REFRESH_MESSAGE, window.location.origin);
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = window.setTimeout(reload, REFRESH_TIMEOUT_MS);
    });
    return () => {
      cancelled = true;
    };
  }, [revision, reload]);

  useEffect(() => () => window.clearTimeout(refreshTimer.current), []);

  const box = pane === null ? null : fitFrame(viewport, pane, GUTTER);
  const scaled = viewport.size !== null;

  return (
    <section
      aria-labelledby="preview-heading"
      className="flex h-full min-w-0 flex-col bg-muted/40"
      data-preview-slot
    >
      <div className="flex h-11 shrink-0 items-center gap-2 border-b bg-background px-3">
        <h2 id="preview-heading" className="text-sm font-medium">
          Preview
        </h2>
        <span className="truncate font-mono text-xs text-muted-foreground">
          {target.path}
        </span>
        <div className="ml-auto flex min-w-0 items-center gap-1">
          <PreviewStatus
            paused={paused}
            autosave={autosave}
            updating={updating}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Reload the preview"
                onClick={reload}
              >
                <RotateCwIcon aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reload</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <a
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open the preview of ${target.path} in a new tab`}
                >
                  <ExternalLinkIcon aria-hidden />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open the preview in a new tab</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-background/60 px-3">
        {targets.length > 1 ? (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            aria-label="Page to preview"
            value={target.id}
            onValueChange={(next) => {
              const chosen = targets.find((candidate) => candidate.id === next);
              if (chosen !== undefined) {
                setTargetId(chosen.id);
                reload();
              }
            }}
          >
            {targets.map((option) => (
              <ToggleGroupItem
                key={option.id}
                value={option.id}
                className="px-2.5 text-xs"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : (
          <span className="text-xs text-muted-foreground">DDI page</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {scaled && box !== null ? (
            <span
              className="font-mono text-[11px] text-muted-foreground tabular-nums"
              aria-label={`Scaled to ${Math.round(box.scale * 100)} percent`}
            >
              {Math.round(box.scale * 100)}%
            </span>
          ) : null}
          <Select
            value={viewport.id}
            onValueChange={(next) => {
              const chosen = viewportById(next);
              if (chosen !== null) {
                setViewport(chosen);
                localStorage.setItem(VIEWPORT_KEY, chosen.id);
              }
            }}
          >
            <SelectTrigger
              size="sm"
              aria-label="Preview size"
              className="w-36 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {VIEWPORTS.map((option) => (
                <SelectItem
                  key={option.id}
                  value={option.id}
                  className="text-xs"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div
        ref={paneRef}
        className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:14px_14px]"
      >
        {box === null ? null : (
          <iframe
            key={`${src}#${loadCount}`}
            ref={frame}
            src={src}
            title={`Preview of ${target.path} with the saved drafts`}
            onLoad={onLoad}
            className={cn(
              "absolute origin-top-left border-0 bg-background",
              scaled && "rounded-sm shadow-lg ring-1 ring-border",
            )}
            style={{
              width: box.width,
              height: box.height,
              left: box.left,
              top: box.top,
              transform: scaled ? `scale(${box.scale})` : undefined,
            }}
          />
        )}
        <FrameOverlay shown={shown} onRetry={reload} onSignIn={onSignIn} />
      </div>
    </section>
  );
}

function PreviewStatus({
  paused,
  autosave,
  updating,
}: {
  paused: boolean;
  autosave: AutosaveStatus;
  updating: boolean;
}): React.JSX.Element {
  const base = "flex min-w-0 items-center gap-1.5 px-1 text-xs";
  if (paused) {
    return (
      <span
        role="status"
        className={cn(
          base,
          "rounded-md border border-amber-600/40 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-800 dark:border-amber-400/40 dark:text-amber-300",
        )}
        data-preview-status="paused"
      >
        <PauseIcon aria-hidden className="size-3 shrink-0" />
        <span className="truncate">Preview paused: fix errors</span>
      </span>
    );
  }
  if (autosave.kind === "failed") {
    return (
      <span
        role="status"
        className={cn(base, "text-destructive")}
        title={autosave.message}
        data-preview-status="failed"
      >
        <AlertTriangleIcon aria-hidden className="size-3 shrink-0" />
        <span className="truncate">Autosave failed</span>
      </span>
    );
  }
  if (autosave.kind === "saving" || updating) {
    return (
      <span
        role="status"
        className={cn(base, "text-muted-foreground")}
        data-preview-status="updating"
      >
        <Loader2Icon aria-hidden className="size-3 shrink-0 animate-spin" />
        <span className="truncate">
          {autosave.kind === "saving" ? "Saving draft…" : "Updating…"}
        </span>
      </span>
    );
  }
  return (
    <span
      role="status"
      className={cn(base, "text-muted-foreground")}
      data-preview-status="current"
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          autosave.kind === "saved" ? "bg-sky-500" : "bg-emerald-500",
        )}
      />
      <span className="truncate">
        {autosave.kind === "saved"
          ? `Draft saved ${savedTime(autosave.at)}`
          : "Showing published content"}
      </span>
    </span>
  );
}

function FrameOverlay({
  shown,
  onRetry,
  onSignIn,
}: {
  shown: Shown;
  onRetry(): void;
  onSignIn(): void;
}): React.JSX.Element | null {
  if (shown.kind === "draft") {
    return null;
  }
  if (shown.kind === "loading") {
    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-md border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          <Loader2Icon aria-hidden className="size-3.5 animate-spin" />
          Loading the preview…
        </div>
      </div>
    );
  }
  const signedOut = shown.kind === "signed-out";
  return (
    <div
      role="alert"
      className="absolute inset-0 flex items-center justify-center bg-muted/95 p-6 backdrop-blur-sm"
    >
      <div className="flex max-w-72 flex-col items-center gap-3 text-center">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-full border bg-background",
            signedOut ? "text-muted-foreground" : "text-destructive",
          )}
        >
          {signedOut ? (
            <LogInIcon aria-hidden className="size-5" />
          ) : (
            <AlertTriangleIcon aria-hidden className="size-5" />
          )}
        </div>
        <p className="text-sm font-medium">
          {signedOut ? "Sign in to preview" : "The preview could not render"}
        </p>
        <p className="text-xs text-muted-foreground">
          {signedOut
            ? "Your session ended, so the server cannot read the drafts. Your edits are kept in this browser."
            : "The API did not answer, or the page failed to render. Your edits are not affected."}
        </p>
        {signedOut ? (
          <Button size="sm" onClick={onSignIn}>
            Sign in
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RotateCwIcon aria-hidden />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
