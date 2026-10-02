from typing import Annotated, Final, Self

from pydantic import ConfigDict, Field, model_validator

from content.base import ContentModel, ContentRuleError, first_duplicate
from content.extensions import combined_length, new_item, rules, unique_by
from content.text import GLYPHS, FitsRows, wrap_text

# `WORK_BULLET_CHARS` in `ddi/formats/workHistory.tsx`: from the text indent to x = +400 at 120 %.
_BULLET_CHARS: Final[int] = 38
# `bulletCapacity(roleCount)`: highlight rows that fit under a list of 1, 2, 3 or 4 roles.
_BULLET_ROWS_BY_ROLE_COUNT: Final[dict[int, int]] = {1: 17, 2: 16, 3: 15, 4: 14}
_MAX_BULLET_ROWS: Final[int] = max(_BULLET_ROWS_BY_ROLE_COUNT.values())
# One bullet alone can fill the page's rows, never more; the page's shared budget is `Employer.fits_layout`.
_BULLET: Final[FitsRows] = FitsRows(chars=_BULLET_CHARS, rows=_MAX_BULLET_ROWS)
# The subline: location and span at 120 % within x = ±400, less a 40 DI gap.
_SUBLINE_CHARS: Final[int] = 38
_MAX_ROLES: Final[int] = 4

type Slug = Annotated[str, Field(min_length=1, max_length=40, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")]

_SPAN_DESCRIPTION: Final[str] = "The dates, for example 2021-2024."


class Role(ContentModel):
    title: Annotated[
        str, Field(min_length=1, max_length=27, title="Title", description="The role's job title."), GLYPHS
    ]
    span: Annotated[str, Field(min_length=1, max_length=9, title="Span", description=_SPAN_DESCRIPTION), GLYPHS]
    bullets: Annotated[
        list[
            Annotated[
                str,
                Field(min_length=1, max_length=_BULLET.max_length),
                GLYPHS,
                _BULLET,
            ]
        ],
        Field(
            # Each highlight takes at least one row.
            max_length=_MAX_BULLET_ROWS,
            title="Highlights",
            description=f"Wrapped at {_BULLET_CHARS} characters; the employer's roles share the page's rows.",
            json_schema_extra=new_item("New highlight."),
        ),
    ]


class Employer(ContentModel):
    model_config = ConfigDict(
        json_schema_extra=combined_length("location", "span", gap=0, max_length=_SUBLINE_CHARS)
        | rules(
            "Every role's highlights, wrapped at 38 characters, fit 17 rows with 1 role, 16 with 2, 15 with 3 and "
            "14 with 4."
        )
    )

    id: Annotated[
        Slug, Field(title="ID", description="The URL slug, lower case words joined by hyphens; unique per employer.")
    ]
    tab: Annotated[
        str, Field(min_length=1, max_length=7, title="Tab", description="The employer's top-row legend."), GLYPHS
    ]
    name: Annotated[
        str, Field(min_length=1, max_length=30, title="Name", description="Drawn large above the roles."), GLYPHS
    ]
    # Each ≤ 37: the other is at least one character.
    location: Annotated[
        str,
        Field(min_length=1, max_length=_SUBLINE_CHARS - 1, title="Location", description="The subline's left part."),
        GLYPHS,
    ]
    span: Annotated[
        str,
        Field(
            min_length=1,
            max_length=_SUBLINE_CHARS - 1,
            title="Span",
            description=f"The subline's right part; with the location it fits {_SUBLINE_CHARS} characters.",
        ),
        GLYPHS,
    ]
    roles: Annotated[
        list[Role],
        Field(
            min_length=1,
            max_length=_MAX_ROLES,
            title="Roles",
            description=f"1 to {_MAX_ROLES} roles, newest first.",
            json_schema_extra=new_item(Role(title="ROLE", span="2020-2026", bullets=[])),
        ),
    ]

    @model_validator(mode="after")
    def fits_layout(self) -> Self:
        if (length := len(self.location) + len(self.span)) > _SUBLINE_CHARS:
            raise ContentRuleError(
                ("location",),
                f"location and span are {length} characters together; the subline fits {_SUBLINE_CHARS}",
            )
        capacity = _BULLET_ROWS_BY_ROLE_COUNT[len(self.roles)]
        for index, role in enumerate(self.roles):
            rows = sum(len(wrap_text(bullet, _BULLET_CHARS)) for bullet in role.bullets)
            if rows > capacity:
                raise ContentRuleError(
                    ("roles", index, "bullets"),
                    f"{role.title!r}: the highlights wrap to {rows} rows; with {len(self.roles)} roles the page fits "
                    f"{capacity} rows of {_BULLET_CHARS} characters",
                )
        return self


class Work(ContentModel):
    """Work history (docs/pages/work.md): one employer per top-row tab (PB6–10), newest first."""

    employers: Annotated[
        list[Employer],
        Field(
            min_length=1,
            max_length=5,
            title="Employers",
            description="1 to 5 employers, newest first; each gets a top-row tab.",
            json_schema_extra=unique_by("id")
            | new_item(
                Employer(
                    id="new-employer",
                    tab="NEW",
                    name="EMPLOYER",
                    location="CITY",
                    span="2020-2026",
                    roles=[Role(title="ROLE", span="2020-2026", bullets=[])],
                )
            ),
        ),
    ]

    @model_validator(mode="after")
    def unique_ids(self) -> Self:
        if (index := first_duplicate([employer.id for employer in self.employers])) is not None:
            raise ContentRuleError(("employers", index, "id"), "employer ids must be unique")
        return self
