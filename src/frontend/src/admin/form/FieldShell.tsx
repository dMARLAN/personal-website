"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { counterTone, type CounterTone } from "../schema/text";

const TONE_TEXT: Readonly<Record<CounterTone, string>> = {
  ok: "text-muted-foreground",
  near: "text-amber-700 dark:text-amber-400",
  over: "text-destructive",
};

/**
 * How a field lays out. Stacked is the default; compact is a cell of a table-like row (status rows, links): the
 * counter sits inside the control, the help text moves to the label's tooltip, and only the first row shows labels.
 */
export interface FieldDisplay {
  compact: boolean;
  labelHidden: boolean;
}

export const STACKED: FieldDisplay = { compact: false, labelHidden: false };

function Counter({
  id,
  counter,
  rows,
  compact,
}: {
  id: string;
  counter: { length: number; max: number } | null;
  rows: { used: number; max: number } | null;
  compact: boolean;
}): React.JSX.Element | null {
  if (counter === null && rows === null) {
    return null;
  }
  const charTone =
    counter === null ? "ok" : counterTone(counter.length, counter.max);
  const rowTone = rows === null ? "ok" : counterTone(rows.used, rows.max);
  return (
    <span
      id={`${id}--counter`}
      className={cn(
        "flex gap-2 font-mono text-[11px] tabular-nums",
        compact && "pointer-events-none absolute top-[11px] right-2.5",
      )}
    >
      {rows === null ? null : (
        <span className={TONE_TEXT[rowTone]} data-tone={rowTone}>
          {rows.used}/{rows.max} rows
        </span>
      )}
      {counter === null ? null : (
        <span className={TONE_TEXT[charTone]} data-tone={charTone} data-counter>
          {counter.length}/{counter.max}
          <span className="sr-only"> characters</span>
        </span>
      )}
    </span>
  );
}

/** One field: its label (with the live character counter), the control, its help text and its messages. */
export function FieldShell({
  id,
  label,
  required,
  counter,
  rows = null,
  help,
  messages,
  display = STACKED,
  className,
  children,
}: {
  id: string;
  label: string;
  required: boolean;
  /** Characters used and allowed, for a string with a `maxLength`. */
  counter: { length: number; max: number } | null;
  /** Rows used and allowed, for wrapped text (`x-ddi-wrap`). */
  rows?: { used: number; max: number } | null;
  help: string | null;
  messages: readonly string[];
  display?: FieldDisplay;
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const counterElement = (
    <Counter id={id} counter={counter} rows={rows} compact={display.compact} />
  );
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div
        className={cn(
          "flex min-h-4 items-baseline justify-between gap-2",
          display.labelHidden && "sr-only",
        )}
      >
        <Label
          htmlFor={id}
          className="text-xs font-medium text-foreground/85"
          title={display.compact && help !== null ? help : undefined}
        >
          {label}
          {required ? null : (
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          )}
        </Label>
        {display.compact ? null : counterElement}
      </div>
      {display.compact ? (
        <div className="relative [&_input]:pr-12 [&_textarea]:pr-12">
          {children}
          {counterElement}
        </div>
      ) : (
        children
      )}
      {help === null || display.compact ? null : (
        <p
          id={`${id}--help`}
          className="text-xs leading-snug text-muted-foreground"
        >
          {help}
        </p>
      )}
      {messages.length === 0 ? null : (
        <ul id={`${id}--error`} className="text-xs text-destructive">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The ids a control's `aria-describedby` lists: its counter, help and messages, where they exist. */
export function describedBy(
  id: string,
  parts: { counter: boolean; help: boolean; messages: boolean },
): string | undefined {
  const ids = [
    parts.counter ? `${id}--counter` : null,
    parts.help ? `${id}--help` : null,
    parts.messages ? `${id}--error` : null,
  ].filter((part) => part !== null);
  return ids.length === 0 ? undefined : ids.join(" ");
}

export function toneBorder(tone: CounterTone | null, invalid: boolean): string {
  if (invalid || tone === "over") {
    return "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20";
  }
  if (tone === "near") {
    return "border-amber-500/70 focus-visible:ring-amber-500/25";
  }
  return "";
}
