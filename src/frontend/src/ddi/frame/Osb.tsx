"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { pbAnchor, pbEdge, type Pb } from "../geometry";
import { useScreenState } from "./screenState";
import type { LegendAction, LegendSpec } from "./types";

type PressableAction = Extract<
  LegendAction,
  { kind: "link" | "download" | "external" | "state" }
>;

function placement(pb: Pb): React.CSSProperties {
  const [x, y] = pbAnchor(pb);
  return { "--pb-x": x, "--pb-y": y };
}

function startDownload(href: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = "";
  anchor.click();
}

export interface OsbPress {
  pressed: boolean;
  handlers: Pick<
    React.DOMAttributes<HTMLElement>,
    "onPointerDown" | "onKeyDown" | "onKeyUp" | "onBlur" | "onClick"
  >;
}

/**
 * Fires `fire` on press, as DCS does (docs/design.md section 5.1): primary-button `pointerdown`, or Enter/Space
 * `keydown`. The `click` that follows a pointer press is suppressed so the action never fires twice. A `click` with
 * no press before it (no JavaScript yet, or an assistive technology's synthetic click) keeps its native behaviour,
 * or fires when `fireOnClick` is set because the element has no native action. Page islands use it for their OSBs.
 */
export function useOsbPress(fire: () => void, fireOnClick: boolean): OsbPress {
  const suppressClick = useRef(false);
  const [pressed, setPressed] = useState(false);
  return {
    pressed,
    handlers: {
      onPointerDown: (event) => {
        if (event.button !== 0) {
          return;
        }
        suppressClick.current = true;
        fire();
      },
      onKeyDown: (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }
        event.preventDefault();
        if (!event.repeat) {
          setPressed(true);
          fire();
        }
      },
      onKeyUp: () => setPressed(false),
      onBlur: () => setPressed(false),
      onClick: (event) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          event.preventDefault();
        } else if (fireOnClick) {
          fire();
        }
      },
    },
  };
}

function usePress(action: PressableAction): OsbPress {
  const router = useRouter();
  const { setState } = useScreenState();

  const fire = (): void => {
    switch (action.kind) {
      case "link":
        router.push(action.href);
        return;
      case "external":
        window.open(action.href, "_blank", "noopener,noreferrer");
        return;
      case "download":
        startDownload(action.href);
        return;
      case "state":
        setState(action.state);
        return;
    }
  };

  // A state button has no native action, so a click with no press before it must fire it.
  return useOsbPress(fire, action.kind === "state");
}

interface PressableOsbProps {
  pb: Pb;
  label: string;
  action: PressableAction;
}

function PressableOsb({
  pb,
  label,
  action,
}: PressableOsbProps): React.JSX.Element {
  const { pressed, handlers } = usePress(action);
  const props = {
    className: "ddi-osb",
    "data-edge": pbEdge(pb),
    "data-pb": pb,
    "data-pressed": pressed || undefined,
    style: placement(pb),
    ...handlers,
  };
  const name = <span className="ddi-osb-label">{label}</span>;
  switch (action.kind) {
    case "link":
      return (
        <Link href={action.href} {...props}>
          {name}
        </Link>
      );
    case "external":
      return (
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {name}
        </a>
      );
    case "download":
      return (
        <a href={action.href} download {...props}>
          {name}
        </a>
      );
    case "state":
      // Local state only: no URL, so the plain view hides it and the semantic layer carries every state's content.
      return (
        <button type="button" data-action="state" {...props}>
          {name}
        </button>
      );
  }
}

export interface OsbProps {
  pb: Pb;
  /** The OSB's legend; none means a blank OSB. */
  legend?: LegendSpec;
}

/** One bezel pushbutton. Its pressed look is CSS `:active` (or `data-pressed` for keys), with no transition. */
export function Osb({ pb, legend }: OsbProps): React.JSX.Element {
  const common = {
    "data-edge": pbEdge(pb),
    "data-pb": pb,
    style: placement(pb),
  };
  if (legend === undefined) {
    // A blank OSB still shows the press, as in DCS, but has no action and is hidden from assistive technology.
    return (
      <button
        type="button"
        className="ddi-osb"
        tabIndex={-1}
        aria-hidden="true"
        {...common}
      />
    );
  }
  const { label, action } = legend;
  switch (action.kind) {
    case "inert":
      return (
        <button
          type="button"
          className="ddi-osb"
          tabIndex={-1}
          aria-disabled="true"
          {...common}
        >
          <span className="ddi-osb-label">{label}</span>
        </button>
      );
    case "island":
      return (
        <div className="ddi-osb-island" {...common}>
          {action.render}
        </div>
      );
    default:
      return <PressableOsb pb={pb} label={label} action={action} />;
  }
}
