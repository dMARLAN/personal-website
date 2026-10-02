"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type {
  BooleanNode,
  EnumNode,
  NumberNode,
  StringNode,
} from "../schema/fields";
import type { JsonValue } from "../schema/jsonSchema";
import type { Pointer } from "../schema/pointer";
import { characterCount, counterTone } from "../schema/text";
import { valuesAt, wrappedRows } from "../schema/validate";
import {
  describedBy,
  FieldShell,
  STACKED,
  toneBorder,
  type FieldDisplay,
} from "./FieldShell";
import { fieldId, useDocument, useForm } from "./FormContext";

export interface LeafProps<N> {
  node: N;
  value: JsonValue | undefined;
  pointer: Pointer;
  label: string;
  required: boolean;
  display?: FieldDisplay;
}

function useLeaf(pointer: Pointer): {
  id: string;
  messages: readonly string[];
  onChange(value: JsonValue): void;
  autoUppercase: boolean;
} {
  const { idPrefix, issues, onChange, autoUppercase } = useForm();
  return {
    id: fieldId(idPrefix, pointer),
    messages: issues.get(pointer) ?? [],
    onChange: (value) => onChange(pointer, value),
    autoUppercase,
  };
}

export function StringField(props: LeafProps<StringNode>): React.JSX.Element {
  return props.node.optionsFrom === null ? (
    <TextField {...props} />
  ) : (
    <OptionsFromField {...props} path={props.node.optionsFrom} />
  );
}

function TextField({
  node,
  value,
  pointer,
  label,
  required,
  display = STACKED,
}: LeafProps<StringNode>): React.JSX.Element {
  const { id, messages, onChange, autoUppercase } = useLeaf(pointer);
  const text = typeof value === "string" ? value : "";
  const counter =
    node.maxLength === null
      ? null
      : { length: characterCount(text), max: node.maxLength };
  const wrapped =
    node.wrap === null ? null : wrappedRows(text, node.wrap.chars);
  const rows =
    node.wrap === null || wrapped === null || "tooLong" in wrapped
      ? null
      : { used: wrapped.rows, max: node.wrap.rows };
  const tone =
    counter === null ? null : counterTone(counter.length, counter.max);
  const invalid = messages.length > 0;
  // The glass upper-cases what it draws anyway; this only saves typing it.
  const change = (next: string): void =>
    onChange(
      autoUppercase && node.charset !== null ? next.toUpperCase() : next,
    );
  const control = {
    id,
    value: text,
    "aria-invalid": invalid,
    "aria-describedby": describedBy(id, {
      counter: counter !== null,
      help: node.description !== null && !display.compact,
      messages: invalid,
    }),
    spellCheck: node.widget === "textarea",
    className: cn(
      toneBorder(tone, invalid),
      // The glass draws in a fixed-pitch font, so a fixed-pitch input shows how much of the slot the text fills.
      node.charset === null ? null : "font-mono",
    ),
  };
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      counter={counter}
      rows={rows}
      help={node.description}
      messages={messages}
      display={display}
      className={
        node.widget === "textarea" && !display.compact
          ? "col-span-full"
          : undefined
      }
    >
      {node.widget === "textarea" ? (
        <Textarea
          {...control}
          rows={3}
          className={cn("field-sizing-content min-h-16", control.className)}
          onChange={(event) => change(event.target.value)}
        />
      ) : (
        <Input
          {...control}
          type={node.widget === "text" ? "text" : node.widget}
          autoComplete="off"
          onChange={(event) => change(event.target.value)}
        />
      )}
    </FieldShell>
  );
}

/** `x-ui-options-from`: a select of the values found elsewhere in the document, such as the category legends. */
function OptionsFromField({
  node,
  value,
  pointer,
  label,
  required,
  display = STACKED,
  path,
}: LeafProps<StringNode> & { path: string }): React.JSX.Element {
  const { id, messages, onChange } = useLeaf(pointer);
  const document = useDocument();
  const options = [...new Set(valuesAt(document, path).map(String))];
  const selected = typeof value === "string" ? value : "";
  // A value that is no longer an option (its category was renamed) still shows, marked by its message.
  const shown =
    selected === "" || options.includes(selected)
      ? options
      : [selected, ...options];
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      counter={null}
      help={node.description}
      messages={messages}
      display={display}
    >
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className="w-full font-mono text-xs"
          aria-invalid={messages.length > 0}
        >
          <SelectValue placeholder="Choose…" />
        </SelectTrigger>
        <SelectContent>
          {shown.map((option) => (
            <SelectItem
              key={option}
              value={option}
              className="font-mono text-xs"
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

function bounds(node: NumberNode): string | null {
  const low =
    node.minimum !== null
      ? `≥ ${node.minimum}`
      : node.exclusiveMinimum !== null
        ? `> ${node.exclusiveMinimum}`
        : null;
  const high =
    node.maximum !== null
      ? `≤ ${node.maximum}`
      : node.exclusiveMaximum !== null
        ? `< ${node.exclusiveMaximum}`
        : null;
  const parts = [low, high].filter((part) => part !== null);
  return parts.length === 0 ? null : parts.join(", ");
}

export function NumberField({
  node,
  value,
  pointer,
  label,
  required,
  display = STACKED,
}: LeafProps<NumberNode>): React.JSX.Element {
  const { id, messages, onChange } = useLeaf(pointer);
  const stored = typeof value === "number" ? String(value) : "";
  // What is typed, until it parses: "", "-" and "1." are steps on the way to a number.
  const [typed, setTyped] = useState<{ stored: string; text: string } | null>(
    null,
  );
  const text = typed !== null && typed.stored === stored ? typed.text : stored;
  const unparsed = text.trim() === "" || Number.isNaN(Number(text));
  const shown = unparsed ? [...messages, "Enter a number."] : messages;
  const help = [bounds(node), node.description]
    .filter((part) => part !== null)
    .join(" · ");
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      counter={null}
      help={help === "" ? null : help}
      messages={shown}
      display={display}
    >
      <Input
        id={id}
        type="number"
        inputMode={node.integer ? "numeric" : "decimal"}
        className={cn(
          "font-mono tabular-nums",
          toneBorder(null, shown.length > 0),
        )}
        min={node.minimum ?? node.exclusiveMinimum ?? undefined}
        max={node.maximum ?? node.exclusiveMaximum ?? undefined}
        step={node.integer ? 1 : "any"}
        value={text}
        aria-invalid={shown.length > 0}
        aria-describedby={describedBy(id, {
          counter: false,
          help: help !== "" && !display.compact,
          messages: shown.length > 0,
        })}
        onChange={(event) => {
          const next = event.target.value;
          const parsed = Number(next);
          if (next.trim() !== "" && !Number.isNaN(parsed)) {
            onChange(parsed);
            setTyped({ stored: String(parsed), text: next });
          } else {
            setTyped({ stored, text: next });
          }
        }}
      />
    </FieldShell>
  );
}

export function BooleanField({
  node,
  value,
  pointer,
  label,
  display = STACKED,
}: LeafProps<BooleanNode>): React.JSX.Element {
  const { id, messages, onChange } = useLeaf(pointer);
  return (
    <FieldShell
      id={id}
      label={label}
      required
      counter={null}
      help={node.description}
      messages={messages}
      display={display}
    >
      <Switch
        id={id}
        checked={value === true}
        onCheckedChange={(checked) => onChange(checked)}
      />
    </FieldShell>
  );
}

const SEGMENTED_MAX_OPTIONS = 4;
const SEGMENTED_MAX_CHARS = 8;
/** The Select's value for "no value", for a nullable enum. Radix Select reserves "". */
export const NONE = "__none__";

export function EnumField({
  node,
  value,
  pointer,
  label,
  required,
  display = STACKED,
  nullable = false,
  onSelect,
}: LeafProps<EnumNode> & {
  nullable?: boolean;
  /** Replaces the default write of the chosen option at `pointer`. */
  onSelect?(option: string): void;
}): React.JSX.Element {
  const leaf = useLeaf(pointer);
  const { id, messages } = leaf;
  const onChange = (option: string | null): void => {
    if (onSelect !== undefined && option !== null) {
      onSelect(option);
    } else {
      leaf.onChange(option);
    }
  };
  const selected = typeof value === "string" ? value : NONE;
  const segmented =
    !nullable &&
    !display.compact &&
    node.options.length <= SEGMENTED_MAX_OPTIONS &&
    node.options.every((option) => option.length <= SEGMENTED_MAX_CHARS);
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      counter={null}
      help={node.description}
      messages={messages}
      display={display}
    >
      {segmented ? (
        <ToggleGroup
          id={id}
          type="single"
          variant="outline"
          size="sm"
          aria-label={label}
          className="w-fit"
          value={selected}
          onValueChange={(next) => {
            if (next !== "") {
              onChange(next);
            }
          }}
        >
          {node.options.map((option) => (
            <ToggleGroupItem
              key={option}
              value={option}
              className="px-3 font-mono text-xs"
            >
              {option}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : (
        <Select
          value={selected}
          onValueChange={(next) => onChange(next === NONE ? null : next)}
        >
          <SelectTrigger
            id={id}
            className="w-full font-mono text-xs"
            aria-invalid={messages.length > 0}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {nullable ? <SelectItem value={NONE}>None</SelectItem> : null}
            {node.options.map((option) => (
              <SelectItem
                key={option}
                value={option}
                className="font-mono text-xs"
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FieldShell>
  );
}
