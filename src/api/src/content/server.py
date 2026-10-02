from enum import StrEnum
from typing import Annotated, Final, Self

from pydantic import ConfigDict, Field, model_validator

from content.base import ContentModel, ContentRuleError
from content.extensions import rules
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
# Exactly one key per metric: the keys are metrics, and there are as many as metrics.
type HostReadings = Annotated[
    dict[ServerMetric, Annotated[float, Field(ge=0)]],
    Field(min_length=len(ServerMetric), max_length=len(ServerMetric)),
]


class ServerSnapshot(ContentModel):
    """Both hosts' readings at one moment, left host first."""

    hosts: Annotated[
        tuple[HostReadings, HostReadings],
        Field(title="Hosts", description="One reading per metric for each host, left host first."),
    ]


class ServerHost(ContentModel):
    header: Annotated[
        str,
        Field(min_length=1, max_length=9, title="Header", description="The column header, in place of LEFT EPE."),
        GLYPHS,
    ]
    name: Annotated[str, Field(min_length=1, title="Name", description="The host's name for screen readers.")]


class ServerRow(ContentModel):
    metric: Annotated[ServerMetric, Field(title="Metric", description="Which reading the row shows.")]
    label: Annotated[
        str,
        Field(min_length=1, max_length=10, title="Label", description="The centre label, as wide as INLET TEMP."),
        GLYPHS,
    ]
    name: Annotated[str, Field(min_length=1, title="Name", description="The row's name for screen readers.")]
    unit: Annotated[str, Field(title="Unit", description="The unit for screen readers; empty for a bare number.")]
    decimals: Annotated[int, Field(ge=0, le=3, title="Decimals", description="Digits after the decimal point.")]
    # ≤ 5: the value takes at least one digit of the 6-character slot.
    suffix: Annotated[
        str,
        Field(
            max_length=_VALUE_CHARS - 1,
            title="Suffix",
            description="Drawn right after the value, for example D for days; may be empty.",
        ),
        GLYPHS,
    ]


class ServerStats(ContentModel):
    """/server → ENG (docs/pages/eng.md); fake data."""

    model_config = ConfigDict(
        json_schema_extra=rules(
            f"Each baseline value, with its row's decimals and suffix, fits {_VALUE_CHARS} characters."
        )
    )

    hosts: Annotated[
        tuple[ServerHost, ServerHost], Field(title="Hosts", description="The two columns, left host first.")
    ]
    rows: Annotated[
        list[ServerRow],
        Field(
            min_length=len(ServerMetric),
            max_length=len(ServerMetric),
            title="Rows",
            description="One row per metric, in this order: " + ", ".join(ServerMetric) + ".",
            json_schema_extra=rules("Rows follow the metric order, one per metric."),
        ),
    ]
    baseline: Annotated[
        ServerSnapshot, Field(title="Baseline", description="The readings the page starts from and drifts around.")
    ]

    @model_validator(mode="after")
    def fits_table(self) -> Self:
        for index, (row, metric) in enumerate(zip(self.rows, ServerMetric, strict=True)):
            if row.metric != metric:
                raise ContentRuleError(
                    ("rows", index, "metric"), f"rows must be one per metric, in order: {', '.join(ServerMetric)}"
                )
        for row in self.rows:
            for host_index, host in enumerate(self.baseline.hosts):
                text = f"{host[row.metric]:.{row.decimals}f}{row.suffix}"
                if len(text) > _VALUE_CHARS:
                    raise ContentRuleError(
                        ("baseline", "hosts", host_index, row.metric.value),
                        f"{row.metric}: {text!r} is longer than the {_VALUE_CHARS}-character value slot",
                    )
        return self
