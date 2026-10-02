"use client";

import { createContext, useContext, useState } from "react";

interface ScreenStateValue {
  state: string;
  setState: (state: string) => void;
}

const ScreenStateContext = createContext<ScreenStateValue | null>(null);

/**
 * Holds a page's in-section state, for example TAC or SUPT on the menu (docs/design.md section 9.4). It is local
 * client state, not a URL, and it starts at `initial` every time the page mounts.
 */
export function ScreenStateProvider({
  initial,
  children,
}: {
  initial: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const [state, setState] = useState(initial);
  return (
    <ScreenStateContext value={{ state, setState }}>
      {children}
    </ScreenStateContext>
  );
}

export function useScreenState(): ScreenStateValue {
  const value = useContext(ScreenStateContext);
  if (value === null) {
    throw new Error("useScreenState needs a ScreenStateProvider");
  }
  return value;
}

/** Renders the server-rendered node for the current in-section state. */
export function ScreenStateSlot({
  states,
}: {
  states: Readonly<Record<string, React.ReactNode>>;
}): React.ReactNode {
  return states[useScreenState().state];
}
