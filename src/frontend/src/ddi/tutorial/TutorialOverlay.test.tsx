import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VIEW_STORAGE_KEY } from "../controls/state";
import { pbEdge } from "../geometry";
import { PAGES, menuLegends } from "../pages/registry";
import { TUTORIAL_OSB } from "./highlight";
import { TUTORIAL_DONE, TUTORIAL_STORAGE_KEY } from "./state";
import { TutorialOverlay } from "./TutorialOverlay";

function openState(): string | undefined {
  return document.documentElement.dataset.tutorial;
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-tutorial");
});

describe("the first-visit tutorial", () => {
  it("opens on a first visit as a non-modal dialog", () => {
    render(<TutorialOverlay />);
    expect(openState()).toBe("open");
    const dialog = screen.getByRole("dialog", { name: "Quick start" });
    expect(dialog).toHaveAttribute("aria-modal", "false");
  });

  it("stays shut once dismissed", () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, TUTORIAL_DONE);
    render(<TutorialOverlay />);
    expect(openState()).toBeUndefined();
  });

  it("stays shut in the plain view", () => {
    localStorage.setItem(VIEW_STORAGE_KEY, "plain");
    render(<TutorialOverlay />);
    expect(openState()).toBeUndefined();
  });

  it.each([
    ["the glass", "ddi-screen"],
    ["the dimmed backdrop", "ddi-tutorial"],
    ["empty bezel", "ddi-frame"],
  ])("stays open on a press on %s", (_, className) => {
    const { container } = render(
      <div className="ddi-frame">
        <div className="ddi-screen" />
        <TutorialOverlay />
      </div>,
    );
    const target = container.querySelector(`.${className}`);
    if (target === null) {
      throw new Error(`no .${className}`);
    }
    fireEvent.pointerDown(target, { button: 0 });
    expect(openState()).toBe("open");
  });

  it("stays open on keys that press nothing: Enter on the page, letters, Tab and the modifiers", () => {
    render(<TutorialOverlay />);
    for (const key of ["Enter", " ", "a", "Tab", "Shift", "ArrowUp"]) {
      fireEvent.keyDown(document.body, { key });
    }
    expect(openState()).toBe("open");
  });

  it.each([
    ["an OSB", <button key="osb" type="button" className="ddi-osb" />],
    [
      "the theme toggle",
      <button key="theme" type="button" className="theme-toggle" />,
    ],
    [
      "the homepage link",
      <a key="home" href={PAGES.home.path} className="ddi-home-link" />,
    ],
    [
      "a knob",
      <div key="knob" role="slider" aria-valuenow={50} className="ddi-knob" />,
    ],
  ])("closes for good on a primary press of %s", (_, control) => {
    const { container } = render(
      <>
        <TutorialOverlay />
        {control}
      </>,
    );
    const target = container.lastElementChild;
    if (target === null) {
      throw new Error("no control");
    }
    fireEvent.pointerDown(target, { button: 2 });
    expect(openState()).toBe("open");
    fireEvent.pointerDown(target, { button: 0 });
    expect(openState()).toBeUndefined();
    expect(localStorage.getItem(TUTORIAL_STORAGE_KEY)).toBe(TUTORIAL_DONE);
  });

  it.each(["Enter", " "])("closes when %j presses a focused OSB", (key) => {
    render(
      <>
        <TutorialOverlay />
        <button type="button" className="ddi-osb">
          About
        </button>
      </>,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "About" }), { key });
    expect(openState()).toBeUndefined();
  });

  it("closes on an arrow key on a focused knob, not on Enter", () => {
    render(
      <>
        <TutorialOverlay />
        <div role="slider" aria-valuenow={50} className="ddi-knob" />
      </>,
    );
    const knob = screen.getByRole("slider");
    fireEvent.keyDown(knob, { key: "Enter" });
    expect(openState()).toBe("open");
    fireEvent.keyDown(knob, { key: "ArrowRight" });
    expect(openState()).toBeUndefined();
  });

  it("closes on Escape anywhere", () => {
    render(<TutorialOverlay />);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(openState()).toBeUndefined();
    expect(localStorage.getItem(TUTORIAL_STORAGE_KEY)).toBe(TUTORIAL_DONE);
  });

  it("closes from the Got it button", () => {
    render(<TutorialOverlay />);
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(openState()).toBeUndefined();
    expect(localStorage.getItem(TUTORIAL_STORAGE_KEY)).toBe(TUTORIAL_DONE);
  });

  it("closes on the wheel over a knob, not elsewhere", () => {
    render(
      <>
        <TutorialOverlay />
        <div role="slider" aria-valuenow={50} className="ddi-knob" />
      </>,
    );
    fireEvent.wheel(document.body);
    expect(openState()).toBe("open");
    fireEvent.wheel(screen.getByRole("slider"));
    expect(openState()).toBeUndefined();
  });
});

describe("the highlighted OSB", () => {
  it("is a top-row OSB with a live legend on TAC", () => {
    const legend = menuLegends("TAC").find((spec) => spec.pb === TUTORIAL_OSB);
    expect(legend?.action.kind).toBe("link");
    expect(pbEdge(TUTORIAL_OSB)).toBe("top");
  });
});
