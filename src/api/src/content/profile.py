from typing import Annotated, Final, Self

from pydantic import ConfigDict, Field, model_validator

from content.base import ContentModel, ContentRuleError
from content.extensions import combined_length
from content.text import GLYPHS, FitsRows

_TAG_CHARS: Final[int] = 18
_BIO: Final[FitsRows] = FitsRows(chars=18, rows=9)


class StatusRow(ContentModel):
    """A status-quadrant row: label ≤ 7 including the colon, value ≤ 9."""

    label: Annotated[
        str,
        Field(min_length=1, max_length=7, title="Label", description="Left of the row, colon included, e.g. ROLE:."),
        GLYPHS,
    ]
    value: Annotated[str, Field(min_length=1, max_length=9, title="Value", description="Right of the label."), GLYPHS]


class TagRow(ContentModel):
    """An IFF-quadrant row, drawn as `label value` in ≤ 18 characters."""

    model_config = ConfigDict(json_schema_extra=combined_length("label", "value", gap=1, max_length=_TAG_CHARS))

    # Each ≤ 16: the other is at least one character, and a space separates them.
    label: Annotated[
        str, Field(min_length=1, max_length=_TAG_CHARS - 2, title="Label", description="The tag's name."), GLYPHS
    ]
    value: Annotated[
        str,
        Field(
            min_length=1,
            max_length=_TAG_CHARS - 2,
            title="Value",
            description=f"Drawn after the label and a space; the whole row fits {_TAG_CHARS} characters.",
        ),
        GLYPHS,
    ]

    @model_validator(mode="after")
    def fits_row(self) -> Self:
        if (length := len(self.label) + 1 + len(self.value)) > _TAG_CHARS:
            raise ContentRuleError(
                ("value",), f"label, space and value are {length} characters; the row fits {_TAG_CHARS}"
            )
        return self


type LoadoutRow = Annotated[str, Field(min_length=1, max_length=17), GLYPHS]


class Profile(ContentModel):
    """About → TGT DATA OWNSHIP (docs/pages/about.md).

    The `header` slot is the site name: the frontend fills it from `SITE_NAME`, so it is not stored here.
    """

    badge: Annotated[
        str,
        Field(min_length=1, max_length=18, title="Badge", description="The line under the name at the top."),
        GLYPHS,
    ]
    status: Annotated[
        tuple[StatusRow, StatusRow, StatusRow, StatusRow, StatusRow],
        Field(title="Status rows", description="The five rows of the top-left status quadrant."),
    ]
    loadout: Annotated[
        tuple[LoadoutRow, LoadoutRow, LoadoutRow, LoadoutRow, LoadoutRow],
        Field(title="Loadout", description="The five rows of the stores quadrant, ≤ 17 characters each."),
    ]
    footer: Annotated[
        str,
        Field(min_length=1, max_length=19, title="Footer", description="The fuel and gun line across the middle."),
        GLYPHS,
    ]
    tags: Annotated[
        tuple[TagRow, TagRow, TagRow],
        Field(title="Tags", description="The three rows of the IFF quadrant."),
    ]
    bio: Annotated[
        str,
        Field(
            min_length=1,
            max_length=_BIO.max_length,
            title="Bio",
            description=f"Fills the bottom-left quadrant, wrapped to {_BIO.rows} rows of {_BIO.chars} characters.",
        ),
        GLYPHS,
        _BIO,
    ]
