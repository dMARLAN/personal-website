import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { placedTextBounds } from "../formats/placedText";
import { MIDS_STATUS_Y, midsStatusTexts } from "../formats/mids";
import { contactRows, contactScreens } from "./contact";
import {
  COPY_FEEDBACK_MS,
  CopyCautions,
  CopyOsb,
  MailOsb,
} from "./contactIslands";
import { SNAPSHOT_CONTENT } from "@/content/snapshot";

const CONTACT = SNAPSHOT_CONTENT.contact;

/** The inner edge of the side legends' text: x = ±500 less one 14 DI glyph, as the research measures it [pgB §1]. */
const SIDE_LEGEND_INNER = 470;

describe("the MIDS format", () => {
  it("centres each status row on x = 0, with the value 25 DI after the label", () => {
    const texts = midsStatusTexts([{ label: "NET ENTRY:", value: "COARSE" }]);
    const [label, value] = texts.map(placedTextBounds);
    expect(texts[0]).toMatchObject({ align: "RightBottom", pos: [27.5, 341] });
    expect(value.left - label.right).toBe(25);
    expect(label.left + value.right).toBeCloseTo(0);
  });

  it("stays within 13 DI of the hand-placed DCS labels with their sample values [pgB §6]", () => {
    const dcs = [
      { label: "NET ENTRY:", value: "COARSE", x: 25 },
      { label: "DATE:", value: "XX/XX/XX", x: -55 },
      { label: "TIME:", value: "XX:XX:XX", x: -30 },
      { label: "NETWORK:", value: "NET 1", x: 10 },
    ];
    const texts = midsStatusTexts(dcs);
    dcs.forEach(({ x }, index) => {
      expect(Math.abs(texts[2 * index].pos[0] - x)).toBeLessThanOrEqual(13);
      expect(texts[2 * index].pos[1]).toBe(MIDS_STATUS_Y[index]);
    });
  });
});

describe("the Contact content", () => {
  it("puts the email in the first row", () => {
    expect(contactRows(CONTACT)[0]).toEqual({
      label: "EMAIL:",
      value: CONTACT.email,
    });
  });

  it("keeps every row clear of the side legends", () => {
    for (const text of midsStatusTexts(contactRows(CONTACT))) {
      const bounds = placedTextBounds(text);
      expect(bounds.left, text.text).toBeGreaterThanOrEqual(-SIDE_LEGEND_INNER);
      expect(bounds.right, text.text).toBeLessThanOrEqual(SIDE_LEGEND_INNER);
    }
  });

  it("draws with the stroke font, including the @", () => {
    const { screens } = contactScreens(CONTACT);
    for (const screen of Object.values(screens)) {
      expect(() =>
        renderToStaticMarkup(<svg>{screen.symbology}</svg>),
      ).not.toThrow();
    }
  });

  it("puts XMIT MAIL at PB17, COPY at PB16 and MENU at PB18", () => {
    const { initial, screens } = contactScreens(CONTACT);
    expect(
      screens[initial].legends.map(({ pb, lines, label, action }) => [
        pb,
        lines,
        label,
        action.kind,
      ]),
    ).toEqual([
      [16, ["COPY"], "Copy email address", "island"],
      [17, ["XMIT", "MAIL"], "Send email", "island"],
      [18, ["MENU"], "Tactical menu", "link"],
    ]);
  });
});

describe("the Contact islands", () => {
  const writeText = vi.fn<(text: string) => Promise<void>>();

  beforeEach(() => {
    vi.useFakeTimers();
    writeText.mockReset();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderCopy(): void {
    render(
      <>
        <CopyOsb text="a@example.com" label="Copy email address" />
        <svg>
          <CopyCautions
            copied={<path data-testid="copied" />}
            failed={<path data-testid="failed" />}
          />
        </svg>
      </>,
    );
  }

  it("copies on press and shows COPIED for 2 s", async () => {
    writeText.mockResolvedValue(undefined);
    renderCopy();
    expect(screen.queryByTestId("copied")).toBeNull();
    await act(async () => {
      fireEvent.pointerDown(
        screen.getByRole("button", { name: "Copy email address" }),
        { button: 0 },
      );
    });
    expect(writeText).toHaveBeenCalledWith("a@example.com");
    expect(screen.getByTestId("copied")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Email address copied",
    );
    act(() => {
      vi.advanceTimersByTime(COPY_FEEDBACK_MS);
    });
    expect(screen.queryByTestId("copied")).toBeNull();
  });

  it("shows COPY FAILED when the browser refuses the clipboard", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    writeText.mockRejectedValue(new Error("denied"));
    renderCopy();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copy email address" }),
      );
    });
    expect(screen.getByTestId("failed")).toBeInTheDocument();
    expect(screen.queryByTestId("copied")).toBeNull();
  });

  it("renders MAIL as a mailto link, so it works without JavaScript", () => {
    render(<MailOsb href="mailto:a@example.com" label="Send email" />);
    expect(screen.getByRole("link", { name: "Send email" })).toHaveAttribute(
      "href",
      "mailto:a@example.com",
    );
  });
});
