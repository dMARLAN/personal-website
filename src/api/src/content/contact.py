from typing import Annotated, Final, Self

from pydantic import ConfigDict, Field, model_validator

from content.base import ContentModel, ContentRuleError
from content.extensions import Widget, combined_length, widget
from content.text import GLYPHS

# A MIDS status row (label, 25 DI gap, value) centred on x = 0 must stay inside the side legends at x = ±470.
_ROW_CHARS: Final[int] = 46
# The first row is `EMAIL:` and the email.
_EMAIL_LABEL: Final[str] = "EMAIL:"


class ContactRow(ContentModel):
    model_config = ConfigDict(json_schema_extra=combined_length("label", "value", gap=0, max_length=_ROW_CHARS))

    # Each ≤ 45: the other is at least one character.
    label: Annotated[
        str, Field(min_length=1, max_length=_ROW_CHARS - 1, title="Label", description="The row's name."), GLYPHS
    ]
    value: Annotated[
        str,
        Field(
            min_length=1,
            max_length=_ROW_CHARS - 1,
            title="Value",
            description=f"Drawn after the label; the two fit {_ROW_CHARS} characters together.",
        ),
        GLYPHS,
    ]

    @model_validator(mode="after")
    def fits_row(self) -> Self:
        if (length := len(self.label) + len(self.value)) > _ROW_CHARS:
            raise ContentRuleError(
                ("value",), f"label and value are {length} characters together; a row fits {_ROW_CHARS}"
            )
        return self


class Contact(ContentModel):
    """Contact → MIDS (docs/pages/contact.md). The email fills the first row; `rows` fill the other three."""

    email: Annotated[
        str,
        Field(
            max_length=_ROW_CHARS - len(_EMAIL_LABEL),
            pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
            title="Email",
            description="The first row, after EMAIL:.",
            json_schema_extra=widget(Widget.EMAIL),
        ),
        GLYPHS,
    ]
    rows: Annotated[
        tuple[ContactRow, ContactRow, ContactRow],
        Field(title="Rows", description="The three rows under the email."),
    ]
