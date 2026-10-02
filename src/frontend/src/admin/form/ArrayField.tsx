"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronRightIcon,
  CopyIcon,
  GripVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { defaultValue } from "../schema/defaults";
import type { ArrayNode, FieldNode } from "../schema/fields";
import type { JsonValue } from "../schema/jsonSchema";
import { childPointer, type Pointer } from "../schema/pointer";
import {
  Block,
  FieldRenderer,
  FlatRow,
  GroupHelp,
  isFlatObject,
  isLeaf,
  ObjectFields,
  PointerMessages,
} from "./FieldRenderer";
import {
  fieldId,
  issueCountWithin,
  useForm,
  useOpenOnIssues,
} from "./FormContext";

/** "Employers" → "Employer", "Categories" → "Category": an item's name from its list's. */
function singular(label: string): string {
  if (label.endsWith("ies")) {
    return `${label.slice(0, -3)}y`;
  }
  return label.endsWith("s") && !label.endsWith("ss")
    ? label.slice(0, -1)
    : label;
}

const SUMMARY_KEYS = [
  "name",
  "title",
  "label",
  "tab",
  "heading",
  "legend",
  "slug",
  "id",
  "metric",
  "value",
];

/** The item's card title: its first naming field that has text, such as a link's name. */
function itemSummary(item: JsonValue | undefined): string | null {
  if (typeof item === "string") {
    return item === "" ? null : item;
  }
  if (typeof item !== "object" || item === null || Array.isArray(item)) {
    return null;
  }
  for (const key of SUMMARY_KEYS) {
    const text = item[key];
    if (typeof text === "string" && text.trim() !== "") {
      return text;
    }
  }
  return null;
}

/** A second line for the card: the item's other short texts, such as a link's tag and URL. */
function itemDetail(
  item: JsonValue | undefined,
  summary: string | null,
): string | null {
  if (typeof item !== "object" || item === null || Array.isArray(item)) {
    return null;
  }
  const texts = Object.values(item).filter(
    (text): text is string =>
      typeof text === "string" && text !== summary && text.length <= 60,
  );
  return texts.length === 0 ? null : texts.slice(0, 3).join(" · ");
}

let nextItemId = 0;
function newItemId(): string {
  nextItemId += 1;
  return `item-${nextItemId}`;
}

/**
 * Stable keys for the items of a JSON array, which has none: the drag-and-drop list and each card's open state
 * follow them. Edits made here move the keys with the items; a change of length from elsewhere (the JSON editor)
 * adds or drops keys at the end.
 */
function useItemIds(length: number): [string[], (ids: string[]) => void] {
  const [ids, setIds] = useState<string[]>(() =>
    Array.from({ length }, newItemId),
  );
  if (ids.length !== length) {
    const adjusted =
      ids.length < length
        ? [...ids, ...Array.from({ length: length - ids.length }, newItemId)]
        : ids.slice(0, length);
    setIds(adjusted);
    return [adjusted, setIds];
  }
  return [ids, setIds];
}

/**
 * Flat items (a link, a row) are short, so their cards start open; bigger items (an employer, a project) start
 * closed to their summary line, unless the list holds just one.
 */
function openByDefault(item: FieldNode, count: number): boolean {
  const flat =
    isFlatObject(item) ||
    (item.kind === "nullable" && isFlatObject(item.inner));
  return flat || count === 1;
}

export function ArrayField({
  node,
  value,
  pointer,
  label,
  depth,
}: {
  node: ArrayNode;
  value: JsonValue | undefined;
  pointer: Pointer;
  label: string;
  depth: number;
}): React.JSX.Element {
  const { onChange } = useForm();
  const items: JsonValue[] = Array.isArray(value) ? value : [];
  const [ids, setIds] = useItemIds(items.length);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const canAdd = node.maxItems === null || items.length < node.maxItems;
  const canRemove = items.length > node.minItems;
  const fixedLength = node.maxItems !== null && node.maxItems === node.minItems;
  const itemName = singular(label);

  const move = (from: number, to: number): void => {
    onChange(pointer, arrayMove(items, from, to));
    setIds(arrayMove(ids, from, to));
  };
  const insert = (index: number, item: JsonValue): void => {
    onChange(pointer, [...items.slice(0, index), item, ...items.slice(index)]);
    setIds([...ids.slice(0, index), newItemId(), ...ids.slice(index)]);
  };
  const remove = (index: number): void => {
    onChange(
      pointer,
      items.filter((_, at) => at !== index),
    );
    setIds(ids.filter((_, at) => at !== index));
  };
  const onDragEnd = ({ active, over }: DragEndEvent): void => {
    if (over === null || active.id === over.id) {
      return;
    }
    move(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };

  const limits =
    node.maxItems === null
      ? `${items.length}`
      : `${items.length} / ${node.maxItems}${fixedLength ? " fixed" : ""}`;
  const addButton = fixedLength ? null : (
    <Button
      type="button"
      variant="outline"
      size="xs"
      disabled={!canAdd}
      onClick={() =>
        insert(
          items.length,
          node.newItem === null
            ? defaultValue(node.item)
            : structuredClone(node.newItem),
        )
      }
    >
      <PlusIcon aria-hidden />
      Add {itemName.toLowerCase()}
    </Button>
  );

  return (
    <Block
      label={label}
      node={node}
      pointer={pointer}
      depth={depth}
      meta={limits}
      actions={addButton}
    >
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No {label.toLowerCase()} yet.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ol
              className={cn(
                "flex flex-col",
                isLeaf(node.item) || isFlatObject(node.item)
                  ? "gap-2"
                  : "gap-2.5",
              )}
            >
              {items.map((item, index) => (
                <SortableItem
                  key={ids[index]}
                  id={ids[index]}
                  node={node.item}
                  value={item}
                  pointer={childPointer(pointer, index)}
                  name={`${itemName} ${index + 1}`}
                  index={index}
                  count={items.length}
                  depth={depth}
                  defaultOpen={openByDefault(node.item, items.length)}
                  canAdd={canAdd && !fixedLength}
                  canRemove={canRemove && !fixedLength}
                  onMove={move}
                  onDuplicate={() => insert(index + 1, structuredClone(item))}
                  onRemove={() => remove(index)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </Block>
  );
}

interface ItemProps {
  id: string;
  node: FieldNode;
  value: JsonValue;
  pointer: Pointer;
  /** "Link 3": the item's accessible name. */
  name: string;
  index: number;
  count: number;
  depth: number;
  defaultOpen: boolean;
  canAdd: boolean;
  canRemove: boolean;
  onMove(from: number, to: number): void;
  onDuplicate(): void;
  onRemove(): void;
}

function SortableItem(props: ItemProps): React.JSX.Element {
  const { id, name, index, count, node } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = { transform: CSS.Translate.toString(transform), transition };
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className="flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing"
      aria-label={`Drag to reorder ${name}`}
      {...attributes}
      {...listeners}
    >
      <GripVerticalIcon aria-hidden className="size-4" />
    </button>
  );
  const actions = (
    <ItemActions
      name={name}
      index={index}
      count={count}
      canAdd={props.canAdd}
      canRemove={props.canRemove}
      onMove={props.onMove}
      onDuplicate={props.onDuplicate}
      onRemove={props.onRemove}
    />
  );
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "z-10 opacity-90 shadow-lg")}
    >
      <fieldset aria-label={name} className="min-w-0">
        {isLeaf(node) ? (
          <div className="flex items-start gap-1.5">
            <div className="pt-0.5">{handle}</div>
            <div className="min-w-0 flex-1">
              <FieldRenderer
                node={node}
                value={props.value}
                pointer={props.pointer}
                label={name}
                required
                depth={props.depth + 1}
                display={{ compact: true, labelHidden: true }}
              />
            </div>
            <div className="pt-0.5">{actions}</div>
          </div>
        ) : (
          <ItemCard {...props} handle={handle} actions={actions} />
        )}
      </fieldset>
    </li>
  );
}

function ItemCard({
  node,
  value,
  pointer,
  name,
  index,
  depth,
  defaultOpen,
  handle,
  actions,
}: ItemProps & {
  handle: React.ReactNode;
  actions: React.ReactNode;
}): React.JSX.Element {
  const { idPrefix, issues } = useForm();
  const errors = issueCountWithin(issues, pointer);
  const [open, setOpen] = useOpenOnIssues(defaultOpen, errors);
  const summary = itemSummary(value);
  const detail = itemDetail(value, summary);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        "rounded-md border bg-background",
        errors > 0 && "border-destructive/50",
      )}
    >
      <div className="flex items-center gap-1.5 py-1 pr-1.5 pl-1">
        {handle}
        <CollapsibleTrigger
          aria-controls={`${fieldId(idPrefix, pointer)}--body`}
          className="group/trigger flex min-w-0 flex-1 items-center gap-2 rounded-sm px-1 py-1 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ChevronRightIcon
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/trigger:rotate-90"
          />
          <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
            {index + 1}
          </span>
          <span className="truncate text-sm font-medium">
            {summary ?? name}
          </span>
          {detail === null ? null : (
            <span className="truncate font-mono text-xs text-muted-foreground">
              {detail}
            </span>
          )}
          <span className="sr-only">({name})</span>
          {errors === 0 ? null : (
            <Badge variant="destructive" className="h-5 px-1.5 text-[11px]">
              {errors} {errors === 1 ? "issue" : "issues"}
            </Badge>
          )}
        </CollapsibleTrigger>
        {actions}
      </div>
      <CollapsibleContent
        id={`${fieldId(idPrefix, pointer)}--body`}
        className="border-t px-3 pt-3 pb-3.5 pl-9"
      >
        {node.kind === "object" ? <GroupHelp node={node} /> : null}
        <PointerMessages pointer={pointer} className="mb-2" />
        {node.kind === "object" ? (
          isFlatObject(node) ? (
            <FlatRow
              node={node}
              value={value}
              pointer={pointer}
              first
              depth={depth}
            />
          ) : (
            <ObjectFields
              node={node}
              value={value}
              pointer={pointer}
              depth={depth + 1}
            />
          )
        ) : (
          <FieldRenderer
            node={node}
            value={value}
            pointer={pointer}
            label={name}
            required
            depth={depth + 2}
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ItemActions({
  name,
  index,
  count,
  canAdd,
  canRemove,
  onMove,
  onDuplicate,
  onRemove,
}: {
  name: string;
  index: number;
  count: number;
  canAdd: boolean;
  canRemove: boolean;
  onMove(from: number, to: number): void;
  onDuplicate(): void;
  onRemove(): void;
}): React.JSX.Element {
  const iconButton = "text-muted-foreground hover:text-foreground";
  return (
    <div className="flex shrink-0 items-center">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={iconButton}
        aria-label={`Move ${name} up`}
        title="Move up"
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        <ArrowUpIcon aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={iconButton}
        aria-label={`Move ${name} down`}
        title="Move down"
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        <ArrowDownIcon aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={iconButton}
        aria-label={`Duplicate ${name}`}
        title="Duplicate"
        disabled={!canAdd}
        onClick={onDuplicate}
      >
        <CopyIcon aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground hover:text-destructive"
        aria-label={`Remove ${name}`}
        title="Remove"
        disabled={!canRemove}
        onClick={onRemove}
      >
        <Trash2Icon aria-hidden />
      </Button>
    </div>
  );
}
