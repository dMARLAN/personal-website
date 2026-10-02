"use client";

import { useEffect } from "react";
import { useOsbPress } from "../../frame/Osb";
import { checkStatus, groupStatus, type LiveCheck } from "./status";
import { bitTests, useBitTests } from "./store";

/**
 * A status cell. The server draws every status the cell can reach (`options`); the client shows the one the test
 * state picks, so the stroke font never ships to the browser.
 */
export function LiveStatus({
  checks,
  summary,
  options,
}: {
  checks: readonly LiveCheck[];
  summary: "check" | "group";
  options: Readonly<Record<string, React.ReactNode>>;
}): React.JSX.Element {
  const state = useBitTests();
  const status =
    summary === "check"
      ? checkStatus(checks[0], state)
      : groupStatus(checks, state);
  if (!(status in options)) {
    throw new Error(`No drawn status ${JSON.stringify(status)}`);
  }
  return (
    <g
      data-bit-checks={checks.map((check) => check.id).join(" ")}
      data-bit-status={status}
    >
      {options[status]}
    </g>
  );
}

/** The FCS-MC PB17 legend, which `FCS OPTION` (PB16) cycles through its labels (`MPD_BIT_FCS_OPTION_label`). */
export function LiveFcsOption({
  options,
}: {
  options: readonly React.ReactNode[];
}): React.ReactNode {
  return options[useBitTests().fcsOption];
}

export type BitCommand =
  | { kind: "test"; ids: readonly string[] }
  | { kind: "stop" }
  | { kind: "fcs-option"; count: number };

function run(command: BitCommand): void {
  switch (command.kind) {
    case "test":
      bitTests.start(command.ids, {
        instant: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
      return;
    case "stop":
      bitTests.stop();
      return;
    case "fcs-option":
      bitTests.cycleFcsOption(command.count);
      return;
  }
}

/**
 * An OSB cap that runs a BIT command. It fires on press like every OSB (design section 5.1), through the shared
 * `useOsbPress`. It is local state, so it is marked as a state
 * OSB and the plain view hides it.
 */
export function BitOsbButton({
  label,
  command,
}: {
  label: string;
  command: BitCommand;
}): React.JSX.Element {
  // A button has no native action, so a click with no press before it must run the command too.
  const { pressed, handlers } = useOsbPress(() => run(command), true);
  return (
    <button
      type="button"
      className="ddi-osb"
      data-action="state"
      data-pressed={pressed || undefined}
      // The island carries the placement; the cap fills it.
      style={{ margin: 0 }}
      {...handlers}
    >
      <span className="ddi-osb-label">{label}</span>
    </button>
  );
}

/**
 * Clears the test state when the page unmounts, so it starts fresh on every visit (design section 9.4). It lives in
 * the semantic layer because that is mounted for the page's whole life, while each BIT level's screen unmounts when
 * the level changes.
 */
export function BitSession(): null {
  useEffect(() => () => bitTests.reset(), []);
  return null;
}
