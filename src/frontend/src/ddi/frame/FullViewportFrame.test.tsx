import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTROLS_STORAGE_KEY } from "../controls/state";
import { menuScreens } from "../pages/menus";
import { menuLegends } from "../pages/registry";
import { FullViewportFrame } from "./FullViewportFrame";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function renderTac(): HTMLElement {
  const { container } = render(<FullViewportFrame screens={menuScreens()} />);
  return container;
}

beforeEach(() => {
  push.mockClear();
});

describe("the OSBs", () => {
  it("render the PB18 legend as a button with its accessible name", () => {
    renderTac();
    const nav = screen.getByRole("navigation", { name: "Display pushbuttons" });
    const buttons = within(nav).getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAccessibleName("Support menu");
    expect(buttons[0]).toHaveAttribute("data-pb", "18");
    expect(within(nav).queryAllByRole("link")).toHaveLength(
      menuLegends("TAC").length - 1,
    );
  });

  it("hide blank OSBs from assistive technology and the tab order", () => {
    const container = renderTac();
    const blank = container.querySelectorAll(".ddi-osb[aria-hidden='true']");
    expect(blank).toHaveLength(20 - menuLegends("TAC").length);
    for (const button of blank) {
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveAttribute("tabindex", "-1");
    }
  });

  it("switch TAC and SUPT in place on press, without navigating", () => {
    renderTac();
    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Support menu" }),
      {
        button: 0,
      },
    );
    const toTac = screen.getByRole("button", { name: "Tactical menu" });
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    toTac.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(screen.getByRole("button", { name: "Tactical menu" })).toBe(toTac);
    fireEvent.pointerDown(toTac, { button: 0 });
    expect(screen.getByRole("button", { name: "Support menu" })).toBeVisible();
    expect(push).not.toHaveBeenCalled();
  });

  it("fire on Enter and Space, once per press", () => {
    renderTac();
    const menu = screen.getByRole("button", { name: "Support menu" });
    fireEvent.keyDown(menu, { key: "Enter" });
    fireEvent.keyDown(menu, { key: "Enter", repeat: true });
    fireEvent.keyUp(menu, { key: "Enter" });
    expect(menu).toHaveAccessibleName("Tactical menu");
    fireEvent.keyDown(menu, { key: " " });
    expect(menu).toHaveAccessibleName("Support menu");
  });

  it("fire a state action on a click with no press before it", () => {
    renderTac();
    fireEvent.click(screen.getByRole("button", { name: "Support menu" }));
    expect(
      screen.getByRole("button", { name: "Tactical menu" }),
    ).toBeInTheDocument();
  });

  it("ignore secondary-button presses", () => {
    renderTac();
    const menu = screen.getByRole("button", { name: "Support menu" });
    fireEvent.pointerDown(menu, { button: 2 });
    expect(menu).toHaveAccessibleName("Support menu");
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
});
