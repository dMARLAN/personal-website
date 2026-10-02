# Radar: RDR ATTK, A/A, RWS (`/radar`)

Status: built. Showcase page (design section 9.1). Menu legend `RDR`/`ATTK` at TAC PB4.

The page draws the real DCS A/A attack radar format in RWS, with fake contacts that move. It has one URL. The range
scale is local island state.

- Format: `src/frontend/src/ddi/formats/rdrAttk.tsx` (Lua constants and the static symbology).
- Page: `src/frontend/src/ddi/pages/radar/` (legends, screen, scan simulation, store, client islands).
- Content: `src/frontend/src/content/radar.ts` (PLACEHOLDER flight data and contacts).
- Semantic layer: `src/frontend/src/semantic/RadarSemantic.tsx`.

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

### 1.6 Legends (`RDR_AA_MAIN_PBs.lua`, RWS)

| PB | Legend | Note |
|---|---|---|
| 1 | `INTL` with `HI` above | PRF, drawn as text (1.4) |
| 2 | `RDR` `PRI` | drawn as text (1.4) |
| 3, 4 | `SURF`, `QL` `MAN`/`AUTO` | not in RWS |
| 5 | `RWS` | radar mode, drawn as text |
| 6 | `4B` + bar number | `"%dB"`; options `1B 2B 4B 6B` when pressed |
| 7 | `SIL` | boxed when silent; `ACM` in ACM |
| 8 | `ERASE` | `STOW`/`HITS` alternatives |
| 9 | (none) | `RAID` in TWS |
| 10 | (none) | `ACTIVE`/`FLOOD`/`TWS` with AIM-7/120 states |
| 11, 12 | range arrows | symbols, not text |
| 13 | `SET` | |
| 14 | `RSET` | |
| 15 | `NCTR` | box by `MPD_RDR_AA_NCTR_Box` |
| 16 | `DATA` | boxed on the DATA sublevel |
| 17 | `CHAN` | |
| 18 | `MENU` (time when airborne) | base page, not moved |
| 19 | `140°` | `"%3d°"`; options `140 80 60 40 20` |
| 20 | `MODE` | `EXP` in TWS |

### 1.7 Cross-check

`hoggit-RDR_ATTK_Common_Labels_1.png` and `guide-page-91-attack-radar.png` show the same layout: `OPR`/`C11`, `RWS`,
`4B 2`, `SIL`, `ERASE`, heading, weapon with X-over, diamond, `40`/`0`, arrows, `SET`, `RSET`, boxed `NCTR`, `RDR PRI`,
`HI`/`INTL`, `7`, airspeed, Mach, altitude, `MODE`, `140°`, time, `CHAN`, `DATA`, the cursor with limits and the
caret. The screenshots draw the cursor yellow; the site keeps every stroke `#1E8C00` (design section 6.1).

## 2. What the page draws

Everything in 1.4 to 1.6 for RWS, with these choices:

- Fake data (`content/radar.ts`, PLACEHOLDER): heading 256°, 404 knots, Mach 0.90, 20 480 ft, weapon `9X 2`
  without the X-over. The numbers are quiet programmer jokes (2^8, HTTP 404, 20 KiB).
- `NCTR` is boxed and the sensitivity reads `7`, as in the reference figure.
- Level flight: the horizon line passes through the velocity vector.
- The velocity vector's circle centre is on (0, 136.5). The extracted symbol's origin is its bounding-box centre, so it
  is drawn 15 DI higher. This anchor is inferred; the reference shows the horizon through the circle's centre.
- The acquisition cursor rests at (−270, 250), up and left of the velocity vector, clear of the horizon line.
- No TUC, tracks, L&S or bullseye: nothing is designated in RWS.

## 3. Behaviour (ours)

| Item | Value | Why |
|---|---|---|
| Scan | 60°/s across ±70°, a triangle wave from the left edge | design section 12 |
| Bars | 4; each sweep moves to the next bar, then back to bar 1. Bar centres +2.1°, +0.7°, −0.7°, −2.1° | the caret steps per bar; the PB6 bar number follows |
| Elevation scale | 201.75 DI per 30°, from the elevation ticks | |
| Contacts | 5, from `content/radar.ts`: range, azimuth, relative speed and track at t = 0 | an explicit list is easier to tune than a seeded PRNG |
| Volume | 2–80 NM, ±70°. A contact flies a straight line and re-enters where it first came in | design: "respawns at the far edge" |
| Raw hits | A hit moves only when the sweep crosses the contact (bisection inside each sweep). It dims linearly and ages out after 8 s | RWS refreshes a brick per pass. 8 s is the middle of the DATA aging options (2–32) |
| Range scales | 5, 10, 20, 40, 80, 160 NM; opens at 40; stops at the ends | design section 12 |
| Cursor limits | our altitude ± range × tan(3.75°), in thousands of feet, lower limit ≥ 0 | 4 bars × 1.4° + 3.3° beam |

The sim is a pure function of sim time (`pages/radar/sim.ts`), so the server renders the t = 0 frame and tests can
check any frame.

## 4. Rendering and interactions

- `DdiScreen.live` (new): the frame draws it in the square in a second `EmissiveLayer` with `bloom={false}`. The sweep
  line, caret and hits live there, so the night bloom never re-blurs per frame (design section 6.3).
- `RadarScope` (client) runs a `requestAnimationFrame` loop on a fixed 50 ms schedule (20 Hz). It writes `transform`,
  `opacity` and `visibility` through refs, so React never re-renders per frame. A frame advances the sim by at most
  100 ms. The loop stops on `visibilitychange` when hidden and never starts under `prefers-reduced-motion`, which
  leaves the server's t = 0 frame.
- The range arrows are OSB islands (`RangeOsb`): they fire on press like every OSB and are marked
  `data-action="state"`, so the plain view hides them. A small module store (`pages/radar/store.ts`) shares the range
  with the scope and the readouts through `useSyncExternalStore`. The scope resets it on unmount, so each visit opens
  at 40 NM. The URL never changes.
- The bar number is a tiny island in the top strip that re-renders once per sweep.
- Every other legend is an inert `aria-disabled` button. PB1, PB2 and PB5 carry no legend lines: the format draws their
  text, because the Lua does not use `add_PB_label_RDR` for them.

## 5. Deviations

- Monochrome green; DCS draws the cursor and TUC yellow on colour displays.
- The bar sequence, bar spacing, aging time and scan rate are ours; the C++ radar model is not in the Lua.
- Raw hits refresh on every sweep, not only on the bars where the contact's elevation lies.
- Playful identifiers were not added: RWS shows no text beside raw hits (the altitude text is 1LOOK/RAID only).
