from enum import StrEnum, auto
from typing import Annotated, Final, Self

from pydantic import ConfigDict, Field, model_validator

from content.base import ContentModel, ContentRuleError
from content.extensions import new_item, rules
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
    value: Annotated[
        str, Field(min_length=1, max_length=3, title="Value", description="The deflection readout."), GLYPHS
    ]
    arrow: Annotated[FcsArrow | None, Field(title="Arrow", description="The arrow beside the value, or none.")]


class FcsSurface(ContentModel):
    label: Annotated[
        str, Field(min_length=1, max_length=4, title="Label", description="The surface's name, e.g. LEF."), GLYPHS
    ]
    left: Annotated[FcsSurfaceSide, Field(title="Left", description="The left surface.")]
    right: Annotated[FcsSurfaceSide, Field(title="Right", description="The right surface.")]


class FcsStatusRow(ContentModel):
    # Between x = 88 and the table at 188: ≤ 100 DI at F120.
    label: Annotated[
        str, Field(min_length=1, max_length=5, title="Label", description="The row's name beside the table."), GLYPHS
    ]
    meaning: Annotated[
        str, Field(min_length=1, title="Meaning", description="What the row stands for, for screen readers.")
    ]


class FcsFailure(ContentModel):
    """One X in a channel table: that channel has failed."""

    model_config = ConfigDict(
        json_schema_extra=rules(
            "The bottom table has rows 0 to 10, each with channels 1 to 4.",
            "The top tables have rows 0 to 6. Rows 0, 3 and 4 have channels 1 and 4 on the left table, 2 and 3 on "
            "the right; the other rows have all four.",
        )
    )

    table: Annotated[FcsTable, Field(title="Table", description="Which channel table.")]
    row: Annotated[int, Field(ge=0, le=_BOTTOM_ROWS - 1, title="Row", description="The table row, from 0 at the top.")]
    channel: Annotated[int, Field(ge=1, le=4, title="Channel", description="The channel, 1 to 4.")]

    @model_validator(mode="after")
    def cell_exists(self) -> Self:
        match self.table:
            case FcsTable.BOTTOM:
                return self
            case FcsTable.LEFT | FcsTable.RIGHT:
                rows = _TOP_CELLS[self.table]
                if self.row >= len(rows):
                    raise ContentRuleError(("row",), f"the {self.table} table has no row {self.row}")
                if self.channel not in rows[self.row]:
                    raise ContentRuleError(
                        ("channel",), f"the {self.table} table has no cell at row {self.row}, channel {self.channel}"
                    )
                return self


class FcsAoa(ContentModel):
    left: Annotated[str, Field(min_length=1, max_length=5, title="Left", description="The left readout."), GLYPHS]
    right: Annotated[str, Field(min_length=1, max_length=5, title="Right", description="The right readout."), GLYPHS]


type Channel = Annotated[str, Field(min_length=1)]


class FlightControls(ContentModel):
    """/fcs → FCS (docs/pages/fcs.md); fake data."""

    surfaces: Annotated[
        tuple[FcsSurface, FcsSurface, FcsSurface, FcsSurface, FcsSurface],
        Field(title="Surfaces", description="LEF, TEF, AIL, RUD and STAB, in that order."),
    ]
    status_rows: Annotated[
        list[FcsStatusRow],
        Field(
            min_length=_BOTTOM_ROWS,
            max_length=_BOTTOM_ROWS,
            title="Status rows",
            description=f"The {_BOTTOM_ROWS} rows beside the bottom table.",
        ),
    ]
    channels: Annotated[
        tuple[Channel, Channel, Channel, Channel],
        Field(title="Channels", description="What channels 1 to 4 stand for, for screen readers."),
    ]
    failures: Annotated[
        list[FcsFailure],
        Field(
            title="Failures",
            description="The channel cells drawn with an X.",
            json_schema_extra=new_item(FcsFailure(table=FcsTable.BOTTOM, row=0, channel=1)),
        ),
    ]
    g_limit: Annotated[
        str, Field(min_length=1, max_length=3, title="G limit", description="The G limit readout."), GLYPHS
    ]
    aoa: Annotated[FcsAoa, Field(title="AOA", description="The two angle-of-attack readouts.")]
    blin_code: Annotated[
        str, Field(min_length=1, max_length=10, title="BLIN code", description="The BLIN code line."), GLYPHS
    ]
