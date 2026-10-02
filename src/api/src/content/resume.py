from typing import Annotated, Final

from pydantic import Field

from content.base import ContentModel
from content.extensions import new_item
from content.text import GLYPHS

_MAX_ROWS: Final[int] = 12

type TitleLine = Annotated[str, Field(min_length=1, max_length=24), GLYPHS]


class SkillRow(ContentModel):
    """Left column: the value must end before the right column (x = 80), so ≤ 15."""

    name: Annotated[str, Field(min_length=1, max_length=6, title="Name", description="The row's short label."), GLYPHS]
    value: Annotated[
        str, Field(min_length=1, max_length=15, title="Value", description="Drawn after the name."), GLYPHS
    ]


class QualificationRow(ContentModel):
    """Right column: the value must end before the side legends (x = 470), so ≤ 12."""

    name: Annotated[str, Field(min_length=1, max_length=6, title="Name", description="The row's short label."), GLYPHS]
    value: Annotated[
        str, Field(min_length=1, max_length=12, title="Value", description="Drawn after the name."), GLYPHS
    ]


class SkillColumn(ContentModel):
    # Only the semantic layer shows the heading, so it may use any characters.
    heading: Annotated[
        str,
        Field(min_length=1, title="Heading", description="The column's heading for screen readers; not drawn."),
    ]
    rows: Annotated[
        list[SkillRow],
        Field(
            max_length=_MAX_ROWS,
            title="Rows",
            description=f"Up to {_MAX_ROWS} skills, top first.",
            json_schema_extra=new_item(SkillRow(name="SKILL", value="VALUE")),
        ),
    ]


class QualificationColumn(ContentModel):
    heading: Annotated[
        str,
        Field(min_length=1, title="Heading", description="The column's heading for screen readers; not drawn."),
    ]
    rows: Annotated[
        list[QualificationRow],
        Field(
            max_length=_MAX_ROWS,
            title="Rows",
            description=f"Up to {_MAX_ROWS} qualifications, top first.",
            json_schema_extra=new_item(QualificationRow(name="QUAL", value="VALUE")),
        ),
    ]


class Resume(ContentModel):
    """Resume → S/W CONFIGURATION (docs/pages/resume.md). The PDF is uploaded separately (`PUT /api/admin/resume`)."""

    title: Annotated[
        tuple[TitleLine, TitleLine],
        Field(title="Title", description="Two lines drawn large at the top, ≤ 24 characters each."),
    ]
    left: Annotated[SkillColumn, Field(title="Left column", description="Skills: name ≤ 6, value ≤ 15.")]
    right: Annotated[
        QualificationColumn, Field(title="Right column", description="Qualifications: name ≤ 6, value ≤ 12.")
    ]
