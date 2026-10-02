from enum import StrEnum
from typing import Annotated, Final, Self

from pydantic import Field, model_validator

from content.base import ContentModel, ContentRuleError
from content.extensions import rules
from content.text import GLYPHS


class BitCheckStatus(StrEnum):
    """`BIT_StatMsgs` [pgB §3] without `IN TEST`, which only a running test shows, plus `NO TEST`."""

    RESTRT = "RESTRT"
    SF_TEST = "SF TEST"
    OFF = "OFF"
    NOT_RDY = "NOT RDY"
    NO_TEST = "NO TEST"
    MUX_FAIL = "MUX FAIL"
    DEGD_OVRHT = "DEGD+OVRHT"
    OVRHT = "OVRHT"
    DEGD = "DEGD"
    OP_GO = "OP GO"
    GO = "GO"
    PBIT_GO = "PBIT GO"


class BitItemKey(StrEnum):
    """The DCS equipment items the BIT sublevels list (`EquipItems` in `BIT_defs.lua`), plus the two fuel-low rows."""

    MC1 = "MC1"
    MC2 = "MC2"
    FCSA = "FCSA"
    FCSB = "FCSB"
    RDR = "RDR"
    FLIR = "FLIR"
    LTDR = "LTDR"
    SMS = "SMS"
    AWW4 = "AWW4"
    CLC = "CLC"
    WPNS = "WPNS"
    CSC = "CSC"
    ICS = "ICS"
    IFF = "IFF"
    D_L = "D_L"
    COM1 = "COM1"
    COM2 = "COM2"
    MIDS = "MIDS"
    INS = "INS"
    ADC = "ADC"
    ILS = "ILS"
    RALT = "RALT"
    TCN = "TCN"
    AUG = "AUG"
    BCN = "BCN"
    GPS = "GPS"
    LDDI = "LDDI"
    RDDI = "RDDI"
    MPCD = "MPCD"
    HUD = "HUD"
    IFEI = "IFEI"
    DMS = "DMS"
    HMD = "HMD"
    SDC = "SDC"
    MU = "MU"
    AISI = "AISI"
    RWR = "RWR"
    IBS = "IBS"
    ALE_47 = "ALE_47"
    ASPJ = "ASPJ"
    TK2FL = "TK2FL"
    TK3FL = "TK3FL"


class BitLegendKey(StrEnum):
    """Item legends that have no list row of their own."""

    FCS = "FCS"
    UFC = "UFC"
    DDI = "DDI"
    DFIRS = "DFIRS"
    FQTY = "FQTY"
    FXFR = "FXFR"


# Items that also have an item legend (`SUBLEVELS` in `ddi/pages/bit/structure.ts`): drawn as `"   NAME"` beside a PB,
# so their names are ≤ 7 characters.
_LEGEND_ITEMS: Final[frozenset[BitItemKey]] = frozenset(
    {
        BitItemKey.RDR,
        BitItemKey.FLIR,
        BitItemKey.LTDR,
        BitItemKey.SMS,
        BitItemKey.AWW4,
        BitItemKey.CLC,
        BitItemKey.CSC,
        BitItemKey.ICS,
        BitItemKey.IFF,
        BitItemKey.D_L,
        BitItemKey.COM1,
        BitItemKey.COM2,
        BitItemKey.MIDS,
        BitItemKey.INS,
        BitItemKey.ADC,
        BitItemKey.ILS,
        BitItemKey.RALT,
        BitItemKey.TCN,
        BitItemKey.AUG,
        BitItemKey.BCN,
        BitItemKey.GPS,
        BitItemKey.DMS,
        BitItemKey.IFEI,
        BitItemKey.HMD,
        BitItemKey.SDC,
        BitItemKey.MU,
        BitItemKey.AISI,
        BitItemKey.IBS,
        BitItemKey.ALE_47,
    }
)
_LEGEND_CHARS: Final[int] = 7
# DCS shows `NO TEST` only on the STATUS MONITOR fuel-low rows.
_FUEL_LOW_ITEMS: Final[frozenset[BitItemKey]] = frozenset({BitItemKey.TK2FL, BitItemKey.TK3FL})
_SW_CONFIG_ROWS: Final[int] = 12
# The left column keeps the DCS blank row (the ATARS slot).
_SW_CONFIG_BLANK_ROW: Final[int] = 3


class BitCheck(ContentModel):
    # ≤ 9, so a space separates it from the status column.
    name: Annotated[
        str, Field(min_length=1, max_length=9, title="Name", description="The row's name in the list."), GLYPHS
    ]
    status: Annotated[BitCheckStatus, Field(title="Status", description="The status before any test.")]
    after_test: Annotated[
        BitCheckStatus, Field(title="Status after test", description="The status a test resolves to, after IN TEST.")
    ]


class SwConfigEntry(ContentModel):
    # ≤ 6, like the longest DCS name (`ALE-47`); the value ≤ 8, the width of the DCS sample `XXXXXXXX`.
    name: Annotated[str, Field(min_length=1, max_length=6, title="Name", description="The component's name."), GLYPHS]
    value: Annotated[
        str, Field(min_length=1, max_length=8, title="Value", description="Its version, ≤ 8 characters."), GLYPHS
    ]


class SwConfig(ContentModel):
    """S/W CONFIGURATION: the site's own stack. `null` is a blank row."""

    left: Annotated[
        list[SwConfigEntry | None],
        Field(
            min_length=_SW_CONFIG_ROWS,
            max_length=_SW_CONFIG_ROWS,
            title="Left column",
            description=f"{_SW_CONFIG_ROWS} rows; null is a blank row.",
            json_schema_extra=rules(f"Row {_SW_CONFIG_BLANK_ROW + 1} stays blank (null), as the ATARS slot is in DCS."),
        ),
    ]
    right: Annotated[
        list[SwConfigEntry],
        Field(
            min_length=_SW_CONFIG_ROWS,
            max_length=_SW_CONFIG_ROWS,
            title="Right column",
            description=f"{_SW_CONFIG_ROWS} rows.",
        ),
    ]

    @model_validator(mode="after")
    def keeps_blank_row(self) -> Self:
        if self.left[_SW_CONFIG_BLANK_ROW] is not None:
            raise ContentRuleError(
                ("left", _SW_CONFIG_BLANK_ROW),
                f"left row {_SW_CONFIG_BLANK_ROW + 1} stays blank, as the ATARS slot is in DCS",
            )
        return self


class Bit(ContentModel):
    """/bit → BIT FAILURES and its sublevels (docs/pages/bit.md); themed mock checks."""

    # A dict with enum keys and exactly as many entries as the enum has members holds every member once.
    checks: Annotated[
        dict[BitItemKey, BitCheck],
        Field(
            min_length=len(BitItemKey),
            max_length=len(BitItemKey),
            title="Checks",
            description="One row per BIT item, every item once.",
            json_schema_extra=rules(
                f"Items with their own legend ({', '.join(sorted(_LEGEND_ITEMS))}) have names of at most "
                f"{_LEGEND_CHARS} characters.",
                "Only the fuel-low rows (TK2FL, TK3FL) may show NO TEST.",
            ),
        ),
    ]
    legend_names: Annotated[
        dict[BitLegendKey, Annotated[str, Field(min_length=1, max_length=_LEGEND_CHARS), GLYPHS]],
        Field(
            min_length=len(BitLegendKey),
            max_length=len(BitLegendKey),
            title="Legend names",
            description=f"The names of the item legends with no list row, ≤ {_LEGEND_CHARS} characters each.",
        ),
    ]
    sw_config: Annotated[
        SwConfig, Field(title="S/W configuration", description="The site's own stack, in two columns.")
    ]

    @model_validator(mode="after")
    def fits_pages(self) -> Self:
        for item in _LEGEND_ITEMS:
            if len(name := self.checks[item].name) > _LEGEND_CHARS:
                raise ContentRuleError(
                    ("checks", item.value, "name"),
                    f"{item}: {name!r} is also an item legend, so it fits {_LEGEND_CHARS} characters",
                )
        for item, check in self.checks.items():
            if item in _FUEL_LOW_ITEMS:
                continue
            for field, status in (("status", check.status), ("afterTest", check.after_test)):
                if status == BitCheckStatus.NO_TEST:
                    raise ContentRuleError(
                        ("checks", item.value, field), f"{item}: only the fuel-low rows (TK2FL, TK3FL) may show NO TEST"
                    )
        return self
