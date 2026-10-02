from enum import StrEnum
from typing import Annotated, Final, Self

from pydantic import Field, model_validator

from content.base import ContentModel
from content.text import GLYPHS

# `ENG_LIMITS` in `ddi/formats/eng.tsx`.
_VALUE_CHARS: Final[int] = 6


class ServerMetric(StrEnum):
    """`SERVER_METRICS` in the frontend: the 13 ENG rows, top row first."""

    INLET_TEMP = "inletTemp"
    CPU = "cpu"
    RAM = "ram"
    CPU_TEMP = "cpuTemp"
    POWER = "power"
    FAN = "fan"
    MEM_PRESSURE = "memPressure"
    THROUGHPUT = "throughput"
    JITTER = "jitter"
    DISK_TEMP = "diskTemp"
    LOAD_AVG = "loadAvg"
    DISK = "disk"
    UPTIME = "uptime"


# One host's readings: a number per metric, in that row's unit (`Record<ServerMetric, number>` in the frontend).
type HostReadings = dict[ServerMetric, Annotated[float, Field(ge=0)]]


class ServerSnapshot(ContentModel):
    """Both hosts' readings at one moment, left host first."""

    hosts: tuple[HostReadings, HostReadings]

    @model_validator(mode="after")
    def every_metric(self) -> Self:
        for host in self.hosts:
            if set(host) != set(ServerMetric):
                raise ValueError("each host needs one reading per metric")
        return self


class ServerHost(ContentModel):
    # Column header in place of `LEFT EPE` / `RIGHT EPE`.
    header: Annotated[str, Field(min_length=1, max_length=9), GLYPHS]
    # The semantic layer's name for the host.
    name: Annotated[str, Field(min_length=1)]


class ServerRow(ContentModel):
    metric: ServerMetric
    # Centre label, F150; the width of `INLET TEMP`.
    label: Annotated[str, Field(min_length=1, max_length=10), GLYPHS]
    name: Annotated[str, Field(min_length=1)]
    # The semantic layer's unit; empty for a bare number.
    unit: str
    decimals: Annotated[int, Field(ge=0, le=3)]
    # Drawn right after the value, for example "D" for days.
    suffix: Annotated[str, GLYPHS]


class ServerStats(ContentModel):
    """/server → ENG (docs/pages/eng.md); fake data."""

    hosts: tuple[ServerHost, ServerHost]
    rows: Annotated[list[ServerRow], Field(min_length=len(ServerMetric), max_length=len(ServerMetric))]
    baseline: ServerSnapshot

    @model_validator(mode="after")
    def fits_table(self) -> Self:
        if [row.metric for row in self.rows] != list(ServerMetric):
            raise ValueError(f"rows must be one per metric, in order: {', '.join(ServerMetric)}")
        for row in self.rows:
            for host in self.baseline.hosts:
                text = f"{host[row.metric]:.{row.decimals}f}{row.suffix}"
                if len(text) > _VALUE_CHARS:
                    raise ValueError(f"{row.metric}: {text!r} is longer than the {_VALUE_CHARS}-character value slot")
        return self
