"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LiveCopy } from "./consoleState";
import { diffDocuments } from "./schema/diff";
import type { FieldNode } from "./schema/fields";
import type { JsonValue } from "./schema/jsonSchema";
import { describePointer } from "./schema/serverIssues";

const MAX_ROWS = 50;

function show(value: JsonValue | undefined): string {
  if (value === undefined) {
    return "—";
  }
  return typeof value === "string" ? value : JSON.stringify(value);
}

/** A publish was refused with 412: what changed, and the three ways on. */
export function ConflictDialog({
  label,
  fields,
  theirs,
  mine,
  busy,
  onKeepEditing,
  onTakeTheirs,
  onOverwrite,
}: {
  label: string;
  fields: FieldNode;
  theirs: LiveCopy;
  mine: JsonValue;
  busy: boolean;
  onKeepEditing(): void;
  onTakeTheirs(): void;
  onOverwrite(): void;
}): React.JSX.Element {
  const changes = diffDocuments(theirs.document, mine);
  return (
    <Dialog open onOpenChange={(open) => (open ? null : onKeepEditing())}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{label} changed since you loaded it</DialogTitle>
          <DialogDescription>
            Not published: this section changed since you loaded it, for example
            in another tab (published{" "}
            {new Date(theirs.updatedAt).toLocaleString()}). Your edits are still
            here.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-auto rounded-md border">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">
              Differences between the published version and yours
            </caption>
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Field
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Published now
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Yours
                </th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono">
              {changes.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-2 font-sans text-muted-foreground"
                  >
                    No differences: publishing yours changes nothing.
                  </td>
                </tr>
              ) : (
                changes.slice(0, MAX_ROWS).map((change) => (
                  <tr key={change.pointer} className="align-top">
                    <th
                      scope="row"
                      className="px-3 py-1.5 font-sans font-normal text-muted-foreground"
                    >
                      {describePointer(fields, change.pointer)}
                    </th>
                    <td className="px-3 py-1.5 break-all text-red-700 dark:text-red-400">
                      {show(change.before)}
                    </td>
                    <td className="px-3 py-1.5 break-all text-emerald-700 dark:text-emerald-400">
                      {show(change.after)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {changes.length > MAX_ROWS ? (
          <p className="text-xs text-muted-foreground">
            and {changes.length - MAX_ROWS} more differences.
          </p>
        ) : null}
        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={onKeepEditing}>
            Keep editing
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onTakeTheirs}
            >
              Reload the latest version
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={onOverwrite}
            >
              Overwrite with mine
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
