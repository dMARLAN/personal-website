from typing import Annotated, Final

from pydantic import Field

from content.base import ContentModel
from content.text import GLYPHS

# Limits are `MUMI_LIMITS` in `ddi/formats/mumi.tsx`: each keeps its text inside the rules and labels that frame it.

_MEANING_TITLE: Final[str] = "Meaning"
_MEANING_DESCRIPTION: Final[str] = "What the value stands for, for screen readers; not drawn."


class MuId(ContentModel):
    """The memory unit, on the 570 DI rule."""

    value: Annotated[
        str, Field(min_length=1, max_length=15, title="Value", description="The MU ID before a load."), GLYPHS
    ]
    meaning: Annotated[str, Field(min_length=1, title=_MEANING_TITLE, description=_MEANING_DESCRIPTION)]


class IdField(ContentModel):
    """One ID field, over its 200 DI rule."""

    value: Annotated[str, Field(min_length=1, max_length=10, title="Value", description="The field's value."), GLYPHS]
    meaning: Annotated[str, Field(min_length=1, title=_MEANING_TITLE, description=_MEANING_DESCRIPTION)]


class VersionField(ContentModel):
    """The MC or SMS value, a character clear of its label and the vertical rule."""

    value: Annotated[str, Field(min_length=1, max_length=10, title="Value", description="The version string."), GLYPHS]
    meaning: Annotated[str, Field(min_length=1, title=_MEANING_TITLE, description=_MEANING_DESCRIPTION)]


class LoadErrors(ContentModel):
    """The ERRORS list from the last load, a character clear of `ERRORS:`. A new load clears it."""

    value: Annotated[
        str, Field(min_length=1, max_length=15, title="Value", description="The errors after ERRORS:."), GLYPHS
    ]
    meaning: Annotated[str, Field(min_length=1, title=_MEANING_TITLE, description=_MEANING_DESCRIPTION)]


class MissionData(ContentModel):
    """/mumi → MUMI (docs/pages/mumi.md); the site's deployment as fake mission data."""

    mu_id: Annotated[MuId, Field(title="MU ID", description="The memory unit, on the long rule.")]
    loaded_mu_id: Annotated[
        str,
        Field(
            min_length=1,
            max_length=15,
            title="Loaded MU ID",
            description="The MU ID once the load completes: the console the load opens.",
        ),
        GLYPHS,
    ]
    id_fields: Annotated[
        tuple[IdField, IdField], Field(title="ID fields", description="The two ID fields, ≤ 10 characters each.")
    ]
    mc: Annotated[VersionField, Field(title="MC", description="The mission computer version.")]
    sms: Annotated[VersionField, Field(title="SMS", description="The stores management version.")]
    errors: Annotated[LoadErrors, Field(title="Errors", description="The errors from the last load.")]
