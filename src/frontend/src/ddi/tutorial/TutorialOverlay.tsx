"use client";

import { useLayoutEffect } from "react";
import { KNOB_DIAMETER, OSB_ART } from "../constants";
import { plainViewRequested } from "../controls/store";
import { pbAnchor } from "../geometry";
import { MENU_LEGEND } from "../pages/menuLegend";
import { TUTORIAL_OPEN, storeTutorialDone, tutorialPending } from "./state";

/** (ours) The clear space between a bracket and the control it marks, in DI. */
const BRACKET_GAP = 3;
const OSB_HALF = OSB_ART / 2 + BRACKET_GAP;
const MENU_X = pbAnchor(MENU_LEGEND.pb)[0];

/**
 * Every bracket's geometry in DI, from the same PB anchors and bezel constants as the frame, as unitless custom
 * properties. tutorial.css multiplies them by `--k`, so the callouts track the controls at every viewport size with no
 * JavaScript measurement.
 */
const GEOMETRY: React.CSSProperties = {
  "--t-osb-half": OSB_HALF,
  "--t-row-left": pbAnchor(6)[0] - OSB_HALF,
  "--t-row-right": pbAnchor(10)[0] + OSB_HALF,
  "--t-column-top": pbAnchor(5)[1] + OSB_HALF,
  "--t-column-bottom": pbAnchor(1)[1] - OSB_HALF,
  // Between PB4 and PB5, where the left column's legends leave a gap.
  "--t-column-gap": (pbAnchor(4)[1] + pbAnchor(5)[1]) / 2,
  "--t-menu-x": MENU_X,
  // PB18's leader rises midway to PB17, clear of both legends and of the TAC/SUPT title box above MENU.
  "--t-menu-riser": (MENU_X + pbAnchor(17)[0]) / 2 - MENU_X,
  "--t-knob-half": KNOB_DIAMETER / 2 + 2 * BRACKET_GAP,
};

/** Keys that move focus or only modify another key: they do not count as a press. */
const PASSIVE_KEYS = new Set([
  "Tab",
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
]);

function closeTutorial(): void {
  storeTutorialDone();
  delete document.documentElement.dataset.tutorial;
}

/**
 * Opens the tutorial for a first visit and closes it for good on the visitor's first press anywhere: a pointer press,
 * any key but Tab and the modifiers, or the wheel on a knob. The listeners only observe, in the capture phase, so the
 * press that closes the overlay also does its normal job.
 */
function useFirstVisit(): void {
  useLayoutEffect(() => {
    if (plainViewRequested() || !tutorialPending()) {
      return;
    }
    // The pre-paint script already set this. React drops <html> attributes when it remounts the root layout in
    // development, so set it again before paint.
    document.documentElement.dataset.tutorial = TUTORIAL_OPEN;

    const controller = new AbortController();
    const close = (): void => {
      closeTutorial();
      controller.abort();
    };
    const options = { capture: true, passive: true, signal: controller.signal };
    window.addEventListener("pointerdown", close, options);
    window.addEventListener(
      "keydown",
      (event) => {
        if (!PASSIVE_KEYS.has(event.key)) {
          close();
        }
      },
      options,
    );
    window.addEventListener(
      "wheel",
      (event) => {
        if (
          event.target instanceof Element &&
          event.target.closest(".ddi-knob")
        ) {
          close();
        }
      },
      options,
    );
    return () => controller.abort();
  }, []);
}

interface CalloutProps {
  target: "osbs" | "menu" | "brt" | "cont" | "theme";
  children: React.ReactNode;
}

/** One label with its leader line. The label's underline is the leader's shelf. */
function Callout({ target, children }: CalloutProps): React.JSX.Element {
  return (
    <li className={`ddi-callout ddi-callout-${target}`}>
      <span className="ddi-callout-leader" aria-hidden="true" />
      <span className="ddi-callout-label">{children}</span>
    </li>
  );
}

/**
 * The one-screen first-visit tutorial (docs/design.md section 5.6). It is a non-modal dialog: it never takes focus or
 * blocks a pointer, so every control stays usable, and the first press closes it. CSS shows it only while
 * `<html data-tutorial="open">` is set.
 */
export function TutorialOverlay(): React.JSX.Element {
  useFirstVisit();
  return (
    <div
      className="ddi-tutorial"
      role="dialog"
      aria-modal="false"
      aria-labelledby="ddi-tutorial-title"
      style={GEOMETRY}
    >
      <div className="ddi-tutorial-marks" aria-hidden="true">
        <i className="ddi-bracket ddi-bracket-top" />
        <i className="ddi-bracket ddi-bracket-bottom" />
        <i className="ddi-bracket ddi-bracket-left" />
        <i className="ddi-bracket ddi-bracket-right" />
        <i className="ddi-bracket ddi-bracket-menu" />
        <i className="ddi-bracket ddi-bracket-brt" />
        <i className="ddi-bracket ddi-bracket-cont" />
        <i className="ddi-bracket ddi-bracket-theme" />
      </div>
      <ul className="ddi-callouts">
        <Callout target="osbs">Press the buttons to navigate</Callout>
        <Callout target="menu">MENU switches TAC and SUPT</Callout>
        <Callout target="brt">
          <b>Brightness</b> Drag or scroll
        </Callout>
        <Callout target="cont">
          <b>Contrast</b> Drag or scroll
        </Callout>
        <Callout target="theme">Day / night</Callout>
      </ul>
      <div className="ddi-tutorial-panel">
        <h2 id="ddi-tutorial-title">Quick start</h2>
        <p>Any press closes this guide.</p>
        <button
          type="button"
          className="ddi-tutorial-close"
          onClick={closeTutorial}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
