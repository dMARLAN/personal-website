from pathlib import Path
from typing import Final

from content.sections import SiteContent
from seed.content import seed_site_content

# The frontend renders this when it has no cached content and the API is unreachable (docs/design.md section 13).
_SNAPSHOT: Final[Path] = Path(__file__).parents[3] / "frontend" / "src" / "content" / "snapshot.json"


def test_the_frontend_snapshot_is_the_seed_content() -> None:
    snapshot = SiteContent.model_validate_json(_SNAPSHOT.read_text(encoding="utf-8"))

    assert snapshot == seed_site_content(), (
        "src/frontend/src/content/snapshot.json is stale: regenerate it with "
        "`uv run python src/cli.py content-snapshot ../frontend/src/content/snapshot.json` from src/api"
    )
