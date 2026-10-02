"""Shared helpers for the bezel material bakes: texture loading, a small PBR-style shader and asset export.

Coordinates are image space: x right, y down, z toward the viewer. Every light direction is in that space.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Final

import numpy as np
from PIL import Image

from sources import SOURCES_DIR

HERE: Final[Path] = Path(__file__).resolve().parent
# The shipped files. src/frontend/src/theme/materials.css references them by name.
ASSETS: Final[Path] = HERE.parent.parent / "src/frontend/public/materials"
# Full-resolution PNG masters and dev previews: useful when tuning, never shipped (gitignored).
BUILD: Final[Path] = HERE / ".build"

type Array = np.ndarray


def srgb_to_linear(colour: Array) -> Array:
    return np.where(colour <= 0.04045, colour / 12.92, ((colour + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(colour: Array) -> Array:
    colour = np.clip(colour, 0.0, 1.0)
    return np.where(colour <= 0.0031308, colour * 12.92, 1.055 * colour ** (1 / 2.4) - 0.055)


def hex_rgb(value: str) -> Array:
    value = value.lstrip("#")
    return np.array([int(value[i : i + 2], 16) / 255 for i in (0, 2, 4)])


def load_map(asset: str, kind: str, size: int | None = None) -> Array:
    """An ambientCG 1K map as floats in 0..1. Exact power-of-two box downscales keep a tileable map seamless."""
    image = Image.open(SOURCES_DIR / asset / f"{asset}_1K-JPG_{kind}.jpg")
    image = image.convert("RGB" if kind in {"Color", "NormalGL"} else "L")
    if size is not None and size != image.width:
        image = image.resize((size, size), Image.Resampling.BOX)
    return np.asarray(image, dtype=np.float64) / 255.0


def decode_normal(rgb: Array, strength: float = 1.0) -> Array:
    """An OpenGL normal map (green = up in texture space) as unit vectors in image space (y down)."""
    vectors = rgb * 2.0 - 1.0
    vectors = np.stack([vectors[..., 0] * strength, -vectors[..., 1] * strength, vectors[..., 2]], axis=-1)
    return vectors / np.linalg.norm(vectors, axis=-1, keepdims=True)


def normal_from_height(height: Array, scale: float = 1.0) -> Array:
    """Unit normals from a height field in pixel units (larger height = toward the viewer)."""
    slope_y, slope_x = np.gradient(height * scale)
    vectors = np.stack([-slope_x, -slope_y, np.ones_like(height)], axis=-1)
    return vectors / np.linalg.norm(vectors, axis=-1, keepdims=True)


def blend_normals(macro: Array, micro: Array) -> Array:
    """Whiteout blend: the micro detail rides on the macro surface."""
    vectors = np.stack(
        [macro[..., 0] + micro[..., 0], macro[..., 1] + micro[..., 1], macro[..., 2] * micro[..., 2]], axis=-1
    )
    return vectors / np.linalg.norm(vectors, axis=-1, keepdims=True)


def unit(vector: tuple[float, float, float]) -> Array:
    array = np.array(vector, dtype=np.float64)
    return array / np.linalg.norm(array)


@dataclass(frozen=True, slots=True)
class Light:
    """A key light plus a hemispheric fill. `direction` points from the surface toward the light."""

    direction: tuple[float, float, float]
    key: float
    fill: float
    fill_tint: tuple[float, float, float]
    specular: float


# The cockpit references are lit from above and slightly left (canopy light): a top-left key.
DAY: Final[Light] = Light(direction=(-0.42, -0.62, 0.66), key=1.0, fill=0.30, fill_tint=(1.0, 1.0, 1.0), specular=1.2)
# A dark cockpit: a weak, cool key (moon and ambient light through the canopy) and almost no specular.
NIGHT: Final[Light] = Light(
    direction=(-0.30, -0.55, 0.78), key=0.55, fill=0.40, fill_tint=(0.92, 0.96, 1.0), specular=0.35
)


def shade(
    albedo: Array,
    normal: Array,
    roughness: Array,
    light: Light,
    shadow: Array | None = None,
    occlusion: Array | None = None,
    f0: float | Array = 0.04,
) -> Array:
    """Linear RGB radiance: Lambert diffuse + normalised Blinn-Phong specular + hemispheric fill."""
    light_direction = unit(light.direction)
    half_vector = unit(tuple(light_direction + np.array([0.0, 0.0, 1.0])))
    n_dot_l = np.clip(normal @ light_direction, 0.0, 1.0)
    n_dot_h = np.clip(normal @ half_vector, 0.0, 1.0)
    clamped_roughness = np.clip(roughness, 0.08, 1.0)
    exponent = 2.0 / clamped_roughness**4 - 2.0
    highlight = (exponent + 8.0) / (8.0 * np.pi) * n_dot_h**exponent
    v_dot_h = float(half_vector[2])
    fresnel = f0 + (1 - f0) * (1 - v_dot_h) ** 5
    direct = n_dot_l if shadow is None else n_dot_l * shadow
    # Sky fill from above: surfaces facing up (−y) get more of it.
    sky = 0.75 + 0.25 * np.clip(-normal[..., 1], -1.0, 1.0)
    sky = sky * (0.55 + 0.45 * normal[..., 2])
    if occlusion is not None:
        sky = sky * occlusion
    fill = light.fill * sky[..., None] * np.array(light.fill_tint)
    diffuse = albedo * (light.key * direct[..., None] + fill)
    specular = (light.specular * light.key * fresnel * highlight * direct)[..., None] * np.ones(3)
    return diffuse + specular


def scale_for(target_hex: str, radiance: Array, mask: Array) -> Array:
    """Per-channel factor that brings the masked mean radiance to the target sRGB colour."""
    weights = mask / mask.sum()
    current = (radiance * weights[..., None]).sum(axis=(0, 1))
    return srgb_to_linear(hex_rgb(target_hex)) / current


def height_shadow(height: Array, light: Light, softness: float = 1.0, steps: int = 48, reach: float = 0.12) -> Array:
    """Soft cast shadows on a height field (height in pixels) by marching toward the light."""
    size = height.shape[0]
    light_direction = unit(light.direction)
    horizontal = np.hypot(light_direction[0], light_direction[1])
    rise = light_direction[2] / horizontal
    rows, columns = np.mgrid[0:size, 0:size].astype(np.float64)
    lit = np.ones_like(height)
    max_distance = reach * size
    for step in range(1, steps + 1):
        distance = max_distance * step / steps
        sample_x = np.clip(columns + light_direction[0] / horizontal * distance, 0, size - 1).astype(int)
        sample_y = np.clip(rows + light_direction[1] / horizontal * distance, 0, size - 1).astype(int)
        blocker = height[sample_y, sample_x] - (height + rise * distance)
        lit = np.minimum(lit, np.clip(1.0 - blocker / (softness * (1 + 0.15 * distance)), 0.0, 1.0))
    return lit


def to_rgba8(srgb: Array, alpha: Array | None = None) -> Image.Image:
    rgb = (np.clip(srgb, 0, 1) * 255 + 0.5).astype(np.uint8)
    if alpha is None:
        return Image.fromarray(rgb, "RGB")
    alpha8 = (np.clip(alpha, 0, 1) * 255 + 0.5).astype(np.uint8)
    return Image.fromarray(np.dstack([rgb, alpha8]), "RGBA")


def density_sizes(canvas_di: float) -> dict[str, int]:
    """The shipped densities: `@2x` is 2 px per DI and `@3x` is 3 px per DI, whatever the part's size."""
    return {"@2x": round(2 * canvas_di), "@3x": round(3 * canvas_di)}


def export(
    image: Image.Image, name: str, sizes: dict[str, int] | None = None, quality: int = 60, webp_quality: int = 80
) -> None:
    """Save a PNG master plus AVIF and WebP renditions. `sizes` maps a suffix (e.g. "@2x") to a pixel width."""
    ASSETS.mkdir(parents=True, exist_ok=True)
    BUILD.mkdir(exist_ok=True)
    image.save(BUILD / f"{name}.png", optimize=True)
    for suffix, width in (sizes or {"": image.width}).items():
        height = round(image.height * width / image.width)
        resized = image if width == image.width else image.resize((width, height), Image.Resampling.LANCZOS)
        stem = ASSETS / f"{name}{suffix}"
        resized.save(stem.with_suffix(".avif"), quality=quality, speed=2, subsampling="4:4:4")
        resized.save(stem.with_suffix(".webp"), quality=webp_quality, alpha_quality=70, method=6)


def smoothstep(edge0: float, edge1: float, x: Array) -> Array:
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def bilinear(texture: Array, u: Array, v: Array) -> Array:
    """Bilinear lookup with wrap-around; u and v in texture pixels."""
    height, width = texture.shape[:2]
    u0 = np.floor(u).astype(int)
    v0 = np.floor(v).astype(int)
    fraction_u = u - u0
    fraction_v = v - v0
    if texture.ndim == 3:
        fraction_u = fraction_u[..., None]
        fraction_v = fraction_v[..., None]
    top_left = texture[np.mod(v0, height), np.mod(u0, width)]
    top_right = texture[np.mod(v0, height), np.mod(u0 + 1, width)]
    bottom_left = texture[np.mod(v0 + 1, height), np.mod(u0, width)]
    bottom_right = texture[np.mod(v0 + 1, height), np.mod(u0 + 1, width)]
    top = top_left * (1 - fraction_u) + top_right * fraction_u
    bottom = bottom_left * (1 - fraction_u) + bottom_right * fraction_u
    return top * (1 - fraction_v) + bottom * fraction_v


def gaussian_blur(array: Array, sigma: float) -> Array:
    """Separable Gaussian blur with edge padding (array is 2-D)."""
    radius = max(1, int(3 * sigma))
    offsets = np.arange(-radius, radius + 1)
    kernel = np.exp(-(offsets**2) / (2 * sigma**2))
    kernel /= kernel.sum()
    padded = np.pad(array, radius, mode="edge")
    rows = np.apply_along_axis(lambda row: np.convolve(row, kernel, mode="valid"), 1, padded)
    return np.apply_along_axis(lambda column: np.convolve(column, kernel, mode="valid"), 0, rows)


def sdf_round_box(x: Array, y: Array, half: float, radius: float) -> Array:
    """Signed distance to a rounded square centred on the origin (negative inside)."""
    corner_x = np.abs(x) - (half - radius)
    corner_y = np.abs(y) - (half - radius)
    outside = np.hypot(np.maximum(corner_x, 0), np.maximum(corner_y, 0))
    inside = np.minimum(np.maximum(corner_x, corner_y), 0)
    return outside + inside - radius


def night_of(day_hex: str, day_face: str = "#2f302f", night_face: str = "#141615") -> str:
    """The night colour of a day colour: the same linear ratio the bezel face drops by."""
    ratio = srgb_to_linear(hex_rgb(night_face)) / srgb_to_linear(hex_rgb(day_face))
    rgb = linear_to_srgb(srgb_to_linear(hex_rgb(day_hex)) * ratio)
    return "#" + "".join(f"{round(channel * 255):02x}" for channel in rgb)


def to_overlay(base_srgb: Array, target_srgb: Array, inside: Array) -> tuple[Array, Array]:
    """An RGBA layer that, composited over `base`, gives `target`: black for shade, white for light."""
    base = base_srgb.mean(-1)
    target = target_srgb.mean(-1)
    darken = np.clip(1 - target / np.maximum(base, 1e-4), 0, 1)
    lighten = np.clip((target - base) / np.maximum(1 - base, 1e-4), 0, 1)
    colour = np.where((target >= base)[..., None], 1.0, 0.0) * np.ones(3)
    alpha = np.where(target >= base, lighten, darken) * inside
    return colour, alpha
