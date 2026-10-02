"""The OSB cap in its shallow well: up and pressed, day and night, plus the NVG glow mask.

The canvas is CANVAS_DI square: the 42 DI cap (OSB_CAP, radius 6) plus its well, centred on the cap box. The well
reaches 3 DI past the cap on each side, well inside the 7 DI gap to the lip ring. Keep the constants in step with
src/frontend/src/ddi/constants.ts (OSB_CAP, OSB_CAP_RADIUS, OSB_ART).
"""

from typing import Final

import numpy as np
from PIL import Image

from common import (
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
    sdf_round_box,
    shade,
    smoothstep,
    to_rgba8,
)
from materials import N, Material, bezel_paint, cap_plastic

CANVAS_DI: Final[float] = 48.0
CAP_HALF: Final[float] = 21.0
CAP_RADIUS: Final[float] = 6.0
WELL_HALF: Final[float] = 22.2
WELL_RADIUS: Final[float] = 7.2
# Where the image fades out round the well; it reaches the canvas edge.
WELL_FADE: Final[tuple[float, float]] = (0.9, 1.8)
CAP_EDGE_RADIUS: Final[float] = 2.8
CAP_TOP: Final[float] = 0.8
# (ours) the pressed cap sits 1.8 DI deeper, nearly flush: the baked depth replaces the old 2 DI translate.
CAP_TOP_PRESSED: Final[float] = -1.0
WELL_FLOOR: Final[float] = -2.5
CAP_ALBEDO: Final[float] = 0.04
PIXELS_PER_DI: Final[int] = 8  # supersampled master; the exports are downscaled
SIZE: Final[int] = int(CANVAS_DI * PIXELS_PER_DI)
# Texture pixels per DI: the bezel tile's scale (1024 px over 689 DI), and a finer plastic grain.
BEZEL_TEXELS_PER_DI: Final[float] = N / 689
CAP_TEXELS_PER_DI: Final[float] = N / 240

FACE: Final[dict[str, str]] = {"day": "#2f302f", "night": night_of("#2f302f")}
CAP: Final[dict[str, str]] = {"day": "#282829", "night": night_of("#282829")}
CAP_PRESSED: Final[dict[str, str]] = {"day": "#222223", "night": night_of("#222223")}


def sample(material: Material, x: Array, y: Array, texels_per_di: float, offset: float) -> dict[str, Array]:
    u = (x + offset) * texels_per_di
    v = (y + offset * 0.7) * texels_per_di
    normal = bilinear(material.normal, u, v)
    return {
        "albedo": bilinear(material.albedo, u, v),
        "normal": normal / np.linalg.norm(normal, axis=-1, keepdims=True),
        "roughness": bilinear(material.roughness, u, v),
        "wear": bilinear(material.wear, u, v),
    }


def geometry(pressed: bool) -> tuple[Array, Array, Array, Array, Array, Array]:
    centres = (np.arange(SIZE) + 0.5) / PIXELS_PER_DI - CANVAS_DI / 2
    x, y = np.meshgrid(centres, centres)
    d_well = sdf_round_box(x, y, WELL_HALF, WELL_RADIUS)
    d_cap = sdf_round_box(x, y, CAP_HALF, CAP_RADIUS)
    # The bezel face with a small convex lip that drops into the well.
    h_bezel = np.where(d_well > 0.8, 0.0, -0.6 * (1 - np.clip(d_well / 0.8, 0, 1)) ** 2)
    h_bezel = np.where(d_well < 0, -0.6 + np.clip(d_well, -0.8, 0) / 0.8 * (-WELL_FLOOR - 0.6), h_bezel)
    top = CAP_TOP_PRESSED if pressed else CAP_TOP
    inset = np.clip(d_cap + CAP_EDGE_RADIUS, 0, CAP_EDGE_RADIUS)  # 0 on the flat top, the radius at the outline
    h_cap = top - (CAP_EDGE_RADIUS - np.sqrt(np.maximum(CAP_EDGE_RADIUS**2 - inset**2, 0)))
    # A barely domed face catches the light like a moulded cap.
    h_cap = h_cap + 0.15 * (1 - np.clip((x**2 + y**2) / CAP_HALF**2, 0, 1))
    on_cap = d_cap < 0
    height = np.where(on_cap, np.maximum(h_cap, WELL_FLOOR), np.maximum(h_bezel, WELL_FLOOR))
    return x, y, d_well, d_cap, height, on_cap


def render(theme: str, light: Light, pressed: bool, bezel: Material, cap: Material) -> Image.Image:
    x, y, d_well, d_cap, height, on_cap = geometry(pressed)
    bezel_sample = sample(bezel, x, y, BEZEL_TEXELS_PER_DI, 211.0)
    cap_sample = sample(cap, x, y, CAP_TEXELS_PER_DI, 57.0)
    cap_weight = on_cap.astype(float)
    cap_weight3 = cap_weight[..., None]
    # Black plastic reflects about CAP_ALBEDO of the light diffusely, so its specular edges stand out as they do on
    # the real caps. The colour match below then only nudges the exposure.
    albedo = cap_sample["albedo"] * CAP_ALBEDO * cap_weight3 + bezel_sample["albedo"] * (1 - cap_weight3)
    micro = cap_sample["normal"] * cap_weight3 + bezel_sample["normal"] * (1 - cap_weight3)
    roughness = cap_sample["roughness"] * cap_weight + bezel_sample["roughness"] * (1 - cap_weight)
    wear = bezel_sample["wear"] * (1 - cap_weight)
    # Edge wear: the well lip and the cap's top edge are rubbed lighter, broken up by chip noise.
    chips = bilinear(bezel.wear, x * 9 + 300, y * 9 + 100)
    lip = np.exp(-(((d_well - 0.4) / 0.4) ** 2)) * (0.15 + 0.85 * smoothstep(0.1, 0.4, chips))
    cap_edge = np.exp(-(((d_cap + 1.2) / 0.8) ** 2)) * on_cap * 0.35
    wear = np.clip(wear + lip * 0.45, 0, 1)
    albedo = albedo * (1 + 0.9 * wear[..., None] + 0.5 * cap_edge[..., None])
    # Fingers polish the cap's rounded edge: glossier there, so it catches the key light as a soft specular rim.
    bevel = smoothstep(-CAP_EDGE_RADIUS - 0.5, -0.6, d_cap) * on_cap
    roughness = roughness - 0.12 * bevel
    macro = normal_from_height(gaussian_blur(height, 0.2 * PIXELS_PER_DI), scale=PIXELS_PER_DI)
    normal = blend_normals(macro, micro)
    shadow = height_shadow(height * PIXELS_PER_DI, light, softness=0.7 * PIXELS_PER_DI, reach=0.12)
    occlusion = np.clip(1 - (gaussian_blur(height, 1.6 * PIXELS_PER_DI) - height) * 0.3, 0.25, 1.0)
    radiance = shade(albedo, normal, roughness, light, shadow=shadow, occlusion=occlusion, f0=0.04 + 0.4 * wear)
    # Colour-match the cap face to the cap colour, on its flat, unshadowed part.
    flat_cap = ((d_cap < -4) & (shadow > 0.99)).astype(float)
    target_cap = (CAP_PRESSED if pressed else CAP)[theme]
    # The bezel parts use the exact exposure of the tile bake, so the well's surround blends into the tiled face.
    face_patch = shade(bezel.albedo, bezel.normal, bezel.roughness, light)
    bezel_scale = scale_for(FACE[theme], face_patch, np.ones(face_patch.shape[:2]))
    cap_scale = scale_for(target_cap, radiance, flat_cap)
    radiance = radiance * (cap_scale * cap_weight3 + bezel_scale * (1 - cap_weight3))
    alpha = 1 - smoothstep(*WELL_FADE, d_well)
    return to_rgba8(linear_to_srgb(radiance), alpha)


def glow_mask() -> Image.Image:
    """Where NVG panel light leaks: the gap between the cap and the well, softly. White on transparent."""
    _, _, d_well, d_cap, *_ = geometry(pressed=False)
    gap = (d_cap > -0.2) & (d_well < 0.0)
    alpha = gaussian_blur(gap.astype(float), 1.1 * PIXELS_PER_DI)
    alpha = alpha / alpha.max()
    return to_rgba8(np.ones((SIZE, SIZE, 3)), alpha)


def main() -> None:
    bezel = bezel_paint()
    cap = cap_plastic()
    for theme, light in (("day", DAY), ("night", NIGHT)):
        for pressed in (False, True):
            name = f"osb-{'down' if pressed else 'up'}-{theme}"
            export(render(theme, light, pressed, bezel, cap), name, density_sizes(CANVAS_DI), quality=64)
    export(glow_mask(), "osb-glow-mask", {"@3x": round(3 * CANVAS_DI)}, quality=60)


if __name__ == "__main__":
    main()
