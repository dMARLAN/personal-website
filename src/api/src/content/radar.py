from typing import Annotated

from pydantic import Field

from content.base import ContentModel
from content.extensions import new_item
from content.text import GLYPHS


class Ownship(ContentModel):
    heading: Annotated[
        int, Field(ge=0, le=359, title="Heading", description="Degrees magnetic, shown as three digits.")
    ]
    airspeed: Annotated[int, Field(ge=0, le=999, title="Airspeed", description="Knots calibrated, ≤ 3 digits.")]
    mach: Annotated[
        str, Field(min_length=1, max_length=4, title="Mach", description="Shown as written, for example 0.90."), GLYPHS
    ]
    altitude: Annotated[int, Field(ge=1000, le=99999, title="Altitude", description="Feet.")]


class RadarContact(ContentModel):
    """A contact at t = 0, moving in a straight line relative to our aircraft."""

    range: Annotated[float, Field(gt=0, le=80, title="Range", description="Nautical miles, within the 80 NM scale.")]
    azimuth: Annotated[
        float, Field(ge=-70, le=70, title="Azimuth", description="Degrees off the nose, right positive.")
    ]
    speed: Annotated[float, Field(gt=0, title="Speed", description="Knots, relative to our aircraft.")]
    track: Annotated[
        float,
        Field(ge=0, lt=360, title="Track", description="Degrees clockwise from our nose: 180 flies straight at us."),
    ]
    altitude: Annotated[
        int,
        Field(
            ge=0,
            le=99999,
            title="Altitude",
            description="Feet. The contact flies level, so the elevation bars decide which scans see it.",
        ),
    ]


class RadarScene(ContentModel):
    """/radar → RDR ATTK in RWS (docs/pages/radar.md); fake data."""

    ownship: Annotated[Ownship, Field(title="Ownship", description="Our aircraft's readouts.")]
    weapon: Annotated[
        str,
        Field(
            min_length=1,
            max_length=6,
            title="Weapon",
            description="The priority air-to-air weapon and its count, for example 9X 2.",
        ),
        GLYPHS,
    ]
    contacts: Annotated[
        list[RadarContact],
        Field(
            min_length=3,
            max_length=6,
            title="Contacts",
            description="3 to 6 contacts.",
            json_schema_extra=new_item(RadarContact(range=40, azimuth=0, speed=500, track=180, altitude=20000)),
        ),
    ]
