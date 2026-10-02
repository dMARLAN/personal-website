from typing import Annotated, Final, Self

from pydantic import Field, model_validator

from content.base import ContentModel
from content.text import GLYPHS

# A MIDS status row (label, 25 DI gap, value) centred on x = 0 must stay inside the side legends at x = ±470.
_ROW_CHARS: Final[int] = 46
# The first row is `EMAIL:` and the email.
_EMAIL_LABEL: Final[str] = "EMAIL:"


class ContactRow(ContentModel):
    label: Annotated[str, Field(min_length=1), GLYPHS]
    value: Annotated[str, Field(min_length=1), GLYPHS]

    @model_validator(mode="after")
    def fits_row(self) -> Self:
        if (length := len(self.label) + len(self.value)) > _ROW_CHARS:
            raise ValueError(f"label and value are {length} characters together; a row fits {_ROW_CHARS}")
        return self


class Contact(ContentModel):
    """Contact → MIDS (docs/pages/contact.md). The email fills the first row; `rows` fill the other three."""

    email: Annotated[
        str,
        Field(max_length=_ROW_CHARS - len(_EMAIL_LABEL), pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$"),
        GLYPHS,
    ]
    rows: tuple[ContactRow, ContactRow, ContactRow]
