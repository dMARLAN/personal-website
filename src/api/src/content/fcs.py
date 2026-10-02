from enum import StrEnum, auto
from typing import Annotated, Final, Self

from pydantic import Field, model_validator

from content.base import ContentModel
from content.text import GLYPHS


class FcsArrow(StrEnum):
    UP = auto()
    DOWN = auto()
    LEFT = auto()
    RIGHT = auto()


class FcsTable(StrEnum):
    LEFT = auto()
    RIGHT = auto()
    BOTTOM = auto()


# `TOP_CELLS` in `ddi/formats/fcs.tsx`: which channel cells exist per row of the two top tables. Rows 0, 3 and 4
# (LEF, AIL, RUD) have two channels.
_TOP_CELLS: Final[dict[FcsTable, tuple[tuple[int, ...], ...]]] = {
    FcsTable.LEFT: ((1, 4), (1, 2, 3, 4), (1, 2, 3, 4), (1, 4), (1, 4), (1, 2, 3, 4), (1, 2, 3, 4)),
    FcsTable.RIGHT: ((2, 3), (1, 2, 3, 4), (1, 2, 3, 4), (2, 3), (2, 3), (1, 2, 3, 4), (1, 2, 3, 4)),
}
_BOTTOM_ROWS: Final[int] = 11


class FcsSurfaceSide(ContentModel):
    value: Annotated[str, Field(min_length=1, max_length=3), GLYPHS]
    arrow: FcsArrow | None


class FcsSurface(ContentModel):
    label: Annotated[str, Field(min_length=1, max_length=4), GLYPHS]
    left: FcsSurfaceSide
    right: FcsSurfaceSide


class FcsStatusRow(ContentModel):
    # Between x = 88 and the table at 188: ≤ 100 DI at F120.
    label: Annotated[str, Field(min_length=1, max_length=5), GLYPHS]
    meaning: Annotated[str, Field(min_length=1)]


class FcsFailure(ContentModel):
    """One X in a channel table: that channel has failed."""

    table: FcsTable
    row: Annotated[int, Field(ge=0)]
    channel: Annotated[int, Field(ge=1, le=4)]

    @model_validator(mode="after")
    def cell_exists(self) -> Self:
        match self.table:
            case FcsTable.BOTTOM:
                exists = self.row < _BOTTOM_ROWS
            case FcsTable.LEFT | FcsTable.RIGHT:
                rows = _TOP_CELLS[self.table]
                exists = self.row < len(rows) and self.channel in rows[self.row]
        if not exists:
            raise ValueError(f"the {self.table} table has no cell at row {self.row}, channel {self.channel}")
        return self


class FcsAoa(ContentModel):
    left: Annotated[str, Field(min_length=1, max_length=5), GLYPHS]
    right: Annotated[str, Field(min_length=1, max_length=5), GLYPHS]


class FlightControls(ContentModel):
    """/fcs → FCS (docs/pages/fcs.md); fake data."""

    # LEF, TEF, AIL, RUD and STAB in DCS order.
    surfaces: tuple[FcsSurface, FcsSurface, FcsSurface, FcsSurface, FcsSurface]
    status_rows: Annotated[list[FcsStatusRow], Field(min_length=_BOTTOM_ROWS, max_length=_BOTTOM_ROWS)]
    # What channels 1–4 stand for, for the semantic layer.
    channels: tuple[str, str, str, str]
    failures: list[FcsFailure]
    g_limit: Annotated[str, Field(min_length=1, max_length=3), GLYPHS]
    aoa: FcsAoa
    blin_code: Annotated[str, Field(min_length=1, max_length=10), GLYPHS]
