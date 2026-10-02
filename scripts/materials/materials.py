"""The three surface materials, built once at 1024² from the CC0 maps. Every map here is seamless.

- bezel paint: Metal029 powder-coat grain + sparse wear (chips and scratches) from PaintedMetal002
- cap: Plastic012A (smudged, slightly rubbery black plastic)
- knob: Metal027 fine powder coat (rougher, a touch bluer)
"""

from dataclasses import dataclass
from typing import Final

import numpy as np

from common import Array, blend_normals, decode_normal, load_map, smoothstep

N: Final[int] = 1024  # every material map is N × N


def periodic_noise(size: int, feature_px: float, seed: int) -> Array:
    """Seamless band-limited noise in 0..1 (FFT-filtered white noise wraps by construction)."""
    generator = np.random.default_rng(seed)
    white = generator.standard_normal((size, size))
    frequencies = np.fft.fftfreq(size)
    frequency_x, frequency_y = np.meshgrid(frequencies, frequencies)
    sigma = 1.0 / feature_px
    low_pass = np.exp(-(frequency_x**2 + frequency_y**2) / (2 * sigma**2))
    noise = np.real(np.fft.ifft2(np.fft.fft2(white) * low_pass))
    noise = (noise - noise.mean()) / noise.std()
    return 0.5 + 0.5 * np.tanh(noise * 0.8)


@dataclass(frozen=True, slots=True)
class Material:
    albedo: Array  # linear-ish relative albedo (mean ~0.5, gets colour-matched after shading)
    normal: Array
    roughness: Array
    wear: Array  # 0..1 where paint is worn through (used for f0 and tint)


def bezel_paint() -> Material:
    grain = load_map("Metal029", "Color").mean(-1)
    grain = grain / grain.mean()
    mottle = periodic_noise(N, 90, seed=3)
    smudge = periodic_noise(N, 40, seed=11)
    # Wear: PaintedMetal002's bare-metal mask, thinned out by a sparse low-frequency mask so it reads as light wear.
    bare = load_map("PaintedMetal002", "Metalness")
    keep = smoothstep(0.66, 0.85, periodic_noise(N, 110, seed=7))
    scratches = load_map("PaintedMetal002", "Opacity")
    scratch_keep = smoothstep(0.35, 0.7, periodic_noise(N, 150, seed=9))
    wear = np.clip(bare * keep * 0.6 + scratches * 0.25 * scratch_keep, 0, 1)
    # Faint horizontal wipe streaks, as on the DCS face: noise stretched along x (still periodic).
    streak = periodic_noise(N, 3, seed=13)
    streak = np.repeat(streak[:, :1], N, axis=1) * 0.5 + 0.5 * periodic_noise(N, 25, seed=17)
    fine = periodic_noise(N, 2.2, seed=19)  # the finest paint grain, about 1 DI
    scuff = smoothstep(0.6, 0.9, periodic_noise(N, 30, seed=23)) * smoothstep(
        0.5, 0.75, periodic_noise(N, 160, seed=29)
    )
    tone = (
        1.0
        + 0.55 * (grain - 1.0)
        + 0.20 * (fine - 0.5)
        + 0.08 * (mottle - 0.5)
        - 0.04 * (smudge - 0.5)
        + 0.07 * (streak - 0.5)
        + 0.07 * scuff
    )
    albedo = np.clip(tone, 0.6, 1.4)[..., None] * np.ones(3)
    # Worn paint shows a lighter, slightly warm primer/bare aluminium.
    worn_colour = np.array([1.75, 1.72, 1.62])
    albedo = albedo * (1 - wear[..., None] * 0.85) + worn_colour * wear[..., None] * 0.85
    # A faint warm grime in the low-frequency mottle (DCS shows amber finger grime).
    grime = smoothstep(0.55, 0.8, periodic_noise(N, 120, seed=21))
    albedo = albedo * (1 + grime[..., None] * np.array([0.05, 0.02, -0.04]))
    paint_normal = decode_normal(load_map("Metal029", "NormalGL"), strength=1.6)
    wear_normal = decode_normal(load_map("PaintedMetal002", "NormalGL"), strength=0.9)
    wear_weight = (wear * 0.8 + 0.1 * keep)[..., None]
    normal = blend_normals(paint_normal, wear_normal * wear_weight + np.array([0, 0, 1.0]) * (1 - wear_weight))
    roughness = load_map("Metal029", "Roughness")
    roughness = 0.40 + (roughness - roughness.mean()) * 0.8 + 0.05 * (smudge - 0.5) - 0.12 * wear
    return Material(albedo=albedo, normal=normal, roughness=roughness, wear=wear)


def cap_plastic() -> Material:
    colour = load_map("Plastic012A", "Color").mean(-1)
    colour = colour / colour.mean()
    smudge = periodic_noise(N, 60, seed=5)
    tone = 1.0 + 1.6 * (colour - 1.0) + 0.06 * (smudge - 0.5)
    albedo = tone[..., None] * np.ones(3)
    normal = decode_normal(load_map("Plastic012A", "NormalGL"), strength=0.7)
    roughness = load_map("Plastic012A", "Roughness")
    roughness = 0.52 + (roughness - roughness.mean()) * 1.5
    return Material(albedo=albedo, normal=normal, roughness=roughness, wear=np.zeros((N, N)))


def knob_coat() -> Material:
    colour = load_map("Metal027", "Color").mean(-1)
    colour = colour / colour.mean()
    albedo = (1.0 + 0.5 * (colour - 1.0))[..., None] * np.ones(3)
    normal = decode_normal(load_map("Metal027", "NormalGL"), strength=1.2)
    roughness = load_map("Metal027", "Roughness")
    roughness = 0.34 + (roughness - roughness.mean())
    return Material(albedo=albedo, normal=normal, roughness=roughness, wear=np.zeros((N, N)))
