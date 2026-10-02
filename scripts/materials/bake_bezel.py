"""The seamless bezel face tile, day and night.

The tile is drawn at TILE_DI (CSS: `calc(689 * var(--k))`), so the paint grain and wear keep one physical scale at
every viewport size. The 1024 px map gives 1.49 px per DI.
"""

from typing import Final

import numpy as np

from common import DAY, NIGHT, Light, export, linear_to_srgb, scale_for, shade, to_rgba8
from materials import bezel_paint

TILE_DI: Final[float] = 689.0
# The mean of the unworn paint, matched in linear light [bzl §3]. Night drops every colour by the face's ratio.
TARGETS: Final[dict[str, tuple[str, Light]]] = {"day": ("#2f302f", DAY), "night": ("#141615", NIGHT)}


def main() -> None:
    paint = bezel_paint()
    for theme, (target, light) in TARGETS.items():
        radiance = shade(paint.albedo, paint.normal, paint.roughness, light, f0=0.04 + 0.45 * paint.wear)
        radiance = radiance * scale_for(target, radiance, (paint.wear < 0.05).astype(float))
        image = to_rgba8(linear_to_srgb(radiance))
        # The WebP fallback is only for browsers without AVIF, so it trades fidelity for size.
        export(image, f"bezel-tile-{theme}", quality=70 if theme == "day" else 76, webp_quality=55)
        print(theme, np.asarray(image).reshape(-1, 3).mean(0).round(1))


if __name__ == "__main__":
    main()
