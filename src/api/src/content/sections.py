from dataclasses import dataclass
from enum import StrEnum, auto
from typing import Final

from content.base import ContentModel
from content.bit import Bit
from content.checklist import Checklist
from content.contact import Contact
from content.fcs import FlightControls
from content.fuel import FuelReserves
from content.links import Links
from content.mumi import MissionData
from content.profile import Profile
from content.projects import Projects
from content.radar import RadarScene
from content.resume import Resume
from content.server import ServerStats
from content.work import Work


class ContentSection(StrEnum):
    """One stored document each. The value is the `SiteContent` field and the database key."""

    PROFILE = auto()
    RESUME = auto()
    WORK = auto()
    PROJECTS = auto()
    CONTACT = auto()
    LINKS = auto()
    SERVER = auto()
    FUEL = auto()
    FCS = auto()
    CHECKLIST = auto()
    BIT = auto()
    RADAR = auto()
    MUMI = auto()


@dataclass(frozen=True, slots=True)
class SectionSpec[M: ContentModel]:
    section: ContentSection
    model: type[M]
    # The site paths that render this section, which the API asks Next.js to revalidate after a write.
    paths: tuple[str, ...]


PROFILE: Final[SectionSpec[Profile]] = SectionSpec(ContentSection.PROFILE, Profile, ("/about",))
RESUME: Final[SectionSpec[Resume]] = SectionSpec(ContentSection.RESUME, Resume, ("/resume",))
WORK: Final[SectionSpec[Work]] = SectionSpec(ContentSection.WORK, Work, ("/work",))
PROJECTS: Final[SectionSpec[Projects]] = SectionSpec(ContentSection.PROJECTS, Projects, ("/projects",))
CONTACT: Final[SectionSpec[Contact]] = SectionSpec(ContentSection.CONTACT, Contact, ("/contact",))
LINKS: Final[SectionSpec[Links]] = SectionSpec(ContentSection.LINKS, Links, ("/links",))
SERVER: Final[SectionSpec[ServerStats]] = SectionSpec(ContentSection.SERVER, ServerStats, ("/server",))
FUEL: Final[SectionSpec[FuelReserves]] = SectionSpec(ContentSection.FUEL, FuelReserves, ("/fuel",))
FCS: Final[SectionSpec[FlightControls]] = SectionSpec(ContentSection.FCS, FlightControls, ("/fcs",))
CHECKLIST: Final[SectionSpec[Checklist]] = SectionSpec(ContentSection.CHECKLIST, Checklist, ("/chklst",))
BIT: Final[SectionSpec[Bit]] = SectionSpec(ContentSection.BIT, Bit, ("/bit",))
RADAR: Final[SectionSpec[RadarScene]] = SectionSpec(ContentSection.RADAR, RadarScene, ("/radar",))
MUMI: Final[SectionSpec[MissionData]] = SectionSpec(ContentSection.MUMI, MissionData, ("/mumi",))

# The site paths that show the resume PDF's download legend.
RESUME_PDF_PATHS: Final[tuple[str, ...]] = ("/resume",)


class SiteContent(ContentModel):
    """Every section, as `GET /api/content` returns it."""

    profile: Profile
    resume: Resume
    work: Work
    projects: Projects
    contact: Contact
    links: Links
    server: ServerStats
    fuel: FuelReserves
    fcs: FlightControls
    checklist: Checklist
    bit: Bit
    radar: RadarScene
    mumi: MissionData
