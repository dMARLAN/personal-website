"use client";

import { ChevronRightIcon, InfoIcon } from "lucide-react";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { defaultValue } from "../schema/defaults";
import {
  humanise,
  type FieldNode,
  type NullableNode,
  type ObjectNode,
  type PropertyNode,
  type TupleNode,
  type UnionNode,
} from "../schema/fields";
import type { JsonValue } from "../schema/jsonSchema";
import { childPointer, type Pointer } from "../schema/pointer";
import { unionVariantOf } from "../schema/validate";
import { ArrayField } from "./ArrayField";
import { STACKED, type FieldDisplay } from "./FieldShell";
import {
  fieldId,
  issueCountWithin,
  useForm,
  useOpenOnIssues,
} from "./FormContext";
import {
  BooleanField,
  EnumField,
  NumberField,
  StringField,
} from "./leafFields";

export interface FieldProps {
  node: FieldNode;
  value: JsonValue | undefined;
  pointer: Pointer;
  label: string;
  required: boolean;
  depth: number;
  display?: FieldDisplay;
}

/** A field with no inner fields: it fits a cell of a grid or a row. */
export function isLeaf(node: FieldNode): boolean {
  switch (node.kind) {
    case "string":
    case "number":
    case "boolean":
    case "enum":
    case "const":
      return true;
    case "nullable":
      return node.inner.kind === "enum";
    default:
      return false;
  }
}

/** An object of leaves only, such as a status row or a link: it lays out as one row. */
export function isFlatObject(node: FieldNode): node is ObjectNode {
  return (
    node.kind === "object" &&
    node.properties.every((property) => isLeaf(property.node))
  );
}

function objectEntry(
  value: JsonValue | undefined,
  key: string,
): JsonValue | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value[key]
    : undefined;
}

function arrayEntry(
  value: JsonValue | undefined,
  index: number,
): JsonValue | undefined {
  return Array.isArray(value) ? value[index] : undefined;
}

/** Renders any field node: the form engine's dispatch. Memoised: unchanged branches keep their value's identity. */
export const FieldRenderer = memo(function FieldRenderer({
  node,
  value,
  pointer,
  label,
  required,
  depth,
  display = STACKED,
}: FieldProps): React.JSX.Element | null {
  const leaf = { value, pointer, label, required, display };
  switch (node.kind) {
    case "string":
      return <StringField node={node} {...leaf} />;
    case "number":
      return <NumberField node={node} {...leaf} />;
    case "boolean":
      return <BooleanField node={node} {...leaf} />;
    case "enum":
      return <EnumField node={node} {...leaf} />;
    case "const":
      return null;
    case "nullable":
      return node.inner.kind === "enum" ? (
        <EnumField node={node.inner} {...leaf} nullable />
      ) : (
        <NullableField
          node={node}
          value={value}
          pointer={pointer}
          label={label}
          depth={depth}
        />
      );
    case "object":
      return (
        <Block label={label} node={node} pointer={pointer} depth={depth}>
          <ObjectFields
            node={node}
            value={value}
            pointer={pointer}
            depth={depth}
          />
        </Block>
      );
    case "tuple":
      return (
        <Block
          label={label}
          node={node}
          pointer={pointer}
          depth={depth}
          meta={`${node.items.length} fixed`}
        >
          <TupleFields
            node={node}
            value={value}
            pointer={pointer}
            depth={depth}
          />
        </Block>
      );
    case "array":
      return (
        <ArrayField
          node={node}
          value={value}
          pointer={pointer}
          label={label}
          depth={depth}
        />
      );
    case "union":
      return (
        <Block label={label} node={node} pointer={pointer} depth={depth}>
          <UnionFields
            node={node}
            value={value}
            pointer={pointer}
            depth={depth}
          />
        </Block>
      );
  }
});

/** A group's help text and its cross-field rules (`x-ui-rules`). */
export function GroupHelp({
  node,
}: {
  node: FieldNode;
}): React.JSX.Element | null {
  if (node.description === null && node.rules.length === 0) {
    return null;
  }
  return (
    <div className="mb-3 flex max-w-prose flex-col gap-1.5 text-xs text-muted-foreground">
      {node.description === null ? null : <p>{node.description}</p>}
      {node.rules.length === 0 ? null : (
        <ul className="flex flex-col gap-1">
          {node.rules.map((rule) => (
            <li key={rule} className="flex gap-1.5">
              <InfoIcon aria-hidden className="mt-px size-3.5 shrink-0" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A titled, collapsible group of fields. Top-level groups are cards; nested ones are lighter. */
export function Block({
  label,
  node,
  pointer,
  depth,
  meta,
  actions,
  children,
}: {
  label: string;
  node: FieldNode;
  pointer: Pointer;
  depth: number;
  /** A short note beside the title, such as an item count. */
  meta?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  const { idPrefix, issues } = useForm();
  const errors = issueCountWithin(issues, pointer);
  const [open, setOpen] = useOpenOnIssues(true, errors);
  const headingId = `${fieldId(idPrefix, pointer)}--heading`;
  const top = depth <= 1;
  const Heading = top ? "h3" : "h4";
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        "col-span-full min-w-0",
        top ? "rounded-lg border bg-card shadow-xs" : "rounded-md border",
      )}
    >
      <section aria-labelledby={headingId}>
        <div
          className={cn(
            "flex items-center gap-2",
            top ? "px-4 py-2.5" : "bg-muted/40 px-3 py-1.5",
            open && "border-b",
            !top && !open && "rounded-md",
            !top && open && "rounded-t-md",
          )}
        >
          <CollapsibleTrigger className="group/trigger -ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-sm px-1 py-0.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <ChevronRightIcon
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/trigger:rotate-90"
            />
            <Heading
              id={headingId}
              className={cn(
                "truncate font-medium",
                top ? "text-sm" : "text-[13px]",
              )}
            >
              {label}
            </Heading>
            {meta === undefined ? null : (
              <span className="shrink-0 text-xs text-muted-foreground">
                {meta}
              </span>
            )}
            {errors === 0 ? null : (
              <Badge
                variant="destructive"
                className="ml-1 h-5 px-1.5 text-[11px]"
              >
                {errors} {errors === 1 ? "issue" : "issues"}
              </Badge>
            )}
          </CollapsibleTrigger>
          {actions}
        </div>
        <CollapsibleContent className={cn(top ? "p-4" : "p-3")}>
          <GroupHelp node={node} />
          <PointerMessages pointer={pointer} className="mb-3" />
          {children}
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

type Segment =
  | { kind: "leaves"; properties: PropertyNode[] }
  | { kind: "complex"; property: PropertyNode };

/** Consecutive leaves share a grid; anything else is its own block. Property order is form order. */
function segmentsOf(properties: readonly PropertyNode[]): Segment[] {
  const segments: Segment[] = [];
  for (const property of properties) {
    if (property.node.kind === "const") {
      continue;
    }
    const last = segments.at(-1);
    if (!isLeaf(property.node)) {
      segments.push({ kind: "complex", property });
    } else if (last?.kind === "leaves") {
      last.properties.push(property);
    } else {
      segments.push({ kind: "leaves", properties: [property] });
    }
  }
  return segments;
}

const GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-x-4 gap-y-4";

export function ObjectFields({
  node,
  value,
  pointer,
  depth,
}: {
  node: ObjectNode;
  value: JsonValue | undefined;
  pointer: Pointer;
  depth: number;
}): React.JSX.Element {
  const render = (property: PropertyNode): React.JSX.Element => (
    <FieldRenderer
      key={property.key}
      node={property.node}
      value={objectEntry(value, property.key)}
      pointer={childPointer(pointer, property.key)}
      label={property.node.label}
      required={property.required}
      depth={depth + 1}
    />
  );
  return (
    <div className="flex flex-col gap-4">
      {segmentsOf(node.properties).map((segment) =>
        segment.kind === "complex" ? (
          render(segment.property)
        ) : (
          <div
            key={segment.properties[0].key}
            className={cn(
              GRID,
              // The document's own leaves get a card like the groups around them.
              depth === 0 && "rounded-lg border bg-card p-4 shadow-xs",
            )}
          >
            {segment.properties.map(render)}
          </div>
        ),
      )}
    </div>
  );
}

/**
 * Messages about a whole group rather than one of its fields, such as a list with too many items, or a client
 * rule the API reports on the group.
 */
export function PointerMessages({
  pointer,
  className,
}: {
  pointer: Pointer;
  className?: string;
}): React.JSX.Element | null {
  const { idPrefix, issues } = useForm();
  const messages = issues.get(pointer) ?? [];
  return messages.length === 0 ? null : (
    <ul
      id={`${fieldId(idPrefix, pointer)}--error`}
      className={cn("text-xs text-destructive", className)}
    >
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}

/** A row cell's share of the width: short slot strings narrow, free text (URLs, meanings) wide. */
function columnWeight(node: FieldNode): number {
  if (node.kind !== "string") {
    return 1;
  }
  if (node.maxLength === null) {
    return 2.5;
  }
  return Math.min(2.5, Math.max(1, node.maxLength / 8));
}

/** One row of a table-like list: the item's leaves side by side, labelled once by the first row. */
export function FlatRow({
  node,
  value,
  pointer,
  first,
  depth,
}: {
  node: ObjectNode;
  value: JsonValue | undefined;
  pointer: Pointer;
  first: boolean;
  depth: number;
}): React.JSX.Element {
  const visible = node.properties.filter(
    (property) => property.node.kind !== "const",
  );
  return (
    <div
      className="grid min-w-0 flex-1 gap-x-3 gap-y-2"
      style={{
        gridTemplateColumns: visible
          .map((property) => `minmax(0, ${columnWeight(property.node)}fr)`)
          .join(" "),
      }}
    >
      {visible.map((property) => (
        <FieldRenderer
          key={property.key}
          node={property.node}
          value={objectEntry(value, property.key)}
          pointer={childPointer(pointer, property.key)}
          label={property.node.label}
          required={property.required}
          depth={depth + 1}
          display={{ compact: true, labelHidden: !first }}
        />
      ))}
    </div>
  );
}

function TupleFields({
  node,
  value,
  pointer,
  depth,
}: {
  node: TupleNode;
  value: JsonValue | undefined;
  pointer: Pointer;
  depth: number;
}): React.JSX.Element {
  if (node.items.every(isFlatObject)) {
    return (
      <div className="flex flex-col gap-2">
        {node.items.map((item, index) => (
          <fieldset key={index} className="flex flex-col gap-1">
            <legend className="sr-only">{item.label}</legend>
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className={cn(
                  "w-5 shrink-0 text-right font-mono text-xs leading-9 text-muted-foreground tabular-nums",
                  index === 0 && "mt-[22px]",
                )}
              >
                {index + 1}
              </span>
              <FlatRow
                node={item}
                value={arrayEntry(value, index)}
                pointer={childPointer(pointer, index)}
                first={index === 0}
                depth={depth}
              />
            </div>
            <PointerMessages
              pointer={childPointer(pointer, index)}
              className="pl-8"
            />
          </fieldset>
        ))}
      </div>
    );
  }
  return (
    <div className={node.items.every(isLeaf) ? GRID : "flex flex-col gap-3"}>
      {node.items.map((item, index) => (
        <FieldRenderer
          key={index}
          node={item}
          value={arrayEntry(value, index)}
          pointer={childPointer(pointer, index)}
          label={item.label}
          required
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

function NullableField({
  node,
  value,
  pointer,
  label,
  depth,
}: {
  node: NullableNode;
  value: JsonValue | undefined;
  pointer: Pointer;
  label: string;
  depth: number;
}): React.JSX.Element {
  const { idPrefix, onChange } = useForm();
  const id = `${fieldId(idPrefix, pointer)}--present`;
  const present = value !== null && value !== undefined;
  return (
    <div className="col-span-full flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Switch
          id={id}
          size="sm"
          checked={present}
          onCheckedChange={(checked) =>
            onChange(pointer, checked ? defaultValue(node.inner) : null)
          }
        />
        <Label
          htmlFor={id}
          className="text-xs font-normal text-muted-foreground"
        >
          {label}: {present ? "set" : "blank"}
        </Label>
      </div>
      {present ? (
        <FieldRenderer
          node={node.inner}
          value={value}
          pointer={pointer}
          label={label}
          required
          depth={depth}
        />
      ) : null}
    </div>
  );
}

function UnionFields({
  node,
  value,
  pointer,
  depth,
}: {
  node: UnionNode;
  value: JsonValue | undefined;
  pointer: Pointer;
  depth: number;
}): React.JSX.Element {
  const { idPrefix, onChange } = useForm();
  const variant = unionVariantOf(node, value);
  const label = humanise(node.discriminator);
  return (
    <div className="flex flex-col gap-3.5">
      <div className={GRID}>
        <EnumField
          node={{
            kind: "enum",
            label,
            description: null,
            rules: [],
            schema: {},
            options: node.variants.map(({ tag }) => tag),
          }}
          value={variant?.tag}
          pointer={childPointer(pointer, node.discriminator)}
          label={label}
          required
          // The variants share only the tag, so a new kind starts from that variant's defaults.
          onSelect={(tag) => {
            const next = node.variants.find(
              (candidate) => candidate.tag === tag,
            );
            if (next !== undefined) {
              onChange(pointer, defaultValue(next.node));
            }
          }}
        />
      </div>
      {variant === undefined ? (
        <p
          className="text-xs text-destructive"
          id={`${fieldId(idPrefix, pointer)}--error`}
        >
          Unknown {node.discriminator}. Pick one above.
        </p>
      ) : (
        <ObjectFields
          node={variant.node}
          value={value}
          pointer={pointer}
          depth={depth}
        />
      )}
    </div>
  );
}
