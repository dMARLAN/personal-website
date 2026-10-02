"use client";

import { FileTextIcon, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { SectionId } from "./api";
import { isDirty, type Sections } from "./consoleState";
import { SECTION_GROUPS, SECTIONS } from "./sections";

export const RESUME_PDF = "resume-pdf";
export type Panel = SectionId | typeof RESUME_PDF;

function NavItem({
  active,
  dirty,
  draft,
  onClick,
  children,
}: {
  active: boolean;
  dirty: boolean;
  draft: boolean;
  onClick(): void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <li>
      <button
        type="button"
        aria-current={active ? "page" : undefined}
        onClick={onClick}
        className={cn(
          "flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          active
            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        )}
      >
        <span className="flex-1 truncate">{children}</span>
        {draft ? (
          <span className="rounded-sm border border-sky-600/40 px-1 text-[10px] leading-4 font-medium text-sky-700 dark:border-sky-400/40 dark:text-sky-300">
            DRAFT
            <span className="sr-only"> saved</span>
          </span>
        ) : null}
        {dirty ? (
          <span
            className="size-2 shrink-0 rounded-full bg-amber-500"
            title="Unsaved changes"
          >
            <span className="sr-only">, unsaved changes</span>
          </span>
        ) : null}
      </button>
    </li>
  );
}

/** The section list, grouped, with a dot on each section that has unsaved edits. */
export function Sidebar({
  sections,
  panel,
  onPanel,
  autoUppercase,
  onAutoUppercase,
  expiresAt,
  onSignOut,
}: {
  sections: Sections;
  panel: Panel;
  onPanel(panel: Panel): void;
  autoUppercase: boolean;
  onAutoUppercase(on: boolean): void;
  expiresAt: string;
  onSignOut(): void;
}): React.JSX.Element {
  return (
    <div className="flex h-full min-h-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <div
          aria-hidden
          className="flex size-6 items-center justify-center rounded-md bg-primary font-mono text-[11px] font-semibold text-primary-foreground"
        >
          A
        </div>
        <h1 className="text-sm font-semibold">Site admin</h1>
      </div>
      <nav
        aria-label="Sections"
        className="min-h-0 flex-1 overflow-y-auto px-2 py-3"
      >
        {SECTION_GROUPS.map((group) => (
          <div key={group} className="mb-4">
            <h2 className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {group}
            </h2>
            <ul className="flex flex-col gap-0.5">
              {SECTIONS.filter((section) => section.group === group).map(
                ({ id, label }) => {
                  const edit = sections[id];
                  return (
                    <NavItem
                      key={id}
                      active={panel === id}
                      dirty={edit !== undefined && isDirty(edit)}
                      draft={edit?.draftSavedAt != null}
                      onClick={() => onPanel(id)}
                    >
                      {label}
                    </NavItem>
                  );
                },
              )}
              {group === "Site content" ? (
                <NavItem
                  active={panel === RESUME_PDF}
                  dirty={false}
                  draft={false}
                  onClick={() => onPanel(RESUME_PDF)}
                >
                  <span className="flex items-center gap-1.5">
                    Résumé PDF
                    <FileTextIcon
                      aria-hidden
                      className="size-3.5 text-muted-foreground"
                    />
                  </span>
                </NavItem>
              ) : null}
            </ul>
          </div>
        ))}
      </nav>
      <div className="flex shrink-0 flex-col gap-3 border-t p-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <Label
            htmlFor="auto-uppercase"
            className="text-xs font-normal text-sidebar-foreground/80"
          >
            Auto-uppercase DDI text
          </Label>
          <Switch
            id="auto-uppercase"
            size="sm"
            checked={autoUppercase}
            onCheckedChange={onAutoUppercase}
          />
        </div>
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="text-[11px] text-muted-foreground">
            Session ends{" "}
            {new Date(expiresAt).toLocaleTimeString(undefined, {
              timeStyle: "short",
            })}
          </p>
          <Button variant="ghost" size="xs" onClick={onSignOut}>
            <LogOutIcon aria-hidden />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
