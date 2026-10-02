"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]";

/**
 * The semantic `<main>`. In DDI mode it is visually hidden, so its links would be invisible tab stops (WCAG 2.4.7):
 * take them out of the tab order there. Screen readers still read and follow them, and the OSBs carry the same
 * navigation. The plain view shows them, so they stay tabbable. The view only changes on a reload (design 10.2).
 */
export function SemanticMain({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    if (
      main.current === null ||
      document.documentElement.dataset.view === "plain"
    ) {
      return;
    }
    for (const element of main.current.querySelectorAll(FOCUSABLE)) {
      element.setAttribute("tabindex", "-1");
    }
  }, []);
  return (
    <main ref={main} id="content" className="ddi-semantic">
      {children}
    </main>
  );
}
