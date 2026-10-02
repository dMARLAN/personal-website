# Research: `0x408/hornet-display`

- Repo: https://github.com/0x408/hornet-display (author "Mørkvitnir", github.com/morkvitnir)
- Commit analysed: `5d64918ccc7e78ef6daa9f265f8e9c2871f064d5` (2023-01-03, the last commit; 12 commits between 2022-12-19 and 2023-01-03)
- Local clone: `/tmp/claude-1000/-mnt-c-Users-Chad-PycharmProjects/231311e5-8de4-4471-b03d-93ca759bc8b0/scratchpad/hornet-display` (scratch, not kept)

## TL;DR

The repo is **not a DDI renderer**. It is a **font**, "Hornet Display" (Regular and Bold), that recreates the
stroke typeface drawn on the DCS World F/A-18C DDI/AMPCD. It has no app code, no bezel, OSBs, pages, colours,
glow, geometry or symbology data. Its value to us is the font, which is MIT licensed and well made. Its
character set is incomplete, though.

## 1. What it is and what it renders

| Item | Finding |
|---|---|
| Type | Font family: 2 weights x 3 formats (`.ttf`, `.woff`, `.woff2`) plus per-glyph source SVGs |
| Pages rendered | None. No HTML/JS/CSS. The README is three images. |
| Demo images | 3440x1440 PNGs linked from `README.md` (GitHub user-images): a logo, a glyph specimen, and an A/B comparison of a DCS **radar ATTK (RWS)** page screenshot ("ORIGINAL") against the same page re-typeset in Hornet Display Regular and Bold |
| Fidelity | The glyphs fit DCS's on a pixel grid. In the comparison image the re-typeset legends ("1B 1 SIL ERASE", "306°", "BRA 258°/18.5", "19600", "MODE 140° 2944 CHAN DATA") sit on the original glyph positions with the same advance width. |

Files:

```
README.md                       3 image links only
LICENSE                         MIT, (c) 2022 Mørkvitnir
HornetDisplay-Regular.{ttf,woff,woff2}   17264 / 5952 / 4132 bytes
HornetDisplay-Bold.{ttf,woff,woff2}      15784 / 5780 / 3980 bytes
svg/<glyph>-{Regular,Bold}.svg           106 files, filled outline paths, fill="#000"
```

woff2 SHA-256:
- Regular `703e043d2929f5dab384ca2e766c3c515e326817b199fa8f0d0ba6dd46c93b8c`
- Bold `8e3ddb71d70061336d5164898bf5e44d02718b601997ba7d076240dcf6921ad3`

## 2. Tech stack and rendering approach

The repo has no runtime and no build scripts. The glyphs were drawn as SVG outlines on an integer pixel grid
(the paths look like Inkscape output) and then compiled to TrueType. The `name` ID 3 string contains `FL801`,
which suggests FontLab 8. The TTFs include `fpgm`/`prep`/`cvt ` (hinting) and `gasp` = `{65535: 15}`
(grid-fit plus smoothing at all sizes), plus `DSIG` and `GDEF`. They have no `kern` or `GPOS` table.

## 3. Bezel, OSBs, legends, boxing and fonts

- **Bezel and OSBs:** none in the repo.
- **Boxing:** none. In the comparison image the boxed "NCTR" is drawn separately. The font has no box glyphs.
- **Vertical legends** (S/U/R/F, R/S/E/T, N/C/T/R): in DCS these are single characters stacked vertically.
  The font only provides the glyphs, so we must do the stacking in layout.
- **Font: yes, it ships one.** Details:

| Metric | Value (units, UPM = 1000) | Design-grid px (cap = 21 px) |
|---|---|---|
| Family / styles | `Hornet Display` Regular (wght 400) and Bold (700) | |
| Monospaced | `post.isFixedPitch = 1`, PANOSE proportion = 9 | |
| Advance (every glyph) | **550** (0.55 em); `.notdef` 0, `.null` 250 | **16.5 px** pitch |
| Cap height (all glyphs) | **700** (0.70 em) | 21 px |
| x-height field | 500 (not meaningful, because lowercase is identical to uppercase) | |
| Ascender / descender / lineGap (hhea and typo) | 850 / -100 / 100 → natural line height 1.05 em | |
| usWinAscent / usWinDescent | 850 / 100 | |
| Font bbox | Regular 0,-100 → 550,783; Bold 0,-100 → 550,768 | |
| Stroke width | Regular ≈ 33 (1/21 cap); Bold ≈ 67 (2/21 cap) | 1 px / 2 px |
| Corner style | 45° chamfers, ≈ 3/21 cap | 3 px |
| Example: `A` ink | Regular x 58–492; Bold x 42–508 | 13 px / 14 px wide |
| Example: `I` ink | x 142–408 | 8 px |
| `OS/2.fsType` | **4** (Preview & Print embedding restriction; see the licence section) | |

**Character set (82 mapped code points, identical in both weights):**

```
space " % ' ( ) * + , - . / 0-9 : = ? A-Z \ _ a-z °
```

- Lowercase `a-z` are separate glyphs whose outlines are **byte-identical to uppercase**, so mixed-case text
  renders as uppercase, as the DDI does.
- **Missing** (verified against the cmap): `; < > [ ] # ! & @ ^ | ~ $` and the arrows `↑ ↓ ← →`. The README
  specimen shows a `;`, but the shipped fonts do not map one. The arrows in the comparison image (RDR elevation
  ↑/↓, the "←" caret) were drawn as separate graphics. DCS pages need several of these (arrows, `<`/`>`
  carets, `|`), so we need SVG symbols or added glyphs for them.

## 4. Colours and glow

The repo defines **no colours or glow values** (the SVGs use `fill="#000"`). Values sampled from the README
images (PNG pixels, so approximate):

| Source | RGB |
|---|---|
| Specimen and mock-up green (the author's chosen colour, not DCS) | `#25AE00` (37,174,0) |
| DCS "ORIGINAL" screenshot: most common stroke pixel | `#1E8C00` (30,140,0) |
| DCS screenshot: other common stroke pixels | `#1F9000` (31,144,0), `#229D00` (34,157,0) |
| DCS screenshot: brightest pixel | `#2FDD00` (47,221,0) |
| DCS screenshot: anti-aliased fringe | `#0D3D00`, `#104A00` |
| Background | `#000000` |

All the DCS samples have B = 0 and R/G ≈ 0.21, a hue of about 108°. The DCS screenshot shows **little or no
bloom** at that brightness: strokes are about 1 to 1.5 px with a narrow anti-aliased fringe. For our glow we
should use a subtle 1 to 2 px blur and not a wide neon halo. Get exact DCS brightness and gamma values from
another source, such as the DCS `Mods/aircraft/FA-18C/Cockpit/Scripts/MDI` Lua material definitions.

## 5. Geometry constants

The repo contains no DDI geometry: no aspect ratio, OSB spacing or display area. The only geometry is the font
grid:
- Character cell 16.5 x 21 px (cap) at DCS's native resolution of that screenshot. This works out to
  **pitch = 0.55 x font-size** and **cap height = 0.70 x font-size**.
- So to put N characters per line across a display W px wide: `font-size = W / (N x 0.55)`.
- The comparison image crops the DCS display to about 596 x 603 display-px (≈1:1.01) at 2000-px preview scale.
  This is a cropped screenshot, so it is **not** a reliable source for the DDI aspect ratio.

## 6. Assets

- 2 font families x 3 formats (above).
- 106 SVG glyph outlines: `svg/<name>-Regular.svg` / `svg/<name>-Bold.svg`. Most viewBoxes are `0 0 13 21`
  (Regular) or about 12.5–14 x 21. The degree sign is `0 0 9 9`, and `.` is `0 0 4 4`. These are filled
  outlines, not centre-line strokes.
- **No** STORES planforms, symbology, bezel art, page data or images (the README images are hosted off-repo).

## 7. Source data and citations

The repo cites nothing: no NATOPS reference, no DCS export, and no notes. The comparison image labelled
"ORIGINAL" is a DCS World F/A-18C screenshot (RWS radar page). The glyphs were almost certainly traced from DCS
screenshots on an integer pixel grid.

## 8. Licence and what we can reuse

- `LICENSE`: **MIT, Copyright (c) 2022 Mørkvitnir**. We may use, modify and redistribute the font, including
  self-hosting it as a web font and subsetting or extending it. We must keep the copyright and licence notice,
  for example in `public/fonts/HornetDisplay-LICENSE.txt` and on a credits page.
- The font files have **no** `name` ID 0 (copyright) or ID 13/14 (licence) record, so the LICENSE file must
  travel with them.
- `OS/2.fsType = 4` ("Preview & Print") contradicts the MIT grant. Browsers ignore fsType for `@font-face`, so
  it does not affect web use. If we modify the font, we may set it to `0`, because MIT permits modification.
- **IP caveat:** the design imitates ED's DCS rendering of the real aircraft symbology. Typeface designs are
  generally not copyrightable in the US, and this is an independent redraw, so the risk is low for a personal
  site. We should still credit DCS/ED as the visual reference and not use ED trademarks or logos.

## 9. Code quality, ideas to copy and what to do better

Copy:
- Strict monospace at 0.55 em with a 0.70 em cap height, uppercase-only behaviour, and chamfered 1-px/2-px
  strokes. These match DCS closely.
- The Regular/Bold pair. DCS uses the heavier stroke for some legends and highlighted text, so the comparison
  image shows how each looks against the original.
- `woff2` files of about 4 KB each are tiny, so we can preload both.

Do better:
- **Add the missing glyphs** (`; < > [ ] | #` and the arrows ↑↓←→, and possibly a filled triangle and a
  diamond) in the same grid style. Add them with fontTools to a forked copy, or render them as inline SVG
  symbols sized to the same 16.5 x 21 cell.
- Write our own constants for the bezel, OSB pitch and display area from DCS cockpit files or NATOPS, because
  this repo has none.
- Set `font-variant-ligatures: none`, `font-kerning: none` and `text-transform: uppercase`, and keep the
  font's own spacing (no `letter-spacing`).
- Snap the font size so that `0.55 x size` is close to an integer device pixel. This keeps the 1-px strokes
  crisp, which is what the hinting and grid were designed for.

## 10. Accuracy against the DCS Hornet DDI

- **Glyph shapes and advance widths: high.** The A/B overlay on a real DCS RWS page matches glyph for glyph in
  position and width. Regular is slightly thinner than the DCS screenshot. Bold is slightly heavier but closer
  in apparent weight at that brightness. Choose between them after testing, or apply a 0.5-px stroke/blur to
  Regular.
- **Coverage: incomplete** for DCS pages (no arrows, `<`/`>`, `;`, `|`, `[]`, `#`).
- **Everything else** (layout, colour, glow, symbology): not addressed by the repo.

## 11. Build and run

There is nothing to build. The fonts were inspected with fontTools 4.66.1 in a scratch venv. I rendered a
specimen with Pillow (green on black) to confirm that both weights render correctly: uppercase, digits,
symbols, and strings such as "STORES FCS BIT HSI SA CHKLST FUEL 10800".

## Recommendation

1. Vendor `HornetDisplay-Regular.woff2` and `HornetDisplay-Bold.woff2` into the site with `next/font/local`
   (weights 400/700, `display: block` to avoid FOUT on the DDI), together with the MIT LICENSE text. Pin them to
   commit `5d64918`.
2. Use them for **all DDI text**. Derive the type scale from `pitch = 0.55em` and `cap = 0.70em`.
3. Optionally fork the TTF with fontTools to add the missing glyphs and set `fsType = 0`. Until then, draw the
   arrows and carets as SVG.
4. Source the bezel, OSB geometry, colours and glow from DCS cockpit Lua files or NATOPS in a separate research
   task. This repo provides none of them.
