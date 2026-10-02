"use client";

import { useLayoutEffect, useState } from "react";
import { CORNER_VARIABLES } from "@/theme/corner";
import { KNOB_COLLAR_RADIUS, OSB_ART } from "../constants";
import { plainViewRequested } from "../controls/store";
import { pbAnchor } from "../geometry";
import { MENU_LEGEND } from "../pages/menuLegend";
import { TUTORIAL_OSB_RISER_X, TUTORIAL_OSB_X } from "./highlight";
import { TUTORIAL_OPEN, storeTutorialDone, tutorialPending } from "./state";

/** (ours) The clear space between a bracket and the control it marks, in DI. */
const BRACKET_GAP = 3;
const MENU_X = pbAnchor(MENU_LEGEND.pb)[0];

/**
 * Every bracket's geometry in DI, from the same PB anchors and bezel constants as the frame, as unitless custom
 * properties, plus the corner buttons' px placement. tutorial.css multiplies the DI values by `--k`, so the callouts
 * track the controls at every viewport size with no JavaScript measurement.
 */
const GEOMETRY: React.CSSProperties = {
  ...CORNER_VARIABLES,
  "--t-gap": BRACKET_GAP,
  "--t-osb-half": OSB_ART / 2 + BRACKET_GAP,
  "--t-knob-half": KNOB_COLLAR_RADIUS + BRACKET_GAP,
  "--t-osb-x": TUTORIAL_OSB_X,
  "--t-osb-riser": TUTORIAL_OSB_RISER_X - TUTORIAL_OSB_X,
  "--t-menu-x": MENU_X,
  // PB18's leader rises midway to PB17, clear of both legends and of the TAC/SUPT title box above MENU.
  "--t-menu-riser": (MENU_X + pbAnchor(17)[0]) / 2 - MENU_X,
};

/** The controls whose press closes the tutorial: every OSB, the theme toggle and the homepage link. */
const BUTTONS = ".ddi-osb, .ddi-osb-island, .theme-toggle, .ddi-home-link";
const KNOBS = ".ddi-knob";
/** The keys that press each kind of control from the keyboard: see useOsbPress and Knob. */
const BUTTON_KEYS = new Set(["Enter", " "]);
const KNOB_KEYS = new Set([
  "ArrowUp",
  "ArrowRight",
  "ArrowDown",
  "ArrowLeft",
  "Home",
  "End",
]);

function within(target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null;
}

/** A primary press on a control: the pointer half of the close (section 5.6). */
function pressesControl(event: PointerEvent): boolean {
  return event.button === 0 && within(event.target, `${BUTTONS}, ${KNOBS}`);
}

/** A key that presses the focused control, or Escape, the usual way to dismiss a dialog. */
function keyPressesControl(event: KeyboardEvent): boolean {
  return (
    event.key === "Escape" ||
    (BUTTON_KEYS.has(event.key) && within(event.target, BUTTONS)) ||
    (KNOB_KEYS.has(event.key) && within(event.target, KNOBS))
  );
}

function closeTutorial(): void {
  storeTutorialDone();
  delete document.documentElement.dataset.tutorial;
}

/**
 * Opens the tutorial for a first visit and closes it for good when the visitor first presses a bezel control: an OSB,
 * a knob, the theme toggle or the homepage link, by pointer, keyboard or the wheel on a knob. Escape and "Got it"
 * close it too. A press anywhere else, on the glass or the dimmed bezel, does nothing. The listeners only observe, in
 * the capture phase, so the press that closes the overlay also does its normal job.
 *
 * The pre-paint script shows the overlay before this hydrates, when nothing can close it yet. It returns whether the
 * listeners are attached.
 */
function useFirstVisit(): boolean {
  const [listening, setListening] = useState(false);
  useLayoutEffect(() => {
    if (plainViewRequested() || !tutorialPending()) {
      return;
    }
    // The pre-paint script already set this. React drops <html> attributes when it remounts the root layout in
    // development, so set it again before paint.
    document.documentElement.dataset.tutorial = TUTORIAL_OPEN;

    const controller = new AbortController();
    const closeWhen =
      <T extends Event>(presses: (event: T) => boolean) =>
      (event: T): void => {
        if (presses(event)) {
          closeTutorial();
          controller.abort();
        }
      };
    const options = { capture: true, passive: true, signal: controller.signal };
    window.addEventListener("pointerdown", closeWhen(pressesControl), options);
    window.addEventListener("keydown", closeWhen(keyPressesControl), options);
    window.addEventListener(
      "wheel",
      closeWhen((event: WheelEvent) => within(event.target, KNOBS)),
      options,
    );
    // Attaching the listeners is the external system: the state records that it happened, once per mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setListening(true);
    return () => controller.abort();
  }, []);
  return listening;
}

type Target = "osb" | "menu" | "brt" | "cont" | "home" | "theme";

const TARGETS: readonly Target[] = [
  "osb",
  "menu",
  "brt",
  "cont",
  "home",
  "theme",
];

interface CalloutProps {
  target: Target;
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
 * blocks a pointer, so every control stays usable, and the first press of a control closes it. CSS shows it only while
 * `<html data-tutorial="open">` is set.
 */
export function TutorialOverlay(): React.JSX.Element {
  const listening = useFirstVisit();
  return (
    <div
      className="ddi-tutorial"
      role="dialog"
      aria-modal="false"
      aria-labelledby="ddi-tutorial-title"
      style={GEOMETRY}
    >
      <div className="ddi-tutorial-marks" aria-hidden="true">
        {TARGETS.map((target) => (
          <i key={target} className={`ddi-bracket ddi-bracket-${target}`} />
        ))}
      </div>
      <ul className="ddi-callouts">
        <Callout target="osb">Press the buttons to navigate</Callout>
        <Callout target="menu">MENU switches TAC and SUPT</Callout>
        <Callout target="brt">
          <b>Brightness</b> Drag or scroll
        </Callout>
        <Callout target="cont">
          <b>Contrast</b> Drag or scroll
        </Callout>
        <Callout target="home">Standard homepage</Callout>
        <Callout target="theme">Day / night</Callout>
      </ul>
      <div className="ddi-tutorial-panel">
        <h2 id="ddi-tutorial-title">Quick start</h2>
        <p>Press any button to begin.</p>
        {/* Disabled until the close listeners are attached, since before then neither it nor Escape works. */}
        <button
          type="button"
          className="ddi-tutorial-close"
          aria-disabled={!listening}
          onClick={closeTutorial}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
