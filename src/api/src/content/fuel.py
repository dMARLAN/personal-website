from enum import StrEnum, auto
from typing import Annotated, Final, Literal, Self

from pydantic import Field, model_validator

from content.base import ContentModel
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


class MotionKind(StrEnum):
    WAVE = auto()
    DRAIN = auto()


class WaveMotion(ContentModel):
    """A slow sine: `level` at t = 0, ± `swing`."""

    kind: Literal[MotionKind.WAVE]
    level: Fraction
    swing: Fraction
    period_seconds: Period


class DrainMotion(ContentModel):
    """Drains from full to `low` over the period, then refills at once."""

    kind: Literal[MotionKind.DRAIN]
    low: Fraction
    period_seconds: Period


type FuelMotion = Annotated[WaveMotion | DrainMotion, Field(discriminator="kind")]


class FuelTank(ContentModel):
    id: FuelTankId
    label: Annotated[str, Field(min_length=1), GLYPHS]
    # The semantic layer's name, for example "Coffee".
    name: Annotated[str, Field(min_length=1)]
    capacity: Annotated[int, Field(ge=1, le=9999)]
    motion: FuelMotion

    @model_validator(mode="after")
    def fits_box(self) -> Self:
        if len(self.label) > (limit := _LABEL_CHARS[self.id]):
            raise ValueError(f"{self.id}: the label fits {limit} characters")
        return self


class FuelReserves(ContentModel):
    """/fuel → FUEL (docs/pages/fuel.md); fake "energy" reserves."""

    tanks: Annotated[list[FuelTank], Field(min_length=len(FuelTankId), max_length=len(FuelTankId))]
    bingo: Pounds

    @model_validator(mode="after")
    def every_tank_once(self) -> Self:
        if {tank.id for tank in self.tanks} != set(FuelTankId):
            raise ValueError("tanks must list each of the nine tanks once")
        return self
