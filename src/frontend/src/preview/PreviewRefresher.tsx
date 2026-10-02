"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  REFRESH_MESSAGE,
  RENDERED_MESSAGE,
  type PreviewState,
  type RenderedMessage,
} from "./paths";

/**
 * Runs in a draft-mode page inside the admin's preview frame. On the admin's message it renders the page again from
 * the server (`router.refresh()`), which keeps client state such as a STEP or a sublevel and the scroll position, and
 * after every server render it tells the admin, so the admin knows the new content is on screen.
 */
export function PreviewRefresher({
  state,
  renderId,
}: {
  state: Exclude<PreviewState, "error">;
  renderId: string;
}): null {
  const router = useRouter();

  useEffect(() => {
    if (window.parent === window) {
      return;
    }
    const onMessage = (event: MessageEvent): void => {
      if (
        event.origin === window.location.origin &&
        event.source === window.parent &&
        event.data === REFRESH_MESSAGE
      ) {
        router.refresh();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  useEffect(() => {
    if (window.parent === window) {
      return;
    }
    const message: RenderedMessage = {
      type: RENDERED_MESSAGE,
      state,
      renderId,
    };
    window.parent.postMessage(message, window.location.origin);
  }, [state, renderId]);

  return null;
}
