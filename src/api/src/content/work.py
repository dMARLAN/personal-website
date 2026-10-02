from typing import Annotated, Final, Self

from pydantic import Field, model_validator

from content.base import ContentModel
from content.text import GLYPHS, wrap_text

# `WORK_BULLET_CHARS` in `ddi/formats/workHistory.tsx`: from the text indent to x = +400 at 120 %.
_BULLET_CHARS: Final[int] = 38
# `bulletCapacity(roleCount)`: highlight rows that fit under a list of 1, 2, 3 or 4 roles.
_BULLET_ROWS_BY_ROLE_COUNT: Final[dict[int, int]] = {1: 17, 2: 16, 3: 15, 4: 14}
# The subline: location and span at 120 % within x = ±400, less a 40 DI gap.
_SUBLINE_CHARS: Final[int] = 38

type Slug = Annotated[str, Field(min_length=1, max_length=40, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")]


class Role(ContentModel):
    title: Annotated[str, Field(min_length=1, max_length=27), GLYPHS]
    span: Annotated[str, Field(min_length=1, max_length=9), GLYPHS]
    bullets: list[Annotated[str, Field(min_length=1), GLYPHS]]


class Employer(ContentModel):
    id: Slug
    tab: Annotated[str, Field(min_length=1, max_length=7), GLYPHS]
    name: Annotated[str, Field(min_length=1, max_length=30), GLYPHS]
    location: Annotated[str, Field(min_length=1), GLYPHS]
    span: Annotated[str, Field(min_length=1), GLYPHS]
    roles: Annotated[list[Role], Field(min_length=1, max_length=4)]

    @model_validator(mode="after")
    def fits_layout(self) -> Self:
        if (length := len(self.location) + len(self.span)) > _SUBLINE_CHARS:
            raise ValueError(f"location and span are {length} characters together; the subline fits {_SUBLINE_CHARS}")
        capacity = _BULLET_ROWS_BY_ROLE_COUNT[len(self.roles)]
        for role in self.roles:
            rows = sum(len(wrap_text(bullet, _BULLET_CHARS)) for bullet in role.bullets)
            if rows > capacity:
                raise ValueError(
                    f"{role.title!r}: the highlights wrap to {rows} rows; with {len(self.roles)} roles the page fits "
                    f"{capacity} rows of {_BULLET_CHARS} characters"
                )
        return self


class Work(ContentModel):
    """Work history (docs/pages/work.md): one employer per top-row tab (PB6–10), newest first."""

    employers: Annotated[list[Employer], Field(min_length=1, max_length=5)]

    @model_validator(mode="after")
    def unique_ids(self) -> Self:
        ids = [employer.id for employer in self.employers]
        if len(set(ids)) != len(ids):
            raise ValueError("employer ids must be unique")
        return self
