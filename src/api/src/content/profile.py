from typing import Annotated, Final, Self

from pydantic import AfterValidator, Field, model_validator

from content.base import ContentModel
from content.text import GLYPHS, FitsRows

_TAG_CHARS: Final[int] = 18


class StatusRow(ContentModel):
    """A status-quadrant row: label ≤ 7 including the colon, value ≤ 9."""

    label: Annotated[str, Field(min_length=1, max_length=7), GLYPHS]
    value: Annotated[str, Field(min_length=1, max_length=9), GLYPHS]


class TagRow(ContentModel):
    """An IFF-quadrant row, drawn as `label value` in ≤ 18 characters."""

    label: Annotated[str, Field(min_length=1), GLYPHS]
    value: Annotated[str, Field(min_length=1), GLYPHS]

    @model_validator(mode="after")
    def fits_row(self) -> Self:
        if (length := len(self.label) + 1 + len(self.value)) > _TAG_CHARS:
            raise ValueError(f"label, space and value are {length} characters; the row fits {_TAG_CHARS}")
        return self


type LoadoutRow = Annotated[str, Field(min_length=1, max_length=17), GLYPHS]


class Profile(ContentModel):
    """About → TGT DATA OWNSHIP (docs/pages/about.md).

    The `header` slot is the site name: the frontend fills it from `SITE_NAME`, so it is not stored here.
    """

    badge: Annotated[str, Field(min_length=1, max_length=18), GLYPHS]
    status: tuple[StatusRow, StatusRow, StatusRow, StatusRow, StatusRow]
    loadout: tuple[LoadoutRow, LoadoutRow, LoadoutRow, LoadoutRow, LoadoutRow]
    footer: Annotated[str, Field(min_length=1, max_length=19), GLYPHS]
    tags: tuple[TagRow, TagRow, TagRow]
    bio: Annotated[str, Field(min_length=1), GLYPHS, AfterValidator(FitsRows(chars=18, rows=9))]
