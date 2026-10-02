import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FLBIT_SECONDS, FlbitTimeout } from "../formats/FlbitTimeout";
import {
  ScreenStateProvider,
  ScreenStateSlot,
  useScreenState,
} from "../frame/screenState";
import { FUEL_STATES, fuelScreens } from "./fuel";

describe("the FUEL screens", () => {
  const { initial, screens } = fuelScreens();
  const legend = (state: string, pb: number) =>
    screens[state].legends.find((candidate) => candidate.pb === pb);

  it("opens idle, with the real legends: RESET SDC, FLBIT and MENU", () => {
    expect(initial).toBe(FUEL_STATES.idle);
    expect(
      screens[FUEL_STATES.idle].legends.map(({ pb, lines }) => [pb, lines]),
    ).toEqual([
      [10, ["RESET", "SDC"]],
      [20, ["FLBIT"]],
      [18, ["MENU"]],
    ]);
  });

  it("boxes FLBIT while the test runs, without a URL", () => {
    expect(legend(FUEL_STATES.idle, 20)?.action).toEqual({
      kind: "state",
      state: FUEL_STATES.testing,
    });
    expect(legend(FUEL_STATES.idle, 20)?.boxed).toBeUndefined();
    expect(legend(FUEL_STATES.testing, 20)?.boxed).toBe(true);
  });
});

function CurrentState(): React.JSX.Element {
  return <output>{useScreenState().state}</output>;
}

describe("the FLBIT timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns to the idle state after 13 s", () => {
    render(
      <ScreenStateProvider initial={FUEL_STATES.testing}>
        <ScreenStateSlot
          states={{
            [FUEL_STATES.testing]: <FlbitTimeout state={FUEL_STATES.idle} />,
            [FUEL_STATES.idle]: null,
          }}
        />
        <CurrentState />
      </ScreenStateProvider>,
    );
    act(() => {
      vi.advanceTimersByTime(FLBIT_SECONDS * 1000 - 1);
    });
    expect(screen.getByRole("status")).toHaveTextContent(FUEL_STATES.testing);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole("status")).toHaveTextContent(FUEL_STATES.idle);
  });
});
