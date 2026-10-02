import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTROLS_STORAGE_KEY } from "../controls/state";
import { menuScreen } from "../pages/menus";
import { FullViewportFrame } from "./FullViewportFrame";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function renderTac(): HTMLElement {
  const { container } = render(
    <FullViewportFrame screen={menuScreen("TAC")} />,
  );
  return container;
}

beforeEach(() => {
  push.mockClear();
});

describe("the OSBs", () => {
  it("render the PB18 legend as a link with its accessible name", () => {
    renderTac();
    const nav = screen.getByRole("navigation", { name: "Display pushbuttons" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName("Support menu");
    expect(links[0]).toHaveAttribute("href", "/supt");
  });

  it("hide blank OSBs from assistive technology and the tab order", () => {
    const container = renderTac();
    const blank = container.querySelectorAll(".ddi-osb[aria-hidden='true']");
    expect(blank).toHaveLength(19);
    for (const button of blank) {
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveAttribute("tabindex", "-1");
    }
  });

  it("fire on press and swallow the click that follows", () => {
    renderTac();
    const menu = screen.getByRole("link", { name: "Support menu" });
    fireEvent.pointerDown(menu, { button: 0 });
    expect(push).toHaveBeenCalledWith("/supt");
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    menu.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("fire on Enter and Space, once per press", () => {
    renderTac();
    const menu = screen.getByRole("link", { name: "Support menu" });
    fireEvent.keyDown(menu, { key: "Enter" });
    fireEvent.keyDown(menu, { key: "Enter", repeat: true });
    fireEvent.keyUp(menu, { key: "Enter" });
    fireEvent.keyDown(menu, { key: " " });
    expect(push).toHaveBeenCalledTimes(2);
  });

  it("ignore secondary-button presses", () => {
    renderTac();
    fireEvent.pointerDown(screen.getByRole("link", { name: "Support menu" }), {
      button: 2,
    });
    expect(push).not.toHaveBeenCalled();
  });
});

describe("the bezel controls", () => {
  function knob(name: string): HTMLElement {
    const slider = screen.getByRole("slider", { name });
    vi.spyOn(slider, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 0, 84, 84),
    );
    return slider;
  }

  function percent(name: string): number {
    return Number(
      screen.getByRole("slider", { name }).getAttribute("aria-valuenow"),
    );
  }

  it("step BRT with the halves, the wheel and the arrow keys", () => {
    renderTac();
    const brightness = knob("Brightness");
    const start = percent("Brightness");
    fireEvent.click(brightness, { clientX: 10, clientY: 42 });
    expect(percent("Brightness")).toBe(start - 10);
    fireEvent.wheel(brightness, { deltaY: 100 });
    expect(percent("Brightness")).toBe(start - 30);
    fireEvent.keyDown(brightness, { key: "ArrowUp" });
    expect(percent("Brightness")).toBe(start - 20);
    fireEvent.click(brightness, { clientX: 74, clientY: 42 });
    fireEvent.click(brightness, { clientX: 74, clientY: 42 });
    expect(percent("Brightness")).toBe(start);
    expect(brightness).toHaveAttribute("aria-valuetext", `${start}%`);
  });

  it("send CONT to its end stops with Home and End, and persist it", () => {
    renderTac();
    const contrast = knob("Contrast");
    fireEvent.keyDown(contrast, { key: "End" });
    expect(percent("Contrast")).toBe(100);
    fireEvent.keyDown(contrast, { key: "Home" });
    fireEvent.keyDown(contrast, { key: "ArrowRight" });
    expect(percent("Contrast")).toBe(10);
    expect(
      JSON.parse(localStorage.getItem(CONTROLS_STORAGE_KEY) ?? "{}").cont,
    ).toBe(0.1);
  });

  it("stop the selector at its end stops", () => {
    renderTac();
    const toOff = screen.getByRole("button", { name: "Turn toward OFF" });
    const toDay = screen.getByRole("button", { name: "Turn toward DAY" });
    const mode = (): string | null =>
      screen.getByTestId("ddi-mode").textContent;
    for (let press = 0; press < 4; press += 1) {
      fireEvent.click(toDay);
    }
    expect(mode()).toBe("DAY");
    expect(toDay).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(toOff);
    expect(mode()).toBe("NIGHT");
    fireEvent.click(toOff);
    expect(mode()).toBe("OFF");
    expect(toOff).toHaveAttribute("aria-disabled", "true");
    expect(document.documentElement.dataset.ddiMode).toBe("OFF");
    fireEvent.click(toOff);
    expect(mode()).toBe("OFF");
    fireEvent.wheel(screen.getByRole("group", { name: "Display mode" }), {
      deltaY: -100,
    });
    expect(mode()).toBe("NIGHT");
  });
});
