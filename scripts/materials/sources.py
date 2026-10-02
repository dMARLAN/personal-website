"""The CC0 ambientCG texture sets the bakes start from. They are downloaded once into `.sources/` (gitignored).

ambientCG (Lennart Demes) publishes them under CC0 1.0 Universal: https://docs.ambientcg.com/license/
"""

import io
import urllib.request
import zipfile
from pathlib import Path
from typing import Final

SOURCES_DIR: Final[Path] = Path(__file__).resolve().parent / ".sources"
# Metal029: bezel paint grain. PaintedMetal002: bezel wear. Plastic012A: OSB caps. Metal027: knob coat.
TEXTURE_SETS: Final[tuple[str, ...]] = ("Metal029", "PaintedMetal002", "Plastic012A", "Metal027")
DOWNLOAD_URL: Final[str] = "https://ambientcg.com/get?file={name}_1K-JPG.zip"


def ensure_sources() -> None:
    """Download and unpack each 1K-JPG set that is not already in `.sources/`."""
    for name in TEXTURE_SETS:
        target = SOURCES_DIR / name
        if target.is_dir():
            continue
        request = urllib.request.Request(DOWNLOAD_URL.format(name=name), headers={"User-Agent": "bezel-bake"})
        with urllib.request.urlopen(request, timeout=60) as response:
            archive = zipfile.ZipFile(io.BytesIO(response.read()))
        target.mkdir(parents=True)
        archive.extractall(target)
        print(f"downloaded {name}")
