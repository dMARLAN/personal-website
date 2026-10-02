import { FONTS, PB_LEGEND, type FontId } from "./constants";

/** A point in DCS display increments (DI): origin at the screen centre, +y up. */
export type Point = readonly [x: number, y: number];

type Horizontal = "Left" | "Center" | "Right";
type Vertical = "Top" | "Center" | "Bottom";

/** The DCS 9-way alignment, for example `LeftCenter` or `CenterTop`. */
export type Align = `${Horizontal}${Vertical}`;

export interface Size {
  width: number;
  height: number;
}

/** An axis-aligned box in DCS coordinates (+y up, so `top > bottom`). */
export interface Rect {
  left: number;
  right: number;
  bottom: number;
  top: number;
}

const ALIGN_FRACTIONS: Readonly<
  Record<Align, readonly [x: number, y: number]>
> = {
  LeftTop: [0, 1],
  LeftCenter: [0, 0.5],
  LeftBottom: [0, 0],
  CenterTop: [0.5, 1],
  CenterCenter: [0.5, 0.5],
  CenterBottom: [0.5, 0],
  RightTop: [1, 1],
  RightCenter: [1, 0.5],
  RightBottom: [1, 0],
};

/** How far across the box `alignment` sits: 0 is left or bottom, 1 is right or top. */
export function alignFractions(
  alignment: Align,
): readonly [x: number, y: number] {
  return ALIGN_FRACTIONS[alignment];
}

/** SVG is y-down; DCS is y-up. */
export function toSvg([x, y]: Point): Point {
  return [x, -y];
}

/** The box of `size` whose `alignment` point sits at `pos`. */
export function align(size: Size, alignment: Align, [x, y]: Point): Rect {
  const [fractionX, fractionY] = alignFractions(alignment);
  const left = x - size.width * fractionX;
  const bottom = y - size.height * fractionY;
  return { left, right: left + size.width, bottom, top: bottom + size.height };
}

/** Width of one line of `length` characters: n·W + (n − 1)·interchar [fnd §3.3]. */
export function lineWidth(length: number, font: FontId): number {
  const { width, interchar } = FONTS[font];
  return length === 0 ? 0 : length * width + (length - 1) * interchar;
}

export function textLines(text: string): string[][] {
  return text
    .toUpperCase()
    .split("\n")
    .map((line) => [...line]);
}

/** The bounding box of `text`: the widest line, and n·H + (n − 1)·interline for n lines. */
export function measure(text: string, font: FontId): Size {
  const lines = textLines(text);
  const { height, interline } = FONTS[font];
  return {
    width: Math.max(...lines.map((line) => lineWidth(line.length, font))),
    height: lines.length * height + (lines.length - 1) * interline,
  };
}

/** `addStrokeLine`'s far end: `rot` is in degrees counter-clockwise from up. */
export function lineEnd([x, y]: Point, length: number, rot: number): Point {
  const radians = (rot * Math.PI) / 180;
  return [x - length * Math.sin(radians), y + length * Math.cos(radians)];
}

/** A point on a circle at `degrees` clockwise from up, as `addStrokeArc` places it. */
export function arcPoint(radius: number, degrees: number): Point {
  const radians = (degrees * Math.PI) / 180;
  return [radius * Math.sin(radians), radius * Math.cos(radians)];
}

/** Formats a coordinate for path data: at most 3 decimals and no negative zero. */
export function formatNumber(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded === 0 ? 0 : rounded);
}

/** SVG path data for a polyline given in DCS coordinates. */
export function polylinePath(points: readonly Point[], closed = false): string {
  const commands = points.map((point, index) => {
    const [x, y] = toSvg(point);
    return `${index === 0 ? "M" : "L"}${formatNumber(x)},${formatNumber(y)}`;
  });
  return commands.join(" ") + (closed ? " Z" : "");
}

/** An OSB number. DCS numbers them clockwise from the lowest button on the left [bzl §1]. */
export type Pb =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20;

export const PBS: readonly Pb[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
];

export type Edge = "left" | "top" | "right" | "bottom";

/** Which bezel edge `pb` sits on: 1–5 left, 6–10 top, 11–15 right, 16–20 bottom. */
export function pbEdge(pb: Pb): Edge {
  if (pb <= 5) {
    return "left";
  }
  if (pb <= 10) {
    return "top";
  }
  return pb <= 15 ? "right" : "bottom";
}

// MPD_PB_defs.lua [fnd §5.2]
const PB_ROW_START = -336;
const PB_ROW_PITCH = 169;
const PB_COLUMN_TOP = 307;
const PB_COLUMN_PITCH = 167;
const PB_EDGE = PB_LEGEND.edge;

/** The legend anchor of `pb` [fnd §5.2]: the outer text edge, in DI from the screen centre. */
export function pbAnchor(pb: Pb): Point {
  switch (pbEdge(pb)) {
    case "left":
      return [-PB_EDGE, PB_COLUMN_TOP - PB_COLUMN_PITCH * (5 - pb)];
    case "top":
      return [PB_ROW_START + PB_ROW_PITCH * (pb - 6), PB_EDGE];
    case "right":
      return [PB_EDGE, PB_COLUMN_TOP - PB_COLUMN_PITCH * (pb - 11)];
    case "bottom":
      return [PB_ROW_START + PB_ROW_PITCH * (20 - pb), -PB_EDGE];
  }
}
