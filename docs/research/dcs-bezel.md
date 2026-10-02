# DCS F/A-18C DDI / AMPCD bezel: controls, behaviour and appearance

Research notes for the physical display unit around the screen: the bezel, the 20 OSBs, the
OFF/NIGHT/DAY selector, BRT/CONT and the AMPCD rockers. The display contents are covered elsewhere.

Source: DCS World install, `Mods/aircraft/FA-18C/` (read-only). Every texture referenced here is
Eagle Dynamics copyright. They are for **reference only** and live in the gitignored
`docs/research/figures/`. Do not ship them.

---

## 1. Control definitions (Cockpit/Scripts)

### Devices (`devices.lua`)
| Device | Comment in file |
|---|---|
| `MDI_LEFT` (35) | Left Multipurpose Display Indicator (DDI), IP-1556/A |
| `MDI_RIGHT` (36) | Right MDI, IP-1556/A |
| `AMPCD` (37) | Advanced Multipurpose Color Display |

The C++ classes are `F18::avMDI_IP1556A_F18` and `F18::avAMPCD_F18`. The device scripts run at a
`device_timer_dt = 0.05` (20 Hz) update rate.

### Clickables (`clickabledata.lua`)

| Control | Element / arg (L / R / AMPCD) | Helper | Behaviour |
|---|---|---|---|
| Brightness Selector Knob, OFF/NIGHT/DAY | `pnt_51` / `pnt_76`, args 51 / 76 | `default_3_position_tumb(..., cycled=false, anim_speed=16, inversed=false, arg_value=0.1, arg_limit={0,0.2})` | **3 detents.** arg 0.0 = OFF, 0.1 = NIGHT, 0.2 = DAY. Left-click steps one way and right-click the other (two TUMB actions of -0.1/+0.1). **Not cyclic**, so it stops at the ends. Animated rotation at speed 16. Sound `SOUND_SW1` on each detent. |
| Brightness Control Knob (BRT) | `pnt_52` / `pnt_77`, args 52 / 77 | `default_axis_limited(default=0.0, gain=0.1, arg_lim={0,1})` | **Continuous rotary** (class LEV) from 0 to 1 with no detents. Mouse wheel or drag changes it by 0.1 per step. Sound `SOUND_SW10`, a soft ratchet tick. |
| Contrast Control Knob (CONT) | `pnt_53` / `pnt_78`, args 53 / 78 | same as BRT | Continuous 0 to 1, gain 0.1, `SOUND_SW10`. |
| PB 1-20 (OSBs) | Left: `pnt_54-70, 72, 73, 75` (args 54-70, 72, 73, 75: **71 and 74 are skipped**). Right: args 79-98. AMPCD: args 183-202. | `short_way_button` → `button_prototype` | **Momentary.** arg 0 → 1 while held, back to 0 on release (`use_release_message`). Because `animated_short_way_btns = false`, the press is **not animated**: the cap jumps straight to the pressed position. Sound `SOUND_SW5_ON` on press and `SOUND_SW5_OFF` on release. The click face is `BOX_SIDE_Y_bottom`. |
| Heading Set Switch (HDG) | `pnt_312`, arg 312, device **MDI_LEFT** | `springloaded_3_pos_tumb2` | Spring-loaded 3-position toggle (-1 / 0 / +1) that returns to centre. Sounds `Sw01` and `Sw01_Off`. Physically on the AMPCD bezel, upper-left corner. |
| Course Set Switch (CRS) | `pnt_313`, arg 313, device MDI_LEFT | `springloaded_3_pos_tumb` | Same, with `SOUND_SW1`. Upper-right corner of the AMPCD bezel. |
| AMPCD Off/Brightness Knob | `pnt_203`, arg 203 | `default_axis_limited(0..1, gain 0.1)` | Continuous. 0 = OFF, so OFF and brightness share one knob. Sound SW10. |
| AMPCD Night/Day rocker | `pnt_177_1` (NGT, arg → -1) and `pnt_177_2` (DAY, arg → +1), arg 177 | `AMPCD_switch_negative/positive` = `short_way_button` | **Momentary rocker.** Each half is its own button. The arg goes to +1 or -1 while held and returns to 0, so the rocker is spring-centred. Not animated. Sounds Sw05_On / Sw05_Off. |
| AMPCD Symbology rocker (SYM) | `pnt_179_2` UP / `pnt_179_1` DOWN, arg 179 | same | Momentary up/down. |
| AMPCD Gain rocker | `pnt_180_2` / `pnt_180_1`, arg 180 | same | Momentary up/down. |
| AMPCD Contrast rocker | `pnt_182_2` / `pnt_182_1`, arg 182 | same | Momentary up/down. |

Note: the left MDI's BRT knob and the right MDI's CONT knob pass an `attach_left` / `attach_right`
value of `{90,-45}`. These are VR hand-attachment offsets and have no visual meaning.

### Commands (`command_defs.lua`)
- `MDI_commands`: `MDI_off_night_day`, `MDI_brightness`, `MDI_contrast`, `MDI_Left_HDG_±`,
  `MDI_Left_CRS_±`, plus the keyboard/axis forms `*_ITER` and `*_AXIS`.
  `default.lua` binds `MDI_contrast_ITER` with a value of ±0.5 per press.
- `AMPCD_commands`: `AMPCD_off_brightness`, `AMPCD_nite_day_DAY/NGT`, `AMPCD_symbology_UP/DOWN`,
  `AMPCD_contrast_UP/DOWN`, `AMPCD_gain_UP/DOWN`.
- PB commands are shared between the MDIs and the AMPCD. The file's own comment reads:
  **"Pushbuttons are numbered clockwise from the lowest button at the left side"**:
  - PB1-5: left column, from **bottom to top**
  - PB6-10: top row, left to right
  - PB11-15: right column, top to bottom
  - PB16-20: bottom row, **right to left**
- Keyboard bindings send 1.0 on key down and 0.0 on key up.

### Sounds (`sounds.lua`, `sounds_init.lua`)
| ID | Sound path | Used by |
|---|---|---|
| `SOUND_SW5_ON` / `SOUND_SW5_OFF` | `Aircrafts/FA-18/Cockpit/Sw05_On`, `Sw05_Off` | OSBs and AMPCD rockers (press and release) |
| `SOUND_SW1` | `Aircrafts/FA-18/Cockpit/Sw01` | OFF/NIGHT/DAY detents, CRS switch |
| `SOUND_SW1_OFF` | `.../Sw01_Off` | HDG switch return |
| `SOUND_SW10` | `.../Sw10` | BRT/CONT and AMPCD brightness rotary |

The actual audio is inside `Mods/aircraft/FA-18C/Sounds.edce`. That file is encrypted: its header
is not a recognisable archive, there is no plain `Sounds/` folder, and no `.sdef` or `.wav` files
are exposed. We therefore cannot extract the clicks, so we should record or synthesise our own.
The pattern to imitate is two-part feedback: a short, crisp "tick" on press (Sw05_On) and a
softer, higher "tick" on release (Sw05_Off). The rotary knobs give a light detent click on each
step.

### Display geometry (`Multipurpose_Display_Group/*/indicator/*_specifics.lua`)
- **MDI visible display border**, taken from 3ds Max in metres: half-extents **0.06642 x 0.06637
  m**, so the visible display is about **132.8 x 132.7 mm (5.23 in)**, square. The corners are
  **strongly rounded**. The straight edges end at about ±45.1 mm on the top and bottom edges and
  at +42.0/-42.4 mm on the side edges, so the corner radius is **about 21-24 mm, roughly 17% of
  the width**.
- **AMPCD border**: half-extents 0.0659 x 0.0645 m, so about **131.8 x 129.0 mm**, with only small
  corner radii of about 1-2 mm. The display area is almost a sharp rectangle.
- Display units: 1024 DI per side, with 1 DI = 0.0048 in. The symbology field is therefore about
  4.92 in (124.9 mm), slightly smaller than the glass.
- OSB legend anchors (`MPD_PB_defs.lua`, in DI with the origin at the centre and ±512 at the
  edges):
  - side columns at x = ±500, at y = 307, 140, -27, -194, -361 (pitch **167 DI = 20.4 mm**)
  - top and bottom rows at y = ±500, at x = -336, -167, 2, 171, 340 (pitch **169 DI = 20.6 mm**)
  - The rows are **offset about 27 DI (3.3 mm) downward** of centre. This matches the physical
    buttons, which sit a little low on the side columns.

---

## 2. Textures (`Cockpit/Textures/FA-18C-CPT-TEXTURES.zip`)

The archive holds 95 files: DXT1/DXT5 DDS, each with `_NRM` and `_RoughMet` companions. Pillow
reads them directly. The relevant ones are:

| Zip file | Contents | Saved as |
|---|---|---|
| `f18c_cpt-tex04.dds` (2048², DXT5) | **The DDI bezel face** (left half of the sheet, around px 0-940 × 260-1240), **the AMPCD bezel face** (bottom right, around px 1080-2048 × 1080-2048), the AMPCD rocker cap, the HUD control panel and the UFC. Other panels are UV-packed into the empty display holes. | `dcs-tex-f18c_cpt-tex04.png` (full), `dcs-tex-ddi-bezel.png`, `dcs-tex-ampcd-bezel.png`, `dcs-tex-ampcd-rocker-cap.png` |
| `f18c_cpt-tex03.dds` | Top-left: the **DDI glass in its off state**, a dark slate rounded square. Top-centre: a green AMPCD/screen glass. | `dcs-tex-f18c_cpt-tex03.png`, `dcs-tex-ddi-glass-off.png` |
| `f18c_mdi_l.dds` / `f18c_mdi_r.dds` (1024², DXT1) | The screen base tint: a very dark green-black (`#1b2319` at the centre) with a darker vignette (`#161714`) at the edges. This is the colour of an unlit or "black" pixel on the DDI. | `dcs-tex-mdi-screen-tint.png` |
| `f18c_cpt-displayglass-dif.dds` | Glass diffuse for two displays: green, rounded. | `dcs-tex-displayglass-dif.png` |
| `f18c_cpt-tex01/02.dds` | Console panels, UFC buttons and gauges. These are useful only for the general legend style. | not saved |

**Most useful: `dcs-tex-ddi-bezel.png` and `dcs-tex-ampcd-bezel.png`.**

Measurements below are in texels of the 2048 texture, which is about 5.0 px/mm, calibrated
against the 132.8 mm display opening and confirmed by the OSB pitch matching the 20.6 mm DI
pitch. They are approximate, because UV texel density is not guaranteed to be uniform.

---

## 3. DDI bezel: appearance

### Colour and finish
- The face is **dark charcoal grey with a neutral to slightly cool tint**. Its diffuse colour is
  about `#2F302F`.
- The OSB caps are slightly darker (`#282829`). The recessed ring around the display opening is
  `#252626`, and the knobs are `#222427`, a touch bluer.
- The legend placards are raised dark plates (`#404242` including the white text).
- RoughMet shows the surface is **non-metallic** (metal = 0) with a **satin-matte finish**. In the
  G channel, roughness is about 0.38 on the face, 0.50 on the OSB caps and 0.31 on the knobs.
- The surface is weathered: light scuffs, lighter worn edges and **faint warm brown/amber grime
  smudges between the OSBs**, which look like finger wear. There are also subtle panel seams.
- Under normal cockpit lighting it renders as mid-dark grey. For the web, use roughly
  `#2b2d2e` to `#383a3b`, with a subtle top-light gradient.

### Shape and proportions
- The outline is an **upright rectangle with 45° chamfered top corners**. The bottom corners are
  square, and the BRT/CONT knobs sit there.
- The outer size is about **890 × 970 px, roughly 178 × 194 mm (7.0 × 7.6 in)**. The
  width:height ratio is about **0.92**.
- The top chamfers are large, with legs of about 35-40 mm. The vertical side edge starts about
  a third of the way down from the top of the top OSB row.
- **The display opening is about 133 mm square, about 75% of the bezel width and about 68% of
  its height.** The opening sits slightly above centre, because the bottom carries the knob
  corners.
- The opening is a rounded square: an **inner recessed lip/ring** about 4-6 mm wide surrounds
  the glass and steps down to it.
- The left/right border is about **22-23 mm**, with the OSB columns centred in it. The top
  border, including the legend plate, is about **38-40 mm**. The bottom border, including the
  OSB row and knobs, is about **28-30 mm**.

### OSBs (20)
- They are **square caps with rounded corners**, about **59 × 59 px, roughly 11.8 mm**. The corner
  radius is about 8 px (1.6 mm, about 14% of the side).
- They are blank, with **no printed legends**. The labels come from the display.
- They read as **raised caps in a shallow well**. A thin highlight runs along the lower edge of
  each cap and a dark shadow line along the upper edge.
- Spacing:
  - Top and bottom rows: centres at about 264, 368, 472, 578 and 688 px. The pitch is about
    **105 px (21 mm)** and the gap about 46 px (9 mm). The cap:pitch ratio is about 0.56.
  - Side columns: caps at y ≈ 288-347, 400-458, 512-570, 624-682 and 736-794. The pitch is about
    **112 px (≈21-22 mm)**.
  - The middle (third) side button is level with the display centre, or slightly below it.
- Distance from the display: the top-row caps sit about **4-5 mm above the display opening's
  edge**, and the side columns about **5 mm outside it**. In other words, each button row is
  tucked right against the glass ring.
- The five-button runs span about 96 mm horizontally and 101 mm vertically. That is about 72-76%
  of the display edge, centred, so the display corners have no buttons beside them.

### Knob and controls positions
- **OFF/NIGHT/DAY selector**: a small knob at **top centre**, above the top OSB row. It sits on a
  raised rounded-rectangle legend plate about 42 × 16 mm.
  - The legend reads **"NIGHT"** at the upper left, **"OFF"** at the lower left and **"DAY"** at the
    upper right, with **index lines in a "V"/fan pattern** radiating from the knob's centre.
  - The pointer positions are therefore about OFF = left/lower-left, NIGHT = up-left and
    DAY = up-right. This means a rotation of roughly 30-45° per detent.
- **BRT**: a round knob of about 17 mm diameter at the **bottom-left corner**, level with the
  bottom OSB row. A white ring marks its skirt. A **teardrop/lozenge-shaped placard** tapers
  inward toward the bottom row and reads **"BRT"**.
- **CONT**: the mirror of BRT at the **bottom-right corner**, reading **"CONT"**.
- **Screws**: six visible, all small and round-headed/countersunk.
  - two flank the top legend plate, above the 1st/5th top OSBs
  - one on each side edge, between side OSBs 3 and 4
  - one under each corner knob
- The legend typeface is **white, upper-case, condensed sans** (Helvetica/Futura-like) of about
  3 mm cap height. Other than the knob and screws there are no further markings on the DDI face:
  no part numbers and no OSB numbers.

### Glass
- When off, the glass is a dark slate blue-grey (`#20262B` to `#272F33`) with soft reflections.
- The screen's "black" when the display is on has a green-black tint (`#1B2319`) and a
  darker vignette at the edges.

---

## 4. AMPCD bezel: appearance (`dcs-tex-ampcd-bezel.png`)
- Same material and colour as the DDI (`#2A2B2B`). It is **square overall, with chamfered top
  corners**, and the display opening is an almost sharp-cornered square of about 132 × 129 mm.
- **OSBs are smaller and narrower** than on the DDI: about 50 px caps on a 100 px pitch, a
  cap:pitch ratio of 0.5. There are 5 per side.
- **Top centre**: the **OFF/BRT** rotary knob. Its arched legend reads "OFF" with a ramp line
  to "BRT".
- **Top-left chamfer**: the **DAY/NGT rocker**, a rectangular cap set at 45°, with placards "DAY"
  above and "NGT" below.
- **Top-right chamfer**: the **SYM rocker**, also set at 45°, with placard "SYM".
- **Bottom-left and bottom-right**: the **GAIN** and **CONT** rockers. These are tall
  rectangular rockers, about 50 × 92 px, at the bottom of each side column, with placards
  "GAIN" and "CONT" next to the bottom row.
- **Rocker cap**: a light-grey rounded rectangle about 2:1 tall, with embossed **"∧" over "∨"**
  chevrons.
- **Upper outer corners**: the **HDG** (left) and **CRS** (right) toggle switches. They have
  orange/brass-tipped round bat heads with white labels above, and belong to device MDI_LEFT.
- There is also a small faint **"+"** printed beside the CRS label.

---

## 5. Model files (`Cockpit/Shape`) and feasibility of extracting geometry
- `Cockpit_F-18C.EDM` (37.5 MB) has an `EDM` magic, which is the standard EDM format. **It is not
  encrypted.** It contains connector names `MDI-L-CENTER/DOWN/RIGHT`, `MDI-R-*` and
  `AMPCD-CENTER/DOWN/RIGHT` (these orient the display plane) and the materials `f18c_mdi_l`,
  `f18c_mdi_l_additive` and so on.
- `cockpit_f-18c.edm.ilv` (9.4 MB, magic `ILV`) is lighting/visibility data.
  `cockpit_f-18c.edm.lua` holds only IBL constants.
- `pilot_F18_helmet.edm` and `pilot_F18_visor_sprt.edm` are the pilot models.
- **Feasibility:** the open-source Blender EDM importer (`ndevenish/Blender_ioEDM`) understands
  this container. With some work it should be possible to isolate the DDI bezel mesh and get
  exact outline and OSB positions. That is a project in its own right (Blender, a large
  multi-material mesh), so it was not attempted. The texture plus the Lua border data above are
  enough for a faithful 2D reproduction.

## 6. MDG indication resources (`Cockpit/IndicationResources/MDG`)
| File | What |
|---|---|
| `stroke_font.svg` | Stroke (vector) font for MDG displays. This is the display font source; see the font research. |
| `stroke_symbols_MDI_AMPCD.svg` | Stroke symbol atlas: arrows, diamonds, aircraft symbols, crosses, HSI-type shapes, plus the TGP/FLIR window frames. Rendered to `dcs-tex-mdg-symbols-atlas.png`. |
| `stroke_symbols_HUD.svg` | HUD symbols |
| `font_TGP_ATFLIR.tga` (512²) / `tgp_texture.tga` (256²) / `flir_texture.dds` | Raster font and noise textures for the TGP/FLIR video pages |

None of these relate to the bezel.

---

## 7. Implementation notes for the website
- **OSB**: momentary. On pointerdown, offset the cap by about 0.5-1 px and darken it slightly,
  with no animation (DCS snaps). Play a press tick, then a release tick on pointerup. Fire the
  action on press, since DCS sends the command on press and the release separately.
- **OFF/NIGHT/DAY**: 3 detents and non-cyclic. Left-click or wheel-down goes toward OFF; right-click
  or wheel-up goes toward DAY. Animate the rotation quickly (DCS anim speed 16, about 60 ms) and
  play a detent click. Map OFF to a blank screen, NIGHT to a dim/NVG palette and DAY to full.
- **BRT/CONT**: continuous 0-1, 10 wheel steps (gain 0.1), with a soft tick for each step. Drive
  them from CSS filter `brightness()` and `contrast()` on the display layer.
- **AMPCD rockers**: two hit zones per rocker (up/down). Spring-centred, momentary.
- **Proportions for a CSS layout** (bezel width W):
  - bezel height ≈ 1.09 W
  - display ≈ 0.75 W square, with corner radius ≈ 0.12 W
  - OSB ≈ 0.066 W square, pitch ≈ 0.118 W
  - side columns centred about 0.07 W from the outer edge
  - top chamfers ≈ 0.2 W
  - knobs ≈ 0.095 W in diameter, in the bottom corners
