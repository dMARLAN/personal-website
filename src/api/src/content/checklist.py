from typing import Annotated, Final

from pydantic import Field

from content.base import ContentModel
from content.extensions import new_item
from content.text import GLYPHS

# Where the frontend sets no limit (headings, the A/C WT, MAX NZ and STAB POS labels), the limit is the length of the
# DCS string in that slot.

_TITLE_DESCRIPTION: Final[str] = "The column's heading, ≤ 4 characters."
_MEANING_DESCRIPTION: Final[str] = "What the heading means, for screen readers; not drawn."


class LeftChecklistColumn(ContentModel):
    """≤ 6 items of ≤ 13 characters, so they clear the right column."""

    title: Annotated[str, Field(min_length=1, max_length=4, title="Title", description=_TITLE_DESCRIPTION), GLYPHS]
    meaning: Annotated[str, Field(min_length=1, title="Meaning", description=_MEANING_DESCRIPTION)]
    items: Annotated[
        list[Annotated[str, Field(min_length=1, max_length=13), GLYPHS]],
        Field(
            max_length=6,
            title="Items",
            description="Up to 6 items, ≤ 13 characters each.",
            json_schema_extra=new_item("ITEM"),
        ),
    ]


class RightChecklistColumn(ContentModel):
    """≤ 9 items of ≤ 16 characters, so they stay inside the glass."""

    title: Annotated[str, Field(min_length=1, max_length=4, title="Title", description=_TITLE_DESCRIPTION), GLYPHS]
    meaning: Annotated[str, Field(min_length=1, title="Meaning", description=_MEANING_DESCRIPTION)]
    items: Annotated[
        list[Annotated[str, Field(min_length=1, max_length=16), GLYPHS]],
        Field(
            max_length=9,
            title="Items",
            description="Up to 9 items, ≤ 16 characters each.",
            json_schema_extra=new_item("ITEM"),
        ),
    ]


class ChecklistWeight(ContentModel):
    label: Annotated[str, Field(min_length=1, max_length=6, title="Label", description="In place of A/C WT."), GLYPHS]
    # At x = −79.5, clear of the right column.
    value: Annotated[
        str, Field(min_length=1, max_length=6, title="Value", description="Drawn after the label."), GLYPHS
    ]


class ChecklistStab(ContentModel):
    label: Annotated[str, Field(min_length=1, max_length=8, title="Label", description="In place of STAB POS."), GLYPHS]
    left: Annotated[str, Field(min_length=1, max_length=6, title="Left", description="The left value."), GLYPHS]
    right: Annotated[str, Field(min_length=1, max_length=6, title="Right", description="The right value."), GLYPHS]


class Checklist(ContentModel):
    """/chklst → CHKLST (docs/pages/chklst.md)."""

    left: Annotated[LeftChecklistColumn, Field(title="Left column", description="Up to 6 items of ≤ 13 characters.")]
    right: Annotated[RightChecklistColumn, Field(title="Right column", description="Up to 9 items of ≤ 16 characters.")]
    weight: Annotated[ChecklistWeight, Field(title="Weight", description="The A/C WT line.")]
    max_nz: Annotated[str, Field(min_length=1, max_length=6, title="Max NZ", description="The MAX NZ value."), GLYPHS]
    stab: Annotated[ChecklistStab, Field(title="Stabilator", description="The STAB POS line.")]
