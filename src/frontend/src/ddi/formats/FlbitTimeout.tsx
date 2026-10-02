"use client";

import { useEffect } from "react";
import { useScreenState } from "../frame/screenState";

/** The fuel low BIT runs for 13 s, with FLBIT boxed meanwhile [gpg §5]. */
export const FLBIT_SECONDS = 13;

/** Mounted only on the FLBIT screen: returns to `state` when the test ends. Draws nothing. */
export function FlbitTimeout({ state }: { state: string }): null {
  const { setState } = useScreenState();
  useEffect(() => {
    const timeout = setTimeout(() => setState(state), FLBIT_SECONDS * 1000);
    return () => clearTimeout(timeout);
  }, [setState, state]);
  return null;
}
