"use client";

import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
  syntaxTree,
} from "@codemirror/language";
import {
  forceLinting,
  linter,
  lintGutter,
  type Diagnostic,
} from "@codemirror/lint";
import { EditorState } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { useEffect, useRef } from "react";
import type { JsonValue } from "../schema/jsonSchema";
import { jsonEqual } from "../schema/pointer";
import type { FieldIssue } from "../schema/validate";
import { pointerRange } from "./pointerRange";

export function formatJson(value: JsonValue): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function parse(text: string): { ok: true; value: JsonValue } | { ok: false } {
  try {
    const value: JsonValue = JSON.parse(text);
    return { ok: true, value };
  } catch {
    return { ok: false };
  }
}

// Colours come from admin.css custom properties, so the editor follows the console's light and dark themes.
const highlight = HighlightStyle.define([
  { tag: tags.propertyName, color: "var(--code-key)" },
  { tag: tags.string, color: "var(--code-string)" },
  { tag: tags.number, color: "var(--code-number)" },
  { tag: [tags.bool, tags.null], color: "var(--code-keyword)" },
  {
    tag: [tags.brace, tags.squareBracket, tags.separator, tags.punctuation],
    color: "var(--code-punctuation)",
  },
]);

const theme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "13px",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.55" },
  ".cm-content": { caretColor: "var(--foreground)", padding: "8px 0" },
  ".cm-cursor": { borderLeftColor: "var(--foreground)" },
  ".cm-gutters": {
    backgroundColor: "var(--muted)",
    color: "var(--muted-foreground)",
    borderRight: "1px solid var(--border)",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in oklab, var(--muted) 60%, transparent)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "var(--accent)",
    color: "var(--foreground)",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
    {
      backgroundColor: "var(--code-selection) !important",
    },
  ".cm-matchingBracket": {
    backgroundColor: "var(--code-selection)",
    outline: "1px solid var(--ring)",
  },
  ".cm-foldGutter span": { padding: "0 4px" },
  ".cm-tooltip": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
  },
  ".cm-diagnostic": { fontFamily: "var(--font-sans)", fontSize: "12px" },
});

/**
 * The JSON escape hatch: the whole section document in CodeMirror, kept in step with the form both ways. Text that
 * parses replaces the document; text that does not stays here, marked, and the form keeps the last document that
 * parsed. Schema messages (`issues`) are lint markers on the exact value.
 */
export function JsonEditor({
  label,
  value,
  issues,
  onChange,
  onView,
}: {
  label: string;
  value: JsonValue;
  issues: readonly FieldIssue[];
  onChange(value: JsonValue): void;
  /** Hands out the editor, for the Format button. */
  onView?(view: EditorView | null): void;
}): React.JSX.Element {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const latest = useRef({ value, issues, onChange });
  useEffect(() => {
    latest.current = { value, issues, onChange };
  });

  useEffect(() => {
    if (host.current === null) {
      throw new Error("JsonEditor rendered without its host element");
    }
    const schemaLinter = linter(
      (editor): Diagnostic[] => {
        const text = editor.state.doc.toString();
        if (!parse(text).ok) {
          return [];
        }
        const tree = syntaxTree(editor.state);
        return latest.current.issues.flatMap((issue) => {
          const range = pointerRange(tree, text, issue.pointer);
          return range === null
            ? []
            : [
                {
                  ...range,
                  severity: "error" as const,
                  message: issue.message,
                },
              ];
        });
      },
      { delay: 150 },
    );
    const created = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: formatJson(latest.current.value),
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          foldGutter(),
          lintGutter(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightActiveLine(),
          json(),
          syntaxHighlighting(highlight),
          linter(jsonParseLinter(), { delay: 150 }),
          schemaLinter,
          EditorState.tabSize.of(2),
          keymap.of([
            { key: "Shift-Alt-f", run: formatEditor },
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...foldKeymap,
            indentWithTab,
          ]),
          EditorView.contentAttributes.of({ "aria-label": label }),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) {
              return;
            }
            const parsed = parse(update.state.doc.toString());
            if (parsed.ok && !jsonEqual(parsed.value, latest.current.value)) {
              latest.current.onChange(parsed.value);
            }
          }),
          theme,
        ],
      }),
    });
    // CodeMirror makes its scroller unfocusable (tabindex -1); a keyboard user must be able to scroll it (WCAG 2.1.1).
    created.scrollDOM.tabIndex = 0;
    view.current = created;
    onView?.(created);
    return () => {
      onView?.(null);
      created.destroy();
      view.current = null;
    };
    // The editor is created once; `label` and the callbacks are read through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A change from the form: show it, unless the text already says the same (keeping the user's own layout).
  useEffect(() => {
    const editor = view.current;
    if (editor === null) {
      return;
    }
    const parsed = parse(editor.state.doc.toString());
    if (!parsed.ok || !jsonEqual(parsed.value, value)) {
      editor.dispatch({
        changes: {
          from: 0,
          to: editor.state.doc.length,
          insert: formatJson(value),
        },
      });
    }
  }, [value]);

  useEffect(() => {
    if (view.current !== null) {
      forceLinting(view.current);
    }
  }, [issues]);

  return <div ref={host} className="h-full min-h-[24rem] overflow-hidden" />;
}

/** Re-indents the editor's text, when it parses. */
export function formatEditor(editor: EditorView): boolean {
  const parsed = parse(editor.state.doc.toString());
  if (!parsed.ok) {
    return false;
  }
  editor.dispatch({
    changes: {
      from: 0,
      to: editor.state.doc.length,
      insert: formatJson(parsed.value),
    },
  });
  return true;
}
