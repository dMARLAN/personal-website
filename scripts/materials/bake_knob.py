"""The BRT/CONT rotary knob as a layer stack whose lighting does not turn with the knob.

The knob is modelled in its own units (a skirt radius of 42 on a 112 square canvas) and exported so the canvas
covers ART_DI = 4/3 × the 50 DI knob (KNOB_DIAMETER), centred on it. Layers, bottom to top:

- knob-base-{theme}   static   the skirt's cast shadow and contact occlusion on the bezel
- knob-body-{theme}   ROTATES  skirt, fluted grip, knurled shoulder and top face, lit only by a light on the view
                               axis plus fill, so its shading is rotation invariant
- knob-index-mask     ROTATES  the index line (points to 12 o'clock at 0°); tinted in CSS
- knob-ring-mask      static   the painted ring on the skirt (rotationally symmetric); tinted in CSS
- knob-light-{theme}  static   the top-left key light: shade (black) and highlight (white), computed from the knob's
                               rotationally symmetric shape, plus the grip's cast shadow on the skirt
"""

from typing import Final

import numpy as np

from common import (
    BUILD,
    DAY,
    NIGHT,
    Array,
    Light,
    bilinear,
    blend_normals,
    density_sizes,
    export,
    gaussian_blur,
    height_shadow,
    linear_to_srgb,
    night_of,
    normal_from_height,
    scale_for,
    shade,
    smoothstep,
    to_overlay,
    to_rgba8,
)
from materials import N, knob_coat

KNOB_DIAMETER_DI: Final[float] = 50.0
CANVAS: Final[float] = 112.0  # model units
SKIRT_R: Final[float] = 42.0
ART_DI: Final[float] = KNOB_DIAMETER_DI * CANVAS / (2 * SKIRT_R)
PIXELS_PER_UNIT: Final[int] = 8
SIZE: Final[int] = int(CANVAS * PIXELS_PER_UNIT)
TEXELS_PER_UNIT: Final[float] = N / 260

GRIP_R: Final[float] = 33.5
TOP_R: Final[float] = 26.5
FLUTES: Final[int] = 24
KNURL_RIBS: Final[int] = 90
H_TOP: Final[float] = 13.0
H_SKIRT: Final[float] = 2.2
RING: Final[tuple[float, float]] = (38.4, 40.8)
INDEX: Final[tuple[float, float, float]] = (4.0, 32.5, 3.6)  # inner radius, outer radius, width

KNOB_ALBEDO: Final[float] = 0.05
KNOB: Final[dict[str, str]] = {"day": "#222427", "night": night_of("#222427")}
# A light on the view axis: shading that depends only on slope, so it is the same at any rotation.
AXIAL: Final[Light] = Light(direction=(0.0, 0.0, 1.0), key=1.0, fill=0.35, fill_tint=(1.0, 1.0, 1.0), specular=0.0)


def polar() -> tuple[Array, Array, Array, Array]:
    centres = (np.arange(SIZE) + 0.5) / PIXELS_PER_UNIT - CANVAS / 2
    x, y = np.meshgrid(centres, centres)
    return x, y, np.hypot(x, y), np.arctan2(y, x)


def height_field(detailed: bool) -> Array:
    """Height in model units. `detailed` adds flutes, knurl and lathe rings; without them the shape is symmetric."""
    _, _, radius, angle = polar()
    flute = 0.5 + 0.5 * np.cos(FLUTES * angle)
    grip_edge = GRIP_R - (2.6 * smoothstep(0.35, 0.9, flute) if detailed else 0.0)
    # Top face: a whisper of dome; the lathe rings are finer than a pixel, so they only add sheen.
    top = H_TOP - 0.35 * (radius / TOP_R) ** 2
    if detailed:
        top = top + 0.025 * np.sin(radius * 2 * np.pi / 0.9)
    # A rounded, knurled shoulder (slope 0 → 1.3) so the key light leaves a specular arc on the upper left.
    shoulder = H_TOP - 0.35 - 0.093 * (radius - TOP_R) ** 2
    if detailed:
        shoulder = shoulder + 0.32 * (0.5 + 0.5 * np.cos(KNURL_RIBS * angle)) * smoothstep(TOP_R, TOP_R + 1.5, radius)
    # The skirt has a rounded outer edge.
    edge = np.clip((radius - (SKIRT_R - 1.6)) / 1.6, 0, 1)
    skirt = H_SKIRT * np.sqrt(np.clip(1 - edge**2, 0, 1))
    height = np.where(radius <= TOP_R, top, shoulder)
    height = np.where(radius > grip_edge, skirt, height)
    return np.where(radius > SKIRT_R, 0.0, height)


def ring_mask() -> Array:
    _, _, radius, _ = polar()
    inner, outer = RING
    return smoothstep(inner - 0.4, inner + 0.4, radius) * (1 - smoothstep(outer - 0.4, outer + 0.4, radius))


def index_mask() -> Array:
    x, y, _, _ = polar()
    inner, outer, width = INDEX
    # A rounded bar pointing to 12 o'clock (−y).
    along = np.clip(-y, inner, outer)
    distance = np.hypot(x, -y - along) - width / 2
    return 1 - smoothstep(-0.35, 0.35, distance)


def lit(
    height: Array, light: Light, micro: Array, albedo: Array, roughness: Array, shadows: bool, f0: float = 0.05
) -> Array:
    macro = normal_from_height(gaussian_blur(height, 0.5), scale=PIXELS_PER_UNIT)
    normal = blend_normals(macro, micro)
    occlusion = np.clip(1 - (gaussian_blur(height, 3.0 * PIXELS_PER_UNIT) - height) * 0.12, 0.3, 1.0)
    shadow = (
        height_shadow(height * PIXELS_PER_UNIT, light, softness=1.5 * PIXELS_PER_UNIT, reach=0.2) if shadows else None
    )
    return shade(albedo, normal, roughness, light, shadow=shadow, occlusion=occlusion, f0=f0)


def main() -> None:
    sizes = density_sizes(ART_DI)
    coat = knob_coat()
    x, y, radius, _ = polar()
    u, v = x * TEXELS_PER_UNIT + 400, y * TEXELS_PER_UNIT + 150
    albedo = bilinear(coat.albedo, u, v)
    micro = bilinear(coat.normal, u, v)
    micro = micro / np.linalg.norm(micro, axis=-1, keepdims=True)
    roughness = bilinear(coat.roughness, u, v)
    flat = np.array([0.0, 0.0, 1.0]) * np.ones_like(micro)
    inside = 1 - smoothstep(SKIRT_R - 0.3, SKIRT_R + 0.3, radius)
    top_face = (radius < TOP_R - 3).astype(float)
    detailed = height_field(detailed=True)
    smooth = height_field(detailed=False)
    for theme, key in (("day", DAY), ("night", NIGHT)):
        # 1. The reference look: everything lit by the key at 0°. A dev check for the layered result; not shipped.
        reference = lit(detailed, key, micro, albedo, roughness, shadows=True)
        reference = reference * scale_for(KNOB[theme], reference, top_face)
        BUILD.mkdir(exist_ok=True)
        to_rgba8(linear_to_srgb(reference), inside).save(BUILD / f"dev-knob-reference-{theme}.png")
        # 2. Body: axial light only (rotation invariant), exposed to match the key-lit top face.
        axial = Light(AXIAL.direction, key.key, key.fill, key.fill_tint, 0.0)
        # Cavity: the knurl and flute grooves darker, the rib crests rubbed lighter. Rotation invariant.
        cavity = detailed - gaussian_blur(detailed, 0.8 * PIXELS_PER_UNIT)
        cavity = np.clip(cavity / 0.25, -1, 1) * (radius > TOP_R - 0.5) * (radius < SKIRT_R - 1)
        body_albedo = albedo * (1 + 0.45 * cavity)[..., None]
        body = lit(detailed, axial, micro, body_albedo, roughness, shadows=False)
        body = body * scale_for(KNOB[theme], body, top_face)
        export(to_rgba8(linear_to_srgb(body), inside), f"knob-body-{theme}", sizes, quality=64)
        # 3. Light overlay: the smooth shape under the key light against the same shape under the axial light.
        # A physical albedo for black powder coat, so the specular arc on the shoulder keeps its real weight.
        coat_albedo = np.full_like(albedo, KNOB_ALBEDO)
        smooth_key = lit(smooth, key, flat, coat_albedo, np.full_like(roughness, 0.27), shadows=True, f0=0.09)
        smooth_axial = lit(smooth, axial, flat, coat_albedo, np.full_like(roughness, 0.36), shadows=False)
        smooth_axial = smooth_axial * scale_for(KNOB[theme], smooth_axial, top_face)
        smooth_key = smooth_key * scale_for(KNOB[theme], smooth_key, top_face)
        colour, alpha = to_overlay(linear_to_srgb(smooth_axial), linear_to_srgb(smooth_key), inside)
        export(to_rgba8(colour, alpha), f"knob-light-{theme}", sizes, quality=64)
        # 4. Base: the skirt's cast shadow and contact occlusion on the bezel (outside the skirt only).
        shadow = height_shadow(smooth * PIXELS_PER_UNIT, key, softness=1.5 * PIXELS_PER_UNIT, reach=0.2)
        occlusion = np.clip(1 - (gaussian_blur(smooth, 3.0 * PIXELS_PER_UNIT) - smooth) * 0.12, 0.3, 1.0)
        darkening = 1 - (0.62 * shadow + 0.38 * occlusion)
        base_alpha = np.clip(darkening * 1.1, 0, 0.85) * (1 - inside)
        export(to_rgba8(np.zeros((SIZE, SIZE, 3)), base_alpha), f"knob-base-{theme}", sizes, quality=64)
    export(to_rgba8(np.ones((SIZE, SIZE, 3)), index_mask()), "knob-index-mask", {"@3x": sizes["@3x"]}, quality=70)
    export(to_rgba8(np.ones((SIZE, SIZE, 3)), ring_mask()), "knob-ring-mask", {"@3x": sizes["@3x"]}, quality=70)


if __name__ == "__main__":
    main()
