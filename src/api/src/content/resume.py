from typing import Annotated

from pydantic import Field

from content.base import ContentModel
from content.text import GLYPHS

type TitleLine = Annotated[str, Field(min_length=1, max_length=24), GLYPHS]


class SkillRow(ContentModel):
    """Left column: the value must end before the right column (x = 80), so ≤ 15."""

    name: Annotated[str, Field(min_length=1, max_length=6), GLYPHS]
    value: Annotated[str, Field(min_length=1, max_length=15), GLYPHS]


class QualificationRow(ContentModel):
    """Right column: the value must end before the side legends (x = 470), so ≤ 12."""

    name: Annotated[str, Field(min_length=1, max_length=6), GLYPHS]
    value: Annotated[str, Field(min_length=1, max_length=12), GLYPHS]


class SkillColumn(ContentModel):
    # Only the semantic layer shows the heading, so it may use any characters.
    heading: Annotated[str, Field(min_length=1)]
    rows: Annotated[list[SkillRow], Field(max_length=12)]


class QualificationColumn(ContentModel):
    heading: Annotated[str, Field(min_length=1)]
    rows: Annotated[list[QualificationRow], Field(max_length=12)]


class Resume(ContentModel):
    """Resume → S/W CONFIGURATION (docs/pages/resume.md). The PDF is uploaded separately (`PUT /api/admin/resume`)."""

    title: tuple[TitleLine, TitleLine]
    left: SkillColumn
    right: QualificationColumn
