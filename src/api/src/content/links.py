from typing import Annotated

from pydantic import Field

from content.base import ContentModel
from content.text import GLYPHS


class LinkEntry(ContentModel):
    # Written in normal case: the glass upper-cases it and the semantic layer keeps it.
    name: Annotated[str, Field(min_length=1, max_length=8), GLYPHS]
    # ≤ 6, so it stays inside the 480 DI selection box.
    tag: Annotated[str, Field(min_length=1, max_length=6), GLYPHS]
    # An external https URL, or a path on this site such as `/api/resume.pdf`.
    url: Annotated[str, Field(pattern=r"^(https://|/)\S*$")]


class Links(ContentModel):
    """Links → UFC BU (docs/pages/links.md): one row per keypad digit."""

    links: Annotated[list[LinkEntry], Field(min_length=1, max_length=10)]
