# DCS F/A-18C DDI foundations, from the cockpit Lua

Ground truth: DCS World install, `Mods/aircraft/FA-18C/Cockpit/` (abbreviated below as `FA18/`) and the shared
`Scripts/Aircrafts/_Common/Cockpit/` (`LockOn_Options.common_script_path`, abbreviated as `COMMON/`). Nothing under
`/mnt/f` was modified. Unless noted otherwise, paths under `MDG/` mean
`FA18/Scripts/Multipurpose_Display_Group/`.

Tags used below:
- **[C++]**: the behaviour belongs to a named engine class or controller. Lua only names it.
- **[INFERRED]**: derived from the data. No source line states it.

The extraction scripts are in the session scratchpad (`.../scratchpad/dcs-foundations/`). See section 9.

---

## 0. Key constants at a glance

| Item | Value | Source |
|---|---|---|
| Display unit | **DI (Display Increment)** = 0.0048 in = 0.12192 mm | `MDG/Common/indicator/MDG_units.lua` |
| Symbology area | **1024 x 1024 DI** (±512), origin at the centre, **+y up** | `MDG_units.lua`, `MPD_base.lua` |
| Symbology area, physical | 4.9152 in = 124.85 mm square | derived |
| MDI glass/mask outline | ±544.8 DI (x), ±544.4 DI (y) = 132.8 mm square, corner radius ≈ 174 DI (21.2 mm) | `MDI_specifics.lua` |
| AMPCD glass/mask outline | ±540.5 DI (x) by ±529.0 DI (y) = 131.8 x 129.0 mm, small corner chamfers | `AMPCD_specifics.lua` |
| Aspect | MDI 1:1 (1.0007). AMPCD 1.022:1 (the bake uses `aspect_adjustment = 0.97`) | derived |
| MDI/AMPCD green | **RGBA {30, 140, 0, 255} = `#1E8C00`** | `FA18/Scripts/materials.lua` |
| Background | `MPD_BACKGROUND` {0,0,0,255} in exported/HUD-only views. In the cockpit the black level is the screen texture, ≈ `#1a2218` with a vignette to `#151915` | `materials.lua`, `f18c_mdi_l.dds` |
| NIGHT gain | ×0.126 MDI / ×0.085 AMPCD (cockpit), ×0.9 (exported). DAY ×1.0 | `BAKE/*_bake_init.lua` |
| Stroke shader | thickness **0.8**, fuzziness **0.5**, specular pass **on** | `MDG_strokesDefs.lua`, `MDI_init.lua` |
| Font cell (100 %) | **12 x 20 DI**, interchar 4, interline 5 | `Common_page_defs.lua` |
| OSB legend font (120 %) | **14 x 24 DI**, interchar 6, interline 6 | `MPD_page_defs.lua` |
| OSB anchors | side columns at x = ±500. Top/bottom rows at y = ±500. Row x = −336 + 169k; column y = 307 − 167k | `Common/indicator/MPD_PB_defs.lua` |
| Glyph geometry | **Exact vector paths exist**: `FA18/IndicationResources/MDG/stroke_font.svg` (1 SVG px = 1 DI) | section 3 |

---

## 1. Coordinate system and units

### 1.1 DI and the scale chain

```lua
-- MDG/Common/indicator/MDG_units.lua
MeterToIn = 39.3701 / 1.00000054
UnitsPerSide = 1024
HalfUnitsPerSide = UnitsPerSide / 2
local DItoMil_ = 0.34          -- (angular, HUD use)
local DItoIn_  = 0.0048
-- MDG/Common/indicator/Pages/MPD/MPD_scales.lua
DItoScreenUnits = DItoIn()
SetScale(METERS)
SetCustomScale(GetScale() * (1 / MeterToIn) * DItoScreenUnits) -- Display Increments
```

- All page Lua coordinates are therefore **in DI**. The origin is the display centre, **x is right and y is up**:
  the MENU title sits at y = −446 (bottom), and the PB6–10 legends sit at y = +500 (top). Rotations
  (`init_rot`) are in degrees, counter-clockwise from up.
- 1 m = 8202.1 DI and 1 mm = 8.2021 DI. The comment says "DI is the minimum possible stroke ray position
  increment".
- Font sizes in `stringdefs` are multiplied by `GetScale()` because they are given in absolute units. Element
  positions are not.
- For the web: use an SVG `viewBox="-544.8 -544.8 1089.6 1089.6"`, or `-512 -512 1024 1024` for the symbology
  rectangle only, and flip y (`svg_y = -dcs_y`).

### 1.2 Display extent and masking (`MDG/Common/indicator/Pages/MPD/MPD_base.lua`)

The drawable area is the **intersection** of two stencil masks:
1. **Total Display Area**: `displayBorderVerts`, a rounded-corner convex polygon taken from the 3D model in metres.
   The specifics files give the right half only, and it is mirrored about Y (`IndicatorBorderTools.lua`). It is
   rescaled by `MeterToIn * ScreenUnitsToDI`. Material `MPD_BACKGROUND` (black). It is a visible black fill only
   in the HUD-only/exported view, and an invisible mask in the cockpit view.
2. **Symbology Display Rectangle**: an invisible 1024 x 1024 DI square (±`HalfUnitsPerSide`).

The comment says the square is "slightly tighter than the total display area, except its corners". The MDI corner
arc (centre ≈ (370, 371) DI, r ≈ 174 DI) clips the square's corners from about (512, 471) to (471, 512).

MDI border vertices (right half, metres, `MDG/MDI_IP1556A/indicator/MDI_specifics.lua`): x reaches 0.06642 and
y reaches ±0.06637. The straight side runs from y = +0.04199 to −0.04240, a slight asymmetry. In DI the extremes
are x ±544.8 and y ±544.4. The full mirrored list in DI is printed by `compute_geometry.py`.

AMPCD border (`MDG/AMPCD/indicator/AMPCD_specifics.lua`): {0.0640,0.0645} {0.0648,0.0641} {0.0656,0.0633}
{0.0659,0.0625} {0.0659,−0.0625} {0.0655,−0.0634} {0.0648,−0.0641} {0.0649,−0.0645}. That is ±540.5 x ±529.0 DI
with tiny chamfered corners.

Stencil "levels" (`MDG_init_DEFAULT_LEVEL`) are 6 for LMDI, 10 for RMDI and 14 for AMPCD
(`MDI_left_init.lua`, `MDI_right_init.lua`, `AMPCD_init.lua`). They only keep the displays' clipping independent.

### 1.3 Physical size

- The 1024 DI symbology square is **4.915 in (124.9 mm)**. The MDI bezel opening/glass from the 3D model is
  **132.8 mm (5.23 in) square**.
- No other physical size is stated in Lua.

### 1.4 Indicator init and viewports

- `MDI_init.lua` and `AMPCD_init.lua` set `indicator_type = indicator_types.COMMON`. With `bakeIndicators = true`
  (the shipped value in `FA18/Scripts/config.lua`), the only purpose is `render_purpose.BAKE`. The indicator renders
  to an offscreen texture (section 4). `BasePage = MPD_base.lua` and `IndicatorSpecificPage = CautAdvAndMenuPage.lua`.
- The engine classes are `F18::ccMPD_F18` (MDIs) and `F18::ccAMPCD_F18`, with devices `F18::avMDI_IP1556A_F18` and
  `F18::avAMPCD_F18` (`FA18/Scripts/device_init.lua`) **[C++]**.
- Exported viewports are square:
  - MDIs: `update_screenspace_diplacement(1, is_left, 0)` then `try_find_assigned_viewport("LEFT_MFCD"/"RIGHT_MFCD")`.
  - AMPCD: `size = min(0.5*h, 0.5*w)`, bottom-centre, `"CENTER_MFCD"`.
  - Source: `COMMON/ViewportHandling.lua`. Aspect 1 means a square viewport.
- `MDI_init.lua` sets `used_render_mask = .../IndicationResources/MDG/flir_texture.dds`. Its comment reads
  "green shade for render_target_X". This tints video (FLIR) feeds.

---

## 2. Colours

### 2.1 Materials (`FA18/Scripts/materials.lua`)

| Material | RGBA | Use |
|---|---|---|
| `LMDI_SYMBOLOGY_MATERIAL`, `RMDI_…`, `AMPCD_SYMBOLOGY_MATERIAL` | **{30, 140, 0, 255}** `#1E8C00` | all MDI/AMPCD green strokes. The comment says "MDI original". The earlier value {94,202,0} and tests {57,224,32} and {69,224,45} are commented out |
| `LMDI_FONT_MATERIAL` etc. (font entries) | same green, via `{fontdescription["font_stroke_MDG"], 10, green}` | stroke text |
| `HUD_SYMBOLOGY_MATERIAL`, `HMD_SYMBOLOGY_MATERIAL` | {1, 255, 2, 255} | HUD/HMD (not DDI) |
| `MPD_BACKGROUND` | {0, 0, 0, 255} | display area fill (HUD-only view), the bake background |
| `BLACK`, `MPD_DMC_OUTLINE`, `font_MPD_DMC_outline` | {0, 0, 0, 255} | black outlines behind symbology on map pages (AMPCD HSI/SA); AMPCD BRT/CONT backgrounds |
| `MDI_HALF` | {5, 28, 0, 255} | dim green (only `RDR_defs.lua`, half segmented arc) |
| `font_MPD_DMC_main` | AMPCD green | "DMC" (map overlay) text |
| `MASK_MATERIAL_PURPLE` {255,0,255,30}, `_PURPLE_2` {255,0,255,100}, `MASK_MATERIAL_2` {0,255,255,30} | debug colours of invisible masks (`show_masks = false`) | never visible |
| `INDICATION_COMMON_RED` {255,0,0,255}, `_WHITE` {255,255,255,255}, `_GREEN` {0,255,0,255}, `_AMBER` {255,161,45,255} | generic / TGP / RWR textures | |
| `MAV_COLOR_0/1` green, `MAV_COLOR_2` white; `TGP_STBY_BLACK` {0,0,0}, `TGP_STBY_DGRAY` {5,5,5} | weapon video | |
| `RWR_STROKE` {0,255,0,**350**} | RWR (alpha > 255 overdrives) | not DDI |

**Red and yellow are not materials.** The comment reads: "Only green colors are described here. Red and yellow
will be set via dedicated controllers". The reference values exist only as comments (MIL-C-25050 CIE xy converted
to RGB):

```lua
-- red    {255, 93, 0, 255}  -- X 0.633, Y 0.366
-- green (per documents) {204, 255, 0, 255} -- X 0.396, Y 0.597
-- yellow {255, 225, 0, 255} -- X 0.513, Y 0.483
-- HOWEVER it does not work well, and some colors were replaced with custom ones, picked from color-balanced photos.
```

The runtime colour switching is done by C++ controllers. Examples: `MPD_MSI_FF_Color`, `MPD_RDR_TWS_Color`,
`MPD_RDR_EADI_SetYellowColor`, `MPD_SA_SetYellowColor`, `MPD_SA_EW_Color`, `MPD_HSI_GRID_SetYellowColor` and
`MPD_RDR_GreyScaleColor` **[C++]**. The exact red and yellow RGB at runtime are therefore not in Lua. Use the
commented values as the best available, and check them against screenshots.

**AMPCD colours:** the AMPCD symbology and font materials are the same {30,140,0} green. Its colour content (the
moving map and the chart) comes from render targets: `render_target_N` `ceTexPoly` with `input_space_SRGB = true`
and additive alpha (`AddVideoSignalRender_MPD_FullScreen` in `MPD_page_defs.lua`). Over the map, symbology is drawn
twice (`*_outlined.lua`, then `*_DMC.lua`), as a black outline under green strokes.

The `#1E8C00` material exactly matches the "most common stroke pixel" sampled from a DCS screenshot in
`hornet-display.md`. This confirms that the material is drawn at about unit gain in day mode.

### 2.2 Brightness, contrast, OFF/NIGHT/DAY: what is and is not in Lua

**Summary.** The Lua defines the controls, the NIGHT/DAY gain constants and the OFF page. It does **not** define
how the BRT or CONT knob positions map to output, what CONT does, or any power-on timing. Those live in
`avMDI_IP1556A_F18`, `avAMPCD_F18` and `ccMDG_IndicatorBake_F18` **[C++]**.

**Controls** (`FA18/Scripts/clickabledata.lua`, `command_defs.lua`, `clickable_defs.lua`):

| Control | Arg (L / R) | Type and range | Command |
|---|---|---|---|
| MDI OFF/NIGHT/DAY selector | 51 / 76 | `default_3_position_tumb`, step 0.1, limits {0, 0.2}: **0 = OFF, 0.1 = NIGHT, 0.2 = DAY** | `MDI_off_night_day` (+ `_ITER`) |
| MDI BRT knob | 52 / 77 | `default_axis_limited`, 0..1, gain 0.1 per detent/wheel step | `MDI_brightness` (+ `_ITER`, `_AXIS`) |
| MDI CONT knob | 53 / 78 | `default_axis_limited`, 0..1, gain 0.1 | `MDI_contrast` (+ `_ITER`, `_AXIS`) |
| AMPCD OFF/BRT knob | 203 | axis 0..1 (0 = off) | `AMPCD_off_brightness` (+ `_ITER`, `_AXIS`) |
| AMPCD NGT/DAY rocker | 177 | 2 momentary buttons | `AMPCD_nite_day_NGT` / `_DAY` |
| AMPCD SYM, CONT, GAIN rockers | 179, 182, 180 | momentary up/down (relative) | `AMPCD_symbology_*`, `AMPCD_contrast_*`, `AMPCD_gain_*` |

- Autostart (`Macro_sequencies.lua`) sets both MDIs to **0.2 (DAY)** and the AMPCD knob to **0.85**. It does not
  touch BRT or CONT, so their power-up values are engine defaults **[C++]**.
- No Lua script reads these args or converts them into a colour or alpha. `mainpanel_init.lua` has no MDI
  brightness gauge.

**What the Lua does define:**

1. **OFF.** `Common_init.lua` defines `pages[PAGE_NONE] = {}` with the comment `-- Indicator if OFF`. It contains
   **no subsets**, so no mask, no black fill and no symbology is drawn. What remains visible is the unlit 3D
   screen and cover glass (section 4.2). Lua defines **no fade-out or fade-in**. Whether switching to OFF is
   instant is C++, but nothing in Lua animates it.
2. **Power-on.** `PAGE_STANDBY` = mask + `"STANDBY"` (200 % font, 24 x 40 DI, centred at 0,0) gated by
   `{"StandbyFlash"}` **[C++]**. When it is shown (during warm-up, or while the mission computer is not ready),
   how long it lasts and the flash rate are all C++. The device update rate is `device_timer_dt = 0.05` (20 Hz,
   `MDI_left.lua`). The Lua has **no warm-up ramp, phosphor fade or brightness transition**.
3. **NIGHT vs DAY = a luminance scale only, with the same palette.**
   - There is no night material, no night font and no colour table per mode. The materials in section 2.1 are
     mode-independent.
   - The bake compositor multiplies the baked display by a per-view constant
     (`MDG/Common/indicator/BAKE/MPD_common_bake_init.lua`; the AMPCD overrides are in `AMPCD_bake_init.lua`):

| Constant | MDI | AMPCD | Meaning |
|---|---|---|---|
| `brightness_scale_gen_purp_day` | 1.0 (a commented-out `--1.5`) | 1.0 | cockpit (GENERAL render purpose), DAY |
| `brightness_scale_gen_purp_nite` | **0.126** | **0.085** | cockpit, NIGHT: about 1/8 and 1/12 |
| `brightness_scale_nongen_purp_day` | 1.0 | 1.0 | HUD-only view / exported viewport, DAY |
| `brightness_scale_nongen_purp_nite` | **0.9** | **0.9** | exported, NIGHT: almost no dimming, so it stays readable on a monitor |

   **[INFERRED]** BRT (and AMPCD BRT) then scales within that mode's range. The curve is C++.
4. **Brightness acts on symbology opacity and gain, not on the background.**
   - In the non-bake path, `opacity_sensitive_materials` lists exactly the materials whose opacity follows
     brightness: the per-display font and symbology materials, plus `MPD_DMC_OUTLINE`, `font_MPD_DMC_outline` and
     `font_MPD_DMC_main` on the AMPCD. See `MDI_left_init.lua` and `AMPCD_init.lua`.
   - `MPD_BACKGROUND` (black) is **not** in that list. In the cockpit view the display-area polygon is only an
     invisible mask anyway (`MPD_base.lua`).
   - So **black stays the unlit screen texture whatever BRT is set to**, and the green rises from it additively.
   - On the AMPCD the black map outlines fade together with the green. Turning BRT down does not leave black
     outlines behind.
   - In the shipped bake path the same effect is achieved by scaling the additive baked texture.
5. **AMPCD on-screen readout** (`MDG/AMPCD/indicator/AMPCD_brightness_contrast.lua`) is appended to every AMPCD
   page:
   - It shows `AUTO` (optional) and a `%d` integer in the 200 % font.
   - Each sits over an opaque `BLACK` box: half-height 20 + 15 = 35 DI, with a 15 DI border.
   - The number is right-aligned at x = +66 and `AUTO` is right-aligned at x = −6.
   - The box spans x −153..+81 with AUTO, and x +27..+81 without.
   - It is controlled by `AMPCD_brightnessContrastShow` (when it is visible, presumably while a rocker is
     pressed), `AMPCD_brightnessContrastIsAuto` and `AMPCD_brightnessContrastValue` **[C++]**.
   - The numeric range, and which control it reflects (BRT, CONT, SYM or GAIN), are C++.
   - The MDIs have **no** equivalent readout in Lua.
6. **CONT, SYM and GAIN.**
   - The Lua is **silent** on CONT, apart from the command names.
   - No contrast curve, gamma or black-level lift appears anywhere.
   - On the AMPCD, SYM and GAIN are presumably symbology-vs-video balance and video gain for the map or sensor
     render targets. That is inferred from the names only.
   - Any implementation of CONT is our own design and not DCS data. A defensible choice is a
     gamma/contrast curve on the green intensity that leaves black at the screen-texture level.
7. **Runtime stroke parameters.** `shaderLineParamsUpdatable = true` in `MDI_init.lua` and `AMPCD_init.lua`
   allows the engine to change line thickness and fuzziness at runtime. No Lua ties them to BRT, so treat them as
   constant (0.8 / 0.5).
8. `config.lua` sets `args_initial_state[524/525] = MDI_greenness`. It is 0, or 1.0 only when
   `bakeToCockpitTexture`. This 3D-model argument most likely drives the `f18c_mdi_l_additive` screen layer
   **[INFERRED]**. It is not a brightness control.

**Web mapping consistent with this.** Let `out = green_rgb * mode_scale * f(BRT)`, composited additively over the
fixed screen-base colour. `mode_scale` is 1.0 for DAY and 0.126 for NIGHT (cockpit look), or 0.9 for an
"exported display" look. `f` is a monotonic curve of our choice from 0 to 1. OFF renders nothing over the glass.
CONT, the warm-up and any fade are our own additions, and are not DCS behaviour.

---

## 3. The stroke font

### 3.1 Definition chain

```lua
-- FA18/Scripts/fonts.lua
fontdescription["font_stroke_MDG"] = {
  class = "ceSLineFont", symb_storage = "stroke_font",
  thickness = stroke_thickness, fuzziness = stroke_fuzziness,
  default = {12, 20}, -- F/A-18 MDG DIs (display increments)
  chars = { [1] = {latin['A'], "A"}, ... [55] = {symbol['^'], "symbol-lambda"} } }
-- materials.lua
symbologyPaths = {LockOn_Options.script_path.."../IndicationResources/MDG", ...}
```

`symb_storage = "stroke_font"` resolves to **`FA18/IndicationResources/MDG/stroke_font.svg`**. The comment in
`symbology_defs.lua` says "Stroke text with glyphs described in a .svg file". Each glyph is an SVG element whose
`id` is the name in `chars` (for example `A`, `0`, `symbol-minus`). The shared `COMMON/Fonts/fonts_cmn.lua` and
`symbols_locale.lua` only provide the `latin[...]`/`symbol[...]` code-point tables. They contain no geometry. The
other stroke sets are `stroke_symbols_MDI_AMPCD.svg` (64 symbols, for example `124-arrow-up` and `075-arrow-up`,
used for the OSB arrows) and `stroke_symbols_HUD.svg`.

### 3.2 Can exact glyph paths be reconstructed? **Yes.**

- In `stroke_font.svg` (viewBox 0 0 21000 29700 on a 744.09 px page, so 28.222 units = 1 px), **1 px = 1 DI**:
  - `A` is exactly 12 x 20 px.
  - Chamfers are 3 px.
  - The Inkscape grid/guides are on a 3-px module.
- Glyphs are authored in a grid of cells: x0 = 282.222 + 564.444·col (20 DI pitch), y0 = 348.889 + 846.667·row
  (30 DI pitch). Each cell is 12 x 20 DI at (x0, y0).
  - **[INFERRED]** anchoring: the C++ `ceSLineFont` loader is not visible. However, all 36 alphanumerics land at
    exactly 0..12 x 0..20 in their cell. `-` lands at y = 10, `_` at y = 19.5 and `.` centred at (5, 18), so
    the grid anchoring is consistent.
- The strokes are 1-px-wide centrelines (the stroke width in the SVG is irrelevant). Paths are straight
  polylines. The round marks (`.`, `:`, `°`, `%`, the `?` dot) are Bézier circles.
- Character set (55): `A–Z 0–9 - + ' ( ) * % , ° . / \ " ? : # = _ ^`.
  - `^` is mapped to `symbol-lambda` and draws a "v" in the lower half.
  - There is no space glyph; spaces are advance only.
  - There is no lowercase, no `< > [ ] ; ! & @ |` and no arrows. Arrows are symbols from
    `stroke_symbols_MDI_AMPCD.svg`.
- Anomalies to check visually:
  - `/` spans (−2,−3)→(14,23), wider and taller than its cell.
  - `#` is a legacy Corel import about 22 DI wide.
  - The `*-alt` ids in the file (`V-alt`, `W-alt`, `7-alt`, `4-alt1/2`, `1-alt`, `5-alt`, `K-alt`, `M-alt`,
    `symbol-slash-alt`, `symbol-colon-alt`) are **not** referenced by `fonts.lua`.

Full extracted path table (DI, origin at the cell's top-left, **y down**: ready for SVG `<path d>` or font
generation, flip y for DCS space):

| Char | SVG id | Path |
|---|---|---|
| `A` | A | `M0,20 L0,3 L3,0 L9,0 L12,3 L12,20 M0,10 L12,10` |
| `B` | B | `M12,3 L9,0 L0,0 L0,20 L9,20 L12,17 L12,13 L9,10 L12,7 L12,3 M9,10 L0,10` |
| `C` | C | `M12,3 L9,0 L3,0 L0,3 L0,17 L3,20 L9,20 L12,17` |
| `D` | D | `M12,3 L9,0 L0,0 L0,20 L9,20 L12,17 L12,3` |
| `E` | E | `M12,0 L0,0 L0,20 L12,20 M10,10 L0,10` |
| `F` | F | `M12,0 L0,0 L0,20 M10,10 L0,10` |
| `G` | G | `M12,3 L9,0 L3,0 L0,3 L0,17 L3,20 L9,20 L12,17 L12,10 L7,10` |
| `H` | H | `M0,0 L0,20 M12,0 L12,20 M0,10 L12,10` |
| `I` | I | `M2,0 L10,0 M2,20 L10,20 M6,0 L6,20` |
| `J` | J | `M4,0 L12,0 M8,0 L8,17 L5,20 L3,20 L0,17` |
| `K` | K | `M0,0 L0,20 M12,0 L0,12 M12,20 L2,10` |
| `L` | L | `M0,0 L0,20 L12,20` |
| `M` | M | `M0,20 L0,0 L6,20 L12,0 L12,20` |
| `N` | N | `M0,20 L0,0 L12,20 L12,0` |
| `O` | O | `M3,0 L0,3 L0,17 L3,20 L9,20 L12,17 L12,3 L9,0 L3,0` (identical to `0`) |
| `P` | P | `M0,20 L0,0 L9,0 L12,3 L12,7 L9,10 L0,10` |
| `Q` | Q | `M3,0 L0,3 L0,17 L3,20 L9,20 L12,17 L12,3 L9,0 L3,0 M7,15 L12,20` |
| `R` | R | `M0,20 L0,0 L9,0 L12,3 L12,7 L9,10 L0,10 M12,20 L5,10` |
| `S` | S | `M12,3 L9,0 L3,0 L0,3 L0,7 L3,10 L9,10 L12,13 L12,17 L9,20 L3,20 L0,17` |
| `T` | T | `M0,0 L12,0 M6,20 L6,0` |
| `U` | U | `M0,0 L0,17 L3,20 L9,20 L12,17 L12,0` |
| `V` | V | `M0,0 L6,20 L12,0` |
| `W` | W | `M0,0 L3,20 L6,0 L9,20 L12,0` |
| `X` | X | `M0,0 L12,20 M12,0 L0,20` |
| `Y` | Y | `M0,0 L6,10 L12,0 M6,10 L6,20` |
| `Z` | Z | `M0,0 L12,0 L0,20 L12,20` |
| `0` | 0 | `M3,0 L0,3 L0,17 L3,20 L9,20 L12,17 L12,3 L9,0 L3,0` |
| `1` | 1 | `M3,3 L6,0 L6,20 M2,20 L10,20` |
| `2` | 2 | `M0,3 L3,0 L9,0 L12,3 L12,7 L0,20 L12,20` |
| `3` | 3 | `M0,3 L3,0 L9,0 L12,3 L12,7 L9,10 L12,13 L12,17 L9,20 L3,20 L0,17 M4,10 L9,10` |
| `4` | 4 | `M9,0 L9,20 M12,13 L0,13 L3,2` |
| `5` | 5 | `M0,17 L3,20 L9,20 L12,17 L12,11 L9,8 L0,8 L0,0 L12,0` |
| `6` | 6 | `M12,3 L9,0 L3,0 L0,3 L0,17 L3,20 L9,20 L12,17 L12,13 L9,10 L3,10 L0,13` |
| `7` | 7 | `M0,0 L12,0 L6,20` |
| `8` | 8 | `M3,0 L0,3 L0,7 L3,10 L0,13 L0,17 L3,20 L9,20 L12,17 L12,13 L9,10 L12,7 L12,3 L9,0 L3,0 M3,10 L9,10` |
| `9` | 9 | `M0,17 L3,20 L9,20 L12,17 L12,3 L9,0 L3,0 L0,3 L0,7 L3,10 L9,10 L12,7` |
| `'` | symbol-apostrophe | `M7,0 L4,7` |
| `"` | symbol-quote | `M9,0 L6,8 M6,0 L3,8` |
| `(` | symbol-parenthesis-left | `M9,0 L4,5 L4,15 L9,20` |
| `)` | symbol-parenthesis-right | `M3,0 L8,5 L8,15 L3,20` |
| `*` | symbol-asterisk | `M0.5,10 L11.5,10 M3.25,14.76 L8.74,5.23 M8.76,14.76 L3.25,5.23` |
| `+` | symbol-plus | `M0.5,10 L11.5,10 M6,16.5 L6,3.5` |
| `,` | symbol-comma | `M6,16 L3,24` |
| `-` | symbol-minus | `M0.5,10 L11.5,10` |
| `.` | symbol-period | circle (5, 18) r 1.5 |
| `/` | symbol-slash | `M14,-3 L-2,23` |
| `\` | symbol-backslash | `M3,0 L9,20` |
| `:` | symbol-colon | circles (6, 6) and (6, 14) r 1.5 |
| `=` | symbol-equal | `M0.53,7.51 L11.54,7.51 M0.53,12.51 L11.54,12.51` |
| `?` | symbol-question | `M1,3 L4,0 L8,0 L11,3 L11,7 L6,13 L6,16` + circle (6, 19.06) r 1.0 |
| `_` | symbol-underscore | `M0.5,19.5 L11.5,19.5` |
| `%` | symbol-percent | `M12,0 L0,20` + circles (3, 3) and (9, 17) r 2.5 |
| `°` | symbol-degree | circle (5.05, 3.52) r 3.45 |
| `#` | symbol-octothorpe | `M5.54,0.59 L-2.61,19.42 M13.7,0.59 L5.54,19.42 M-2.33,6.25 L16.68,6.28 M-5.59,13.73 L13.42,13.76` |
| `^` | symbol-lambda | `M0.09,10 L6,20 L11.91,10` |

(Coordinates such as 2.99 and 19.99 in the source are rounded here. The JSON keeps 3 decimals.)

### 3.3 Sizes, spacing and the layout model (`MDG/Common/indicator/Common_page_defs.lua`)

```lua
-- WARNING! The only available fonts sizes for MDG stroke symbology are: 100% (20 DI), 120%, 150%, 200%
glyphNominalHeight100 = 20 ; glyphNominalWidth100 = 12
glyphNominalWidth120 = roundDI(glyphNominalWidth100 * 1.2)   -- = 14 (not 14.4)
stringdefs[STROKE_FNT_DFLT_100] = {fontScaleY_100, fontScaleX_100, fontIntercharDflt100 * GetScale(), fontInterlineDflt100 * GetScale()}
```

| Font id | Glyph W x H (DI) | Interchar | Interline | Advance | Advance / height |
|---|---|---|---|---|---|
| `STROKE_FNT_DFLT_100` (1) | 12 x 20 | 4 | 5 | 16 | 0.80 |
| `STROKE_FNT_DFLT_120` (2) | 14 x 24 | 6 | 6 | 20 | 0.83 |
| `STROKE_FNT_DFLT_150` (3) | 18 x 30 | 6 | 12 | 24 | 0.80 |
| `STROKE_FNT_DFLT_200` (4) | 24 x 40 | 12 | 12 | 36 | 0.90 |
| `…_120_WIDE` (5) | 14 x 24 | 9 | 12 | 23 | 0.96 |
| `…_150_WIDE` (6) | 18 x 30 | 9 | 12 | 27 | 0.90 |
| `…_150_X_WIDE` (7) | **24** x 30 | 9 | 12 | 33 | 1.10 |
| OSB legends `PB_TextFont` | 14 x 24 | 6 | 6 | 20 | 0.83 |
| Cautions `CautionsFont` | 18 x 30 | 9 | 12 | 27 | 0.90 |

- The string width is `n·W + (n−1)·interchar`. This is the formula Lua itself uses in `addLineThroughAString` and
  in the advisory/caution mask widths. The line pitch is `H + interline`.
- The `stringdefs` order is `{sizeY, sizeX, interchar, interline}`. Glyphs scale non-uniformly from the 12 x 20
  `default` cell.
- Text alignment strings (`"LeftCenter"`, `"CenterTop"`, `"RightBottom"`, ...) align the string's bounding box to
  `pos` **[C++ `ceStringSLine`]**.
- `formats` tables plus controllers choose or format the strings at runtime **[C++]**.

**Comparison with Hornet Display (`hornet-display.md`):**
- Hornet Display: cap 0.70 em, advance 0.55 em → advance/cap 0.786. `A` ink is 13/21 of the cap (0.62), chamfers
  are 3/21, and lowercase duplicates uppercase.
- DCS: the cell is 12/20 = 0.60 with 3/20 chamfers. Advance/height is 0.80 at 100 %, 0.83 for OSB legends and
  0.90 for cautions.
- So a single fixed-pitch web font cannot reproduce every size: the per-size interchar differs.
- Recommendation: **generate the glyphs from the DCS SVG** (as inline SVG paths, or a stroke-to-outline web font
  per size), and lay out text manually with the table above. Keep Hornet Display only as a fallback.
- Legal note: `stroke_font.svg` is an ED asset. Redistributing derived outlines on a public site is a licensing
  question for the user, not a technical one.

---

## 4. Glow, blur, bloom and the screen's realism layers

**There is no Lua blur, bloom, halation or glow parameter for the MDIs or AMPCD.** The DCS look is built from the
layers below, listed from bottom to top. Each layer is marked as present in Lua, present in the assets, or engine.

### 4.1 Symbology layer (Lua)

1. **The stroke line shader.** Every `ceSMultiLine`, `ceSCircle`, `ceSVarLenLine` and `ceSLineFont` element is
   rendered by the engine's line shader with:
   ```lua
   -- MDG_strokesDefs.lua                    -- MDI_init.lua / AMPCD_init.lua
   stroke_thickness = 0.8                    shaderLineDefaultThickness = 0.8
   stroke_fuzziness = 0.5                    shaderLineDefaultFuzziness = 0.5
                                             shaderLineUseSpecularPass  = true
                                             shaderLineParamsUpdatable  = true
                                             shaderLineDrawAsWire       = false
   ```
   - `thickness` is the solid core width. `fuzziness` is the soft alpha-falloff width at the edge. This is the
     **only** blur-like parameter. The units and falloff curve are **[C++]**.
   - **[INFERRED]** the values are pixel-scale in the bake render target. Screenshots show about 1–1.5 px strokes
     with a narrow anti-aliased fringe (`hornet-display.md`).
   - For comparison, the HMD uses fuzziness 1.5 with the specular pass off (`HMD/indicator/HMD_init.lua`). DCS
     softens the HMD deliberately and keeps the DDI crisp.
2. **The specular pass** (`shaderLineUseSpecularPass = true`) is an extra engine pass for line elements. What it
   draws is not in Lua **[C++]**. **[INFERRED]** it is a highlight that brightens the core of the line.
3. **Black outlines on map pages** (the AMPCD HSI/SA map variants, `*_outlined.lua`):
   - Black strokes with `DMC_outline_thickness = 0.8*4 = 3.2` and `DMC_outline_fuzziness = 0.5*1.4 = 0.7` are
     drawn beneath the green `DMC_stroke` (0.8 / 0.5). The comment reads "valid for cockpit view, but looks
     overdone at HUD only view".
   - These outlines are for legibility over the coloured map. They are not glow.
   - The non-bake values are main 0.65 / 0.42 and outline 2.4 / 0.55.
4. **Video tint.** `used_render_mask = IndicationResources/MDG/flir_texture.dds`, with the comment "green shade for
   render_target_X". FLIR and weapon video are tinted green through this texture.

### 4.2 Compositing onto the 3D screen (Lua bake + EDM assets)

5. **Baking and additive compositing.**
   - With `bakeIndicators = true` (shipped), every display renders to an offscreen texture.
   - `F18::ccMDG_IndicatorBake_F18` draws that texture on the cockpit's `MDI-L/R-CENTER` / `AMPCD-CENTER`
     connectors as a `ceTexPoly` with **`additive_alpha = true`** (`MPD_common_bake_page.lua`).
   - The quad spans ±1, normalized by the largest border coordinate: 544.8 DI on the MDI, and 540.5 DI with
     `aspect_adjustment = 0.97` on the AMPCD.
   - **Green light is added to whatever the screen already shows.** It is not painted over it.
   - The brightness scales in section 2.2 apply here.
   - Only the HUD-only/exported view gets a black backing polygon (`{0,0,0,255}`, controller `render_purpose`
     1,2,3), so exported displays sit on pure black.
6. **Screen base (the black level).**
   - The DDI's "black" in the cockpit view is the 3D screen material `f18c_mdi_l` / `f18c_mdi_r`, a 1024² DXT1
     texture: about **`#1a2218`** at the centre, falling to `#151915`–`#151615` at the edges as a soft
     rounded-square vignette. See `figures/dcs-tex-mdi-screen-tint.png` and `dcs-bezel.md`.
   - Its PBR map `f18c_mdi_l_RoughMet.dds` has roughness (G) of about 0.38 at the centre rising to about 0.58 at
     the edges, and metallic (B) 0. The screen is a semi-matte, dielectric surface that picks up a little cockpit
     light.
   - The EDM also contains a material named `f18c_mdi_l_additive` / `_r_additive`. **[INFERRED]** this is the
     emissive layer used only when `bakeToCockpitTexture = true`, through args 524/525. That option is off in the
     shipped `config.lua`.
   - The black level therefore **does not change** with BRT, CONT or NIGHT/DAY. It changes only with cockpit
     lighting.
7. **Cover glass: reflections, smudges and scratches** (EDM materials `f18c_cpt-displayglass*`; textures in
   `FA18/Cockpit/Textures/FA-18C-CPT-TEXTURES.zip`):
   - `f18c_cpt-displayglass_refl.dds` (1024 x 512 DXT5, two rounded panes):
     - RGB is a mottled reflection-tint map in purple, blue and magenta, which reads as an anti-reflective
       coating.
     - **Alpha is a smudge, wipe and scratch mask with a maximum of 40/255** (about 16 %) and a mean of about
       7/255.
   - `…_refl_RoughMet.dds` is constant: R 216, G (roughness) **53 ≈ 0.21**, B (metallic) **26 ≈ 0.10**. The glass
     is fairly glossy.
   - `f18c_cpt-displayglass-dif.dds` is a green rounded-pane diffuse (`figures/dcs-tex-displayglass-dif.png`).
     `dcs-tex-ddi-glass-off.png` shows the DDI glass in the off state as dark slate.
   - These are lit by the cockpit image-based lighting. The values are in `Shape/cockpit_f-18c.edm.lua`:
     `CockpitIBL = {3, 2, 1.5}` and `CockpitElipsoidGlassReflection = {5, 5, 5}`.
   - **Smudges and scratches only show where the environment or a light reflects off the glass.** They do not
     dim or blur the symbology itself.
   - Which EDM mesh uses which texture is not readable from Lua **[INFERRED from material and texture names]**.

### 4.3 Engine post-processing (not in the FA-18C files)

8. **HDR tonemapping and bloom.**
   - DCS's global post-process applies to the whole cockpit frame. This produces the soft halo seen around bright
     DDI text in cockpit screenshots, especially at DAY with high BRT and in dark scenes.
   - It is engine-wide. There is no module or Lua parameter for it, and it depends on the user's graphics
     settings.
   - Exported displays and the HUD-only view largely bypass it, which is why they look crisp.

### 4.4 What DCS does **not** model (no Lua, asset or parameter evidence; do not invent these)

- CRT scanlines or a raster or pixel grid.
- Flicker, refresh shimmer or interlace.
- Phosphor persistence, afterglow or trails on moving symbols.
- Power-on warm-up, a brightness ramp, or a power-off fade or collapse to a dot. OFF is an empty page (section 2.2).
- Noise, grain or jitter on the symbology. Video pages (FLIR, MAV) have their own render-target processing, which
  is out of scope.
- Barrel or pincushion distortion, screen curvature, misconvergence or chromatic aberration.
- Burn-in or ghost images.
- A change of stroke width or blur with BRT, CONT or NIGHT/DAY. The line parameters are constant in Lua.
- A different palette at NIGHT. Only the luminance scale changes.
- Blur of symbology by the glass smudges. The smudges are reflection-only.

### 4.5 How the effects scale with the controls

| Effect | BRT | CONT | NIGHT vs DAY | OFF |
|---|---|---|---|---|
| Green stroke intensity | yes (curve [C++]) | unknown [C++] | ×0.126 MDI / ×0.085 AMPCD (cockpit); ×0.9 (exported) | not drawn |
| Stroke thickness/fuzziness | no (constant 0.8/0.5) | no | no | — |
| AMPCD black map outline | fades with the green (opacity-sensitive) | unknown | scaled with the green | not drawn |
| Screen black level (`f18c_mdi_l`) | no | no | no | unchanged (glass visible) |
| Glass reflections/smudges | no (environment-lit) | no | no | unchanged |
| Engine bloom | indirectly (brighter pixels bloom more) | — | much less at NIGHT | none |

**Web recipe that follows this.**
- Base: an image or gradient of the screen tint (`#1a2218` centre → `#151915` edge, rounded-square vignette).
- Then additively add (`mix-blend-mode: plus-lighter`/`screen`):
  - centreline strokes in `#1E8C00 × mode_scale × f(BRT)`, about 1 output px wide with a sub-pixel soft edge
    (for example a sharp stroke merged with an `feGaussianBlur` with σ ≈ 0.3–0.5 px of itself).
- On top: a faint smudge/scratch layer at ≤ 16 % opacity that responds only to a simulated light or reflection.
- An optional, user-toggleable wide bloom for a "cockpit" look.
- No scanlines, flicker or persistence.

---

## 5. Page framework

### 5.1 Page composition (`MDG/Common/indicator/Common_init.lua`)

- A page is a list of subsets (Lua files). Nearly every MPD page is
  `{SUBSET_BASE, SUBSET_SPECIFIC, <page subsets...>}`:
  - `SUBSET_BASE` = `MPD_base.lua`, the masks.
  - `SUBSET_SPECIFIC` = `CautAdvAndMenuPage.lua`, the cautions, advisories and the PB18 MENU/time legend.
- On the AMPCD, `SUBSET_AMPCD_BRT_CONT` is appended to every page.
- Pages **without** `SUBSET_SPECIFIC`, so with no MENU legend and no caution lines:
  - `PAGE_HSI_DATA_GRID`
  - MAV/WALLEYE/SLAM/DATALINK video
  - JDAM_JSOW, MISSION_DATA and JPF
  - the AMPCD map versions of HSI/SA, which use the `_DMC` and `_outlined` variants of it instead.
- `PAGE_STANDBY` = BASE + `Standby.lua`: `"STANDBY"`, 200 % font, centred, `StandbyFlash` **[C++]**.
- Page selection: `pages_by_mode[LEV1][LEV2][LEV3][LEV4]`, keyed by `MDG_DISPL_FMT_*` from
  `display_formats_IDs.lua`. That file is a "copy from MDG_DisplayFormats_F18.h", and the format state machine
  (what each OSB press does) is **[C++]**. LEV1 values: NONE 0, STANDBY 1, HUD 2, MENU 3, ADI 4, AZ_EL 5, BIT 6,
  CHECKLISTS 7, ENG 8, EW 9, FCS 10, FLIR 11, FPAS 12, FUEL 13, HSI 14, HSI_AMPCD 15, MUMI 16, RDR 17, SA 18,
  SA_AMPCD 19, STORES 20, UFC_BU 21, SPIN 22, MAV 23, ACL 24, UTM_GRID 25, WEAPON 26, HMD 27, MIDS 28, HARM 29,
  TGT_DATA 30, JDAM_JSOW 31, MISSION_DATA 32, SLAM 33, WALLEYE 34, DATALINK 35, JPF 36. LEV2 MENU_SUPT = 5 and
  MENU_TAC = 6.

### 5.2 OSB anchor positions (`MDG/Common/indicator/MPD_PB_defs.lua`)

```lua
local TDXLeftPos = -336 ; local DYLeftPos = -500 ; local TYLeftPos = 500
local LRYLeftPos = 307  ; local LXLeftPos = -500 ; local RXLeftPos = 500
local PB_TextDistBetweenWordsInRow = 169 ; local PB_TextDistBetweenWordsInColumn = 167
-- 1-5:  {-500, 307 - 167*(5-n)}   6-10: {-336 + 169*(n-6), 500}
-- 11-15:{ 500, 307 - 167*(n-11)}  16-20:{-336 + 169*(20-n), -500}
```

The numbering is clockwise from the bottom-left. PB1 is the lowest button on the left side and PB18 is bottom
centre, which agrees with the guide and hoggit research.

| PB | x | y | | PB | x | y |
|---|---|---|---|---|---|---|
| 1 | −500 | −361 | | 11 | 500 | 307 |
| 2 | −500 | −194 | | 12 | 500 | 140 |
| 3 | −500 | −27 | | 13 | 500 | −27 |
| 4 | −500 | 140 | | 14 | 500 | −194 |
| 5 | −500 | 307 | | 15 | 500 | −361 |
| 6 | −336 | 500 | | 16 | 340 | −500 |
| 7 | −167 | 500 | | 17 | 171 | −500 |
| 8 | 2 | 500 | | 18 | 2 | −500 |
| 9 | 171 | 500 | | 19 | −167 | −500 |
| 10 | 340 | 500 | | 20 | −336 | −500 |

The rows are offset by +2 DI and the columns by −27 DI. They are not symmetric about the centre; this is
deliberate in the source and presumably matches the bezel buttons. The anchor is the *outer edge* of the legend
text: the top or bottom edge for the rows, and the left or right edge for the columns.

### 5.3 Legend text, stacking and multi-line (`MPD_page_defs.lua`: `add_PB_label` → `addTextFromArgTable`)

```lua
local PB_TextDistBetweenLines = 35 ; local PB_TextDistBetweenColumns = 25
PB_TextFont = {fontScaleY_120, fontScaleX_120, fontIntercharDflt120 * GetScale(), 6 * GetScale()}
-- offset per side: left {1,0}, top {0,-1}, right {-1,0}, bottom {0,1}
-- align: top "CenterTop", bottom "CenterBottom", left "LeftCenter", right "RightCenter"
if offsetY == 0 then str = AddLineBreaksInStr(str) end   -- side legends: one char per line
pos_i = {pos[1] + 25*(i-1)*offsetX, pos[2] + 35*(i-1)*offsetY}
```

- **Top and bottom rows:**
  - The text is horizontal, 120 % font, centred on the PB x.
  - The top row's text top edge is at y = 500 and the bottom row's text bottom edge is at y = −500.
  - Each additional argument (line *i*) moves **35 DI inward**: down for the top row, up for the bottom row.
  - So `add_PB_label(20, "DATA", "TGT")` puts DATA at the bottom edge and TGT 35 DI above it, which reads
    "TGT / DATA".
- **Side columns:**
  - Letters are **not rotated**. Each string becomes one upright character per line (`"\n"` inserted).
  - Line pitch is 24 + 6 = 30 DI. The stack is vertically centred on the PB y.
  - The left column's text left edge is at x = −500 and the right column's text right edge is at x = +500.
  - Each additional word is a **new column 25 DI inward**. RDR at x = −500 and ATTK at x = −475 give two side-by-side
    stacks.
  - Lua contradicts the guide's inference that the letters are "rotated 90 degrees clockwise"
    (`guide-ddi-system.md`), and agrees with `hornet-display.md`.
- Spaces in a side legend become an empty 30-DI line.

### 5.4 Boxing a legend

A box is requested by the 4th element of an argument table: `{"text", parent, controllers, true | boxControllers}`.

```lua
local BoxOffset = -6
-- horizontal (top/bottom): sideX = #str * 22, sideY = 36, align "CenterTop"/"CenterBottom"
-- vertical   (left/right): sideX = 26,       sideY = #str * 32, align "LeftCenter"/"RightCenter"
addStrokeBox(name, sideX, sideY, BoxAlign,
  {pos[1] + (25*(i-1) + BoxOffset)*offsetX, pos[2] + (35*(i-1) + BoxOffset)*offsetY}, parent, box_param)
```

- **Horizontal box:** its outer edge is 6 DI beyond the text edge, toward the display edge (for example a top-row
  box top at y = 506). Its height is 36, so it extends 6 DI past the 24-DI text on the inner side too. Its width is
  22·n, against a text width of 20n − 6, so the padding is n + 3 DI on each side ("NCTR": 88 wide, 7 DI each side).
- **Vertical box:** 26 wide, from 6 DI outside the text (x = −506 to −480 on the left) against 14-DI text, so 6 DI
  on each side. Its height is 32·n against text 30n − 6, so n + 3 DI above and below.
- **Line width:** a box is a `ceSMultiLine` with 4 edges (`line_box_indices`), drawn with the same stroke shader
  (0.8 / 0.5). There is no separate box width.
- `true` means always boxed. A controller table makes the boxing dynamic **[C++]**, for example a selected-mode
  controller.

### 5.5 The page title box and MENU (PB18)

```lua
-- MPD_page_defs.lua
function addMenuLabel(name, parent, controllers, isBoxed)   -- pos {0, -446}
  addStrokeText(..., name, STROKE_FNT_DFLT_150, "CenterCenter", {0,-446}, ...)
  if isBoxed then addStrokeBox(name.."_box", 110, 46, "CenterCenter", {0,-446}, ...) end
-- CautAdvAndMenuPage.lua (on every page with SUBSET_SPECIFIC)
add_PB_label(18, {"MENU", nil, {{"MPD_MENU_labelOrSystemTime"}}})
```

- **PB18 legend.** This is a single 120 % text centred at x = 2, with its bottom edge at y = −500. The C++
  controller `MPD_MENU_labelOrSystemTime` chooses whether it shows "MENU" or a time string **[C++]**. The guide
  says it "converts to a timer when airborne". That is the 4-digit number seen in screenshots, for example "2910"
  or "4311". Its format and source are not in Lua.
- **Page title** (TAC and SUPT pages only). This is a 150 % text (18 x 30) centred at (0, −446) inside a 110 x 46
  box. "TAC" is 66 wide (22 DI side padding, 8 DI top and bottom); "SUPT" is 90 wide.
- The title box runs from y −469 to −423, which leaves a 7-DI gap above the PB18 legend (−500..−476).

---

## 6. Menu pages and the caution/advisory overlay

### 6.1 TAC (`MDG/Common/indicator/Pages/MPD/Menu_TAC.lua`)

Each legend's visibility is gated by `{"MPD_MENU_FormatLabelShow", MDG_DISPL_FMT_LEV1.X}` **[C++]**, which shows a
legend only when the format is available.

| PB | Legend (line 1 / line 2) | Notes |
|---|---|---|
| 1 | AZ/EL | side stack of 5 characters, including `/` |
| 3 | HUD | |
| 4 | RDR / ATTK | two side-by-side stacks |
| 5 | STORES | |
| 6 | FLIR | |
| 8 | DL13 / DSPY | `DATALINK` format |
| 9 | HARM / DSPLY | |
| 10 | IMAV / DSPLY **or** MAV / DSPLY | `{"IMAV_MAV", 0/1}` selects the variant [C++] |
| 11 | JDAM / DSPLY | `{"JDAM_JSOW", 0}`. Note: the code uses `MDG_DISPL_FMT_LEV1.JDAM`, which does not exist (it is `JDAM_JSOW`), so the argument is nil |
| 12 | JSOW / DSPLY | `{"JDAM_JSOW", 1}`, same nil-argument issue |
| 13 | SA | |
| 17 | EW | |
| 18 | MENU or time | from `CautAdvAndMenuPage.lua` |
| 20 | DATA / TGT → reads "TGT DATA" | the "TGT" line has **no** controller, so it is always drawn |
| title | **TAC** boxed at (0, −446) | `addMenuLabel("TAC", rootName, nil, true)`, where `rootName` is undefined in this file (nil) |

PB 2, 7, 14, 15, 16 and 19 are blank.

### 6.2 SUPT (`Menu_SUPT.lua`)

The legends are parented to placeholder `Menu_SUPT` at (0, 0).

| PB | Legend | Controller |
|---|---|---|
| 1 | ADI | FormatLabelShow ADI |
| 2 | HSI | **none** (always shown) |
| 3 | HMD | HMD |
| 6 | MIDS | MIDS |
| 8 | BIT | BIT |
| 10 | MUMI | MUMI |
| 11 | CHKLST | CHECKLISTS |
| 12 | ENG | ENG |
| 15 | FCS | FCS |
| 16 | UFC BU | UFC_BU (horizontal, with a space) |
| 19 | FPAS | FPAS |
| 20 | FUEL | FUEL |
| 18 | MENU or time | (`CautAdvAndMenuPage.lua`) |
| title | **SUPT** boxed at (0, −446) | |

PB 4, 5, 7, 9, 13, 14 and 17 are blank.

### 6.3 Cautions and advisories (`CautAdvAndMenuPage.lua`, `MPD_AdvisoriesDefs.lua`)

- **Origin.** The placeholder `CautionsAdvisoriesPlaceholder` is at **(−450, −412)** with
  `{"MPD_CautionsAdvisoriesVisibilityAndPos", 500}` **[C++]**. The controller may hide or move the block; its
  argument is 500.
- **Advisory line.**
  - One `LeftBottom` 120 % string at the placeholder origin, with the bottom-left at (−450, −412).
  - Formats are `"ADV-%s%s%s%s%s%s%s"` or `"ADV-"`. The 7 slots are filled by `MPD_AdvisoriesLine` [C++] from the
    `Advisories` list: `ACI,`, `AHMD,`, `ALGN,`, `A/P, `, ... `YCODE,`, plus padding strings of 2–9 spaces.
  - Each slot has an **X-over** (`add_X_Over`, 82 x 24 DI, two diagonals, centred at the text mid-height of 12 DI).
    It is positioned by `{"MPD_Advisory_X", place, 14, 6}` [C++]. This draws the crossed-out ALGN, CFIT, LOAD and
    RCDR.
  - The advisory group is gated by `MPD_AdvisoriesShow` [C++].
- **Caution grid.**
  - Origin: placeholder at +(10, 46) from the block, which is **(−440, −366)**.
  - 7 rows x 3 columns, each a `LeftBottom` string at `x = 311·col` and `y = 52·row`. Row 0 is the lowest, so the
    rows stack **upward** to y = −54. The column x positions are −440, −129 and 182.
  - Font: 150 %, 18 x 30, interchar 9. The longest caution (10 characters) is 261 DI wide.
  - Text: `{"MPD_CautionText", row, column}` picks an index into the `Cautions` list [C++]. The list has 128
    entries. Index 1, `"DEBUG"`, is never shown. Priority cautions follow first (AIL OFF ... NAV VVEL), then
    non-priority cautions (AIR DATA ... WING UNLK).
- **Occlusion masks.** These are invisible stencil masks, with two copies each so that they also cover level+1
  symbology. They **black out page symbology underneath** the caution and advisory lines.
  - Advisory mask: 922 x 38 DI from (−4, −3) relative to the advisory origin, which is about x −454..468 and
    y −415..−377.
  - Caution masks: 891 x 52 DI per row, from (−4, −11 + 52·row) relative to the caution origin. Each is shown by
    `MPD_CautionMaskVisibility(row)` [C++]. Web equivalent: a black rectangle behind each active caution or
    advisory row.

The scripts set no other content on the TAC and SUPT pages.

---

## 7. C++-driven behaviour (not reproducible from Lua)

- **Page and format state machine:** what each OSB does, and the TAC/SUPT toggle. Lua only maps formats to pages.
- **The PB18 legend** `MPD_MENU_labelOrSystemTime` (MENU or a 4-digit time), and its time format.
- **Legend visibility** `MPD_MENU_FormatLabelShow`, `IMAV_MAV`, `JDAM_JSOW`, and the box controllers.
- **Cautions, advisories, masks and X-overs:** `MPD_CautionText`, `MPD_AdvisoriesLine`, `MPD_Advisory_X`,
  `MPD_AdvisoriesShow`, `MPD_CautionMaskVisibility` and `MPD_CautionsAdvisoriesVisibilityAndPos`.
- **Brightness, contrast and DAY/NIGHT gain curves** (`avMDI_IP1556A_F18`, `avAMPCD_F18`,
  `ccMDG_IndicatorBake_F18`), and the AMPCD BRT/CONT readout values.
- **All runtime colours other than green:** the red and yellow controllers listed in section 2.1.
- **Stroke shader:** the units and falloff of `thickness`/`fuzziness`, and what the specular pass does.
- **Text alignment, glyph anchoring in `ceSLineFont`, and `"FromSet"` symbol alignment.**
- **`StandbyFlash`:** the flash rate.

## 8. Corrections to the earlier research

- Side legends are stacked upright characters, not rotated text, which corrects `guide-ddi-system.md` line 78.
- The green is exactly `#1E8C00` (30,140,0). The hoggit estimate of `#5EE020` was wrong; it matches the
  "MDI original" value {94,202,0}, which is commented out.
- The OSB numbering (PB1 bottom-left, clockwise) is confirmed by Lua.
- The "4-digit number under the title" is the PB18 MENU legend, switched to a time by a C++ controller.

## 9. Extraction scripts (scratchpad `.../scratchpad/dcs-foundations/`)

- `extract_stroke_font.py`: parses `stroke_font.svg`, applies the transforms, snaps each glyph to its 20 x 30 DI
  authoring cell and writes `glyphs.json` (polylines in DI) and `glyphs_preview.svg`.
- `glyph_table.py`: produces the markdown table in section 3.2 and detects the circles.
- `dds_peek.py`: decodes DXT1/DXT5 cockpit textures from the texture zip (read-only) to PNG and prints channel
  statistics. Used for the screen tint, the glass reflection/smudge mask and the RoughMet values in section 4.2.
- `compute_geometry.py`: border polygons in DI, corner radius, the PB anchor table and sample legend and box
  geometry (`pb_positions.json`).
