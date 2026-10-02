from enum import StrEnum
from typing import Annotated, Final, Self

from pydantic import Field, model_validator

from content.base import ContentModel
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
    name: Annotated[str, Field(min_length=1, max_length=9), GLYPHS]
    # The status before any test.
    status: BitCheckStatus
    # The status a test resolves to, after `IN TEST`.
    after_test: BitCheckStatus


class SwConfigEntry(ContentModel):
    # ≤ 6, like the longest DCS name (`ALE-47`); the value ≤ 8, the width of the DCS sample `XXXXXXXX`.
    name: Annotated[str, Field(min_length=1, max_length=6), GLYPHS]
    value: Annotated[str, Field(min_length=1, max_length=8), GLYPHS]


class SwConfig(ContentModel):
    """S/W CONFIGURATION: the site's own stack. `null` is a blank row."""

    left: Annotated[list[SwConfigEntry | None], Field(min_length=_SW_CONFIG_ROWS, max_length=_SW_CONFIG_ROWS)]
    right: Annotated[list[SwConfigEntry], Field(min_length=_SW_CONFIG_ROWS, max_length=_SW_CONFIG_ROWS)]

    @model_validator(mode="after")
    def keeps_blank_row(self) -> Self:
        if self.left[_SW_CONFIG_BLANK_ROW] is not None:
            raise ValueError(f"left row {_SW_CONFIG_BLANK_ROW + 1} stays blank, as the ATARS slot is in DCS")
        return self


class Bit(ContentModel):
    """/bit → BIT FAILURES and its sublevels (docs/pages/bit.md); themed mock checks."""

    checks: dict[BitItemKey, BitCheck]
    legend_names: dict[BitLegendKey, Annotated[str, Field(min_length=1, max_length=_LEGEND_CHARS), GLYPHS]]
    sw_config: SwConfig

    @model_validator(mode="after")
    def fits_pages(self) -> Self:
        if set(self.checks) != set(BitItemKey):
            raise ValueError("checks must cover every BIT item once")
        if set(self.legend_names) != set(BitLegendKey):
            raise ValueError("legendNames must cover every BIT legend once")
        for item in _LEGEND_ITEMS:
            if len(name := self.checks[item].name) > _LEGEND_CHARS:
                raise ValueError(f"{item}: {name!r} is also an item legend, so it fits {_LEGEND_CHARS} characters")
        for item, check in self.checks.items():
            if item not in _FUEL_LOW_ITEMS and BitCheckStatus.NO_TEST in {check.status, check.after_test}:
                raise ValueError(f"{item}: only the fuel-low rows (TK2FL, TK3FL) may show NO TEST")
        return self
