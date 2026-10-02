import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VIEW_STORAGE_KEY } from "../controls/state";
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
    ["a pointer press", () => fireEvent.pointerDown(document.body)],
    ["Escape", () => fireEvent.keyDown(document.body, { key: "Escape" })],
    ["Enter", () => fireEvent.keyDown(document.body, { key: "Enter" })],
  ])("closes for good on %s", (_, press) => {
    render(<TutorialOverlay />);
    press();
    expect(openState()).toBeUndefined();
    expect(localStorage.getItem(TUTORIAL_STORAGE_KEY)).toBe(TUTORIAL_DONE);
  });

  it("closes from the Got it button", () => {
    render(<TutorialOverlay />);
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(openState()).toBeUndefined();
    expect(localStorage.getItem(TUTORIAL_STORAGE_KEY)).toBe(TUTORIAL_DONE);
  });

  it("stays open while the visitor only tabs or holds a modifier", () => {
    render(<TutorialOverlay />);
    fireEvent.keyDown(document.body, { key: "Tab" });
    fireEvent.keyDown(document.body, { key: "Shift" });
    expect(openState()).toBe("open");
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
