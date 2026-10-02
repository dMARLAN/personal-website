"""Rebuild every bezel material into src/frontend/public/materials/.

Run from the repo root: `uv run --with numpy --with pillow python scripts/materials/bake_all.py`. The first run
downloads the CC0 ambientCG sources into scripts/materials/.sources/.
"""

import bake_bezel
import bake_knob
import bake_lip
import bake_osb
from sources import ensure_sources

if __name__ == "__main__":
    ensure_sources()
    for module in (bake_bezel, bake_osb, bake_knob, bake_lip):
        module.main()
