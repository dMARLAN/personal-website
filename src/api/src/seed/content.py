"""The placeholder content the site shipped with before the admin console, transcribed once from
`src/frontend/src/content/*.ts`. A fresh database is seeded from these documents (`ContentService.seed_missing`).

Every value is a PLACEHOLDER until Chad replaces it in /admin. The About header is not here: the frontend draws
`SITE_NAME` there.
"""

from typing import Final

from content.base import ContentModel
from content.bit import Bit, BitCheck, BitCheckStatus, BitItemKey, BitLegendKey, SwConfig, SwConfigEntry
from content.checklist import (
    Checklist,
    ChecklistStab,
    ChecklistWeight,
    LeftChecklistColumn,
    RightChecklistColumn,
)
from content.contact import Contact, ContactRow
from content.fcs import (
    FcsAoa,
    FcsArrow,
    FcsFailure,
    FcsStatusRow,
    FcsSurface,
    FcsSurfaceSide,
    FcsTable,
    FlightControls,
)
from content.fuel import DrainMotion, FuelReserves, FuelTank, FuelTankId, MotionKind, WaveMotion
from content.links import LinkEntry, Links
from content.profile import Profile, StatusRow, TagRow
from content.projects import (
    LeftField,
    LinkKind,
    MissileStore,
    PairStore,
    Project,
    ProjectCategory,
    ProjectFields,
    ProjectLink,
    Projects,
    ProjectStatus,
    RackStore,
    RightField,
    StoreKind,
    TankStore,
)
from content.radar import Ownship, RadarContact, RadarScene
from content.resume import QualificationColumn, QualificationRow, Resume, SkillColumn, SkillRow
from content.sections import ContentSection, SiteContent
from content.server import ServerHost, ServerMetric, ServerRow, ServerSnapshot, ServerStats
from content.work import Employer, Role, Work

_PROFILE: Final[Profile] = Profile(
    badge="PLACEHOLDER",
    status=(
        StatusRow(label="ROLE:", value="SW ENGR"),
        StatusRow(label="BASE:", value="TBD"),
        StatusRow(label="YRS:", value="00"),
        StatusRow(label="STACK:", value="TS/PY"),
        StatusRow(label="STAT:", value="ACTIVE"),
    ),
    loadout=("1 - TYPESCRIPT", "2 - PYTHON", "3 - REACT", "4 - FASTAPI", "5 - KUBERNETES"),
    footer="99.9 COFFEE 0 BUGS",
    tags=(
        TagRow(label="SIM:", value="DCS F/A-18C"),
        TagRow(label="OS:", value="LINUX"),
        TagRow(label="IDE:", value="PYCHARM"),
    ),
    bio=("Placeholder bio. A software engineer who builds web apps and APIs, and flies the Hornet in DCS after hours."),
)

_RESUME: Final[Resume] = Resume(
    title=("S/W CONFIGURATION", "PLACEHOLDER"),
    left=SkillColumn(
        heading="Skills",
        rows=[
            SkillRow(name="Python", value="Expert 10 yr"),
            SkillRow(name="TS", value="Advanced 7 yr"),
            SkillRow(name="Go", value="Working 3 yr"),
            SkillRow(name="SQL", value="Advanced 9 yr"),
            SkillRow(name="React", value="Advanced 6 yr"),
            SkillRow(name="APIs", value="Expert 9 yr"),
            SkillRow(name="K8s", value="Advanced 5 yr"),
            SkillRow(name="AWS", value="Advanced 7 yr"),
            SkillRow(name="Docker", value="Expert 8 yr"),
            SkillRow(name="Linux", value="Expert 12 yr"),
            SkillRow(name="CI/CD", value="Advanced 7 yr"),
            SkillRow(name="LLM", value="Working 2 yr"),
        ],
    ),
    right=QualificationColumn(
        heading="Qualifications",
        rows=[
            QualificationRow(name="Degree", value="BS Comp Sci"),
            QualificationRow(name="School", value="Placeholder"),
            QualificationRow(name="Grad", value="2014"),
            QualificationRow(name="Cert", value="AWS SA Pro"),
            QualificationRow(name="Cert", value="CKA"),
            QualificationRow(name="Lead", value="Team of 6"),
            QualificationRow(name="Domain", value="Platforms"),
            QualificationRow(name="Domain", value="Data eng"),
            QualificationRow(name="Domain", value="Dev tools"),
            QualificationRow(name="Remote", value="Yes"),
            QualificationRow(name="Langs", value="English"),
            QualificationRow(name="Hobby", value="DCS F/A-18C"),
        ],
    ),
)

_WORK: Final[Work] = Work(
    employers=[
        Employer(
            id="northwind",
            tab="NWIND",
            name="Northwind Systems",
            location="Remote",
            span="2021-NOW",
            roles=[
                Role(
                    title="Staff Software Engineer",
                    span="2023-NOW",
                    bullets=[
                        (
                            "Placeholder: led the move of 40 services to Kubernetes and cut deploy time from 45 to 6 "
                            "minutes."
                        ),
                        "Placeholder: designed the internal developer platform used by 12 teams.",
                        "Placeholder: mentored 5 engineers through promotion.",
                    ],
                ),
                Role(
                    title="Senior Software Engineer",
                    span="2021-2023",
                    bullets=[
                        "Placeholder: built the event pipeline that handles 2 billion events a day.",
                        "Placeholder: replaced a nightly batch job with streaming updates.",
                    ],
                ),
            ],
        ),
        Employer(
            id="bluefin",
            tab="BLUEFIN",
            name="Bluefin Analytics",
            location="San Diego, CA",
            span="2018-2021",
            roles=[
                Role(
                    title="Senior Software Engineer",
                    span="2019-2021",
                    bullets=[
                        "Placeholder: owned the Python API behind the customer dashboard.",
                        "Placeholder: cut p99 latency by 70 % with query and cache work.",
                        "Placeholder: ran the on-call rotation and its postmortems.",
                    ],
                ),
                Role(
                    title="Software Engineer II",
                    span="2018-2019",
                    bullets=[
                        "Placeholder: shipped the first React front end for the reports product.",
                        "Placeholder: added typed API clients generated from OpenAPI.",
                    ],
                ),
            ],
        ),
        Employer(
            id="kestrel",
            tab="KESTREL",
            name="Kestrel Labs",
            location="Austin, TX",
            span="2014-2018",
            roles=[
                Role(
                    title="Software Engineer",
                    span="2016-2018",
                    bullets=[
                        "Placeholder: wrote the flight-data ingest service in Go.",
                        "Placeholder: moved CI from a shared server to containers.",
                    ],
                ),
                Role(
                    title="Junior Software Engineer",
                    span="2015-2016",
                    bullets=[
                        "Placeholder: built internal tools for the test team.",
                        "Placeholder: fixed 200 bugs in the legacy reporting code.",
                    ],
                ),
                Role(
                    title="Software Intern",
                    span="2014",
                    bullets=["Placeholder: automated the nightly regression suite."],
                ),
            ],
        ),
        Employer(
            id="harbor",
            tab="HARBOR",
            name="Harbor Digital",
            location="Portland, OR",
            span="2012-2014",
            roles=[
                Role(
                    title="Web Developer",
                    span="2013-2014",
                    bullets=[
                        "Placeholder: built client sites in PHP and JavaScript.",
                        "Placeholder: set up the first shared Git workflow.",
                    ],
                ),
                Role(
                    title="IT Technician",
                    span="2012-2013",
                    bullets=["Placeholder: ran the office network and backups."],
                ),
            ],
        ),
    ],
)

_PROJECTS: Final[Projects] = Projects(
    categories=[
        ProjectCategory(legend="WEB", name="Web"),
        ProjectCategory(legend="TOOLS", name="Tools"),
        ProjectCategory(legend="HOMELAB", name="Homelab"),
    ],
    projects=[
        Project(
            slug="personal-site",
            station=2,
            name="Personal site",
            code="SITE",
            store=PairStore(kind=StoreKind.PAIR),
            status=ProjectStatus.RDY,
            category="WEB",
            fields=ProjectFields(
                left=[
                    LeftField(label="LANG", value="TS"),
                    LeftField(label="YEAR", value="2026"),
                    LeftField(label="ROLE", value="SOLO"),
                ],
                right=[
                    RightField(label="STACK", value="NEXT FASTAPI"),
                    RightField(label="HOST", value="K8S"),
                    RightField(label="FONT", value="DCS STROKE"),
                ],
            ),
            description=(
                "Placeholder. This website: an F/A-18C DDI drawn in SVG, with a Next.js front end and a FastAPI back "
                "end. Every page is a real cockpit format, and the bezel buttons are the only navigation."
            ),
            links=[
                ProjectLink(kind=LinkKind.REPO, url="https://github.com/example/personal-website"),
                ProjectLink(kind=LinkKind.DEMO, url="https://example.com/"),
            ],
        ),
        Project(
            slug="trail-log",
            station=6,
            name="Trail log",
            code="TRAIL",
            store=MissileStore(kind=StoreKind.MISSILE),
            status=ProjectStatus.DEGD,
            category="WEB",
            fields=ProjectFields(
                left=[LeftField(label="LANG", value="PY"), LeftField(label="YEAR", value="2023")],
                right=[RightField(label="STACK", value="DJANGO LEAFLET"), RightField(label="DATA", value="GPX")],
            ),
            description=(
                "Placeholder. A hiking log that imports GPX tracks, draws them on a map and totals distance and climb "
                "per season. It still runs, but the map tiles it uses have been retired."
            ),
            links=[ProjectLink(kind=LinkKind.REPO, url="https://github.com/example/trail-log")],
        ),
        Project(
            slug="squadron-bot",
            station=9,
            name="Squadron bot",
            code="BOT",
            store=MissileStore(kind=StoreKind.MISSILE),
            status=ProjectStatus.HUNG,
            category="WEB",
            fields=ProjectFields(
                left=[LeftField(label="LANG", value="TS"), LeftField(label="YEAR", value="2022")],
                right=[RightField(label="API", value="DISCORD"), RightField(label="USERS", value="40")],
            ),
            description=(
                "Placeholder. A chat bot for a virtual squadron: mission sign-ups, briefing reminders and a sortie "
                "board. It is hung on the rail until the chat API it depends on settles down."
            ),
            links=[ProjectLink(kind=LinkKind.REPO, url="https://github.com/example/squadron-bot")],
        ),
        Project(
            slug="dotfiles",
            station=1,
            name="Dotfiles",
            code="DOTS",
            store=MissileStore(kind=StoreKind.MISSILE),
            status=ProjectStatus.RDY,
            category="TOOLS",
            fields=ProjectFields(
                left=[LeftField(label="LANG", value="SH"), LeftField(label="YEAR", value="2019")],
                right=[RightField(label="OS", value="LINUX MACOS"), RightField(label="SHELL", value="ZSH")],
            ),
            description=(
                "Placeholder. Shell, editor and terminal settings, installed on a new machine with one command. A "
                "small test suite boots a clean container and checks that every tool comes up."
            ),
            links=[ProjectLink(kind=LinkKind.REPO, url="https://github.com/example/dotfiles")],
        ),
        Project(
            slug="code-rules",
            station=4,
            name="Code review rules",
            code="RULES",
            store=MissileStore(kind=StoreKind.MISSILE),
            status=ProjectStatus.STBY,
            category="TOOLS",
            fields=ProjectFields(
                left=[LeftField(label="LANG", value="MD"), LeftField(label="YEAR", value="2025")],
                right=[RightField(label="RULES", value="40"), RightField(label="USE", value="AI REVIEW")],
            ),
            description=(
                "Placeholder. A shared set of code quality rules, one file per rule with a bad and a good example. "
                "Review agents load them to check a diff, and people read them as a style guide."
            ),
            links=[ProjectLink(kind=LinkKind.REPO, url="https://github.com/example/code-rules")],
        ),
        Project(
            slug="dcs-extract",
            station=8,
            name="DCS asset extractor",
            code="DCSX",
            store=PairStore(kind=StoreKind.PAIR),
            status=ProjectStatus.RDY,
            category="TOOLS",
            fields=ProjectFields(
                left=[
                    LeftField(label="LANG", value="PY"),
                    LeftField(label="YEAR", value="2026"),
                    LeftField(label="DEPS", value="NONE"),
                ],
                right=[RightField(label="INPUT", value="SVG"), RightField(label="OUTPUT", value="TS MODULES")],
            ),
            description=(
                "Placeholder. Reads the stroke font and symbol sheets from a DCS install, snaps every glyph to its "
                "cell and writes typed path data that this site draws with."
            ),
            links=[ProjectLink(kind=LinkKind.REPO, url="https://github.com/example/dcs-extract")],
        ),
        Project(
            slug="home-cluster",
            station=3,
            name="Home cluster",
            code="K8S",
            store=RackStore(kind=StoreKind.RACK, amount=3),
            status=ProjectStatus.RDY,
            category="HOMELAB",
            fields=ProjectFields(
                left=[LeftField(label="NODES", value="3"), LeftField(label="YEAR", value="2024")],
                right=[RightField(label="DIST", value="K3S"), RightField(label="GITOPS", value="FLUX")],
            ),
            description=(
                "Placeholder. Three small machines running Kubernetes, configured from a Git repository. Every "
                "service in the house deploys to it, and a pull request is the only way to change it."
            ),
            links=[ProjectLink(kind=LinkKind.REPO, url="https://github.com/example/home-cluster")],
        ),
        Project(
            slug="storage",
            station=5,
            name="Network storage",
            code="NAS",
            store=TankStore(kind=StoreKind.TANK),
            status=ProjectStatus.RDY,
            category="HOMELAB",
            fields=ProjectFields(
                left=[LeftField(label="SIZE", value="24TB"), LeftField(label="YEAR", value="2021")],
                right=[RightField(label="FS", value="ZFS RAIDZ2"), RightField(label="BACKUP", value="OFFSITE")],
            ),
            description=(
                "Placeholder. The centreline tank: a storage server that holds photos, backups and media, with "
                "snapshots every hour and a nightly copy to a second site."
            ),
            links=[],
        ),
        Project(
            slug="monitoring",
            station=7,
            name="Monitoring stack",
            code="MON",
            store=RackStore(kind=StoreKind.RACK, amount=4),
            status=ProjectStatus.STBY,
            category="HOMELAB",
            fields=ProjectFields(
                left=[LeftField(label="PARTS", value="4"), LeftField(label="YEAR", value="2024")],
                right=[
                    RightField(label="METRIC", value="PROMETHEUS"),
                    RightField(label="LOGS", value="LOKI"),
                    RightField(label="ALERT", value="PHONE"),
                ],
            ),
            description=(
                "Placeholder. Metrics, logs and alerts for the home cluster, with dashboards for power draw, disk "
                "health and how long the last backup took."
            ),
            links=[
                ProjectLink(kind=LinkKind.REPO, url="https://github.com/example/monitoring"),
                ProjectLink(kind=LinkKind.DEMO, url="https://example.com/dashboards"),
            ],
        ),
    ],
)

_CONTACT: Final[Contact] = Contact(
    email="placeholder@example.com",
    rows=(
        ContactRow(label="LOCATION:", value="PLACEHOLDER"),
        ContactRow(label="TIME ZONE:", value="UTC-0 PLACEHOLDER"),
        ContactRow(label="REPLY:", value="WITHIN 2 DAYS"),
    ),
)

_LINKS: Final[Links] = Links(
    links=[
        LinkEntry(name="GitHub", tag="CODE", url="https://example.com/github"),
        LinkEntry(name="LinkedIn", tag="WORK", url="https://example.com/linkedin"),
        LinkEntry(name="Resume", tag="PDF", url="/api/resume.pdf"),
        LinkEntry(name="Blog", tag="TEXT", url="https://example.com/blog"),
        LinkEntry(name="Mastodon", tag="SOCIAL", url="https://example.com/mastodon"),
    ],
)

_SERVER: Final[ServerStats] = ServerStats(
    hosts=(
        ServerHost(header="LEFT NAS", name="nas-01 (storage)"),
        ServerHost(header="RIGHT NUC", name="nuc-02 (compute)"),
    ),
    rows=[
        ServerRow(
            metric=ServerMetric.INLET_TEMP,
            label="INLET TEMP",
            name="Case inlet temperature",
            unit="°C",
            decimals=0,
            suffix="",
        ),
        ServerRow(metric=ServerMetric.CPU, label="CPU %", name="CPU load", unit="%", decimals=0, suffix=""),
        ServerRow(metric=ServerMetric.RAM, label="RAM %", name="Memory used", unit="%", decimals=0, suffix=""),
        ServerRow(
            metric=ServerMetric.CPU_TEMP, label="CPU TEMP", name="CPU temperature", unit="°C", decimals=0, suffix=""
        ),
        ServerRow(metric=ServerMetric.POWER, label="PWR DRAW", name="Power draw", unit="W", decimals=0, suffix=""),
        ServerRow(metric=ServerMetric.FAN, label="FAN RPM", name="Fan speed", unit="rpm", decimals=0, suffix=""),
        ServerRow(
            metric=ServerMetric.MEM_PRESSURE,
            label="MEM PRESS",
            name="Memory pressure (PSI)",
            unit="%",
            decimals=1,
            suffix="",
        ),
        ServerRow(
            metric=ServerMetric.THROUGHPUT,
            label="THRUPUT",
            name="Network throughput",
            unit="Mb/s",
            decimals=0,
            suffix="",
        ),
        ServerRow(metric=ServerMetric.JITTER, label="JITTER", name="Network jitter", unit="ms", decimals=1, suffix=""),
        ServerRow(
            metric=ServerMetric.DISK_TEMP,
            label="DISK TEMP",
            name="Disk temperature",
            unit="°C",
            decimals=0,
            suffix="",
        ),
        ServerRow(
            metric=ServerMetric.LOAD_AVG,
            label="LOAD AVG",
            name="Load average (1 minute)",
            unit="",
            decimals=2,
            suffix="",
        ),
        ServerRow(metric=ServerMetric.DISK, label="DISK %", name="Disk used", unit="%", decimals=0, suffix=""),
        ServerRow(metric=ServerMetric.UPTIME, label="UPTIME", name="Uptime", unit="days", decimals=0, suffix="D"),
    ],
    baseline=ServerSnapshot(
        hosts=(
            {
                ServerMetric.INLET_TEMP: 24,
                ServerMetric.CPU: 18,
                ServerMetric.RAM: 62,
                ServerMetric.CPU_TEMP: 46,
                ServerMetric.POWER: 38,
                ServerMetric.FAN: 820,
                ServerMetric.MEM_PRESSURE: 0.4,
                ServerMetric.THROUGHPUT: 312,
                ServerMetric.JITTER: 0.4,
                ServerMetric.DISK_TEMP: 37,
                ServerMetric.LOAD_AVG: 0.72,
                ServerMetric.DISK: 64,
                ServerMetric.UPTIME: 41,
            },
            {
                ServerMetric.INLET_TEMP: 27,
                ServerMetric.CPU: 47,
                ServerMetric.RAM: 71,
                ServerMetric.CPU_TEMP: 63,
                ServerMetric.POWER: 72,
                ServerMetric.FAN: 1460,
                ServerMetric.MEM_PRESSURE: 2.1,
                ServerMetric.THROUGHPUT: 86,
                ServerMetric.JITTER: 0.9,
                ServerMetric.DISK_TEMP: 41,
                ServerMetric.LOAD_AVG: 3.4,
                ServerMetric.DISK: 23,
                ServerMetric.UPTIME: 12,
            },
        ),
    ),
)


def _wave(level: float, swing: float, period_seconds: float) -> WaveMotion:
    return WaveMotion(kind=MotionKind.WAVE, level=level, swing=swing, period_seconds=period_seconds)


_FUEL: Final[FuelReserves] = FuelReserves(
    tanks=[
        FuelTank(
            id=FuelTankId.TK1,
            label="COFFEE",
            name="Coffee",
            capacity=2800,
            motion=DrainMotion(kind=MotionKind.DRAIN, low=0.15, period_seconds=180),
        ),
        FuelTank(id=FuelTankId.LEFT_FEED, label="FOCUS", name="Focus", capacity=1200, motion=_wave(0.8, 0.15, 70)),
        FuelTank(
            id=FuelTankId.RIGHT_FEED, label="PATIENCE", name="Patience", capacity=1200, motion=_wave(0.65, 0.1, 110)
        ),
        FuelTank(id=FuelTankId.TK4, label="MOTIVATION", name="Motivation", capacity=3700, motion=_wave(0.85, 0.1, 150)),
        FuelTank(id=FuelTankId.LEFT_WING, label="SLEEP", name="Sleep", capacity=1900, motion=_wave(0.55, 0.2, 240)),
        FuelTank(id=FuelTankId.RIGHT_WING, label="SNACKS", name="Snacks", capacity=1900, motion=_wave(0.7, 0.25, 90)),
        FuelTank(id=FuelTankId.LEFT_EXTERNAL, label="MUSIC", name="Music", capacity=2200, motion=_wave(0.9, 0.08, 60)),
        FuelTank(
            id=FuelTankId.CENTRELINE, label="PTO", name="Paid time off", capacity=2200, motion=_wave(0.4, 0.05, 300)
        ),
        FuelTank(
            id=FuelTankId.RIGHT_EXTERNAL,
            label="HOBBIES",
            name="Hobbies",
            capacity=2200,
            motion=_wave(0.6, 0.12, 130),
        ),
    ],
    bingo=2000,
)


def _side(value: str, arrow: FcsArrow | None = None) -> FcsSurfaceSide:
    return FcsSurfaceSide(value=value, arrow=arrow)


_FCS: Final[FlightControls] = FlightControls(
    surfaces=(
        FcsSurface(label="LEF", left=_side("0"), right=_side("0")),
        FcsSurface(label="TEF", left=_side("1", FcsArrow.DOWN), right=_side("1", FcsArrow.DOWN)),
        FcsSurface(label="AIL", left=_side("0"), right=_side("0")),
        FcsSurface(label="RUD", left=_side("0"), right=_side("0")),
        FcsSurface(label="STAB", left=_side("1", FcsArrow.UP), right=_side("1", FcsArrow.UP)),
    ),
    status_rows=[
        FcsStatusRow(label="DB  R", meaning="Database reads"),
        FcsStatusRow(label="    W", meaning="Database writes"),
        FcsStatusRow(label="    B", meaning="Database backups"),
        FcsStatusRow(label="API", meaning="API"),
        FcsStatusRow(label="AUTH", meaning="Sign-in"),
        FcsStatusRow(label="CACHE", meaning="Cache"),
        FcsStatusRow(label="QUEUE", meaning="Job queue"),
        FcsStatusRow(label="CI/CD", meaning="Build and deploy pipeline"),
        FcsStatusRow(label="DNS", meaning="DNS (it is always DNS)"),
        FcsStatusRow(label="CRON", meaning="Scheduled jobs"),
        FcsStatusRow(label="DEGD", meaning="Degraded overall"),
    ],
    channels=("Laptop", "CI", "Staging", "Production"),
    failures=[
        FcsFailure(table=FcsTable.BOTTOM, row=8, channel=3),
        FcsFailure(table=FcsTable.BOTTOM, row=10, channel=3),
    ],
    g_limit="7.5",
    aoa=FcsAoa(left="1.0", right="1.0"),
    blin_code="53",
)

_CHECKLIST: Final[Checklist] = Checklist(
    left=LeftChecklistColumn(
        title="LAND",
        meaning="End of the working day",
        items=["TESTS PASS", "GIT PUSH", "PR OPENED", "NOTES SAVED", "LAPTOP SHUT", "DESK CLEAR"],
    ),
    right=RightChecklistColumn(
        title="T.O.",
        meaning="Start of the working day",
        items=[
            "COFFEE",
            "KEYBOARD",
            "DUAL MONITORS",
            "CHAIR HEIGHT",
            "HEADPHONES",
            "GIT PULL",
            "CI GREEN",
            "PINGS LO",
            "FOCUS MODE",
        ],
    ),
    weight=ChecklistWeight(label="A/C WT", value="36533"),
    max_nz="MAX NZ",
    stab=ChecklistStab(label="STAB POS", left=" 1° NU", right=" 1° NU"),
)


def _check(name: str, status: BitCheckStatus, after_test: BitCheckStatus = BitCheckStatus.GO) -> BitCheck:
    return BitCheck(name=name, status=status, after_test=after_test)


_GO: Final[BitCheckStatus] = BitCheckStatus.GO

_BIT: Final[Bit] = Bit(
    checks={
        # FCS-MC: the build pipeline.
        BitItemKey.MC1: _check("LINT", _GO),
        BitItemKey.MC2: _check("TYPECHECK", _GO),
        BitItemKey.FCSA: _check("UNIT TEST", _GO),
        BitItemKey.FCSB: _check("FLAKY E2E", BitCheckStatus.RESTRT),
        # SENSORS: observability.
        BitItemKey.RDR: _check("LOGS", _GO),
        BitItemKey.FLIR: _check("METRICS", BitCheckStatus.PBIT_GO),
        BitItemKey.LTDR: _check("ALERTS", BitCheckStatus.OFF),
        # STORES: storage, and the one store nobody releases on a Friday.
        BitItemKey.SMS: _check("CACHE", BitCheckStatus.DEGD),
        BitItemKey.AWW4: _check("DB", _GO),
        BitItemKey.CLC: _check("BACKUPS", BitCheckStatus.NOT_RDY),
        BitItemKey.WPNS: _check("FRI PROD", BitCheckStatus.NOT_RDY, BitCheckStatus.NOT_RDY),
        # COMM: talking to humans.
        BitItemKey.CSC: _check("SLACK", _GO),
        BitItemKey.ICS: _check("EMAIL", BitCheckStatus.DEGD),
        BitItemKey.IFF: _check("REVIEWS", BitCheckStatus.NOT_RDY),
        BitItemKey.D_L: _check("STANDUP", BitCheckStatus.OVRHT),
        BitItemKey.COM1: _check("ZOOM", BitCheckStatus.RESTRT),
        BitItemKey.COM2: _check("PAGER", BitCheckStatus.OFF),
        BitItemKey.MIDS: _check("1:1", _GO),
        # NAV: finding your way. It's always DNS.
        BitItemKey.INS: _check("GIT", _GO),
        BitItemKey.ADC: _check("MERGE", BitCheckStatus.MUX_FAIL),
        BitItemKey.ILS: _check("REBASE", BitCheckStatus.SF_TEST),
        BitItemKey.RALT: _check("DNS", BitCheckStatus.DEGD, BitCheckStatus.DEGD),
        BitItemKey.TCN: _check("VPN", BitCheckStatus.NOT_RDY),
        BitItemKey.AUG: _check("GREP", BitCheckStatus.PBIT_GO),
        BitItemKey.BCN: _check("DOCS", BitCheckStatus.DEGD),
        BitItemKey.GPS: _check("ROUTER", BitCheckStatus.OP_GO),
        # DISPLAYS: the frontend.
        BitItemKey.LDDI: _check("FLEXBOX", _GO),
        BitItemKey.RDDI: _check("GRID", _GO),
        BitItemKey.MPCD: _check("HTML", _GO),
        BitItemKey.HUD: _check("JS", BitCheckStatus.DEGD_OVRHT),
        BitItemKey.IFEI: _check("A11Y", _GO),
        BitItemKey.DMS: _check("THEME", BitCheckStatus.PBIT_GO),
        BitItemKey.HMD: _check("HEADSET", BitCheckStatus.OFF),
        # STATUS MONITOR: the engineer.
        BitItemKey.SDC: _check("COFFEE", BitCheckStatus.NOT_RDY),
        BitItemKey.MU: _check("SLEEP", BitCheckStatus.DEGD, BitCheckStatus.DEGD),
        BitItemKey.AISI: _check("DUCK", _GO),
        BitItemKey.TK2FL: _check("MUG 1", BitCheckStatus.NO_TEST, BitCheckStatus.NO_TEST),
        BitItemKey.TK3FL: _check("MUG 2", _GO),
        # EW: security.
        BitItemKey.RWR: _check("NPM AUDIT", BitCheckStatus.DEGD, BitCheckStatus.DEGD),
        BitItemKey.IBS: _check("2FA", _GO),
        BitItemKey.ALE_47: _check("TLS", _GO),
        BitItemKey.ASPJ: _check("SECRETS", BitCheckStatus.OP_GO),
    },
    legend_names={
        BitLegendKey.FCS: "TESTS",
        BitLegendKey.UFC: "KEYS",
        BitLegendKey.DDI: "CSS",
        BitLegendKey.DFIRS: "OUTAGES",
        BitLegendKey.FQTY: "MUGS",
        BitLegendKey.FXFR: "KETTLE",
    },
    sw_config=SwConfig(
        left=[
            SwConfigEntry(name="NODE", value="24"),
            SwConfigEntry(name="NEXT", value="16.3.8"),
            SwConfigEntry(name="REACT", value="19.3.0"),
            None,
            SwConfigEntry(name="TS", value="6.0.3"),
            SwConfigEntry(name="ESLINT", value="9.39.5"),
            SwConfigEntry(name="VITEST", value="5.0.3"),
            SwConfigEntry(name="PYTHON", value="3.14"),
            SwConfigEntry(name="RUFF", value="0.16.10"),
            SwConfigEntry(name="UV", value="0.9"),
            SwConfigEntry(name="DOCKER", value="28"),
            SwConfigEntry(name="GIT", value="2.51"),
        ],
        right=[
            SwConfigEntry(name="CSS", value="TW 4.3.3"),
            SwConfigEntry(name="E2E", value="PW 1.63"),
            SwConfigEntry(name="A11Y", value="AXE 4.13"),
            SwConfigEntry(name="API", value="FASTAPI"),
            SwConfigEntry(name="ASGI", value="UVICORN"),
            SwConfigEntry(name="TYPES", value="PYRIGHT"),
            SwConfigEntry(name="K8S", value="KIND"),
            SwConfigEntry(name="DEV", value="TILT"),
            SwConfigEntry(name="IDE", value="PYCHARM"),
            SwConfigEntry(name="OS", value="WSL2"),
            SwConfigEntry(name="SIM", value="DCS 2.9"),
            SwConfigEntry(name="FUEL", value="COFFEE"),
        ],
    ),
)

_RADAR: Final[RadarScene] = RadarScene(
    ownship=Ownship(heading=256, airspeed=404, mach="0.90", altitude=20480),
    weapon="9X 2",
    contacts=[
        RadarContact(range=33, azimuth=-24, speed=880, track=172, altitude=17500),
        RadarContact(range=19, azimuth=31, speed=320, track=245, altitude=21300),
        RadarContact(range=52, azimuth=8, speed=720, track=186, altitude=30500),
        RadarContact(range=27, azimuth=52, speed=460, track=212, altitude=19000),
        RadarContact(range=38, azimuth=-49, speed=610, track=150, altitude=27500),
    ],
)

SEED_DOCUMENTS: Final[dict[ContentSection, ContentModel]] = {
    ContentSection.PROFILE: _PROFILE,
    ContentSection.RESUME: _RESUME,
    ContentSection.WORK: _WORK,
    ContentSection.PROJECTS: _PROJECTS,
    ContentSection.CONTACT: _CONTACT,
    ContentSection.LINKS: _LINKS,
    ContentSection.SERVER: _SERVER,
    ContentSection.FUEL: _FUEL,
    ContentSection.FCS: _FCS,
    ContentSection.CHECKLIST: _CHECKLIST,
    ContentSection.BIT: _BIT,
    ContentSection.RADAR: _RADAR,
}


def seed_site_content() -> SiteContent:
    """Every seed document in one `SiteContent`, as `GET /api/content` serves a fresh database."""
    return SiteContent.model_validate({section.value: document for section, document in SEED_DOCUMENTS.items()})
