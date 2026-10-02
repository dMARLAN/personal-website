"""The lip ring where the bezel steps down to the glass: a 9-slice lighting overlay, day and night.

The image is a BOX DI square whose corner radius is CORNER = SCREEN_RADIUS + LIP_RING = 182 DI, so each corner slice
is CORNER / BOX = 47.89 % of the image (the CSS `border-image-slice`). It holds only light and shade (black or white
with alpha); the bezel tile shows through, so the paint texture is never stretched. Along a straight edge the
lighting is constant, so the stretched middle slices are exact. Keep LIP and CORNER in step with
src/frontend/src/ddi/constants.ts.
"""

from typing import Final

import numpy as np

from common import (
    DAY,
    NIGHT,
    Array,
    Light,
    density_sizes,
    export,
    gaussian_blur,
    height_shadow,
    hex_rgb,
    linear_to_srgb,
    normal_from_height,
    sdf_round_box,
    shade,
    smoothstep,
    srgb_to_linear,
    to_overlay,
    to_rgba8,
)

LIP: Final[float] = 8.0
CORNER: Final[float] = 174.0 + LIP
BOX: Final[float] = 2 * CORNER + 16.0
PIXELS_PER_DI: Final[int] = 4
SIZE: Final[int] = int(BOX * PIXELS_PER_DI)
FACE: Final[dict[str, str]] = {"day": "#2f302f", "night": "#141615"}
# The recessed floor is darker paint than the face (#252626 against #2f302f) [bzl §3].
FLOOR_ALBEDO: Final[float] = float((srgb_to_linear(hex_rgb("#252626")) / srgb_to_linear(hex_rgb("#2f302f"))).mean())


def profile() -> tuple[Array, Array, Array]:
    centres = (np.arange(SIZE) + 0.5) / PIXELS_PER_DI - BOX / 2
    x, y = np.meshgrid(centres, centres)
    depth = -sdf_round_box(x, y, BOX / 2, CORNER)  # into the lip: 0 at the outer edge, LIP at the glass
    edge = np.where(depth < 1.2, -0.8 * smoothstep(-0.6, 1.2, depth) ** 2, 0.0)
    chamfer = -0.8 - 3.2 * smoothstep(1.2, 5.5, depth)
    height = np.where(depth < 1.2, edge, chamfer)
    height = np.where(depth > 5.5, -4.0, height)
    height = np.where(depth > LIP, -4.6, height)  # the glass, a touch lower; the screen element covers it
    return depth, height, smoothstep(5.0, 6.0, depth)


def bake(theme: str, light: Light) -> None:
    depth, height, floor = profile()
    normal = normal_from_height(gaussian_blur(height, 0.4 * PIXELS_PER_DI), scale=PIXELS_PER_DI)
    shadow = height_shadow(height * PIXELS_PER_DI, light, softness=1.2 * PIXELS_PER_DI, reach=0.03)
    occlusion = np.clip(1 - (gaussian_blur(height, 4 * PIXELS_PER_DI) - height) * 0.15, 0.3, 1.0)
    albedo = (1 - floor * (1 - FLOOR_ALBEDO))[..., None] * np.ones(3)
    # The outer edge is rubbed through the paint a little: lighter, as on the DCS bezel.
    worn_edge = np.exp(-(((depth - 0.5) / 0.6) ** 2))
    albedo = albedo * (1 + 0.9 * worn_edge)[..., None]
    roughness = np.full(height.shape, 0.38)
    radiance = shade(albedo, normal, roughness, light, shadow=shadow, occlusion=occlusion)
    flat = shade(np.ones((1, 1, 3)), np.array([[[0.0, 0.0, 1.0]]]), np.full((1, 1), 0.38), light)
    face = srgb_to_linear(hex_rgb(FACE[theme]))
    target = linear_to_srgb(face * radiance / flat)
    base = linear_to_srgb(face) * np.ones_like(target)
    inside = smoothstep(-1.0, -0.4, depth) * (1 - smoothstep(LIP + 0.5, LIP + 1.0, depth))
    colour, alpha = to_overlay(base, target, inside)
    export(to_rgba8(colour, alpha), f"lip-9slice-{theme}", density_sizes(BOX), quality=62)


def main() -> None:
    bake("day", DAY)
    bake("night", NIGHT)


if __name__ == "__main__":
    main()
