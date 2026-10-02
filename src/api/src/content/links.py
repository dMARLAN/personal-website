from typing import Annotated

from pydantic import Field

from content.base import ContentModel
from content.extensions import Widget, new_item, widget
from content.text import GLYPHS


class LinkEntry(ContentModel):
    name: Annotated[
        str,
        Field(
            min_length=1,
            max_length=8,
            title="Name",
            description="Written in normal case: the glass upper-cases it and screen readers keep it.",
        ),
        GLYPHS,
    ]
    # ≤ 6, so it stays inside the 480 DI selection box.
    tag: Annotated[
        str, Field(min_length=1, max_length=6, title="Tag", description="The short tag after the name."), GLYPHS
    ]
    url: Annotated[
        str,
        Field(
            pattern=r"^(https://|/)\S*$",
            title="URL",
            description="An external https URL, or a path on this site such as /api/resume.pdf.",
            json_schema_extra=widget(Widget.URL),
        ),
    ]


class Links(ContentModel):
    """Links → UFC BU (docs/pages/links.md): one row per keypad digit."""

    links: Annotated[
        list[LinkEntry],
        Field(
            min_length=1,
            max_length=10,
            title="Links",
            description="1 to 10 links, one per keypad digit.",
            json_schema_extra=new_item(LinkEntry(name="Name", tag="TAG", url="https://example.com")),
        ),
    ]
