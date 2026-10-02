"""Admin GET and PUT for each content section. One explicit pair per section, so the OpenAPI schema (and the
generated frontend client) types every section's document exactly. Every handler is one service call."""

from typing import Annotated, Final

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, Header, status

from auth.admin import require_admin, require_admin_write
from container import Container
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
from content.sections import (
    BIT,
    CHECKLIST,
    CONTACT,
    FCS,
    FUEL,
    LINKS,
    MUMI,
    PROFILE,
    PROJECTS,
    RADAR,
    RESUME,
    SERVER,
    WORK,
)
from content.server import ServerStats
from content.work import Work
from routes.http_cache import if_match_etag
from services.content.service import ContentService
from services.content.types import SavedSection, SectionState

router = APIRouter(dependencies=[Depends(require_admin)])

# Plain aliases, not `type` statements: dependency-injector's wiring reads the `Provide` marker out of the Annotated
# metadata at runtime, which a TypeAliasType hides.
ContentServiceDep = Annotated[ContentService, Depends(Provide[Container.content_service])]
IfMatch = Annotated[str | None, Header(alias="If-Match", description="The section's `etag`, to refuse a lost update.")]

_PUT_RESPONSES: Final[dict[int | str, dict[str, str]]] = {
    status.HTTP_403_FORBIDDEN: {"description": "Missing or wrong `X-CSRF-Token`."},
    status.HTTP_412_PRECONDITION_FAILED: {"description": "The section changed since the `If-Match` ETag."},
}


@router.get("/profile", operation_id="adminGetProfile")
@inject
async def get_profile(content_service: ContentServiceDep) -> SectionState[Profile]:
    return await content_service.get(PROFILE)


@router.put(
    "/profile", operation_id="adminPutProfile", dependencies=[Depends(require_admin_write)], responses=_PUT_RESPONSES
)
@inject
async def put_profile(
    document: Profile, content_service: ContentServiceDep, if_match: IfMatch = None
) -> SavedSection[Profile]:
    return await content_service.save(PROFILE, document, if_match_etag(if_match))


@router.get("/resume", operation_id="adminGetResume")
@inject
async def get_resume(content_service: ContentServiceDep) -> SectionState[Resume]:
    return await content_service.get(RESUME)


@router.put(
    "/resume", operation_id="adminPutResume", dependencies=[Depends(require_admin_write)], responses=_PUT_RESPONSES
)
@inject
async def put_resume(
    document: Resume, content_service: ContentServiceDep, if_match: IfMatch = None
) -> SavedSection[Resume]:
    return await content_service.save(RESUME, document, if_match_etag(if_match))


@router.get("/work", operation_id="adminGetWork")
@inject
async def get_work(content_service: ContentServiceDep) -> SectionState[Work]:
    return await content_service.get(WORK)


@router.put("/work", operation_id="adminPutWork", dependencies=[Depends(require_admin_write)], responses=_PUT_RESPONSES)
@inject
async def put_work(document: Work, content_service: ContentServiceDep, if_match: IfMatch = None) -> SavedSection[Work]:
    return await content_service.save(WORK, document, if_match_etag(if_match))


@router.get("/projects", operation_id="adminGetProjects")
@inject
async def get_projects(content_service: ContentServiceDep) -> SectionState[Projects]:
    return await content_service.get(PROJECTS)


@router.put(
    "/projects", operation_id="adminPutProjects", dependencies=[Depends(require_admin_write)], responses=_PUT_RESPONSES
)
@inject
async def put_projects(
    document: Projects, content_service: ContentServiceDep, if_match: IfMatch = None
) -> SavedSection[Projects]:
    return await content_service.save(PROJECTS, document, if_match_etag(if_match))


@router.get("/contact", operation_id="adminGetContact")
@inject
async def get_contact(content_service: ContentServiceDep) -> SectionState[Contact]:
    return await content_service.get(CONTACT)


@router.put(
    "/contact", operation_id="adminPutContact", dependencies=[Depends(require_admin_write)], responses=_PUT_RESPONSES
)
@inject
async def put_contact(
    document: Contact, content_service: ContentServiceDep, if_match: IfMatch = None
) -> SavedSection[Contact]:
    return await content_service.save(CONTACT, document, if_match_etag(if_match))


@router.get("/links", operation_id="adminGetLinks")
@inject
async def get_links(content_service: ContentServiceDep) -> SectionState[Links]:
    return await content_service.get(LINKS)


@router.put(
    "/links", operation_id="adminPutLinks", dependencies=[Depends(require_admin_write)], responses=_PUT_RESPONSES
)
@inject
async def put_links(
    document: Links, content_service: ContentServiceDep, if_match: IfMatch = None
) -> SavedSection[Links]:
    return await content_service.save(LINKS, document, if_match_etag(if_match))


@router.get("/server", operation_id="adminGetServer")
@inject
async def get_server(content_service: ContentServiceDep) -> SectionState[ServerStats]:
    return await content_service.get(SERVER)


@router.put(
    "/server", operation_id="adminPutServer", dependencies=[Depends(require_admin_write)], responses=_PUT_RESPONSES
)
@inject
async def put_server(
    document: ServerStats, content_service: ContentServiceDep, if_match: IfMatch = None
) -> SavedSection[ServerStats]:
    return await content_service.save(SERVER, document, if_match_etag(if_match))


@router.get("/fuel", operation_id="adminGetFuel")
@inject
async def get_fuel(content_service: ContentServiceDep) -> SectionState[FuelReserves]:
    return await content_service.get(FUEL)


@router.put("/fuel", operation_id="adminPutFuel", dependencies=[Depends(require_admin_write)], responses=_PUT_RESPONSES)
@inject
async def put_fuel(
    document: FuelReserves, content_service: ContentServiceDep, if_match: IfMatch = None
) -> SavedSection[FuelReserves]:
    return await content_service.save(FUEL, document, if_match_etag(if_match))


@router.get("/fcs", operation_id="adminGetFcs")
@inject
async def get_fcs(content_service: ContentServiceDep) -> SectionState[FlightControls]:
    return await content_service.get(FCS)


@router.put("/fcs", operation_id="adminPutFcs", dependencies=[Depends(require_admin_write)], responses=_PUT_RESPONSES)
@inject
async def put_fcs(
    document: FlightControls, content_service: ContentServiceDep, if_match: IfMatch = None
) -> SavedSection[FlightControls]:
    return await content_service.save(FCS, document, if_match_etag(if_match))


@router.get("/checklist", operation_id="adminGetChecklist")
@inject
async def get_checklist(content_service: ContentServiceDep) -> SectionState[Checklist]:
    return await content_service.get(CHECKLIST)


@router.put(
    "/checklist",
    operation_id="adminPutChecklist",
    dependencies=[Depends(require_admin_write)],
    responses=_PUT_RESPONSES,
)
@inject
async def put_checklist(
    document: Checklist, content_service: ContentServiceDep, if_match: IfMatch = None
) -> SavedSection[Checklist]:
    return await content_service.save(CHECKLIST, document, if_match_etag(if_match))


@router.get("/bit", operation_id="adminGetBit")
@inject
async def get_bit(content_service: ContentServiceDep) -> SectionState[Bit]:
    return await content_service.get(BIT)


@router.put("/bit", operation_id="adminPutBit", dependencies=[Depends(require_admin_write)], responses=_PUT_RESPONSES)
@inject
async def put_bit(document: Bit, content_service: ContentServiceDep, if_match: IfMatch = None) -> SavedSection[Bit]:
    return await content_service.save(BIT, document, if_match_etag(if_match))


@router.get("/radar", operation_id="adminGetRadar")
@inject
async def get_radar(content_service: ContentServiceDep) -> SectionState[RadarScene]:
    return await content_service.get(RADAR)


@router.put(
    "/radar", operation_id="adminPutRadar", dependencies=[Depends(require_admin_write)], responses=_PUT_RESPONSES
)
@inject
async def put_radar(
    document: RadarScene, content_service: ContentServiceDep, if_match: IfMatch = None
) -> SavedSection[RadarScene]:
    return await content_service.save(RADAR, document, if_match_etag(if_match))


@router.get("/mumi", operation_id="adminGetMumi")
@inject
async def get_mumi(content_service: ContentServiceDep) -> SectionState[MissionData]:
    return await content_service.get(MUMI)


@router.put("/mumi", operation_id="adminPutMumi", dependencies=[Depends(require_admin_write)], responses=_PUT_RESPONSES)
@inject
async def put_mumi(
    document: MissionData, content_service: ContentServiceDep, if_match: IfMatch = None
) -> SavedSection[MissionData]:
    return await content_service.save(MUMI, document, if_match_etag(if_match))
