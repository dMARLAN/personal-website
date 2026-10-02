# /// script
# requires-python = ">=3.14"
# dependencies = []
# ///
"""Extract the DCS F/A-18C MDG stroke font and stroke symbols into TypeScript modules.

Reads `$DCS_ROOT/Mods/aircraft/FA-18C/Cockpit/IndicationResources/MDG/*.svg` (read-only) and writes
`src/frontend/src/ddi/generated/strokeFont.ts` and `strokeSymbols.ts`. See docs/design.md section 7.1 and
docs/research/dcs-lua-foundations.md section 3.

Run with `make dcs-assets`.
"""

import hashlib
import json
import math
import os
import re
import xml.etree.ElementTree as ET
from collections.abc import Callable, Iterator
from dataclasses import dataclass
from pathlib import Path
from textwrap import dedent
from typing import Final

type Point = tuple[float, float]
type Matrix = tuple[float, float, float, float, float, float]

MDG_DIR: Final[Path] = Path("Mods/aircraft/FA-18C/Cockpit/IndicationResources/MDG")
FONT_FILE: Final[str] = "stroke_font.svg"
SYMBOL_FILES: Final[tuple[str, ...]] = ("stroke_symbols_MDI_AMPCD.svg", "stroke_symbols_HUD.svg")
OUT_DIR: Final[Path] = Path(__file__).resolve().parent.parent / "src/frontend/src/ddi/generated"

SVG_NS: Final[str] = "{http://www.w3.org/2000/svg}"
IDENTITY: Final[Matrix] = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)

# stroke_font.svg: viewBox 0 0 21000 29700 on a 744.09 px page, and 1 px = 1 DI [fnd §3.2].
FONT_UNITS_PER_DI: Final[float] = 21000 / 744.09448
CELL_X0: Final[float] = 282.2222
CELL_Y0: Final[float] = 348.8889
CELL_PITCH_X: Final[float] = 564.4444
CELL_PITCH_Y: Final[float] = 846.6667

# The 55 characters that fonts.lua maps, keyed by their SVG id. The `*-alt` ids are unused and dropped.
FONT_CHARS: Final[dict[str, str]] = {
    **{char: char for char in "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"},
    "symbol-minus": "-",
    "symbol-plus": "+",
    "symbol-apostrophe": "'",
    "symbol-parenthesis-left": "(",
    "symbol-parenthesis-right": ")",
    "symbol-asterisk": "*",
    "symbol-percent": "%",
    "symbol-comma": ",",
    "symbol-degree": "°",
    "symbol-period": ".",
    "symbol-slash": "/",
    "symbol-backslash": "\\",
    "symbol-quote": '"',
    "symbol-question": "?",
    "symbol-colon": ":",
    "symbol-octothorpe": "#",
    "symbol-equal": "=",
    "symbol-underscore": "_",
    "symbol-lambda": "^",
}

BEZIER_SAMPLES: Final[int] = 16
ARC_SEGMENTS_PER_TURN: Final[int] = 64
# A closed curved subpath is emitted as a circle when every sample lies within this fraction of the radius.
CIRCLE_TOLERANCE: Final[float] = 0.03
DECIMALS: Final[int] = 2
# A subpath whose ends are closer than this (in DI) is closed.
CLOSED_GAP: Final[float] = 0.05

PATH_TOKEN: Final[re.Pattern[str]] = re.compile(r"[A-Za-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?")


@dataclass(frozen=True, slots=True)
class Subpath:
    points: list[Point]
    curved: bool


@dataclass(frozen=True, slots=True)
class Poly:
    points: list[Point]


@dataclass(frozen=True, slots=True)
class Circle:
    center: Point
    radius: float


type Stroke = Poly | Circle


class PathParser:
    """Flattens SVG path data into polylines. Supports the commands the DCS files use: M L H V C A Z."""

    def __init__(self, data: str) -> None:
        self.tokens = PATH_TOKEN.findall(data)
        self.index = 0
        self.current: Point = (0.0, 0.0)
        self.start: Point = (0.0, 0.0)
        self.subpaths: list[Subpath] = []
        self.points: list[Point] = []
        self.curved = False

    def parse(self) -> list[Subpath]:
        command = ""
        while self.index < len(self.tokens):
            if self.tokens[self.index].isalpha():
                command = self.tokens[self.index]
                self.index += 1
            command = self.run(command)
        self.flush()
        return self.subpaths

    def run(self, command: str) -> str:
        """Runs one command and returns the command implied for any repeated coordinates that follow."""
        relative = command.islower()
        match command.upper():
            case "M":
                self.flush()
                self.current = self.read_point(relative)
                self.start = self.current
                self.points = [self.current]
                return "l" if relative else "L"
            case "L":
                self.line_to(self.read_point(relative))
            case "H":
                x = self.read_number() + (self.current[0] if relative else 0.0)
                self.line_to((x, self.current[1]))
            case "V":
                y = self.read_number() + (self.current[1] if relative else 0.0)
                self.line_to((self.current[0], y))
            case "C":
                controls = (self.read_point(relative), self.read_point(relative), self.read_point(relative))
                self.points += sample_cubic(self.current, *controls)
                self.current = controls[2]
                self.curved = True
            case "A":
                self.arc_to(relative)
            case "Z":
                self.line_to(self.start)
                self.flush()
            case _:
                raise ValueError(f"unsupported path command {command!r}")
        return command

    def read_number(self) -> float:
        value = float(self.tokens[self.index])
        self.index += 1
        return value

    def read_point(self, relative: bool) -> Point:
        x, y = self.read_number(), self.read_number()
        if relative:
            return (self.current[0] + x, self.current[1] + y)
        return (x, y)

    def line_to(self, point: Point) -> None:
        self.points.append(point)
        self.current = point

    def arc_to(self, relative: bool) -> None:
        rx, ry, rotation = self.read_number(), self.read_number(), self.read_number()
        large_arc, sweep = self.read_number() != 0, self.read_number() != 0
        end = self.read_point(relative)
        self.points += sample_arc(Arc(self.current, end, (abs(rx), abs(ry)), rotation, large_arc, sweep))
        self.current = end
        self.curved = True

    def flush(self) -> None:
        if len(self.points) > 1:
            self.subpaths.append(Subpath(self.points, self.curved))
        self.points = [self.current]
        self.curved = False


def sample_cubic(p0: Point, p1: Point, p2: Point, p3: Point) -> list[Point]:
    samples: list[Point] = []
    for step in range(1, BEZIER_SAMPLES + 1):
        t = step / BEZIER_SAMPLES
        u = 1 - t
        weights = (u**3, 3 * u * u * t, 3 * u * t * t, t**3)
        samples.append(
            (
                sum(w * p[0] for w, p in zip(weights, (p0, p1, p2, p3), strict=True)),
                sum(w * p[1] for w, p in zip(weights, (p0, p1, p2, p3), strict=True)),
            )
        )
    return samples


@dataclass(frozen=True, slots=True)
class Arc:
    start: Point
    end: Point
    radii: Point
    rotation: float
    large_arc: bool
    sweep: bool


def rotate(point: Point, radians: float) -> Point:
    cos_angle, sin_angle = math.cos(radians), math.sin(radians)
    return (cos_angle * point[0] - sin_angle * point[1], sin_angle * point[0] + cos_angle * point[1])


@dataclass(frozen=True, slots=True)
class ArcCenter:
    center: Point
    radii: Point
    start_angle: float
    sweep_angle: float


def arc_center(arc: Arc) -> ArcCenter:
    """Endpoint-to-centre arc conversion, per https://www.w3.org/TR/SVG2/implnote.html#ArcConversionEndpointToCenter"""
    phi = math.radians(arc.rotation)
    x1, y1 = rotate(((arc.start[0] - arc.end[0]) / 2, (arc.start[1] - arc.end[1]) / 2), -phi)
    scale = math.sqrt(max(1.0, (x1 / arc.radii[0]) ** 2 + (y1 / arc.radii[1]) ** 2))
    rx, ry = arc.radii[0] * scale, arc.radii[1] * scale
    numerator = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
    factor = math.sqrt(max(0.0, numerator / (rx * rx * y1 * y1 + ry * ry * x1 * x1)))
    if arc.large_arc == arc.sweep:
        factor = -factor
    cx1, cy1 = factor * rx * y1 / ry, -factor * ry * x1 / rx
    offset = rotate((cx1, cy1), phi)
    start_angle = math.atan2((y1 - cy1) / ry, (x1 - cx1) / rx)
    sweep_angle = (math.atan2((-y1 - cy1) / ry, (-x1 - cx1) / rx) - start_angle) % (2 * math.pi)
    if not arc.sweep:
        sweep_angle -= 2 * math.pi
    return ArcCenter(
        center=(offset[0] + (arc.start[0] + arc.end[0]) / 2, offset[1] + (arc.start[1] + arc.end[1]) / 2),
        radii=(rx, ry),
        start_angle=start_angle,
        sweep_angle=sweep_angle,
    )


def sample_arc(arc: Arc) -> list[Point]:
    params = arc_center(arc)
    phi = math.radians(arc.rotation)
    segments = max(2, math.ceil(abs(params.sweep_angle) / (2 * math.pi) * ARC_SEGMENTS_PER_TURN))
    samples: list[Point] = []
    for step in range(1, segments + 1):
        angle = params.start_angle + params.sweep_angle * step / segments
        x, y = rotate((params.radii[0] * math.cos(angle), params.radii[1] * math.sin(angle)), phi)
        samples.append((params.center[0] + x, params.center[1] + y))
    return samples


def multiply(a: Matrix, b: Matrix) -> Matrix:
    return (
        a[0] * b[0] + a[2] * b[1],
        a[1] * b[0] + a[3] * b[1],
        a[0] * b[2] + a[2] * b[3],
        a[1] * b[2] + a[3] * b[3],
        a[0] * b[4] + a[2] * b[5] + a[4],
        a[1] * b[4] + a[3] * b[5] + a[5],
    )


def parse_transform(transform: str | None) -> Matrix:
    matrix = IDENTITY
    for name, raw_args in re.findall(r"(\w+)\(([^)]*)\)", transform or ""):
        args = [float(value) for value in re.split(r"[\s,]+", raw_args.strip())]
        matrix = multiply(matrix, transform_matrix(name, args))
    return matrix


def transform_matrix(name: str, args: list[float]) -> Matrix:
    match name, args:
        case "matrix", [a, b, c, d, e, f]:
            return (a, b, c, d, e, f)
        case "translate", [tx, *rest]:
            # SVG: an omitted ty is 0.
            return (1.0, 0.0, 0.0, 1.0, tx, rest[0] if rest else 0.0)
        case "scale", [sx, *rest]:
            # SVG: an omitted sy equals sx.
            return (sx, 0.0, 0.0, rest[0] if rest else sx, 0.0, 0.0)
        case "rotate", [degrees]:
            return rotation_matrix(degrees)
        case "rotate", [degrees, cx, cy]:
            to_center = (1.0, 0.0, 0.0, 1.0, cx, cy)
            from_center = (1.0, 0.0, 0.0, 1.0, -cx, -cy)
            return multiply(multiply(to_center, rotation_matrix(degrees)), from_center)
        case _:
            raise ValueError(f"unsupported transform {name}({args})")


def rotation_matrix(degrees: float) -> Matrix:
    angle = math.radians(degrees)
    return (math.cos(angle), math.sin(angle), -math.sin(angle), math.cos(angle), 0.0, 0.0)


def apply(matrix: Matrix, point: Point) -> Point:
    x, y = point
    return (matrix[0] * x + matrix[2] * y + matrix[4], matrix[1] * x + matrix[3] * y + matrix[5])


def ellipse_points(cx: float, cy: float, rx: float, ry: float) -> list[Point]:
    return [
        (
            cx + rx * math.cos(2 * math.pi * k / ARC_SEGMENTS_PER_TURN),
            cy + ry * math.sin(2 * math.pi * k / ARC_SEGMENTS_PER_TURN),
        )
        for k in range(ARC_SEGMENTS_PER_TURN + 1)
    ]


def numbers(element: ET.Element, *names: str) -> list[float]:
    return [float(element.attrib[name]) for name in names]


def read_path(element: ET.Element) -> list[Subpath]:
    return PathParser(element.attrib["d"]).parse()


def read_line(element: ET.Element) -> list[Subpath]:
    x1, y1, x2, y2 = numbers(element, "x1", "y1", "x2", "y2")
    return [Subpath([(x1, y1), (x2, y2)], curved=False)]


def read_points(element: ET.Element) -> list[Point]:
    values = [float(value) for value in re.split(r"[\s,]+", element.attrib["points"].strip())]
    return list(zip(values[0::2], values[1::2], strict=True))


def read_polyline(element: ET.Element) -> list[Subpath]:
    return [Subpath(read_points(element), curved=False)]


def read_polygon(element: ET.Element) -> list[Subpath]:
    points = read_points(element)
    return [Subpath([*points, points[0]], curved=False)]


def read_rect(element: ET.Element) -> list[Subpath]:
    x, y, width, height = numbers(element, "x", "y", "width", "height")
    return [Subpath([(x, y), (x + width, y), (x + width, y + height), (x, y + height), (x, y)], curved=False)]


def read_ellipse(element: ET.Element) -> list[Subpath]:
    cx, cy, rx, ry = numbers(element, "cx", "cy", "rx", "ry")
    return [Subpath(ellipse_points(cx, cy, rx, ry), curved=True)]


def read_circle(element: ET.Element) -> list[Subpath]:
    cx, cy, radius = numbers(element, "cx", "cy", "r")
    return [Subpath(ellipse_points(cx, cy, radius, radius), curved=True)]


SHAPE_READERS: Final[dict[str, Callable[[ET.Element], list[Subpath]]]] = {
    "path": read_path,
    "line": read_line,
    "polyline": read_polyline,
    "polygon": read_polygon,
    "rect": read_rect,
    "ellipse": read_ellipse,
    "circle": read_circle,
}


def element_subpaths(element: ET.Element) -> list[Subpath]:
    """The element's own geometry in its local coordinates. Groups and non-shape elements have none."""
    reader = SHAPE_READERS.get(element.tag.removeprefix(SVG_NS))
    return reader(element) if reader else []


def collect(element: ET.Element, parent: Matrix) -> Iterator[Subpath]:
    """Every subpath under `element`, in file coordinates with all transforms applied."""
    matrix = multiply(parent, parse_transform(element.get("transform")))
    for subpath in element_subpaths(element):
        yield Subpath([apply(matrix, point) for point in subpath.points], subpath.curved)
    for child in element:
        yield from collect(child, matrix)


def to_stroke(subpath: Subpath) -> Stroke:
    points = subpath.points
    if subpath.curved and math.dist(points[0], points[-1]) < CLOSED_GAP:
        xs, ys = [p[0] for p in points], [p[1] for p in points]
        center = ((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2)
        radius = (max(xs) - min(xs) + max(ys) - min(ys)) / 4
        if all(abs(math.dist(center, point) - radius) <= CIRCLE_TOLERANCE * radius for point in points):
            return Circle(center, radius)
    return Poly(points)


def bounds(subpaths: list[Subpath]) -> tuple[float, float, float, float]:
    xs = [point[0] for subpath in subpaths for point in subpath.points]
    ys = [point[1] for subpath in subpaths for point in subpath.points]
    return min(xs), min(ys), max(xs), max(ys)


def to_local(subpaths: list[Subpath], origin: Point, units_per_di: float) -> list[Stroke]:
    ox, oy = origin
    return [
        to_stroke(
            Subpath([((x - ox) / units_per_di, (y - oy) / units_per_di) for x, y in subpath.points], subpath.curved)
        )
        for subpath in subpaths
    ]


def extract_font(root: ET.Element) -> dict[str, list[Stroke]]:
    """Each glyph in DI, origin at its 12 x 20 cell's top-left, y down [fnd §3.2]."""
    glyphs: dict[str, list[Stroke]] = {}
    for element in root:
        svg_id = element.get("id")
        if svg_id not in FONT_CHARS:
            continue
        subpaths = list(collect(element, IDENTITY))
        left, top, right, bottom = bounds(subpaths)
        column = math.floor(((left + right) / 2 - CELL_X0) / CELL_PITCH_X)
        row = math.floor(((top + bottom) / 2 - CELL_Y0) / CELL_PITCH_Y)
        origin = (CELL_X0 + column * CELL_PITCH_X, CELL_Y0 + row * CELL_PITCH_Y)
        glyphs[FONT_CHARS[svg_id]] = to_local(subpaths, origin, FONT_UNITS_PER_DI)
    missing = set(FONT_CHARS.values()) - set(glyphs)
    if missing:
        raise ValueError(f"stroke_font.svg lacks glyphs for {sorted(missing)}")
    return {char: glyphs[char] for char in FONT_CHARS.values()}


def extract_symbols(root: ET.Element, into: dict[str, list[Stroke]]) -> None:
    """Each symbol in DI (1 file unit = 1 DI), origin at its bounding-box centre, y down."""
    layer = root.find(f"{SVG_NS}g[@id='layer1']")
    if layer is None:
        raise ValueError("symbol file has no layer1 group")
    for element in layer:
        symbol_id = element.attrib["id"]
        if symbol_id in into:
            raise ValueError(f"duplicate symbol id {symbol_id!r}")
        subpaths = list(collect(element, IDENTITY))
        left, top, right, bottom = bounds(subpaths)
        into[symbol_id] = to_local(subpaths, ((left + right) / 2, (top + bottom) / 2), 1.0)


def number(value: float) -> str:
    rounded = round(value, DECIMALS)
    return f"{rounded + 0.0:g}"  # + 0.0 turns -0.0 into 0.0


def stroke_literal(stroke: Stroke) -> str:
    match stroke:
        case Poly(points):
            coordinates = ", ".join(f"{number(x)}, {number(y)}" for x, y in points)
            return f'{{ kind: "poly", pts: [{coordinates}] }}'
        case Circle((cx, cy), radius):
            return f'{{ kind: "circle", cx: {number(cx)}, cy: {number(cy)}, r: {number(radius)} }}'


def key_literal(key: str) -> str:
    if re.fullmatch(r"[A-Za-z_$][\w$]*", key):
        return key
    escaped = key.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def record_literal(entries: dict[str, list[Stroke]]) -> str:
    lines = []
    for key, strokes in entries.items():
        lines.append(f"  {key_literal(key)}: [")
        lines += [f"    {stroke_literal(stroke)}," for stroke in strokes]
        lines.append("  ],")
    return "\n".join(lines)


def header(sources: list[Path]) -> str:
    lines = ["// Generated. Do not edit. Regenerate with `make dcs-assets` (scripts/extract_dcs_assets.py)."]
    for source in sources:
        lines.append(f"// Source: {source}")
        lines.append(f"// SHA-256: {hashlib.sha256(source.read_bytes()).hexdigest()}")
    lines.append("// Derived from Eagle Dynamics DCS World assets.")
    return "\n".join(lines)


def font_module(source: Path, glyphs: dict[str, list[Stroke]]) -> str:
    body = dedent("""\
        export type Stroke =
          | { kind: "poly"; pts: readonly number[] }
          | { kind: "circle"; cx: number; cy: number; r: number };

        // Each glyph is in DI, origin at the top-left of its 12 x 20 DI cell, y down.
        // prettier-ignore
        export const STROKE_FONT: Readonly<Record<string, readonly Stroke[]>> = {
        """)
    return f"{header([source])}\n\n{body}{record_literal(glyphs)}\n}};\n"


def symbols_module(sources: list[Path], symbols: dict[str, list[Stroke]]) -> str:
    ids = "\n".join(f"  | {json.dumps(symbol_id)}" for symbol_id in symbols)
    body = dedent("""\
        // Each symbol is in DI, origin at its bounding-box centre, y down. DCS anchors symbols with
        // "FromSet", which is C++ [pgB §14.6]; the bounding-box centre is our stand-in.
        // prettier-ignore
        export const STROKE_SYMBOLS: Readonly<Record<SymbolId, readonly Stroke[]>> = {
        """)
    imports = 'import type { Stroke } from "./strokeFont";'
    return (
        f"{header(sources)}\n\n{imports}\n\n// prettier-ignore\nexport type SymbolId =\n{ids};\n\n"
        f"{body}{record_literal(symbols)}\n}};\n"
    )


def main() -> None:
    mdg_dir = Path(os.environ["DCS_ROOT"]) / MDG_DIR
    font_source = mdg_dir / FONT_FILE
    glyphs = extract_font(ET.parse(font_source).getroot())

    symbol_sources = [mdg_dir / name for name in SYMBOL_FILES]
    symbols: dict[str, list[Stroke]] = {}
    for source in symbol_sources:
        extract_symbols(ET.parse(source).getroot(), symbols)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "strokeFont.ts").write_text(font_module(font_source, glyphs), encoding="utf-8")
    (OUT_DIR / "strokeSymbols.ts").write_text(symbols_module(symbol_sources, symbols), encoding="utf-8")
    print(f"Wrote {len(glyphs)} glyphs and {len(symbols)} symbols to {OUT_DIR}")


if __name__ == "__main__":
    main()
