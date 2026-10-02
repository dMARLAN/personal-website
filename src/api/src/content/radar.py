from typing import Annotated

from pydantic import Field

from content.base import ContentModel
from content.text import GLYPHS


class Ownship(ContentModel):
    # Degrees magnetic, shown as `%03.0f°`.
    heading: Annotated[int, Field(ge=0, le=359)]
    # Knots calibrated, ≤ 3 digits.
    airspeed: Annotated[int, Field(ge=0, le=999)]
    # Shown as written, for example "0.90".
    mach: Annotated[str, Field(min_length=1, max_length=4), GLYPHS]
    altitude: Annotated[int, Field(ge=1000, le=99999)]


class RadarContact(ContentModel):
    """A contact at t = 0, moving in a straight line relative to our aircraft."""

    # NM, within the 80 NM volume.
    range: Annotated[float, Field(gt=0, le=80)]
    # Degrees, right positive.
    azimuth: Annotated[float, Field(ge=-70, le=70)]
    # Knots, relative to our aircraft.
    speed: Annotated[float, Field(gt=0)]
    # Degrees clockwise from our nose: 180 flies straight at us.
    track: Annotated[float, Field(ge=0, lt=360)]


class RadarScene(ContentModel):
    """/radar → RDR ATTK in RWS (docs/pages/radar.md); fake data."""

    ownship: Ownship
    # The priority A/A weapon and its count, for example "9X 2".
    weapon: Annotated[str, Field(min_length=1, max_length=6), GLYPHS]
    contacts: Annotated[list[RadarContact], Field(min_length=3, max_length=6)]
