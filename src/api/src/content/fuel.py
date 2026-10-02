from enum import StrEnum, auto
from typing import Annotated, Final, Literal, Self

from pydantic import ConfigDict, Field, model_validator

from content.base import ContentModel, ContentRuleError, first_duplicate
from content.extensions import rules, unique_by
from content.text import GLYPHS


class FuelTankId(StrEnum):
    TK1 = "tk1"
    LEFT_FEED = "leftFeed"
    RIGHT_FEED = "rightFeed"
    TK4 = "tk4"
    LEFT_WING = "leftWing"
    RIGHT_WING = "rightWing"
    LEFT_EXTERNAL = "leftExternal"
    CENTRELINE = "centreline"
    RIGHT_EXTERNAL = "rightExternal"


# The F100 label must fit its box (`FUEL_TANKS` in `ddi/formats/fuelModel.ts`): feed boxes are 350 DI wide, wing
# boxes 150 and external boxes 225, at 16 DI a character.
_FEED_LABEL_CHARS: Final[int] = 22
_WING_LABEL_CHARS: Final[int] = 9
_EXTERNAL_LABEL_CHARS: Final[int] = 14
_LABEL_CHARS: Final[dict[FuelTankId, int]] = {
    FuelTankId.TK1: _FEED_LABEL_CHARS,
    FuelTankId.LEFT_FEED: _FEED_LABEL_CHARS,
    FuelTankId.RIGHT_FEED: _FEED_LABEL_CHARS,
    FuelTankId.TK4: _FEED_LABEL_CHARS,
    FuelTankId.LEFT_WING: _WING_LABEL_CHARS,
    FuelTankId.RIGHT_WING: _WING_LABEL_CHARS,
    FuelTankId.LEFT_EXTERNAL: _EXTERNAL_LABEL_CHARS,
    FuelTankId.CENTRELINE: _EXTERNAL_LABEL_CHARS,
    FuelTankId.RIGHT_EXTERNAL: _EXTERNAL_LABEL_CHARS,
}

type Fraction = Annotated[float, Field(ge=0, le=1)]
type Period = Annotated[float, Field(gt=0)]
# Pounds, ≤ 4 digits, so the F200 readout fits the narrowest box.
type Pounds = Annotated[int, Field(ge=0, le=9999)]

_KIND_TITLE: Final[str] = "Motion"
_PERIOD_TITLE: Final[str] = "Period"


class MotionKind(StrEnum):
    WAVE = auto()
    DRAIN = auto()


class WaveMotion(ContentModel):
    """A slow sine: `level` at t = 0, ± `swing`."""

    kind: Annotated[Literal[MotionKind.WAVE], Field(title=_KIND_TITLE, description="A slow sine.")]
    level: Annotated[Fraction, Field(title="Level", description="The level at the start, 0 (empty) to 1 (full).")]
    swing: Annotated[Fraction, Field(title="Swing", description="How far the level moves either way, 0 to 1.")]
    period_seconds: Annotated[Period, Field(title=_PERIOD_TITLE, description="Seconds per cycle.")]


class DrainMotion(ContentModel):
    """Drains from full to `low` over the period, then refills at once."""

    kind: Annotated[Literal[MotionKind.DRAIN], Field(title=_KIND_TITLE, description="Drains, then refills at once.")]
    low: Annotated[Fraction, Field(title="Low", description="The level it drains to, 0 (empty) to 1 (full).")]
    period_seconds: Annotated[Period, Field(title=_PERIOD_TITLE, description="Seconds from full to low.")]


type FuelMotion = Annotated[WaveMotion | DrainMotion, Field(discriminator="kind")]


class FuelTank(ContentModel):
    model_config = ConfigDict(
        json_schema_extra=rules(
            f"The label fits {_FEED_LABEL_CHARS} characters on tk1, leftFeed, rightFeed and tk4, "
            f"{_WING_LABEL_CHARS} on the wing tanks and {_EXTERNAL_LABEL_CHARS} on the external tanks."
        )
    )

    id: Annotated[FuelTankId, Field(title="Tank", description="Which tank box this is; each tank appears once.")]
    label: Annotated[
        str,
        Field(
            min_length=1,
            max_length=_FEED_LABEL_CHARS,
            title="Label",
            description="Drawn in the tank's box; how much fits depends on the box.",
        ),
        GLYPHS,
    ]
    name: Annotated[
        str, Field(min_length=1, title="Name", description='The name for screen readers, for example "Coffee".')
    ]
    capacity: Annotated[int, Field(ge=1, le=9999, title="Capacity", description="Pounds when full, ≤ 4 digits.")]
    motion: Annotated[FuelMotion, Field(title="Motion", description="How the level moves over time.")]

    @model_validator(mode="after")
    def fits_box(self) -> Self:
        if len(self.label) > (limit := _LABEL_CHARS[self.id]):
            raise ContentRuleError(("label",), f"{self.id}: the label fits {limit} characters")
        return self


class FuelReserves(ContentModel):
    """/fuel → FUEL (docs/pages/fuel.md); fake "energy" reserves."""

    tanks: Annotated[
        list[FuelTank],
        Field(
            min_length=len(FuelTankId),
            max_length=len(FuelTankId),
            title="Tanks",
            description="All nine tanks, each once.",
            json_schema_extra=unique_by("id"),
        ),
    ]
    bingo: Annotated[Pounds, Field(title="Bingo", description="The BINGO readout in pounds, ≤ 4 digits.")]

    @model_validator(mode="after")
    def every_tank_once(self) -> Self:
        # Nine tanks with distinct ids are every tank, since the list holds exactly nine.
        if (index := first_duplicate([tank.id for tank in self.tanks])) is not None:
            raise ContentRuleError(("tanks", index, "id"), "tanks must list each of the nine tanks once")
        return self
