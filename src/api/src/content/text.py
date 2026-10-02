"""What the DDI can draw: the stroke font's glyph set and the fixed-pitch word wrap (docs/design.md section 7).

These mirror `src/frontend/src/ddi/font/` so the admin cannot save text that fails to render. Each rule is also put
into the JSON Schema (a `pattern`, the `x-ddi-*` keys of `content/extensions.py`), so the admin forms can check it
while Chad types.
"""

from dataclasses import dataclass
from typing import Final

from pydantic import GetCoreSchemaHandler, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import CoreSchema, core_schema

from content.extensions import DDI_CHARSET, DDI_WRAP, STROKE_FONT, UI_WIDGET, Widget

# The DCS stroke font (`ddi/generated/strokeFont.ts`) plus our `@` (`ddi/font/extraGlyphs.ts`). A space draws nothing.
_GLYPHS: Final[str] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-+'()*%,°./\\?:#=_^@ "
# Text is upper-cased before drawing, so lower case letters are fine on input. No other character changes when
# upper-cased, so every allowed character draws as exactly one glyph.
_ALLOWED: Final[frozenset[str]] = frozenset(_GLYPHS + _GLYPHS.lower())
# `_ALLOWED` as a pattern that ECMAScript (with the `u` flag) and Python read alike: `-` last and `^` not first, so
# only the backslash needs escaping. tests/content/test_text.py checks the two agree.
GLYPH_PATTERN: Final[str] = r"^[A-Za-z0-9 +'()*%,°./\\?:#=_^@-]*$"


def check_glyphs(text: str) -> str:
    if missing := sorted(set(text) - _ALLOWED):
        raise ValueError(f"the DDI font has no glyph for {''.join(missing)!r}")
    return text


@dataclass(frozen=True, slots=True)
class _DrawnText:
    """Annotates a string the glass draws: checks its glyphs, and says so in the JSON Schema."""

    def __get_pydantic_core_schema__(self, source: type, handler: GetCoreSchemaHandler) -> CoreSchema:
        return core_schema.no_info_after_validator_function(check_glyphs, handler(source))

    def __get_pydantic_json_schema__(self, schema: CoreSchema, handler: GetJsonSchemaHandler) -> JsonSchemaValue:
        json_schema = handler(schema)
        json_schema[DDI_CHARSET] = STROKE_FONT
        if "pattern" in json_schema:
            # The string has its own pattern (the email); JSON Schema checks both through `allOf`.
            json_schema["allOf"] = [{"pattern": GLYPH_PATTERN}]
        else:
            json_schema["pattern"] = GLYPH_PATTERN
        return json_schema


GLYPHS: Final[_DrawnText] = _DrawnText()


class WordTooLongError(ValueError):
    def __init__(self, word: str, max_chars: int) -> None:
        super().__init__(f"{word!r} is longer than {max_chars} characters, so it cannot wrap")


def wrap_text(text: str, max_chars: int) -> list[str]:
    """Greedy word wrap for the fixed-pitch font, as `wrapText` in `ddi/font/wrap.ts`."""
    lines: list[str] = []
    line = ""
    for word in text.split():
        if len(word) > max_chars:
            raise WordTooLongError(word, max_chars)
        if not line:
            line = word
        elif len(line) + 1 + len(word) <= max_chars:
            line = f"{line} {word}"
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


@dataclass(frozen=True, slots=True)
class FitsRows:
    """Annotates wrapped prose: it word-wraps to at most `rows` rows of `chars` characters.

    Use it with `Field(max_length=<it>.max_length)`, the longest text such a wrap can hold, so the schema has a
    `maxLength` too.
    """

    chars: int
    rows: int

    @property
    def max_length(self) -> int:
        return self.chars * self.rows + self.rows - 1

    def check(self, text: str) -> str:
        if (count := len(wrap_text(text, self.chars))) > self.rows:
            raise ValueError(f"wraps to {count} rows; the slot fits {self.rows} rows of {self.chars} characters")
        return text

    def __get_pydantic_core_schema__(self, source: type, handler: GetCoreSchemaHandler) -> CoreSchema:
        return core_schema.no_info_after_validator_function(self.check, handler(source))

    def __get_pydantic_json_schema__(self, schema: CoreSchema, handler: GetJsonSchemaHandler) -> JsonSchemaValue:
        json_schema = handler(schema)
        json_schema[DDI_WRAP] = {"chars": self.chars, "rows": self.rows}
        json_schema[UI_WIDGET] = Widget.TEXTAREA.value
        return json_schema
