from typing import Annotated

from pydantic import Field

from content.base import ContentModel
from content.text import GLYPHS

# Where the frontend sets no limit (headings, the A/C WT, MAX NZ and STAB POS labels), the limit is the length of the
# DCS string in that slot.


class LeftChecklistColumn(ContentModel):
    """≤ 6 items of ≤ 13 characters, so they clear the right column."""

    title: Annotated[str, Field(min_length=1, max_length=4), GLYPHS]
    # What the heading means, for the semantic layer.
    meaning: Annotated[str, Field(min_length=1)]
    items: Annotated[list[Annotated[str, Field(min_length=1, max_length=13), GLYPHS]], Field(max_length=6)]


class RightChecklistColumn(ContentModel):
    """≤ 9 items of ≤ 16 characters, so they stay inside the glass."""

    title: Annotated[str, Field(min_length=1, max_length=4), GLYPHS]
    meaning: Annotated[str, Field(min_length=1)]
    items: Annotated[list[Annotated[str, Field(min_length=1, max_length=16), GLYPHS]], Field(max_length=9)]


class ChecklistWeight(ContentModel):
    label: Annotated[str, Field(min_length=1, max_length=6), GLYPHS]
    # At x = −79.5, clear of the right column.
    value: Annotated[str, Field(min_length=1, max_length=6), GLYPHS]


class ChecklistStab(ContentModel):
    label: Annotated[str, Field(min_length=1, max_length=8), GLYPHS]
    left: Annotated[str, Field(min_length=1, max_length=6), GLYPHS]
    right: Annotated[str, Field(min_length=1, max_length=6), GLYPHS]


class Checklist(ContentModel):
    """/chklst → CHKLST (docs/pages/chklst.md)."""

    left: LeftChecklistColumn
    right: RightChecklistColumn
    weight: ChecklistWeight
    max_nz: Annotated[str, Field(min_length=1, max_length=6), GLYPHS]
    stab: ChecklistStab
