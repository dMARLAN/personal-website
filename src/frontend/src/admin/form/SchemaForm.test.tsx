import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, test } from "vitest";
import snapshot from "@/content/snapshot.json";
import type { JsonValue } from "../schema/jsonSchema";
import { setAt, type Pointer } from "../schema/pointer";
import { sectionModel } from "../schema/sectionModel";
import { SchemaForm } from "./SchemaForm";

// Round-tripped: the JSON import types optional union fields as `undefined`, which JSON never holds.
const SEED: Record<string, JsonValue> = JSON.parse(JSON.stringify(snapshot));

/** A section's form over its seed document, re-validated on every edit as the console does. */
function Harness({
  section,
  autoUppercase = false,
  onDocument,
}: {
  section: string;
  autoUppercase?: boolean;
  onDocument?(document: JsonValue): void;
}): React.JSX.Element {
  const model = sectionModel(section);
  const [document, setDocument] = useState<JsonValue>(() =>
    structuredClone(SEED[section]),
  );
  const [onChange] = useState(
    () => (pointer: Pointer, value: JsonValue) =>
      setDocument((current) => {
        const next = setAt(current, pointer, value);
        onDocument?.(next);
        return next;
      }),
  );
  return (
    <SchemaForm
      idPrefix={`test-${section}`}
      fields={model.fields}
      value={document}
      issues={model.validate(document)}
      autoUppercase={autoUppercase}
      onChange={onChange}
    />
  );
}

function group(name: string): HTMLElement {
  return screen.getByRole("group", { name });
}

/** A field's character counter, which its input lists in `aria-describedby`. */
function counterOf(input: HTMLElement): HTMLElement {
  const counter = document
    .getElementById(`${input.id}--counter`)
    ?.querySelector<HTMLElement>("[data-counter]");
  if (counter === null || counter === undefined) {
    throw new Error(`${input.id} has no counter`);
  }
  return counter;
}

/** Opens a list item's card, which starts closed to its summary line when the item is big. */
function openItem(name: string): void {
  fireEvent.click(
    screen.getByRole("button", { name: new RegExp(`\\(${name}\\)`) }),
  );
}

describe("the generated form", () => {
  test("a string shows its live counter, which turns red with the field's message past the limit", () => {
    render(<Harness section="profile" />);
    const value = within(group("Status rows 1")).getByLabelText("Value");
    expect(value).toHaveValue("SW ENGR");
    expect(counterOf(value)).toHaveTextContent("7/9");
    expect(counterOf(value)).toHaveAttribute("data-tone", "ok");
    fireEvent.change(value, { target: { value: "SW ENGRS" } });
    expect(counterOf(value)).toHaveAttribute("data-tone", "near");
    expect(value).toHaveAttribute("aria-describedby", `${value.id}--counter`);

    fireEvent.change(value, { target: { value: "FAR TOO LONG" } });

    expect(counterOf(value)).toHaveTextContent("12/9");
    expect(counterOf(value)).toHaveAttribute("data-tone", "over");
    expect(value).toHaveAttribute("aria-invalid", "true");
    expect(
      within(group("Status rows 1")).getByText(
        "Too long: at most 9 characters.",
      ),
    ).toBeVisible();
  });

  test("a character the glass cannot draw is named inline", () => {
    render(<Harness section="profile" />);
    fireEvent.change(screen.getByLabelText("Badge"), {
      target: { value: "HELLO~" },
    });
    expect(screen.getByText('The glass cannot draw "~".')).toBeVisible();
  });

  test("auto-uppercase applies to stroke-font fields only", () => {
    const documents: JsonValue[] = [];
    render(
      <Harness
        section="links"
        autoUppercase
        onDocument={(document) => documents.push(document)}
      />,
    );
    const link = group("Link 1");
    fireEvent.change(within(link).getByLabelText("Name"), {
      target: { value: "github" },
    });
    fireEvent.change(within(link).getByLabelText("URL"), {
      target: { value: "https://example.com/abc" },
    });
    expect(within(link).getByLabelText("Name")).toHaveValue("GITHUB");
    expect(within(link).getByLabelText("URL")).toHaveValue(
      "https://example.com/abc",
    );
  });

  test("wrapped prose is a textarea with a row counter", () => {
    render(<Harness section="profile" />);
    const bio = screen.getByLabelText("Bio");
    expect(bio.tagName).toBe("TEXTAREA");
    expect(screen.getByText(/\/9 rows/)).toBeVisible();
  });

  test("URL and email fields use their input types", () => {
    render(<Harness section="links" />);
    expect(within(group("Link 1")).getByLabelText("URL")).toHaveAttribute(
      "type",
      "url",
    );
    render(<Harness section="contact" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
  });

  test("numbers carry their bounds", () => {
    render(<Harness section="radar" />);
    const heading = screen.getByLabelText("Heading");
    expect(heading).toHaveAttribute("type", "number");
    expect(heading).toHaveAttribute("min", "0");
    expect(heading).toHaveAttribute("max", "359");
  });

  test("a short enum is a segmented control; a long one a select", () => {
    render(<Harness section="projects" />);
    openItem("Project 1");
    const project = group("Project 1");
    expect(
      within(project).getAllByRole("radio", { name: "RDY" }).length,
    ).toBeGreaterThan(0);
    render(<Harness section="bit" />);
    expect(screen.getAllByRole("combobox").length).toBeGreaterThan(40);
  });

  test("a nullable row has a switch; a union switches its fields by kind", () => {
    render(<Harness section="bit" />);
    expect(
      screen
        .getAllByRole("switch")
        .some((element) => element.getAttribute("aria-checked") === "false"),
    ).toBe(true);
    render(<Harness section="fuel" />);
    openItem("Tank 1");
    expect(
      screen.getAllByRole("radio", { name: "drain" }).length,
    ).toBeGreaterThan(0);
  });

  test("arrays: add from the schema's new item, duplicate, move and remove, within the limits", () => {
    const documents: JsonValue[] = [];
    render(
      <Harness
        section="links"
        onDocument={(document) => documents.push(document)}
      />,
    );
    const names = (): string[] =>
      screen
        .getAllByRole("group", { name: /^Link \d+$/ })
        .map(
          (link) =>
            within(link).getByLabelText("Name").getAttribute("value") ?? "",
        );
    const before = names();

    fireEvent.click(screen.getByRole("button", { name: "Add link" }));
    expect(names()).toEqual([...before, "Name"]);

    fireEvent.click(
      screen.getByRole("button", { name: `Move Link ${before.length + 1} up` }),
    );
    expect(names().at(-2)).toBe("Name");

    fireEvent.click(screen.getByRole("button", { name: "Duplicate Link 1" }));
    expect(names().slice(0, 2)).toEqual([before[0], before[0]]);

    fireEvent.click(screen.getByRole("button", { name: "Remove Link 2" }));
    expect(names()).toHaveLength(before.length + 1);

    while (names().length < 10) {
      fireEvent.click(screen.getByRole("button", { name: "Add link" }));
    }
    expect(screen.getByRole("button", { name: "Add link" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Move Link 1 up" }),
    ).toBeDisabled();
  });

  test("a list at its minimum cannot lose an item", () => {
    render(<Harness section="work" />);
    openItem("Employer 1");
    const roles = screen.getAllByRole("button", { name: /^Remove Role/ });
    expect(roles.length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Add employer" }),
    ).toHaveLength(1);
  });
});
