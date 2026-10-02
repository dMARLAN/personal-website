"use client";

import { useEffect } from "react";
import { useOsbPress } from "../../frame/Osb";
import { mumiLoad, useMumiLoad, type MumiLoad } from "./store";
import { ADMIN_PATH } from "./structure";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * The load OSB. It fires on press like every OSB (design section 5.1): the load runs on the glass, then the page
 * navigates to the admin console. Without JavaScript it is a plain link there.
 */
export function LoadOsb({ label }: { label: string }): React.JSX.Element {
  const { pressed, handlers } = useOsbPress(
    () =>
      mumiLoad.start(() => window.location.assign(ADMIN_PATH), {
        instant: window.matchMedia(REDUCED_MOTION).matches,
      }),
    false,
  );
  return (
    <a
      href={ADMIN_PATH}
      className="ddi-osb"
      data-pressed={pressed || undefined}
      // The island carries the placement; the cap fills it.
      style={{ margin: 0 }}
      {...handlers}
    >
      <span className="ddi-osb-label">{label}</span>
    </a>
  );
}

/**
 * A slot on the glass that changes with the load. The server draws what each phase shows; the client picks one, so
 * the stroke font never ships to the browser. `loading` shows while the `MU LOAD` cue is lit and `blink` while it
 * is dark; a slot that does not blink passes the same node for both.
 */
export function LoadSlot({
  idle,
  loading,
  blink,
  complete,
}: {
  idle: React.ReactNode;
  loading: React.ReactNode;
  blink: React.ReactNode;
  complete: React.ReactNode;
}): React.JSX.Element {
  const load: MumiLoad = useMumiLoad();
  const shown = {
    idle,
    loading: load.phase === "loading" && load.cueOn ? loading : blink,
    complete,
  }[load.phase];
  return <g data-mumi-load={load.phase}>{shown}</g>;
}

/**
 * Clears the load when the page unmounts, or when the browser restores it from the back/forward cache after the
 * navigation, so it starts fresh on every visit (design section 9.4). It lives in the semantic layer, which is
 * mounted for the page's whole life.
 */
export function MumiSession(): null {
  useEffect(() => {
    const restore = (event: PageTransitionEvent): void => {
      if (event.persisted) {
        mumiLoad.reset();
      }
    };
    window.addEventListener("pageshow", restore);
    return () => {
      window.removeEventListener("pageshow", restore);
      mumiLoad.reset();
    };
  }, []);
  return null;
}
