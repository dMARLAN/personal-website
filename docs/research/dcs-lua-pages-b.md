# DCS F/A-18C DDI page scripts, part B: text, list and navigation pages

Source: `Mods/aircraft/FA-18C/Cockpit/Scripts/Multipurpose_Display_Group/Common/indicator/Pages/MPD/` in the read-only DCS install. Everything below is transcribed from those Lua files. A few helper definitions come from `symbology_defs.lua`, `Common_page_defs.lua`, `MPD_PB_defs.lua`, `MPD_page_defs.lua` and `Common_init.lua`.

Scope: CHKLST, BIT (main, sublevels and SW_CONFIG), FPAS, MUMI, MIDS, EW, ADI/SPIN, HSI (main and DATA sublevels), SA, TGT DATA and UFC BU. The foundations (colours, font glyphs, the OSB framework, the MENU/caution page and the TAC/SUPT menus), and the STORES, ENG, FUEL and FCS pages, are covered in other notes.

Renders (SVG plus 800 px PNG): `docs/research/figures/dcs-{hsi,adi,ew,bit,bit-nav,sw-config,chklst,mumi,tgt-data-group,tgt-data-ownship,hsi-data-wypt,fpas}.svg/.png`.
Generator: `scratchpad/dcs-pages-b/{ddi.py,pages.py}` (`uv run --with cairosvg python pages.py`). Dynamic fields contain sample values. Text is drawn in DejaVu Sans Mono, forced to the exact DCS string widths with `textLength`, so glyph shapes are approximate but widths and placement are exact.

---

## 0. Conventions you need to read the numbers

### Coordinates and primitives
- **Units are Display Increments (DI).** The origin is the display centre. +x is right and **+y is up**. The visible symbology rectangle is -512..+512 (`MPD_base.lua`).
- `addStrokeLine(name, length, pos, rot)` starts at `pos`. `rot` is in degrees, counter-clockwise from up, so `0` points up, `-90` points right, `90` points left and `180` (or `-180`) points down.
- `addStrokeArc` and the compass helpers place points at `(r*sin a, r*cos a)`, measuring the angle clockwise from up.
- `addStrokeBox(w, h, align, pos)` and `addFillBox` take a 9-way alignment such as `LeftCenter` or `CenterTop`.
- `add_X_Over(w, h, pos)` draws two diagonals across a w×h rectangle.
- Clipping uses `openMaskArea`/`closeMaskArea` with `setClipLevel(obj, 1)`. Elements at clip level 1 are visible only inside the opened mask.

### Materials
Every element uses the default stroke material (`stroke_material`, which is green) unless noted otherwise. The exceptions in scope:
- The ADI director bars and the HSI GRID / SA TDC cursors switch to yellow through `MPD_RDR_EADI_SetYellowColor`, `MPD_HSI_GRID_SetYellowColor` and `MPD_SA_SetYellowColor`.
- The HSI GBU-24 pre-planned LAR lines use `INDICATION_COMMON_AMBER`.
- SA EW threat symbols are recoloured through `MPD_SA_EW_Color`.
- The ADI debug texture `INDICATION_MPD_ADI_DBG` has `isdraw=false`.
- In `MDG_strokesDefs.lua`, stroke thickness is 0.8 and fuzziness is 0.5 (engine units).

### Text metrics (`Common_page_defs.lua`)
The advance is the glyph width plus the interchar spacing. Width of a string = n·w + (n−1)·ic. The line pitch inside a multi-line string is h + interline.

| font | h | w | interchar | interline | **advance** | **line pitch** |
|---|---|---|---|---|---|---|
| 100 % | 20 | 12 | 4 | 5 | **16** | 25 |
| 120 % | 24 | 14 | 6 | 6 | **20** | 30 |
| 150 % | 30 | 18 | 6 | 12 | **24** | 42 |
| 200 % | 40 | 24 | 12 | 12 | **36** | 52 |
| `PB_TextFont` (OSB legends) | 24 | 14 | 6 | 6 | 20 | 30 |
| `BIT_PageFont` (BIT, SW_CONFIG) | 24 | 14 | 6 | **8** | 20 | 32 |
| HSI DATA `CustomStrDef` | 30 | 18 | **11** | 12 | **29** | 42 |
| ADI pitch labels (`customStringDef120`) | 24 | 14 | **17** | 6 | 31 | — |

### OSB legend placement (`add_PB_label`)
PB positions come from `MPD_PB_defs.lua`.

| PBs | positions |
|---|---|
| PB n = 1..5 (left side, **PB1 at the bottom**) | (-500, 307 − 167·(5−n)), so y = -361, -194, -27, 140, 307 |
| PB 6..10 (top, left to right) | (-336 + 169·(n−6), 500), so x = -336, -167, 2, 171, 340 |
| PB 11..15 (right side, top to bottom) | (500, 307 − 167·(n−11)) |
| PB 16..20 (bottom, **right to left**) | (-336 + 169·(20−n), -500), so PB16 is at x=340 and PB20 at x=-336. PB18 at (2,-500) holds MENU. |

How the legends are laid out:
- **Side legends are written vertically**, one character per line (pitch 30). Left legends are `LeftCenter` and right legends `RightCenter`.
- Extra arguments step **25 DI inward** as additional columns.
- Top legends are `CenterTop` and bottom legends `CenterBottom`. Extra arguments step **35 DI** inward, so a second bottom argument sits *above* the first.
- Boxed legends:
  - Horizontal: a box `len·22 × 36`, offset 6 DI outward.
  - Vertical: a box `26 × len·32`.
- `addMenuLabel("MENU")` draws `MENU` at (0,-446) in the 150 % font (MUMI and UFC_BU call it directly).

### Navigation is not in Lua
`Common_init.lua` only states which subsets each page loads and maps `pages_by_mode[LEV1][LEV2][LEV3][LEV4]` to page IDs (`display_formats_IDs.lua`). The OSB-to-format transitions live in the C++ MDG device. The **sub-level** switching *inside* a page is visible in Lua as placeholders gated by `*_PB_Label_*` controllers; those are listed per page below.

### Page assembly (from `Common_init.lua`)
Every page starts with `SUBSET_BASE` (the masks) and nearly all add `SUBSET_SPECIFIC` (the caution/advisory and MENU page). The exceptions are HSI_DATA_GRID, MAV/JDAM/SLAM video and similar pages.

| page | subsets added |
|---|---|
| BIT_MAIN | BIT_COMMON, BIT_MAIN |
| BIT_COMM, BIT_DISPLAYS, BIT_EW, BIT_NAV, BIT_SENSORS, BIT_STAT_MON, BIT_STORES | BIT_COMMON, BIT_SUBLEVEL_COMMON, BIT_xxx |
| BIT_FCS_MC | BIT_COMMON, BIT_FCS_MC (no SUBLEVEL_COMMON) |
| SW_CONFIG | BIT_COMMON, SW_CONFIG |
| EW_MAIN | EW_COMMON, EW_MAIN |
| EW_MAIN_RWR | EW_COMMON, EW_MAIN, EW_MAIN_RWR |
| EW_PROG | EW_COMMON, EW_PROG |
| ADI | ADI_SPIN_common, ADI |
| SPIN | ADI_SPIN_common, SPIN |
| HSI_MAIN | HSI_BACKUP_COMMON, HSI_MAIN |
| HSI_DATA_AC, HSI_DATA_WYPT, HSI_DATA_TCN | standalone |
| TGT_DATA_OWNSHIP | TGT_DATA_COMMON_PBs, TGT_DATA_OWNSHIP |
| TGT_DATA_GROUP | TGT_DATA_COMMON_PBs, TGT_DATA_GROUP |

---

## 1. Text-list layout constants (the summary you want for website content)

"Max chars" assumes the stated font. It is measured to about x=±470, which is the inner edge of the vertical side-OSB legends at ±500 minus their 14 DI glyph width.

| page | font / advance | first row y | row pitch | rows | columns (x, align) | max chars per field |
|---|---|---|---|---|---|---|
| **BIT FAILURES** (`BIT_MAIN`) | BIT 120 % / 20 | 161 | **37** (24+13) | **17** per page, last at -431; `PAGE` on PB16 | name x=**-173** L, status x=**29** L | name **10** (to x=29). Status **13** while the right-hand group labels exist (rows at y ≥ −64, limit x≈297), **22** below that. Whole row -290..283 = **28** |
| BIT sublevels (NAV, COMM, …) | BIT 120 % / 20 | 161 | 37 | 3–8 used (same 17-row grid) | same as above | same; the side OSB legends are horizontal `"   NAME"` with a 24 DI tick |
| BIT group blocks (main page) | BIT 120 % / 20 | — | — | 5 left + 3 right | left label x=-500 `LeftBottom` at PB_y+13, rule 200 DI from x=-503 at PB_y, status `LeftTop` at PB_y−13; right side the same at x=300 (rule 297..497) | 10 (200 DI rule) |
| **S/W CONFIGURATION** | BIT 120 % / 20 | 180 | **37** | **12 × 2** columns (y 180 .. -227) | left: name -370, value -220. Right: name 80, value 230 | name **7**, left value **15**, right value **12** (sample `XXXXXXXX` = 8) |
| **CHKLST** | 150 % / 24 | 408 (heading) | **46.5** (30·1.55) | 15 used, 18 fit to y≈-382 | headings x=-289.5 / 60; items x=-264.5 / 85 (+25 indent); value column x=-79.5 | left items **13**, right items **16**, full width from -289.5 **31** |
| **MUMI** | 150 % and 120 % | free layout | — | ~8 lines | see §5 | MU ID value **23** @150 %; ERRORS line ≈**37** @120 % |
| **TGT DATA GROUP** | 120 % / 20 | header 308, rows 236/190/144/98 (top table); -112, -184/-230/-276/-322 (bottom table) | **46** | 4 + 4 | top: 9 columns at x=-340, -244, -125, -93, -61, -29, 55, 170, 275. Bottom: 7 columns at -340, -244, -110, -10, 95, 195, 290 | interior 800 DI ≈ **39**; per column 4–5 |
| **TGT DATA OWNSHIP** | 120 % / 20 | 335 | **41** (status and stores), **45** (IFF) | 5 + 5 + 3 | labels `RightBottom` at x=-210, values `LeftBottom` at -185; stores at x=43; IFF at x=35 | left values **9** (to the divider at x=0); right half **17** |
| **HSI DATA WYPT / AC / TCN** | HSI-data 150 % / **29** | 210 (WYPT, AC), 232 (TCN) | **48** | WYPT 4 + 4 + 2; AC 5 + 3; TCN 5 | WYPT labels x=-320, values -175 / centre 130; AC labels -170, values 0 / -20 / -40 / 95; TCN labels -150, values 0 | from -320: **27**; from -170: **22** |
| **FPAS** | 120 % / 20 | see §4 | 96/49 and 50/52 (irregular) | 3 + 3 table rows | right-aligned value columns at 36 / 358 and 54 / 386 | label column ≈ 22 |
| **MIDS** | 120 % / 20 | 341 | **67** (status), **54** (channels) | 4 + 3 | labels `RightBottom` at varying x; values at label x + 25 | cautions line from x=-330, ≈ **40** |
| **SA data windows** | 120 % / 20 | top 400, bottom -340 | **30** | 4 per corner + 2 centre | left x=-450 (rows 2–3 indented +30), right x=450 `RightCenter`, centre x=0 | ≈ 18 per corner window |
| HSI top-corner blocks | 120 % / 20 | 400 | **30** | 4–5 | left x=-450 (+30 indent), right x=450 `RightCenter` | ≈ 16 |
| UFC BU channel table | 120 % / 20 | **set by controller** | ? (≥ 50, box height) | 12 | columns x=-200, -20, 180 (`CenterCenter`); selection box 480×50 | ≈ 8–9 per column |

---

## 2. CHKLST (`Checklists.lua`)

All text is 150 % (`STROKE_FNT_DFLT_150`), `LeftCenter` unless noted. Let B = 30 (`glyphNominalHeight150`). Then row pitch = 1.55·B = **46.5**, indent = B−5 = **25**, `LandX = -9.65·B = -289.5` and `LandY = 13.6·B = 408`.

| row k (y = 408 − 46.5·k) | left column | right column |
|---|---|---|
| 0 (408) | `LAND` at x=-289.5 | `T.O.` at x=60 |
| 1 (361.5) | `WHEELS` at -264.5 | `CONTROLS` at 85 |
| 2 (315) | `FLAPS` | `WINGS` |
| 3 (268.5) | `HOOK` | `TRIM` |
| 4 (222) | `ANTI SKID` | `FLAPS` |
| 5 (175.5) | `HARNESS` | `HOOK` |
| 6 (129) | `DISPENSER` | `HARNESS` |
| 7 (82.5) | — | `WARN LITES` |
| 8 (36) | — | `NWS LO` |
| 9 (-10.5) | `A/C WT` at -289.5; value at **-79.5** (`MPD_CHECKLIST_Weight`) | `SEAT ARM` |
| 12 (-150) | `MAX NZ` at -289.5 (static; the guide image shows no value) | |
| 14 (-243) | `STAB POS` `CenterCenter` at x=0. Left value at -264.5 and right value at 115, both `{{"MPD_CHECKLIST_Stabs", 0/1}}`, formats `"%2d° NU" / "%2d° ND" / "%2d°  "` | |

- No OSB legends. MENU comes from the caution/menu page.
- There is no paging or sub-navigation, and no other dynamic behaviour.
- Render: `figures/dcs-chklst.*`, which matches `guide-page-81-checklist-page.png`.

---

## 3. BIT (`BIT/*.lua`)

### Common definitions (`BIT_defs.lua`)
- `BIT_titlePosY = 237`. Titles are 200 % and `CenterCenter` at (0,237).
- `BIT_ItemPosY = 161`, `BIT_ItemNamePosX = -173`, `BIT_ItemStatusPosX = 29`, item pitch = 24 + 13 = **37**.
- Status strings `BIT_StatMsgs`, by index: `""`, `IN TEST`, `RESTRT`, `SF TEST`, `OFF`, `NOT RDY`, `MUX FAIL`, `DEGD+OVRHT`, `OVRHT`, `DEGD`, `OP GO`, `GO`, `PBIT GO`. The longest is 10 characters.
- 52 equipment items, `EquipItems`. These are the strings that the failure list can show:
  - FCS-MC: MC1, MC2, FCSA, FCSB
  - SENSORS: RDR, FLIR, LST, LDT, LTDR, CAM, NFLIR, ATARS
  - STORES: SMS, AWW-4, CLC, WPNS
  - COMM: CSC, ICS, IFF, D/L, COM1, COM2, COM3, MIDS
  - NAV: INS, GPS, ADC, ILS, RALT, TCN, BCN, AUG
  - DISPLAYS: LDDI, RDDI, MPCD, HUD, IFEI, UFC, DMS, HMD
  - Aft cockpit: ALDDI, ARDDI, AMPCD, AIFEI
  - STATUS MONITOR: SDC, MU, AISI, DFIRS
  - EW: RWR, IBS, ALE-47, ASPJ
- `add_BIT_item_PB_label(name, PB, ctrl)` draws:
  - a 24 DI vertical tick at the PB position, centred;
  - horizontal text `"   NAME"` (`LeftCenter`) on the left side, or `"NAME   "` (`RightCenter`) on the right side.

  The three leading spaces are 3·14 + 2·6 = 54 DI. These item legends are **horizontal**, unlike normal OSB legends.
- `add_BIT_item_status_next(item)` adds a row: the name at -173 and the status at 29 via `{"MPD_BIT_ItemStatus", idx}`.

### BIT_COMMON (on every BIT page and SW_CONFIG)
- PB9 `MI`, boxed when `MPD_BIT_MemoryInspectActive==1`.
- PB10 `STOP`.
- When MI is active, a `076-arrow-up` sits at PB6 and a 180°-rotated copy at PB7.

### BIT_MAIN — "BIT FAILURES" (render: `figures/dcs-bit.*`)
- Title `BIT FAILURES`, 200 %, at (0,237).
- OSB legends:
  - PB6 `AUTO` and PB7 `CONFIG`, both hidden while MI is active.
  - PB8 `SELBIT`, boxed by `MPD_BIT_SEL_BIT_active`.
  - PB16 `PAGE` (`MPD_BIT_PageLabel`).
- **Equipment-group blocks** (one per OSB, 200 DI rule, `BIT_groupInterLine` = 13):
  - Left side: PB5 `FCS-MC`, PB4 `SENSORS`, PB3 `STORES`, PB2 `COMM`, PB1 `NAV`.
  - Right side: PB11 `DISPLAYS`, PB12 `STATUS\nMONITOR` (two lines), PB13 `EW`.
  - Geometry:
    - label `LeftBottom` at (PBx + off, PBy + 13);
    - `addStrokeLine` of 200 DI from (PBx + off − 3, PBy), pointing right;
    - status `LeftTop` at (PBx + off, PBy − 13) via `{"MPD_BIT_EquipGroupStatus", group}`.

    `off` is 0 on the left and -200 on the right, so right-side blocks start at x=300.
- **Failure list:** 17 rows (`BIT_FAILURES_AT_ONE_PAGE`) at y = 161 − 37·k.
  - Name at x=-173 via `{"MPD_BIT_FailureItem", k}`, which indexes the `EquipItems` names.
  - Status at x=29 via `{"MPD_BIT_FailureStatus", k}`.
  - When more than 17 items have failed, PB16 PAGE steps pages; the logic is in C++.
- PB7 CONFIG leads to SW_CONFIG. The group OSBs lead to the sublevels listed below (the mapping is in C++, but the button positions say which).

### Sublevels
Each sublevel has a title at (0,237) at 200 %, item OSB legends with ticks, and a status list in the 37-pitch grid. `BIT_SUBLEVEL_COMMON` adds PB6 `ALL` (hidden in MI) and PB8 `BIT`.

| page | title | item OSB legends (PB) | list rows (in order) | bottom legends |
|---|---|---|---|---|
| BIT_NAV (render `dcs-bit-nav.*`) | NAV | TCN 1, RALT 2, ILS 3, ADC 4*, INS 5*, AUG 11, BCN 12, GPS 13 | INS, ADC, ILS, RALT, TCN, AUG, BCN, GPS | 16 `MAD\nCAL`*, 17 `ADC\nMAINT`*, 19 `INS\nMAINT`*, 20 `INS\nGB`* |
| BIT_COMM | COMM | D/L 2, IFF 3, ICS 4, CSC 5*, COM1 11, COM2 12, MIDS 15 | CSC, ICS, IFF, D/L, COM1, COM2, MIDS | — |
| BIT_DISPLAYS | DISPLAYS | DMS 2, UFC 3, IFEI 4. PB5 is a bracket group of DDI, MPCD and HUD: placeholder at PB5, texts at y offsets +24 (`LeftBottom`), 0 and −24 (`LeftTop`), two 80 DI rules at ±18 starting x=54, and a vertical rule 96 DI long. HMD 11 | LDDI, RDDI, MPCD, HUD, IFEI, DMS, HMD | 16 `UFC\nMAINT`, 17 `HMD\nMAINT` |
| BIT_EW | EW | ALE-47 3, IBS 4 | RWR, IBS, ALE-47, ASPJ | — |
| BIT_SENSORS | SENSORS | LTDR 3*, FLIR 4*, RDR 5 | RDR, FLIR, LTDR | 17 `RDR\nMAINT` |
| BIT_STAT_MON | STATUS MONITOR | DFIRS 2, AISI 3, MU 4, SDC 5, FQTY 14, FXFR 15 | SDC, MU, AISI; plus `TK2FL` / `TK3FL` at rows 12–13 (y=-283 / -320), with `MPD_BIT_TK2FL_Status` / `TK3FL_Status` (same messages, "NO TEST" at index 5) | PB7 `MSP`, 17 `FIRAM\nMAINT`* |
| BIT_STORES | STORES | CLC 3, AWW-4 4*, SMS 5* | SMS, AWW-4, CLC, WPNS | PB7 `STATION`, 17 `SMS\nMAINT`* |
| BIT_FCS_MC (no SUBLEVEL_COMMON) | FCS-MC | FCS 5* | MC1, MC2, FCSA, FCSB | PB6 `ALL`*, PB8 `BIT`, 16 `FCS\nOPTION`*, 17 cycles through `FCS\nMAINT`, `FCS\nNWS`, `FCS\nATC`, `FCS\nRIG`, `FCS\nTG1`..`TG12` (`MPD_BIT_FCS_OPTION_label`) |

`*` = gated by `{"MPD_BIT_ItemIsAvailable", BIT_itemsWithAvailability.X}`.

### SW_CONFIG (render: `figures/dcs-sw-config.*`)
- Title `S/W CONFIGURATION\nUSN`, 200 %, `CenterCenter` at (0,300). The lines centre at y≈326 and 274.
- OSB legends: PB8 `BIT` (back), PB20 `OVRD`, plus BIT_COMMON's MI and STOP.
- Items at y = 180 − 37·k, all with the static value `XXXXXXXX` (no controller):

  | column | name x | value x | items |
  |---|---|---|---|
  | left | -370 | -220 (`softwareIdIdentX` = 150) | ADC, ALE-47, ASPJ, *(blank row; ATARS slot)*, CLC, CSC, DFIRS, DMS, FCSA, FCSB, FLIR, HMD |
  | right | 80 | 230 | IFF, INS, LDDI, LDT, MC1, MC2, MIDS, MU, RDDI, RDR, SDC, SMS |

---

## 4. FPAS (`FPAS.lua`) (render: `figures/dcs-fpas.*`)
All text is 120 %.

**`addUnderlinedText(t, pos)`** draws the text `CenterBottom` at `pos`, plus a rule of width(t) + 6 DI starting at (x − len/2, y − 6) and pointing right.

**Upper half: CURRENT**
- `CURRENT` at (0,413).
- Column heads at y=364: `RANGE` at x=10, `ENDURANCE` at 328.
- Rows, all `LeftBottom`:
  - y=316: `TO       LB` at x=-425, with target fuel `2000` `RightBottom` at -271 (-425 + width of 8 characters) via `MPD_FPAS_TargetFuelRemaining`.
  - y=220: `BEST MACH` at -428.
  - y=171: `TO       LB` at -412, with its value at -258.
- Value columns are `RightBottom` at x=**36** (range) and **358** (endurance), via `MPD_FPAS_Current*`. The formats are `XXX`, `.XX`, `XXX` and `:XX`, `.XX`, `:XX`.
- NAV TO strip:
  - Heads at y=111: `NAV TO` at -333, `TIME` at -108, `FUEL REMAIN` at 132, `LB/NM` at 403.
  - Values at y=61, `RightBottom`: steer name at -267, time at -54, fuel at 166, ff at 417 (`MPD_FPAS_Steering*`, `MPD_FPAS_FuelFlowRate*`).
- A **1024 DI divider** from (-512,22), pointing right.

**Lower half: OPTIMUM**
- `OPTIMUM` at (0,-51). Heads at y=-93: `RANGE` at 10, `ENDURANCE` at 333.
- Row labels at x=-434: `ALTITUDE` (y=-139), `MACH` (-189), `TO       LB` (-241, with `2000` at -280).
- Values `RightBottom` at x=**54** and **386** (`MPD_FPAS_Optimum*`).
- `DEFAULT:` at (-434,-314). Then `TEMP DRAG FF` at x=-434 + width of 9 characters = -260 (`MPD_FPAS_Default`).

**OSB legends**
- PB20 `CLIMB` (label `MPD_FPAS_CLIMB_Label`, box `MPD_FPAS_CLIMB_Box`).
- `HOME` `CenterBottom` at (255,-500), right next to PB16.
- Home waypoint number `RightBottom` at (272,-455), with an X-over 64×30 at (255,-442) when invalid.
- `075-arrow` up and down symbols at PB16 / PB17, gated by `MPD_FPAS_CanCalculateHomeFuelCaution`.

---

## 5. MUMI (`MUMI.lua`) (render: `figures/dcs-mumi.*`)

**Sub-navigation**
Two legend sets under `MUMI_root`. Placeholder `MPD_MUMI_PB_Label_Main` shows sublevel 0 and `MPD_MUMI_PB_Label_More` shows sublevel 1. Every legend is boxed by its own `MPD_MUMI_<NAME>_Box`.

| set | legends |
|---|---|
| **Main** | 1 RECCE, 2 HARM, 3 RDR, 4 TCN, 5 WYPT, 6 BIT, 7 MI, 8 IFF, 9 `DL 13`, 10 **MORE**, 11 ID, 12 MON / FATG, 13 COMM, 14 HOLD, 15 ERASE, 16 ALR67, 17 D/L, 19 ALM / GPS, 20 WYPT / GPS |
| **More** | 1 PB, 2 NET3, 3 NET2, 4 NET1, 5 SA, 7 JSOW, 8 JDAM, 9 SLAMR, 10 **RETURN**, 14 CAS / DCS, 15 NETS / DCS, 16 FLRP, 17 WIND, 19 PROG / ROE, 20 GPI |

`MENU` is drawn by `addMenuLabel` at (0,-446), 150 %.

**Information block** (placeholder `MUMI_Information`):

| element | font | position | content / controller |
|---|---|---|---|
| `MU ID ` | 150 % `CenterCenter` | (-180, 370) | static |
| MU ID value | 150 % `LeftCenter` | (-100, 370) | sample `ABCDEFGH`, `MPD_MUMI_MU_ID_Text` |
| rule | — | from (-300, 340), 570 long, pointing right | — |
| ID field 1 | 120 % centred | (-190, 250) | `MPD_MUMI_MU_ID_1_Text`; rule 200 DI at (-290, 220) |
| ID field 2 | 120 % centred | (100, 250) | `..._2_Text`; rule 200 DI at (0, 220) |
| vertical rule | — | (-50, 220) down 290, to y=-70 | — |
| `MC` / value | 120 % centred | (-350, 170) / (-200, 170) | sample `15C-XXXU` |
| `SMS` / value | 120 % centred | (-350, 100) / (-200, 100) | sample `15C-XXXU` |
| `DATA XFER` | 120 % centred | (-210, 10) | `MPD_MUMI_DATA_Text` |
| rules | — | 750 long from (-400,-100) and (-400,-250) | — |
| `ERRORS: ` / list | 120 % centred | (-300, -140) / (-70, -140) | sample `HARM, NET 1`, `MPD_MUMI_ERRORS_Text` |
| `MU LOAD` | 150 % centred | (-320, -330) | `MPD_MUMI_MU_LOAD_Label` (blinks / visible during a load) |

The two 750 DI rules frame a single-line "ERRORS" band, 150 DI tall.

---

## 6. MIDS (`MIDS.lua`)
All text is 120 %.

**Status block** (labels `RightBottom`, values `LeftBottom` at label x + 25):

| label | label at | value controller | value strings |
|---|---|---|---|
| `NET ENTRY:` | (25, 341) | `MPD_MIDS_NetEntry` | "", `NO ENTRY`, `CHK TIME`, `PENDING`, `COARSE`, `FINE` |
| `DATE:` | (-55, 274) | `MPD_MIDS_Date` | `XX/XX/XX` |
| `TIME:` | (-30, 207) | `MPD_MIDS_Time` | `XX:XX:XX` |
| `NETWORK:` | (10, 140) | `MPD_MIDS_Network` | `NET 1`, `NET 2`, `NET 3` |

The colons line up on a ragged right edge, with a row pitch of 67.

**Channels** (`MPD_MIDS_Channel` index 0..4; value `RightBottom`):

| label | label at | value right edge at |
|---|---|---|
| `AIC:` | (-142, 27) `RightBottom` | x=-68 |
| `F/F 1:` | (-142, -27) `RightBottom` | x=-68 |
| `VOICE A:` | (-142, -81) `RightBottom` | x=-68 |
| `F/F 2:` | (16, -27) `LeftBottom` | x=210 |
| `VOICE B:` | (16, -81) `LeftBottom` | x=250 |

**Dividers:** two 725 DI symmetric rules at y=-118 and y=-292. Cautions text is an empty string at (-330,-172), `LeftBottom`.

**OSB legends**

| PB | legend |
|---|---|
| 1 | `IPF` / `EXER` |
| 2 | `IPF` boxed / `RSET` |
| 3 | `MSTR` boxed / `RSET` |
| 5 | `NAV` boxed / `RSET` |
| 11 | `ENTRY` / `NET` |
| 12 | `TIME` / `SET` |
| 16 | `RELAY` |
| 17 | `XMIT` / `UPPER` (`MPD_MIDS_XMIT_Antenna`) |
| 19 | `PWR` / `NORM` (`MPD_MIDS_PowerMode`) |
| 20 | `O/H OVRD` boxed / `MIDS` |

**Top row sub-levels** (`MPD_MIDS_PB_Label_Main_PB_6_10` = 0..3):

| sublevel | legends |
|---|---|
| 0 main | 6 `NONE` (user type) · 8 `MODE` / `NORM` · 10 `NTR` |
| 1 user type | 7 `PRI USER`, 8 `SEC USER`, 9 `PRINAV CNTLR`, 10 `SECNAV CNTLR`, each boxed by `MPD_MIDS_UserTypeOption_Box` |
| 2 mode | 8 `NORM`, 9 `POLL`, 10 `SIL` (`MPD_MIDS_ModeOption_Box`) |
| 3 NTR | 9 `ENABLE NTR`, 10 `RETURN CNTLR` |

---

## 7. EW (`EW/*.lua`) (render: `figures/dcs-ew.*`)

### EW_COMMON (every EW page)
- **Countermeasure counters**, 120 %, two lines: `"C\n%3d"` at (-390,400), `"F\n%3d"` at (-320,400), `"O2\n%3d"` at (320,400), `"O1\n%3d"` at (390,400). Controller: `MPD_EW_CmCounter` index 0..3.
- A box 64×30 `CenterTop` at the same point (`MPD_EW_CmCounterBox`) frames the number line.
- OSB legends:
  - PB6 `ASPJ\n{OFF|STBY|BIT|REC|XMIT}`.
  - PB7 `ALR-67\n{OFF|RCV|}`.
  - PB8 `ALE-47\n{OFF|SF TEST|PBIT GO||STBY|S/A %d|AUTO %d|MAN %d}`. It is boxed by `MPD_EW_ALE47_MODE_label,1`, gets an X-over 154×60 when the ALE-47 has failed, and a 154 DI dash when its controller value is 3.
  - PB16 `HRM OVRD` with `SP`, `TOO` or `PB` (`MPD_HARM_OVRD_Opt`).
  - PB20 `STEP`.

### EW_MAIN: RWR azimuth rings
| element | geometry |
|---|---|
| circles at the origin | r = **70** (status), **224** (lethality), **400** (outer) |
| 24 dashes, every 15° | 20 DI each, from r=414 to 434, radial (start `(sin,cos)·414`, rot −15·i) |
| 3 o'clock / 9 o'clock bars | in each quadrant, 3 parallel 86 DI lines starting at x=±438.7, y=±(24, 26, 28), pointing toward the centre (x span ±352.7..±438.7). This gives a thickened pair of bars straddling the outer ring above and below the horizontal axis |
| legends | PB9 `ARM` (`MPD_EW_ARM_label`); PB19 `MODE` |

### EW_MAIN_RWR: symbols on top of the rings
- `136-aircraft` at the centre, under `MainPageParent`.
- Priority `NORM`/`AI`/`AAA`/`UNK`/`FRND` at (-430,-330), `OFFSET` at (-430,-360) and `LIMIT` at (-430,-390), all `LeftCenter` 120 %.
- **16 threat slots.** Each one has:
  - a placer `MPD_EW_ALR_ThreatPos` and a flasher `MPD_EW_ALR_ThreatFlash`;
  - a text symbol `MPD_EW_ALR_ThreatSymbol`;
  - special symbols: square, boat, cross, octagon, AAA, SAM, acquisition, hostile, friendly or ambiguous, warning, FLIR, HARM, STT;
  - a variable-length azimuth line `MPD_EW_ALR_AzimuthLine`.

  This uses `TEWS/indicator/RWR_ALR67_Common_definitions.lua`.
- **BIT pages** (under `BitPageParent`, 200 % text):
  - Page 1: `13` at (0,348) and `GM` at (0,-348); `F` at 348 DI and 225°; `R` plus 64 DI boxes at r=260 on the diagonals; fail letters `C`/`S`/`A`/`L`/`T` at y = 176, 88, 0, -88, -176.
  - Page 2: `1 2 6` at y=160, `H R M` at 0, `IB` at -160.
  - Pages 3–6 (`MPD_EW_ALR_BIT_GetPage`) are a fixed-format text test: `THE\n\nQUICK\n\nBROWN` · `FOXES\n\nJUMPED\n\nOVER` · `THE\n\nLAZY\n\nDOG` · `01234\n\n56789`. **This is a ready-made easter egg for the site.**
- PB14 `HUD`, shown by `MPD_EW_ALR67_Option_show` and boxed by `MPD_EW_ALR67_HUD_Box`.

### EW_PROG (CMDS program edit)
- `CMDS PROG %d` centred at (0,0). A 700 DI rule from (350,-45), pointing left.
- Parameter row, two lines each, 120 % centred at y=-100:
  - `CHAFF\n%d` at x=-298
  - `FLARE` at -155
  - `OTH1` at -22
  - `OTH2` at 102
  - `RPT` at 215
  - `INT\n%.2f` at 318
- OSB legends:
  - PB5 `CHAF`, PB4 `FLAR`, PB3 `OTH1`, PB2 `OTH2`, PB14 `RPT`, PB15 `INT`, each boxed by `MPD_EW_PROG_Parameter_Box,k`.
  - PB9 `RTN`, PB19 `SAVE`.
  - `124-arrow` up and down at PB12 / PB13.

---

## 8. ADI and SPIN (`ADI_SPIN/*.lua`) (render: `figures/dcs-adi.*`)

### ADI.lua
**Ball outline and fixed marks**
- Ball: `addStrokeCircle` with **R = 310**, centred at **(0, 100)**.
- `145-waterline` from `stroke_symbols_HUD` at (0,100), scale 1.2. Its SVG polyline is (-42,0) (-24,0) (-12,-24) (0,0) (12,-24) (24,0) (42,0).
- **Bank ticks** sit on the *lower* half (the bank scale is at the bottom). For i = 0..6, a 20 DI tick at `(-R·cos(−30i), R·sin(−30i)+100)` with rot 90+30i, pointing outward. That puts ticks at 0°, 30°, 60°, 90° (bottom), 120°, 150° and 180°. Short 10 DI ticks are at −70°, −80°, −100° and −110°, which correspond to bank angles of ±10° and ±20°.

**Pitch ladder** (inside mask `ADI_Mask`, a circle of R=310; everything at clip level 1, parent `ADI_center` driven by `{"MPD_ADI_PitchRoll", 900}`)
- **10 DI per degree**: `OffsetBetweenNumbers` = 100 DI per 10°.
- Vertical centre line 3000 DI long, from (0,-1500).
- Labels `abs(i).."0"` at y = 100·i for i = -8..8, using the 120 % font with interchar 17. The label at 0° reads **"00"**.
- 10 DI horizontal ticks centred at y = 100i − 50 (the 5° marks), plus ±85°.
- A zenith circle (r=20) at y=+900. A nadir circle (r=20) with an X at y=-900.
- Labels beyond nadir and zenith read 80, 70, 60.
- **Ground fill:** 121 horizontal lines of 775 DI, spaced **10 DI** apart, from y=-2 down to -1202 (centred). The stroke glow merges them into a hatched or solid lower hemisphere. A web renderer can use a filled half-plane with a line-pattern texture.

**Rate-of-turn indicator** (root at (0,-295), visible on `MPD_ADI_Rate_or_Turn_Valid`)
- Boxes 50×40 at x = -100, 0 and 100.
- A moving 50×50 box at (0,-65) relative to the root, offset ±100 by `MPD_ADI_Rate_or_Turn`.

**ILS director bars** (yellow via `MPD_RDR_EADI_SetYellowColor`)
- A vertical bar 496 long through (0,100) and a horizontal bar 496 long. Both are driven by `Common_IndicatorLandingSystem`.

**OSB legends**
- PB16 `" STBY "` and PB20 `" INS "`, boxed by `MPD_ADI_Source_Box` 0 or 1. PB16 is on the right and PB20 on the left.

### ADI_SPIN_common.lua (EADI data, also used by SPIN)
| element | geometry | font / controller |
|---|---|---|
| altitude box | 176×70 `RightCenter` at (398, 393), so x 222..398 | — |
| airspeed box | 151×70 `LeftCenter` at (-398, 393) | — |
| airspeed | `RightCenter` at (-259, 393) | 200 % with interchar 10 (`HUD_EADI_AirspeedNumerics`) |
| altitude below 1000 ft | `RightCenter` at (387, 393) | 200 % with interchar 8 |
| altitude thousands | at (312, 393) | 200 % with interchar 10 |
| altitude hundreds | at (387, 393) | 150 % with interchar 7 (`HUD_EADI_AltitudeNumerics` 0/1/2) |
| altitude-source letter | `LeftCenter` at (408, 393) | 200 %: `B`, `R` or `X` (`HUD_EADI_AltitudeSymbol`) |
| vertical velocity | `RightCenter` at (392.5, 458) | 150 % (`HUD_EADI_VertVelocityNumerics`) |

### SPIN.lua (spin recovery)
- `SPIN MODE` (150 %) at (0,310), and `ENGAGED` at (0,270) on `MPD_FCS_SpinModeEngaged`.
- AoA label at (0,-315) (`MPD_FCS_SpinAoaLabel`).
- Left cue (`MPD_FCS_SpinStickCue,0`): `LEFT` at (-400,0), `STICK` at (-400,100), and an arrow outline 250 long × 60 wide (head 50 long × 100 wide) at (-400,0) pointing left.
- Right cue (`MPD_FCS_SpinStickCue,1`): `RIGHT` at (380,0), `STICK` at (380,100), arrow at (400,0) rotated 180°.

---

## 9. HSI (`HSI/*.lua`) (render: `figures/dcs-hsi.*`)

**Definitions:** `LittleCompassInternalRadius = 362`, `BigCompassInternalRadius = 543`, `offsetDecenterPivot = -225`.

**`drawCompass(R, parent, ctrl, clipped)`**
- **36 upright stroke-text labels**, 120 % `CenterCenter`, at `(R·sin 10i, R·cos 10i)`.
- Labels:

  | i | label |
  |---|---|
  | 0, 9, 18, 27 | `N`, `E`, `S`, `W` |
  | other multiples of 3 | `3`, `6`, `12`, `15`, `21`, `24`, `30`, `33` |
  | the rest | `.` |

- There are **no tick lines**: the rose is made entirely of text.
- The rose rotates through the parent placeholder; the label text stays upright (`MPD_HSI_Compass_Label`).

### HSI_BACKUP_COMMON (also included on HSI_MAIN)
- Backup-mode rose: R=400 under `MPD_HSI_CourseRoseMode_Root,3`, rotated by `MPD_HSI_CourseRoseMode_Rotate`.
- Alignment lat/long block at (-180,235), 150 %, row pitch 45. Lines: lat, long, `CV HDG %03d°`, `CV SPD XXKTS`.
- TACAN bearing/range at (-450,400), 120 % `LeftCenter`, formats `%03d°/%5.1f`. TACAN identifier at (-420,340).
- The TACAN mark front is `TACAN-mark-front` at (0,440); the back is a mesh oval 15×5 at (0,-440).
- PB1 `ACL`.

### HSI_MAIN
**Modes** (`MPD_HSI_CourseRoseMode_Root`): 0 = track-up or north-up (rose R=**400**), 2 = decentred (rose R=**760** with its pivot at (0,-400), clipped to an 850×900 box), 3 = backup.

**Fixed symbology (T UP / N UP mode)**
- `136-aircraft` at (0,0).
- Ground-track pointer `130-…` at (0,355), rotated by `MPD_HSI_GroundTrack`.
- Lubber line: 80 DI from (0,370), pointing up (`MPD_HSI_LubberLine`).
- True-heading line: 80 DI from (0,400), pointing down, with `TRUE` at (0,430).
- HSEL `141-heading-mark` at (0,430), rotating (`MPD_HSI_HSEL_Mark`).
- `%dT` `RightCenter` at (-50,-20) and `%dG` `LeftCenter` at (50,-20). Required ground speed at (50,-55). `CPL ` at (-50,20) and the coupled mode at (50,20) (`ASL`/`BNK`/`SEQ%d`/`WYPT`/`TCN`/`HDG`/`P/R`).

**Navigation marks**
- Waypoint marks: `Waypoint-head-mark` at (0,367) and `Waypoint-tail-mark` at (0,-362), both under `MPD_HSI_Navigation_Mark`.
- The station symbol (`Waypoint-symbol`, or the `134-rhombus` when designated) is placed by `MPD_HSI_Navigation_StationSymbol` with radius 362.
- Course lines are variable-length (`MPD_HSI_Navigation_CourseLineLen`) with two 20 DI arrow strokes at 150° and 210°.
- Waypoint sequence: 14 dashed 10/10 variable-length lines (`MPD_HSI_Waypoint_SequenceLine`).
- Also present: markpoint, OAP (a 20 DI cross), JDAM/JSOW LAR circles and lines, and the Harpoon HPTP and destination symbols. All of these are controller-placed.

**Data blocks** (120 %, row pitch 30)
- Top right, `RightCenter` at x=450: y=400 `%03d°/%5.1f` (`MPD_HSI_Waypoint_RangeBearing`), y=370 time to go, y=340 FPAS fuel or GPS ID, y=310 distance to descent.
- Top left at x=-450 / -420: the TACAN equivalents (`MPD_HSI_TACAN_*`) down to y=310.
- `HSEL` `LeftTop` at (-480,-423) with `%03.0f°` below at y=-453. `CSEL` `RightTop` at (480,-423), with its value below.
- Course perpendicular distance at (467,-405).
- RTC Zulu time at (-367,-390). Elapsed/countdown time at (420,-360).
- Waypoint number (100 %) `RightCenter` at (505,60), between the PB12 and PB13 arrows.
- Alignment display: `GRND` at (0,-170), a rule 180 DI long at y=-187, then `QUAL: 0.5   OK`, `TIME:38:13` and waypoints at x=-117, y = -204, -234, -264.

**OSB legends and sublevels**
Three independent groups:
- `MPD_HSI_PB_Label_Main_PB_1_5` (sublevel 0..6)
- `…_PB_6_10`
- `…_PB_16_20` (0 main, 1 IFA, 2 CV)

| sublevel | legends |
|---|---|
| main | 1 ACL · 2 VEC (boxed) · 3 MODE · 4 ILS · 5 TCN (boxed) · 6 POS/xxx (dynamic `MPD_HSI_POS_Keeping`) · 7 UPDT · 8 scale (dynamic, for example `SCL/40`) · 9 markpoint (dynamic) · 10 DATA · 11 WYPT (boxed) · 12 / 13 `124-arrow` up / down · 14 WPDSG · 15 SEQn (boxed) · 16 AUTO · 17 TIMEUFC · 19 STD HDG · 20 SENSORS |
| MODE (1) | 1 SLEW, 2 DCTR, 3 MAP (boxed), 4 N UP, 5 T UP |
| VEC (2) | 1 L4, 2 RETURN, 3 L16 |
| POS (3) | 6 INS, 7 TCN, 8 ADC, 9 GPS, 10 HSI |
| UPDATE (4) | 3 CANCEL, 4 GPS, 5 VEL, 6 TCN, 7 DSG, 8 AUTO, 9 MAP, 10 HSI |
| ACPT/REJ (5) | 6 ACPT, 10 REJ |
| UPDATING (6) | 8 AUTO (boxed), 10 HSI |
| IFA (16–20) | 17 SEA, 19 LAND, 20 `CONT\nPVU` |
| CV (16–20) | 16 AUTO, 17 MAN, 19 STD HDG, 20 SENSORS |

PB10 DATA leads to the HSI DATA pages (`MDG_DISPL_FMT_LEV2.HSI_DATA`, LEV3 = AC, WYPT, TCN or GRID).

### HSI DATA tab bar (shared by AC, WYPT and TCN)
| PB | legend |
|---|---|
| 3 | `GPS` |
| 5 | `UFC` |
| 6 | `  A/C  ` |
| 7 | ` WYPT ` |
| 8 | `  TCN  ` |
| 9 | `MDATA` |
| 10 | `HSI` (back) |
| 11 | `NAV CK` |

The active tab is boxed: the **top row acts as a tab strip**.

### HSI_DATA_AC
Font: HSI-data 150 %, advance 29, row pitch 48.

| element | position | content / controller |
|---|---|---|
| position-keeping source | (-60, 300) | `INS`/`TCN`/`ADC`/`GPS` |
| latitude | (-170, 210) | — |
| longitude | (-170, 162) | — |
| `WSPD` / value | (-170, 114) / (0, 114) | `*EST` at (150, 114) |
| `WDIR` / value | (-170, 66) / (-20, 66) | — |
| `MVAR` / value | (-170, 18) / (-40, 18) | — |
| `GPS HERR`, `GPS VERR`, `GPS TIME` | (-170, -90 / -138 / -186) | values at x=95 |
| `WARN ALT` | (-321, -425) | rule 220 DI at (-353, -442) |
| `BARO` / `RADAR` | (-355, -460) / (-215, -460) | values at y=-495 |

OSB legends: 1 NORM; 2 `NOSEC GPS` (box 52×160); 4 BLIM; 13 HDG; 15 LATLN; 17 ` TAWS ` (boxed). The box on PB6 marks the current tab.

### HSI_DATA_WYPT (render: `figures/dcs-hsi-data-wypt.*`)
| element | position | content / controller |
|---|---|---|
| `WYPT n` | (-80, 300) | — |
| GPS ID | centred at (0, 348) | — |
| latitude | (-320, 210) | — |
| longitude | (-320, 162) | — |
| `GRID` / value | (-320, 114) / (-175, 114) | — |
| `ELEV` / value | (-320, 66) / (46, 66) | value `RightCenter` |
| `O/S RNG`, `O/S BRG`, `O/S GRID`, `O/S ELEV` | (-320, y) for y = -90, -138, -186, -234 | values centred at x=130 (GRID at -60) |
| rule | 760 DI at (-360, -254) | — |
| TOT / GSPD | (-380, -282) / (58, -282) | — |
| sequence data | 150 % `LeftTop` at (-330, -312) | — |
| target-waypoint box | 52×40 | offset by controller |

OSB legends: 1 `  SEQUFC`, 2 `A/A WP` / `n`, 4 SLEW, 12 / 13 arrows, 14 `REF WP` / `XX`, 15 SEQn, 16 ` FLRP `, 17 `OVFLY1`, 19 `PRECISE`, 20 `DATUM 47` / `WGS-84`. The arrows step through waypoints; the number is shown at (505,60).

### HSI_DATA_TCN
- Channel at (0,280).
- Lat and long at (-150, 232 / 184).
- `ELEV` at (-150,136) with its value at (0,136). `MVAR` at (-150,88) with its value at (0,88).
- Station number at (505,60). Arrows on PB12 and PB13.

### HSI_DATA_GRID (MGRS grid; no `SUBSET_SPECIFIC`)
- A 5×5 grid of 150 DI squares: 3+3 vertical and 3+3 horizontal lines, each 750 DI long, at ±75, ±225 and ±375.
- Digraphs (150 %) at the centre of each square, (150x, 150y) for x, y in -2..2, with a 60 DI underline marking the chosen square.
- Zone-intersection numbers at y = ±395.
- Edge legends: PB1 `S W`, 3 `W`, 5 `N W`, 8 `N`, 11 `E N`, 13 `E`, 15 `E S`, 18 `S`.
- Reference symbol (aircraft, `SA-LS` or a waypoint) at (0,-15), moved by `MPD_HSI_GRID_CenterShift`.
- Yellow TDC brackets: two 80 DI vertical lines at ±40.

---

## 10. SA (`SA/SA.lua`)
Shares HSI's radii (362 / 543) and the decentre pivot at y=-225.

**Track-up mode**
- Rose R=400 (`MPD_SA_CompasRoseRotate`).
- Aircraft at the origin, moved by `MPD_SA_EXP_PlanePos`.
- Ground-track pointer at 355.
- TACAN and waypoint head/tail marks at ±440 and ±362/367.

**Decentred mode**
- Rose R=**573** with its pivot at (0,-225), clipped to an 850×900 box.
- Range rings at r = 181 and 362 (543/3 and 2·543/3).
- Marks at ±595 and ±535.

**Data windows** (120 %, row pitch 30)
- Hidden at REJ2 declutter, except the bottom set.
- Top left: W1 at (-450,400), W2 and W3 indented to -420, W4 at -450.
- W5 centred at (0,400).
- Top right: W6–W9 `RightCenter` at x=450.
- Bottom left: W10–W13 at (-450, -340 … -430).
- Bottom right: W14–W17 at x=450. Formats include `BRA %03d/%d` and `BE %03d/%d`.
- W18 centred at (0,-430).

**Progress bars** (`MPD_SA_ProgressBars_Show`)
- Chaff, flare, GEN-X 1 and GEN-X 2 labels at x=-475, on the same rows as the bottom-left windows.
- Each label has a dashed box 100×24 (3/3 dashes) at +155, with a fill bar of up to 97 DI (`addFillBox`). Label font: 120 % height with a 13 DI glyph width and interchar 4.

**Map overlays** (all controller-placed)
- Bullseye: circle r=30, an arrow at +45 and a number.
- CAP point: circle r=25 and semicircles.
- Corridor (14+14 dashed lines), FAOR (7 dashed lines), FLOT (7 solid lines).
- 40 MEZ circles with labels.
- 4 EW threat symbols (`SA-EW-Symbol`, scale 1.65, masked by a 79×69 triangle).
- FLIR point: box 20 plus a dot.
- Radar scan area: circle r=20 at 400, 80 DI limit lines at ±70°, `R` labels at 410.
- Sensor line-of-sight wedges: two 60 DI lines at ±30°, labelled `R` or `F`.
- TDC: two 52 DI lines at ±31. Step cursor: box 250×60 (yellow).

**OSB legends** (`MPD_SA_PBsLevelShow` 0 = TOP, 1 = SENSOR)

| level | legends |
|---|---|
| TOP | 2 PLID (or 2 UNK / 3 HOS / 4 FRND while PLID tracking; or 1 DONR0 / 2 MEMB0 in the PPLI menu) · 5 SENSR · 6 MAP · 7 `DCLTR` / `REJ1`…`MREJ2` · 8 scale · 9 markpoint · 10 DCNTR · 11 WYPT · 12 / 13 arrows · 14 WPDSG · 15 SEQ · 16 AUTO · 17 TXDSG · 19 STEP · 20 EXP |
| DCLTR sub-row (6–10) | 5 UFC · 6 OFF · 7 REJ1 · 8 REJ2 · 9 MREJ1 · 10 MREJ2, each boxed by `MPD_SA_DcltrSelectBox` |
| SENSOR | 3 HARM, 4 FLTR, 5 LINK4 (each with a 25×124 X-over when disabled) · 6 IFF · 7 `RWR` / `ALL`, `CRIT LETH`, `CRIT` · 8 `FRIEND` / `OFF`, `NO ID`, `RWR ID` · 9 UNK · 10 SA (back) · 11 OCS1 · 12 OCS2 · 13 F/F · 14 PPLI · 15 SURV |

Declutter placeholders: `MPD_SA_DeclutterLevelShow` with REJ1, REJ2, MREJ1 and MREJ2 gate the rose and the windows. The track symbols are templated subsets (`SA_TRACKS`, `SA_AIR_DEFENSE`) fed by `MPD_updateMultipleSymbolsBuffer`.

---

## 11. TGT DATA (`TGT_DATA/*.lua`) (renders: `dcs-tgt-data-group.*`, `dcs-tgt-data-ownship.*`)

**Common to both pages**
- Frame box 800×840 centred at (0,-25), so x -400..400 and y -445..395.
- Horizontal divider at y=-25 across the full width.
- OSB legends: PB16 `GROUP` (boxed on the group page), PB19 `GO`, PB20 `NOGO` (boxed by controllers). PB16 toggles between OWNSHIP and GROUP.

### GROUP (all 120 % `LeftBottom`; `fm` = -340)
- **Top table** (status):
  - Headers at y=308: `FM` at -340, `VCS` at -244, `1` at -125, `2` at -93, `3` at -61, `H` at -29, `FUEL` at 55, `RDR` at 170, `STAT` at 275.
  - 4 member rows at y = 236 − 46·n, each under a `MPD_TGT_DATA_GroupMemberShow,n` placeholder. Samples: `FA` (`0`, `FA`..`FD`), `FM0n`, `X`×4, `XX.X`, `XX` (with a 4-character X-over when the radar is inoperative), `NOGO`/`GO`.
- **Bottom table** (channels):
  - Headers at y=-112: `FM` at -340, `TN` at -244, `AIC` at -110, `FF1` at -10, `FF2` at 95, `VA` at 195, `VB` at 290.
  - Rows at -184 − 46·n with samples `XXXXX` and `XXX`.

### OWNSHIP
- Vertical divider at x=0, running the full box height. The page is split into four quadrants.
- `EMERG` `LeftBottom` at (-385,410) and `EXER` `RightBottom` at (385,410). These sit *above* the box.
- Status quadrant, top left: labels `RightBottom` at x=-210, values `LeftBottom` at -185, rows at y = 335, 294, 253, 212, 171 (pitch 41):

  | label | sample value |
  |---|---|
  | `VC:` | `XXXX` |
  | `TYPE:` | `FA-18C` |
  | `STRGTH:` | `1` |
  | `ACTVTY:` | `XXXXXX` |
  | `PRI TN:` | `XXXXX` |

- Fuel/gun line at y=-10: `XX.X` at -385, `FUEL` at -296, `GUN` at -201.
- Stores quadrant, top right: 5 rows at x=43, y = 335 .. 171, samples `X - XXXX`.
- IFF quadrant, bottom right: `IFF 1:`..`IFF 3:` at x=35, y = -85, -130, -175 (pitch 45).
- Bottom-left quadrant: empty.
- OSB legends: 1 `CURSOR` / `VCS`; 2 and 3 arrows down and up; 4 `ENTER`; 5 `UFC`; 6 `MSNCDR` and 7 `FLTLDR` (boxed); 12 `ACTVTY` / `RSET`.
- **No controllers are attached to the OWNSHIP values.** Every value is static placeholder text, so on the website it can hold any content.

---

## 12. UFC BU (`UFC_BU.lua`, the backup UFC on a DDI)

**OSB legends**
| PB | legend |
|---|---|
| 1 | `RET` |
| 3 | `PAGE` / current page (`MPD_UFC_BU_CurrentPage`) |
| 4 / 5 | `075-arrow` down / up, with a vertical `C H A N` (100 %) at (-505,227) |
| 6 | `COM1` / channel / frequency (boxed by `MPD_UFC_BU_CurrentSelectedStations,1`) |
| 7 | `COM2` / channel / frequency |
| 8, 9, 10 | `1`, `2`, `3` |
| 11–15 | `4`–`8` |
| 16 | `9` |
| 17 | `0` |
| 19 | `ENT` |
| 20 | `CLR` |

The keypad digits are spread over the OSBs.

**Channel table**
- 12 placeholders, all created at (0,0). **Each row's y comes from `MPD_UFC_BU_CurrentGroupChannel,n`, which is set in C++, so the row pitch is unknown.**
- Columns, 120 % `CenterCenter`: station number at x=-200, frequency at -20, designation at 180.
- A 480×50 selection box per row (`…GroupMemberSelectedChannelBox`).
- Bottom rule: 550 DI from (-270,-350).

**Scratchpad:** box 200×50 at (280,380), holding 100 % text such as `123.456` (`MPD_UFC_BU_ScratchPad_*`).

`MENU` is drawn by `addMenuLabel`.

---

## 13. Out-of-scope pages, one line each
| page | what it is |
|---|---|
| `ACL.lua` | Automatic Carrier Landing page: compass r=400, a 200 DI circle, command heading, and `CMD A/S`, `CMD ALT`, `CMD ROD` windows (`ACL_Window_R1..5`, e.g. `UTM FAIL`) |
| `AZ_EL/*` | AZ/EL format: radar/FLIR azimuth-elevation scope with track templates (`AZ_EL_TRACKS`); scale labels |
| `CautAdvAndMenuPage*.lua` | caution and advisory list, PB18 MENU, and the outlined and DMC variants (foundations) |
| `DATALINK/*` | Walleye/SLAM-ER datalink pod video with overlay symbology (`DATALINK_RENDERED`, tools) |
| `ENG.lua`, `FCS.lua`, `FUEL.lua`, `STORES.lua` | covered in other notes |
| `FLIR/*` | ATFLIR targeting pod video pages (A/G, A/A, LSS) with reticle, LOS and status windows |
| `HARM/*` | AGM-88 HARM pages: self-protect (SP), target of opportunity (TOO), pre-briefed (PB), class and scan tables |
| `HMD/*` | JHMCS pages: HMD settings, `HMD_REJECT` declutter, and `HMD_MIDS` ("MIDS JHMCS PRIORITY", a numbered item list; another list-page candidate) |
| `HSI_DIGITAL_MAP`, `HSI_MAIN_DMC`, `_outlined` | AMPCD moving-map backdrop and outlined/DMC copies of the HSI |
| `JDAM_JSOW/*` | J-weapon pages: JDAM/JSOW display, JPF fuze page, MISSION DATA (PP1–6 table, column step 130, row step 28) |
| `MAV/*` | AGM-65 Maverick seeker video and reticle |
| `Menu_SUPT.lua`, `Menu_TAC.lua` | SUPT and TAC menus (foundations) |
| `RDR/*` | APG-73 radar: A/A (RWS/TWS/STT), A/G (MAP/GMT/SEA), AGR, DATA option sublevels, track templates |
| `SA/SA_DIGITAL_MAP`, `SA_DMC`, `SA_outlined` | AMPCD map and outlined copies of SA |
| `SLAM/*`, `WALLEYE/*` | SLAM/SLAM-ER and Walleye weapon video pages |
| `MPD_AdvisoriesDefs.lua` | advisory string definitions |

---

## 14. Controller gaps (behaviour that is not in Lua)

1. **OSB → page navigation.** Every inter-format jump, such as BIT PB7 → SW_CONFIG, HSI PB10 → DATA, MUMI MORE ↔ RETURN, or TGT DATA PB16 GROUP, happens in C++ through `MDG_DISPL_FMT_LEV1..4`. The Lua only proves which legends exist on which sublevel. The site must define its own state machine; the sublevel controllers named above are a good template.
2. **BIT FAILURES paging** (`MPD_BIT_PageLabel`, `MPD_BIT_FailureItem`): when PAGE appears and how the items are ordered is not visible. Assume 17 rows per page.
3. **UFC BU row positions** (`MPD_UFC_BU_CurrentGroupChannel`): the row pitch is unknown. The 50 DI box height suggests a pitch of at least 50.
4. **The meaning of controller arguments**, such as `MPD_EW_CmCounterBox` (low-count box?), `MPD_HSI_WYPT_TargetWaypoint` box offsets (72, −42), the turn-rate scale and the `MPD_ADI_PitchRoll` scale argument 900: the Lua gives only the parameters, not the transfer functions.
5. **Blink and flash rates** (`*_ThreatFlash`, `MU LOAD`, the `B` altitude symbol) are not defined in these scripts.
6. **Symbol origins.** Symbols with `"FromSet"` alignment (aircraft, waterline, arrows, heading mark) take their anchor from the SVG symbol set. The renders here approximate it, with the aircraft centred at its wing/fuselage gap. SVG units appear to be about 1 DI: the aircraft wingspan is 80 and the 124 arrow is 76 long.
7. **Static placeholders:** SW_CONFIG values (`XXXXXXXX`), TGT DATA OWNSHIP values, FPAS `HOME` and similar fields have no controller, so they are free content slots.

---

## 15. Suggested mapping of website content to pages

| content | page | why |
|---|---|---|
| **About** | **TGT DATA OWNSHIP** | A profile card: `VC:` (callsign), `TYPE:`, `STRGTH:`, `ACTVTY:`, `PRI TN:`, plus a stores list (5 rows) and IFF lines. None of the values have controllers. The fallback is **MUMI**: an `MU ID` header, two ID fields, MC/SMS "versions" and a single ERRORS line |
| **Resume / experience** | **BIT FAILURES** and its sublevels | Eight OSB-anchored group blocks (heading, rule, status) work as sections. The 17-row name/status list works as role and dates, and PB16 PAGE pages through it. Each sublevel (NAV, COMM, …) is a section detail page with item OSB legends |
| **Skills / tech stack** | **S/W CONFIGURATION** | A 2 × 12 name→value table with a fixed 7-character name and an 8–15 character value, i.e. skill → years or level |
| **Projects** | **HSI DATA WYPT** (one project per waypoint) | The PB12/13 arrows step through them with the number at (505,60). The A/C, WYPT and TCN tab strip on the top row gives sub-tabs. The HSI main page can plot projects as waypoints on the rose. **TGT DATA GROUP** suits a project *table*: 4 rows × 9 columns |
| **Blog index** | **CHKLST** for short lists (two columns of up to 9 items, 13–16 characters at 150 %) | Use the BIT failure list for longer paged indexes |
| **Contact** | **MIDS** | Label:value rows (`NET ENTRY:`, `DATE:`, `TIME:`, `NETWORK:`) and labelled "channels" (AIC, F/F, VOICE A/B) map naturally to email, GitHub, LinkedIn and so on. UFC BU (COM1/COM2 plus a keypad) is an alternative |
| **Fun / easter eggs** | **EW** | The RWR rings can plot skills as "threats" by bearing and range. Its BIT pages already display `THE QUICK BROWN FOXES JUMPED OVER THE LAZY DOG` |
| **Stats** | **FPAS** | CURRENT/OPTIMUM × RANGE/ENDURANCE tables, e.g. years and projects |
