from typing import Annotated

from pydantic import Field

from content.base import ContentModel
from content.text import GLYPHS

# Limits are `MUMI_LIMITS` in `ddi/formats/mumi.tsx`: each keeps its text inside the rules and labels that frame it.


class MuId(ContentModel):
    """The memory unit, on the 570 DI rule."""

    value: Annotated[str, Field(min_length=1, max_length=15), GLYPHS]
    # What the value stands for, for the semantic layer.
    meaning: Annotated[str, Field(min_length=1)]


class IdField(ContentModel):
    """One ID field, over its 200 DI rule."""

    value: Annotated[str, Field(min_length=1, max_length=10), GLYPHS]
    meaning: Annotated[str, Field(min_length=1)]


class VersionField(ContentModel):
    """The MC or SMS value, a character clear of its label and the vertical rule."""

    value: Annotated[str, Field(min_length=1, max_length=10), GLYPHS]
    meaning: Annotated[str, Field(min_length=1)]


class LoadErrors(ContentModel):
    """The ERRORS list from the last load, a character clear of `ERRORS:`. A new load clears it."""

    value: Annotated[str, Field(min_length=1, max_length=15), GLYPHS]
    meaning: Annotated[str, Field(min_length=1)]


class MissionData(ContentModel):
    """/mumi → MUMI (docs/pages/mumi.md); the site's deployment as fake mission data."""

    mu_id: MuId
    # The MU ID once the load completes: the console the load opens.
    loaded_mu_id: Annotated[str, Field(min_length=1, max_length=15), GLYPHS]
    id_fields: tuple[IdField, IdField]
    # MC (mission computer) and SMS (stores management).
    mc: VersionField
    sms: VersionField
    errors: LoadErrors
