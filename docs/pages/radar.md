# Radar: RDR ATTK, A/A, RWS and TWS (`/radar`)

Status: built. Showcase page (design section 9.1). Menu legend `RDR`/`ATTK` at TAC PB4.

The page draws the real DCS A/A attack radar format, with fake contacts that move. It opens in RWS and switches to
TWS. It has one URL. Every radar setting is local island state: nothing changes the URL.

- Format: `src/frontend/src/ddi/formats/rdrAttk.tsx` (Lua constants and the symbology).
- Page: `src/frontend/src/ddi/pages/radar/`: `settings.ts` (state and reducer), `legends.ts` (each OSB's legend per
  state), `sim.ts` (scan pattern, contacts, scan state), `store.ts`, `RadarScope.tsx` (the animated layer),
  `islands.tsx` (OSBs, edge legends, readouts), `screens.tsx`.
- Content: `src/frontend/src/content/radar.ts` (PLACEHOLDER flight data and contacts).
- Semantic layer: `src/frontend/src/semantic/RadarSemantic.tsx`.
- Behaviour sources: the Lua for legends and symbology; the DCS F/A-18C Early Access Guide
  (`Mods/aircraft/FA-18C/Doc/`, sections RWS, RWS DATA, TWS and LTWS) for what the controls do. "Guide" below means
  that document.

## 1. Lua transcription

Source: `Mods/aircraft/FA-18C/Cockpit/Scripts/Multipurpose_Display_Group/Common/indicator/Pages/MPD/RDR/` and
`Scripts/Sensors/Radar/RadarDefs.lua`. All values are DI, origin at the screen centre, +y up. `rot` is degrees
counter-clockwise from up, as `addStrokeLine` takes it.

### 1.1 Page composition (`Common_init.lua`)

`PAGE_RDR_AA` = `BASE`, `SPECIFIC` (CautAdvAndMenuPage: the PB18 `MENU`/time legend), `RDR_AA_AG_BASE`,
`RDR_AA_SPECIAL`, `RDR_AA_BASE`, `RDR_AA_AG`, `RDR_AA_MAIN_PBs`, `RDR_AA`. Contacts and tracks are templates:
`Templates/RDR_contacts.lua` (raw hits) and `Templates/RDR_TRACKS.lua` (HAFU tracks), repeated by
`MPD_updateMultipleSymbolsBuffer`. `PAGE_RDR_AA_DATA` swaps `RDR_AA_MAIN_PBs` for `RDR_AA_DATA_PBs`.

### 1.2 Constants (`RadarDefs.lua`, `RDR_defs.lua`)

| Name | Value | Note |
|---|---|---|
| `RDR_tacticalAreaSizeDI` | 819 | `roundDI(InToDI(4))`: the B-scope square. Half = 409.5. |
| `RDR_AOT_zoneSizeDI` | 49 | 6 % of 819. AOT line at y = 360.5. |
| `RDR_TDC_HeightDI`, `RDR_TDC_WidthDI` | 52, 62 | acquisition cursor |
| `ten_degreesSz` | 58.5 | `half / 7`: the scope spans ±70° of azimuth |
| `az_rng_refline_len` | 54.5 | `ten_degreesSz − 4` |
| `az_refline_space` | 175.5 | 30° |
| `rng_speed_refline_space_4_gaps` | 204.75 | `half / 2` |
| `rng_speed_refline_space_5_gaps` | 163.8 | `size / 5` |
| `upper_data_block_posY` | 421.5 | `half + 12` |
| `RF_channel_shiftY` | 7 | |
| `top_bottom_PB_shiftY`, `side_PB_shiftX`, `side_PB_shiftY` | 8, 6, 25 | `add_PB_label_RDR` offsets |
| `label2ndRowIdentWide` | 10 | extra x for `PRI` |

### 1.3 `add_PB_label_RDR(pb, …)`

Calls `addTextFromArgTable` exactly as `add_PB_label` does, then moves every element: left column (+6, +25), top row
(0, +8), right column (−6, +25), bottom row (0, −8). So RDR row legends sit 8 DI further out than menu legends and
side legends sit 25 DI above their PB. The base page's PB18 legend is not moved.

### 1.4 Static symbology

| Element | Lua | Geometry |
|---|---|---|
| Border | `addStrokeBox("Radar_border", 819, 819, "CenterCenter")` | centred square |
| AOT line | `addStrokeLine(819, {409.5, 360.5}, 90)` | full width, shown in range (not velocity) scales |
| Azimuth ticks, top | `add_azimuth_ref_lines(…, 360.5)` | x = 0, ±175.5, ±351; 54.5 long, rot 180 (down) |
| Azimuth ticks, bottom | `add_azimuth_ref_lines(…, −409.5)` | same x; rot 0 (up) |
| Range ticks, 4 gaps | `add_range_speed_ref_lines(±409.5, true)` | y = 0, ±204.75; 54.5 long, pointing in |
| Range ticks, 5 gaps | same, `false` | y = ±81.9, ±245.7 (velocity scales) |
| Elevation ticks | `add_elevation_ref_lines` | x = −414.5, pointing left. Long (20): y = 202.75, 1, −200.75 (+30°, 0°, −30°). Short (8): y = 135.5, 68.25, −66.25, −133.5 |
| Velocity vector | `add_RDR_FLIR_AC_VelVector_HorizonLine({0, 136.5})` | HUD `125-velocity-vector` at 150 %. Horizon: 140 DI lines from x = ±60, 40 DI end ticks pointing down, moving with pitch and roll |
| Heading | `"%03.0f°"`, F120 `CenterBottom` | (0, 421.5) |
| Operating condition | `"", "RDY", "OPR", "TEST", "STBY", "EMER"`, F120 `RightBottom` | (−405.5, 445.5); `RDY` struck through when not ready |
| RF channel | `"C11"`, F120 `RightBottom` | (−411.5, 416.5) |
| Range scale max | F120 `LeftTop` | (424.5, 415.5) |
| Range scale min | F120 `RightBottom` | (458.5, −409.5) |
| TDC diamond | `addMPD_TDC_diamond` | 18 × 18 box turned 45°, dot r = 1, at (448, 455) |
| Weapon | F120 `CenterCenter`, X-over 70 × 25 when not ready | (370, 435) |
| Sensitivity | F150 `RightBottom` | (−419.5, −409.5) |
| Airspeed | F120 `RightCenter` | (−323, −425.5) |
| Mach | `M` F120 `RightCenter` at (−428, −453.5); value F120 `RightCenter` at (−325, −453.5) | |
| Altitude | thousands: 18 × 30, interchar 9, `RightCenter` at (333.5, −432.5); rest F120 `RightCenter` at (395.5, −432.5); `B`/`R` F150 `LeftCenter` at (417.5, −432.5) | |
| Mode (PB5) | `RWS`/`VS`/`TWS`/…, F120 `LeftCenter` | (−494, 335); `RTS` at (−494, 365) |
| PRF (PB1) | operating `CenterBottom` at (−463, −351); instantaneous `CenterBottom` 30 DI above | `LO`, `MED`, `HI`, `INTL`, `PDI` |
| `RDR` / `PRI` (PB2) | `add_PB_label(2, …)` moved +25 y; `PRI` +10 x | columns at x = −500 and −465 |
| Range arrows (PB11, PB12) | `076-arrow-up`, `RightCenter`/rot 180 `LeftCenter` | right edge x = 485; y = 322 and 190 |
| Bar number (PB6) | F120 `LeftTop` 40 DI right of the `nB` legend anchor | (−296, 508) |

### 1.5 Moving symbology

| Element | Lua | Geometry |
|---|---|---|
| B sweep | `addStrokeLine("B_sweep", 824, {0, −409.5}, 0)`, x from `MPD_RDR_AA_B_SweepPos` × 409.5 | full-height antenna azimuth line |
| Elevation caret | `add_RDR_caret` = `addCaretByWidthHeight(24, 32)` at (−409.5, 0), rot −90 | apex on the left edge, opening right; y from `MPD_RDR_ElevationCaret` |
| Raw hit | `RDR_contacts.lua`: 4 lines, 18 long, rot −90, at y = −3, −1, 1, 3 | a brick; `MPD_RDR_RawRadarContactIntensity` sets its intensity |
| Acquisition cursor | `addAcqusitionCursor`: two 52 DI lines at x = ±31, each drawn 3 times 1 DI apart | scan altitude limits F100: upper `RightBottom` (14, 31), lower `RightTop` (14, −35) |
| TUC | Vc F100 `RightCenter` (−40, 0), altitude `LeftCenter` (40, 0) | only with the cursor on a hit |
| Tracks (`RDR_TRACKS.lua`) | HAFU `SA-FF-*` at 110 %, course line 20, rank text F100, `J`/`F` at ±27 | TWS, LTWS, L&S, DT2 |

`addCaretByWidthHeight`: two lines from the apex, length `w / cos a`, at `rot ± a`, `a = atan((h/2)/w)`.

### 1.6 Legends (`RDR_AA_MAIN_PBs.lua`, `RDR_AA_DATA_PBs.lua`)

Main level. RWS and TWS share one page; placeholders gated by `MPD_RDR_RWS_VS_LabelsRoot` and
`MPD_RDR_TWS_LabelsRoot` swap the legends that differ.

| PB | RWS | TWS | Note |
|---|---|---|---|
| 1 | `INTL` with the instantaneous PRF above | same | formats `"" LO MED HI INTL PDI`; drawn as text (1.4) |
| 2 | `RDR` `PRI` | (none) | `MPD_RDR_AA_RDR_PRI_LabelShow`; absent from the guide's TWS figures |
| 3, 4 | `SURF`, `QL` `MAN`/`AUTO` | | not in A/A search |
| 5 | `RWS` | `TWS` | `Radar_mode` text (RDR_AA_SPECIAL.lua) |
| 6 | `4B` + bar number | same | `"%dB"`; layouts `1B 2B 4B 6B` (RWS), `2B 4B 6B` (TWS) |
| 7 | ` SIL ` | same | boxed when `MPD_RDR_SIL_LabelStatus` is 2; `ACM` in ACM |
| 8 | `ERASE` | `HITS` | `STOW`/`HITS` formats; HITS boxed while shown |
| 9 | (none) | `RAID` | boxed by `MPD_RDR_AA_RDR_RAID_BoxShow` |
| 10 | `ACTIVE` while silent | same | `MPD_RDR_ACTIVE_LabelShow`; `FLOOD`, `TWS` with AIM-7/120 states |
| 11, 12 | range arrows | same | symbols, not text; an arrow goes away at its end of the scales (guide) |
| 13 | `SET` | `AUTO` / `MAN` | AUTO/MAN: F120 `RightCenter` at (PB13.x, PB13.y ± 20), boxes 88 × 36 and 66 × 36, 6 DI out |
| 14 | `RSET` | same | boxed by `MPD_RDR_AA_RSET_LabelShow` |
| 15 | `NCTR` | same | box by `MPD_RDR_AA_NCTR_Box` |
| 16 | ` DATA ` | same | `add_PB16_DATA_label(false)` |
| 17 | `CHAN` | (none) | `MPD_RDR_CHAN_LabelStatus`; absent from the guide's TWS figures |
| 18 | `MENU` (time when airborne) | same | base page, not moved |
| 19 | `140°` | `80°` … | `"%3d°"`; layouts `140 80 60 40 20` (RWS); `80 60 40 20` (TWS 2B), `40 20` (TWS 4B) |
| 20 | `MODE` | `EXP` | EXP boxed by `MPD_RDR_TWS_EXP_Box` |

The `*_Additional_Layout` strings (`1B 2B 4B 6B`, `140 80 60 40 20`, `HI MED INTL`, `RWS VS TWS`, `2 4 8 16 32`) are
the TDC control-zone option lists (guide, HOTAS TDC Control Zones). The OSBs cycle instead.

DATA sublevel: `PAGE_RDR_AA_DATA` swaps `RDR_AA_MAIN_PBs` for `RDR_AA_DATA_PBs`. The mode text at PB5 stays.

| PB | Legend | Note |
|---|---|---|
| 1 | `LDF` | no controller |
| 2 | `NORM` / `WIDE` | speed gate, `MPD_RDR_SpeedGate` |
| 4 | `ECCM` | no controller |
| 5 | `RWR` `ATTK` | only with `MPD_RDR_AA_DATA_RWR_ATTK_Show` (not drawn) |
| 10 | target aging `2` … `32`; `ACTIVE` while silent | `MPD_RDR_AA_TargetAgingLabel` |
| 12 | `1LOOK` `RAID` | RAID 10 DI further in; box 26 × 156 `LeftCenter` at (PB12.x − 26, PB12.y + 24) |
| 13 | `COLOR` | box `MPD_RDR_ColorBox` |
| 14 | `MSI` | box `MPD_RDR_MSI_Box` |
| 15 | `LTWS` | RWS only (`MPD_RDR_LTWSShow`) |
| 16 | ` DATA ` | boxed |
| 17 | `DCLTR` / `DCLTR 1` / `DCLTR 2` | boxed at 1 and 2 |
| 19 | `BRA` | box `MPD_RDR_BRAEnable` |

The guide's DATA figure matches: `ECCM`, `NORM` and `LDF` on the left; `RAID 1LOOK`, boxed `COLOR`, `MSI` and `LTWS`
on the right; boxed `BRA`, `DCLTR 2` and `DATA` at the bottom; the aging number at PB10; no range arrows.

Further symbology the settings bring up:

| Element | Lua | Geometry |
|---|---|---|
| Iron cross | `104-iron-cross`, `CenterCenter` (RDR_AA_AG_BASE.lua) | (−330, −330): the radar is not radiating |
| BRA | `"BRA %3d°/%.1f"`, F120 `LeftCenter` (RDR_AA.lua) | (−365, −340) |
| Target heading | `"%3d°"`, F120 `LeftCenter` | (−305, 335) |
| Range caret | `add_RDR_caret` at (409.5, 0), rot 90 | y from `MPD_RDR_AA_TrackedTarget_RangeCaret` × 409.5 |
| Range rate | F100 `RightCenter`, 30 DI left of the range caret | the L&S closure, knots |
| L&S | `SA-LS` in the HAFU; Mach F100 `RightCenter` (−27, 0), altitude F100 `LeftCenter` (27, 0) | the guide's figures read `0.9 ★ 30.0` |

### 1.7 Cross-check

`hoggit-RDR_ATTK_Common_Labels_1.png` and `guide-page-91-attack-radar.png` show the same layout: `OPR`/`C11`, `RWS`,
`4B 2`, `SIL`, `ERASE`, heading, weapon with X-over, diamond, `40`/`0`, arrows, `SET`, `RSET`, boxed `NCTR`, `RDR PRI`,
`HI`/`INTL`, `7`, airspeed, Mach, altitude, `MODE`, `140°`, time, `CHAN`, `DATA`, the cursor with limits and the
caret. The screenshots draw the cursor yellow; the site keeps every stroke `#1E8C00` (design section 6.1). The guide's
RWS, RWS DATA and TWS figures (pages 162, 170, 174, 175 and 177) are the references for the other states.

## 2. What the page draws

Everything in 1.4 to 1.6, with these choices:

- Fake data (`content/radar.ts`, PLACEHOLDER): heading 256°, 404 knots, Mach 0.90, 20 480 ft, weapon `9X 2`
  without the X-over. The numbers are quiet programmer jokes (2^8, HTTP 404, 20 KiB). Each contact flies level at
  its own altitude, from 1 500 ft below us to 10 000 ft above.
- The page opens in RWS at 4 bars, 140°, 40 NM, INTL and 8 s aging, with `NCTR` boxed and sensitivity `7`, as in the
  reference figure.
- Level flight: the horizon line passes through the velocity vector.
- The velocity vector's circle centre is on (0, 136.5). The extracted symbol's origin is its bounding-box centre, so it
  is drawn 15 DI higher. This anchor is inferred; the reference shows the horizon through the circle's centre.
- The acquisition cursor rests at (−270, 250), up and left of the velocity vector, clear of the horizon line.
- No TUC, L&S or bullseye in RWS: nothing is designated.

## 3. Behaviour

Every OSB fires on press through `useOsbPress`. A press sends a `RadarAction` to the pure `radarReducer`
(`settings.ts`). `radarPanel(state)` (`legends.ts`) gives each OSB its legend, box and action in that state.

| Control | Does | Source |
|---|---|---|
| PB6 bars | RWS cycles 1 → 2 → 4 → 6 → 1; TWS cycles 2 → 4 → 6 → 2 | guide: "successive presses cycle between 1, 2, 4 and 6 bars" |
| PB19 azimuth | RWS cycles 140 → 80 → 60 → 40 → 20 → 140; TWS cycles only what the bars allow (2B 80/60/40/20, 4B 40/20, 6B 20) | Lua layouts; guide (TWS) |
| PB11, PB12 range | 5, 10, 20, 40, 80, 160 NM; at an end the arrow and its OSB go blank | guide |
| PB1 PRF | cycles HI → MED → INTL → HI; INTL alternates HI and MED pass by pass | Lua layout; guide: "Interleaved alternates Medium and High bar coverage" |
| PB5 mode | toggles RWS and TWS. Entering TWS turns 1 bar into 2 and narrows the azimuth to the widest the bars allow (ours: DCS's choice is in the C++) | guide: "Pressing toggles between RWS and TWS" |
| PB7 SIL | boxed; the antenna stops, nothing new is detected, the hits age out, the iron cross shows | guide |
| PB10 ACTIVE | while silent: one full frame from bar 1, then silent again | guide |
| PB8 ERASE | clears every raw hit until the beam finds it again | guide |
| PB13 SET | saves bars, azimuth, range, PRF and aging; boxed for 2 s | guide; 2 s from the Hoggit wiki (RSET) |
| PB14 RSET | returns to the saved settings, fitted to the mode; boxed for 2 s | guide: RSET returns to the weapon's settings, which SET saves |
| PB15 NCTR | toggles its box | Lua |
| PB16 DATA | opens and closes the DATA sublevel; boxed while open | Lua |
| TWS PB8 HITS | shows or hides the raw hits, drawn at half intensity | guide: "rendered at a lower intensity" |
| TWS PB13 AUTO/MAN | MAN (default) keeps the scan on the nose; AUTO centres its azimuth and elevation on the L&S | guide |
| DATA PB10 aging | cycles 2 → 4 → 8 → 16 → 32 → 2 s: how long a hit stays | guide |
| DATA PB17 DCLTR | cycles DCLTR → DCLTR 1 → DCLTR 2. Level 1 removes the velocity vector and horizon; level 2 also removes the target heading and the range rate | guide |
| DATA PB19 BRA | shows the bearing and range from us to the cursor | guide |
| DATA PB2, 12, 13, 14, 15 | NORM/WIDE, 1LOOK RAID, COLOR, MSI and LTWS toggle as in DCS (section 5 gives their effect) | Lua |

The scan model. Values are ours unless a source is given.

| Item | Value | Why |
|---|---|---|
| Scan | 60°/s. A raster from the top-left: left to right on even passes, back on odd ones, one bar lower each pass | the guide gives no rate |
| Bars | centred on the scan centre, 1.3° apart; 4.2° on the 5 NM scale; 2° for TWS 2-bar | guide |
| Beam | 3.3° tall: a pass sees a contact within ±1.65° of its bar | |
| Frame time | bars × width ÷ 60°/s: 9.3 s for 4B 140°, 14 s for 6B 140°, 0.33 s for 1B 20° | |
| PRF | HI sees the whole 80 NM volume, but only contacts closing at 300 knots or more. MED sees any aspect out to 40 NM | guide: HI has "greater range but … inferior low to medium aspect detection" |
| Contacts | 5, from `content/radar.ts`: range, azimuth, relative speed and track at t = 0, and altitude | |
| Volume | 2–80 NM, ±70°. A contact flies a straight line and re-enters where it first came in | |
| Raw hits | a brick moves only when a pass that sees the contact crosses it. It dims linearly over the target aging time | RWS refreshes a brick per detection |
| Trackfiles | every detection updates the contact's file, in RWS too (as LTWS keeps them). A file drops after one frame plus 3 s without a hit. TWS ranks the files by time to intercept; rank 1 is the L&S | guide: "The highest priority target is always assigned as the L&S target" |
| TWS symbols | unknown-identity HAFU with its rank and a course line from the HAFU's open edge; the L&S star with Mach and altitude; a file beyond the scale clamps to the top edge | guide figures |
| Scan centre | the nose. TWS AUTO centres on the L&S, keeping the whole width inside ±70° | guide |
| Cursor limits | our altitude ± range × tan(half coverage) about the scan centre, in thousands of feet. Half coverage = ((bars − 1) × spacing + 3.3°) ÷ 2. No floor at 0 | the guide's RWS figure shows `−2` |

The contacts fly on sim time. The antenna moves on a separate scan clock, which stops while silent. `stepScan`
advances both and records each contact the beam crosses (`sim.ts`). `warmScan` runs whole frames up to t = 0, so the
server renders a frame that already shows aged hits. A new bar count, width or spacing restarts the frame at bar 1.

## 4. Rendering and interactions

- `DdiScreen.live`: the frame draws it in the square in a second `EmissiveLayer` with `bloom={false}`. The sweep
  line, caret, hits, trackfiles and range caret live there, so the night bloom never re-blurs per frame (design
  section 6.3).
- `RadarScope` (client) runs a `requestAnimationFrame` loop on a fixed 50 ms schedule (20 Hz). Each frame steps the
  scan by at most 100 ms and writes `transform`, `opacity` and `visibility` through refs, so React never re-renders
  per frame. The loop stops on `visibilitychange` when hidden and never starts under `prefers-reduced-motion`. A press
  still redraws the still frame at once: ERASE clears it, and a new azimuth moves the sweep to the new left edge.
- The loop writes two small stores, and only when a value changes: the bar number and instantaneous PRF
  (`scanReadoutStore`), and the trackfile ranks and L&S closure (`trackFilesStore`). Track symbols re-render only
  when a rank changes.
- All 19 radar OSBs are islands (`RadarOsb`). In each state an OSB is a working `<button data-action="state">`, an
  inert `aria-disabled` button or a blank one, as `radarPanel` says. A cycle's accessible name carries its value
  ("Azimuth scan, 140°"); a toggle reports `aria-pressed`. The plain view hides the state OSBs.
- `RadarEdge` islands draw the legend text in the four edge strips, including the legends the format draws itself
  (PRF, RDR/PRI, mode, range arrows, AUTO/MAN, 1LOOK RAID). `RadarReadouts` draws what the settings change in the
  square: the range scale, cursor limits, velocity vector, iron cross, BRA and target heading.
- The semantic layer lists every control with its options, and the current settings through a small island
  (`RadarSettings`).
- The scope resets the radar state on unmount, so each visit opens at the defaults. The URL never changes.

## 5. Inert legends, gaps and deviations

Inert, or toggling without a visible effect:

| Legend | Why |
|---|---|
| PB2 `RDR` `PRI` | radar priority over the other sensors; the page has no other sensors |
| PB17 `CHAN` | the Lua draws `C11` as fixed text with no controller, so DCS never changes the channel shown |
| PB20 `MODE` | the guide gives it no action; VS, the third mode in the Lua's layout, is not in DCS |
| TWS PB9 `RAID` | SCAN RAID needs the 10 NM, 22° expanded display around the L&S, which the C++ sets |
| TWS PB20 `EXP` | the same expanded display |
| DATA PB1 `LDF`, PB4 `ECCM` | no controller in the Lua; the guide lists ECCM as "coming later" |
| DATA PB2 `NORM`/`WIDE` | toggles. The guide lists the speed gate as "coming later", and no contact is slow enough to matter |
| DATA PB12 `1LOOK` `RAID` | toggles; it works only in STT |
| DATA PB13 `COLOR` | toggles; the site draws monochrome green (design section 6.1) |
| DATA PB14 `MSI` | toggles; it fuses datalink tracks, and there is no datalink |
| DATA PB15 `LTWS` | toggles; LTWS symbols appear only on a TDC-designated contact |
| PB15 `NCTR` | toggles; it identifies only an STT target |

Not built:

- STT and L&S/DT2 designation. DCS enters them with the TDC or the sensor control switch. This page's controls are
  the bezel only (design section 5), so there is no way in. STT's launch zone, ASE circle, steering dot, aspect and
  `SHOOT` cues also need weapon and fire-control data.
- TWS launch zones (`TWS_R_max`, `RNE`, `R_min`), the DT2 diamond and the L&S differential altitude, whose number
  format is in the C++.
- Scan-limit markers on the B-scope: DCS draws none. The sweep line's travel shows the azimuth limits, and the azimuth
  ticks stay fixed (`add_azimuth_ref_lines` has no controller).
- The TDC control-zone option layouts: they appear only when the TDC crosses the display border.

Deviations:

- Monochrome green; DCS draws the cursor, TUC and trackfiles yellow and red on colour displays.
- The scan rate, beam height, PRF limits, trackfile memory and ranking are ours; the C++ radar model is not in the
  Lua.
- The instantaneous PRF line shows only in INTL, where it differs from the operating PRF (inferred).
- The course line starts at the HAFU's open lower edge, 11 DI out, read from the guide's figures.
- Playful identifiers were not added: RWS shows no text beside raw hits (the altitude text is 1LOOK/RAID only).
