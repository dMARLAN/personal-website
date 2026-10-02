"""The `x-` JSON Schema keys the admin console's generated forms read (docs/design.md section 13.2).

Standard keywords (`maxLength`, `pattern`, `maxItems`, `enum`, `minimum`, ...) carry every limit JSON Schema can
express. These keys describe the rest, and how to present a field. They only describe: the Pydantic validators
enforce every rule, and a 422 points at the offending field.
"""

from enum import StrEnum, auto
from typing import Final

from pydantic import BaseModel
from pydantic.config import JsonDict, JsonValue

# On a string the glass draws: `"stroke-font"`. The string also has the font's `pattern`.
DDI_CHARSET: Final[str] = "x-ddi-charset"
STROKE_FONT: Final[str] = "stroke-font"
# On wrapped prose: `{"chars": N, "rows": M}`, a greedy word wrap into at most M rows of N characters.
DDI_WRAP: Final[str] = "x-ddi-wrap"
# On an object drawn as one row: `{"fields": [...], "gap": G, "maxLength": N}`, the fields' lengths plus G fit N.
DDI_COMBINED_LENGTH: Final[str] = "x-ddi-combined-length"
# On a string: the input to render, a `Widget`. Absent means a one-line text input.
UI_WIDGET: Final[str] = "x-ui-widget"
# On a variable-length array: the item "add item" appends. It is valid against the item schema.
UI_NEW_ITEM: Final[str] = "x-ui-new-item"
# On an array of objects: property names whose values must each be unique across the items.
UI_UNIQUE_BY: Final[str] = "x-ui-unique-by"
# On a string: it must equal one of the values at this path from the section document's root, where `*` is any
# array index. For example `categories/*/legend`.
UI_OPTIONS_FROM: Final[str] = "x-ui-options-from"
# On an object or array: rules no other key expresses, as sentences to show beside the field.
UI_RULES: Final[str] = "x-ui-rules"


class Widget(StrEnum):
    TEXTAREA = auto()
    URL = auto()
    EMAIL = auto()


def widget(kind: Widget) -> JsonDict:
    return {UI_WIDGET: kind.value}


def new_item(item: BaseModel | str) -> JsonDict:
    """`item` is built as its model, so a default that breaks the item's own rules fails at import."""
    value: JsonValue = item if isinstance(item, str) else item.model_dump(mode="json")
    return {UI_NEW_ITEM: value}


def unique_by(*keys: str) -> JsonDict:
    return {UI_UNIQUE_BY: list(keys)}


def options_from(path: str) -> JsonDict:
    return {UI_OPTIONS_FROM: path}


def combined_length(*fields: str, gap: int, max_length: int) -> JsonDict:
    return {DDI_COMBINED_LENGTH: {"fields": list(fields), "gap": gap, "maxLength": max_length}}


def rules(*sentences: str) -> JsonDict:
    return {UI_RULES: list(sentences)}
