import type { EditorView } from "@codemirror/view";
import { parser } from "@lezer/json";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, test } from "vitest";
import { SchemaForm } from "../form/SchemaForm";
import type { JsonValue } from "../schema/jsonSchema";
import { setAt } from "../schema/pointer";
import { sectionModel } from "../schema/sectionModel";
import { formatEditor, formatJson, JsonEditor } from "./JsonEditor";
import { pointerRange } from "./pointerRange";

const LINKS: JsonValue = {
  links: [
    { name: "GitHub", tag: "CODE", url: "https://example.com/github" },
    { name: "Blog", tag: "TEXT", url: "/blog" },
  ],
};

/** The form and the JSON editor over one document, as the console wires them. */
function Both({ views }: { views: (EditorView | null)[] }): React.JSX.Element {
  const model = sectionModel("links");
  const [document, setDocument] = useState<JsonValue>(LINKS);
  const [onField] = useState(
    () => (pointer: string, value: JsonValue) =>
      setDocument((current) => setAt(current, pointer, value)),
  );
  const issues = model.validate(document);
  return (
    <>
      <SchemaForm
        idPrefix="sync"
        fields={model.fields}
        value={document}
        issues={issues}
        autoUppercase={false}
        onChange={onField}
      />
      <JsonEditor
        label="Links JSON"
        value={document}
        issues={issues}
        onChange={setDocument}
        onView={(view) => views.push(view)}
      />
    </>
  );
}

function editorOf(views: (EditorView | null)[]): EditorView {
  const view = views.findLast((candidate) => candidate !== null);
  if (view === undefined || view === null) {
    throw new Error("the JSON editor did not start");
  }
  return view;
}

function replaceText(view: EditorView, text: string): void {
  act(() => {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: text },
    });
  });
}

describe("JSON ↔ form sync", () => {
  test("the editor starts with the document, formatted", () => {
    const views: (EditorView | null)[] = [];
    render(<Both views={views} />);
    expect(editorOf(views).state.doc.toString()).toBe(formatJson(LINKS));
    expect(
      screen.getByRole("textbox", { name: "Links JSON" }),
    ).toBeInTheDocument();
  });

  test("a form edit shows in the JSON", () => {
    const views: (EditorView | null)[] = [];
    render(<Both views={views} />);
    fireEvent.change(screen.getAllByLabelText("Name")[0], {
      target: { value: "Forgejo" },
    });
    expect(JSON.parse(editorOf(views).state.doc.toString()).links[0].name).toBe(
      "Forgejo",
    );
  });

  test("JSON that parses updates the form; JSON that does not leaves it as it was", () => {
    const views: (EditorView | null)[] = [];
    render(<Both views={views} />);
    const view = editorOf(views);

    replaceText(
      view,
      JSON.stringify({
        links: [{ name: "Mastodon", tag: "SOCIAL", url: "/m" }],
      }),
    );
    expect(
      screen
        .getAllByLabelText("Name")
        .map((input) => (input as HTMLInputElement).value),
    ).toEqual(["Mastodon"]);

    replaceText(view, '{"links": [');
    expect(
      screen
        .getAllByLabelText("Name")
        .map((input) => (input as HTMLInputElement).value),
    ).toEqual(["Mastodon"]);
    // The broken text stays in the editor for the user to finish.
    expect(view.state.doc.toString()).toBe('{"links": [');
  });

  test("the user's own layout survives as long as it means the same document", () => {
    const views: (EditorView | null)[] = [];
    render(<Both views={views} />);
    const view = editorOf(views);
    const compact = JSON.stringify(LINKS);
    replaceText(view, compact);
    expect(view.state.doc.toString()).toBe(compact);
    act(() => {
      expect(formatEditor(view)).toBe(true);
    });
    expect(view.state.doc.toString()).toBe(formatJson(LINKS));
  });
});

describe("schema messages on the JSON text", () => {
  const text = formatJson(LINKS);
  const tree = parser.parse(text);

  function marked(pointer: string): string | null {
    const range = pointerRange(tree, text, pointer);
    return range === null ? null : text.slice(range.from, range.to);
  }

  test("a value is marked exactly", () => {
    expect(marked("/links/1/tag")).toBe('"TEXT"');
    expect(marked("/links/0/url")).toBe('"https://example.com/github"');
  });

  test("a container is marked at its key; a missing place at its nearest parent", () => {
    expect(marked("/links")).toBe('"links"');
    expect(marked("/links/0/missing")).toBe("{");
    expect(marked("/links/7")).toBe('"links"');
  });
});
