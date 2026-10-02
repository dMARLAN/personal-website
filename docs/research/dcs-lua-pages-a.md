# DCS F/A-18C DDI pages from Lua: STORES, ENG, FUEL, FCS

Source (read-only): `/mnt/f/Program Files/Eagle Dynamics/DCS World/Mods/aircraft/FA-18C/Cockpit/Scripts/Multipurpose_Display_Group/Common/indicator/Pages/MPD/`
(`STORES.lua` 833 lines, `ENG.lua` 71, `FUEL.lua` 110, `FCS.lua` 223).

Renders (made by `/tmp/claude-1000/-mnt-c-Users-Chad-PycharmProjects/231311e5-8de4-4471-b03d-93ca759bc8b0/scratchpad/dcs-pages-a/render_pages.py`, `uv run --with cairosvg python render_pages.py`):

| Page | SVG | PNG |
|---|---|---|
| STORES wingform and stations | `figures/dcs-stores-planform.svg` | `figures/dcs-stores-planform.png` |
| FUEL tank diagram | `figures/dcs-fuel.svg` | `figures/dcs-fuel.png` |
| FCS grid | `figures/dcs-fcs.svg` | `figures/dcs-fcs.png` |

In the renders, green is the DCS geometry. The orange dashed frame (±512 DI), the centre cross, the anchor dots and the coordinate labels are annotation only. I checked each render against the DCS screenshots in `figures/` (`guide-page-303-ag-sms-bombing-page.png`, `guide-page-289-aim120-stores-page.png`, `guide-page-84-fuel-page.png`, `guide-page-83-fcs-page.png`). The layouts match.

## 0. Shared conventions used by these pages (summary only; the foundations doc owns the detail)

- Each page is composed as `pages[PAGE_X] = {SUBSET_BASE, SUBSET_SPECIFIC, SUBSET_X}` in `Common/indicator/Common_init.lua` (for example, STORES is at line 525). The base subsets add the common furniture (MENU and so on). These page files add only what is listed here.
- The units are DI (display increments). The origin is the display centre, +x is right and **+y is up**. OSB legend anchors are at x/y = ±500.
- Material: every element uses the page default `default_material` (`stroke_material`, from `Common_page_defs.lua:9-12`). None of these four pages sets a per-element material or colour. Stroke thickness is 0.8 and fuzziness 0.5 (`MDG_strokesDefs.lua`).
- Helper functions used:
  - `addStrokeText`, `addStrokeLine`, `addStrokeBox`, `addStrokeSymbol`, `addPlaceholder` and `add_X_Over` are in `Cockpit/Scripts/symbology_defs.lua`.
  - `add_PB_label` is in `Pages/MPD/MPD_page_defs.lua` and uses `PB_positions` from `MPD_PB_defs.lua`.
  - `add_Harm_Ovrd_PB16` is in `Pages/MPD/HARM/HARM_Utils.lua` and is used by STORES only.
- These primitive semantics are needed to reproduce the geometry. They are from `symbology_defs.lua:188-241`:
  - `addStrokeLine(name, len, pos, rot, parent, ctrl)`: the vertices are `{0,0}->{0,len}`, rotated **rot degrees counter-clockwise from "up"** and placed at `pos`. So the end point is `pos + len·(−sin rot, cos rot)`. rot=90 draws leftwards, −90 rightwards, 180 or −180 downwards.
  - `addStrokeBox(name, sideX, sideY, align, pos, ...)`: a rectangle of ±side/2 around `pos`. All boxes on these pages are `CenterCenter`.
  - `add_X_Over(name, w, h, pos, parent, ctrl)`: two diagonal lines across a w×h rectangle.
  - Child elements (`parent` set) are positioned relative to the parent's position.
- Font sizes are from `Common_page_defs.lua:28-76`:

  | Font | Glyph height | Glyph width | Inter-character gap | Advance per character |
  |---|---|---|---|---|
  | `STROKE_FNT_DFLT_100` | 20 DI | 12 | 4 | 16 |
  | `_120` | 24 | 14 | 6 | 20 |
  | `_150` | 30 | 18 | 6 | 24 |
  | `_200` | 40 | 24 | 12 | 36 |

  OSB legends use font 120 with interchar 6. In SVG, DejaVu Sans Mono at `font-size = advance/0.6` matches the DCS advance and cap height almost exactly. The renders use that.
- Stroke symbols come from `Cockpit/IndicationResources/MDG/stroke_symbols_MDI_AMPCD.svg`. I assumed 1 SVG unit = 1 DI, and the FCS cross (20×30) inside its 32×48 cells supports that.

  | Symbol | Geometry |
  |---|---|
  | `134-rhombus` | 16.82 square rotated 45°, so a diamond with half-diagonal 11.9. This is the BRU-33/bomb rack symbol. |
  | `116-aim` | Circle r≈8 plus four 12-long ticks from r≈5 to r≈17 (a "+" with a ring). Pages draw it with `init_rot = 45`, which gives the "⊗-with-fins" missile symbol. |
  | `151-cross` | An X, 20 wide × 30 tall. |
  | `076-arrow-up` | 30-long shaft with two 9-long head legs at 45°. |

- OSB legend anchors come from `MPD_PB_defs.lua`:
  - PB n=1..5 (left side): x=−500, y=307−167·(5−n). **PB5 is top-left and PB1 is bottom-left.** Labels are `LeftCenter` and written vertically, one character per line.
  - PB 6..10 (top): y=+500, x=−336+169·(n−6). Labels are `CenterTop`, and further lines stack 35 DI downward.
  - PB 11..15 (right): x=+500, y=307−167·(n−11). PB11 is at the top. Labels are `RightCenter` and vertical.
  - PB 16..20 (bottom): y=−500, x=−336+169·(20−n). PB20 is bottom-left. Labels are `CenterBottom`, and further lines stack 35 DI upward.
  - Boxed legend: for horizontal legends the box is (len·22)×36. For vertical legends it is 26×(len·32).
- All dynamic behaviour is driven by **engine-side C++ controllers**. The controller names appear only in these page files and no Lua defines them. The meanings below come from the names, the arguments and the DCS screenshots.

---

## 1. STORES (`STORES.lua`)

### 1.1 Wingform: exact vertex data (recovered exactly)

DCS does **not** draw a planform polygon. The "aircraft" is **4 stroke lines** (lines 52-58):

```lua
local LSTYPos = 230; local LittleAngle = 3; local BigAngle = 25
local LittleLineLen = 45; local BigLineLen = 350; local littleLineXOffset = 45
local BigLinePosRight = {littleLineXOffset + math.floor(math.cos(math.rad(-90 + LittleAngle)) * LittleLineLen),
                         LSTYPos + 13 + math.floor(math.sin(math.rad(-90 + LittleAngle)) * LittleLineLen)}
addStrokeLine("MainLineRightUP", LittleLineLen, {littleLineXOffset, LSTYPos + 13}, 180 + LittleAngle)
addStrokeLine("MainLineRightBottom", BigLineLen, BigLinePosRight, -90 - BigAngle)
-- left side mirrored: rot 180-3 and 90+25
```

The two short lines are the fuselage sides. The two long lines are the wing leading edges, swept down 25° to the tips.

| Line | Start (DI) | End (DI, computed) | Length | rot |
|---|---|---|---|---|
| MainLineLeftUP (left fuselage) | (−45, 243) | (−47.36, 198.06) | 45 | 177° |
| MainLineLeftBottom (left wing) | (−48, 198) | (−365.21, 50.08) | 350 | 115° |
| MainLineRightUP (right fuselage) | (45, 243) | (47.36, 198.06) | 45 | 183° |
| MainLineRightBottom (right wing) | (47, 198) | (364.21, 50.08) | 350 | −115° |

The wing start points come from `math.floor`. That is why the left wing starts at x=−48 and the right at x=+47: the asymmetry is 1 DI and it is genuine. Each wing line starts about 0.36 DI from the end of its fuselage line, which is invisible at stroke width.

To reproduce in SVG (y flipped):
`M -45,-243 L -47.36,-198.06` · `M -48,-198 L -365.21,-50.08` · `M 45,-243 L 47.36,-198.06` · `M 47,-198 L 364.21,-50.08`.

### 1.2 Stations: anchors and numbering

The wing stations are stepped along each wing line in increments of `BigLineLen/3`, with floor applied at each step (dx=105, dy=−50):

| STA | Anchor (DI) | Pylon tick | Where the content sits |
|---|---|---|---|
| 1 (left tip) | (−363, 48) | none | Missile symbol at (−371, 48), rot 45. `STA1_Label_02` (type) at (−373, 104). `STA1_Label_04` (status) at (−373, 132). Labels are `CenterCenter`, so they sit **above** the wingtip. |
| 2 | (−258, 98) | 5 DI downward, (−258, 98)→(−258, 93) | Symbol row y = anchor−28 = 70 |
| 3 | (−153, 148) | 5 DI downward | Symbol row y = 120 |
| 4 (left fuselage) | (−45, 243) | 5 DI leftward, →(−50, 243) | Missile symbol at (−73, 243). Type `RightCenter` at (−101, 243). Status `RightCenter` at (−101, 202). |
| 5 (centreline) | (0, 230) | none | `STA5_Label_01` at (0, 230) and `_02` at (0, 202), both with no value or controller. BRU symbol, amount and type at (0, 174). Status is type−28. |
| 6 (right fuselage) | (45, 243) | 5 DI rightward | Symbol at (73, 243). Type `LeftCenter` at (101, 243). Status at (101, 202). |
| 7 | (152, 148) | 5 DI downward | Symbol row y = 120 |
| 8 | (257, 98) | 5 DI downward | Symbol row y = 70 |
| 9 (right tip) | (362, 48) | none | Symbol at (370, 48). Labels at (362, 104) and (362, 132). The STA1 labels have an extra −10 x offset; STA9's do not. |

DCS draws **no station numbers**. Numbering is implied by position: 1 is the left wingtip, through to 9 at the right wingtip, and 5 is the centreline.

Station slot stack for STA 2, 3, 5, 7 and 8 (lines 87-125, 160-198). In this list, `b` is the anchor, `y0 = b.y − 28`, and every element is in font 100:

- **Symbol row at y0.** Which symbols show depends on the controllers:
  - `STAn_AA_Missile_Single`: `116-aim` at rot 45, controller `MPD_SMS_MissleSymbol(n)`.
  - `STAn_AIM-9_Left` and `_Right`: two `116-aim` symbols at x±15, for a LAU-115 carrying 2×AIM-9. Controller `MPD_SMS_SidewinderOnLAU_115(n, 0|1)`.
  - `STAn_BRU_33`: `134-rhombus`, controller `MPD_SMS_BRU_33_Symbol(n)`.
- **Amount text** at y0, controller `MPD_SMS_Pylon_Label_Amount(n, -28)`.
- **Type text (weapon name)** at y0, controller `MPD_SMS_Pylon_Label_Type(n, -28)`. Inferred: the −28 argument makes the engine shift the text down one 28-DI line per occupied row above it. The screenshots show diamond / `2` / `RE` stacked, and `⊗⊗` / `AB` / `R SEL` stacked.
- **Selection box**: `STAn_Selective_Box_Line_02` is a child of the type text at (0,0) relative. It is **110 × 26 DI** (110 × 22 for STA5). Controller `MPD_SMS_CurrentLaunchPylon(n[,2])`. **This is how the selected station is shown: its weapon name is boxed.**
- **AIM-7 test X**: `STAn_Label_TYPE_X` is the text `" X "` in font 150 over the type text, controller `MPD_AIM7_TEST(n)`.
- **Status** at type−28, controller `MPD_SMS_Pylon_Label_Status(n)`. It is indexed into `Status_Set`, which holds `"" FAIL DEGD HUNG STBY RDY SEL "L SEL" "R SEL" ... LKD UNLKD H+LKD H+ULK ... SDEGD WDEGD ERASE` (line 9).
- **IR code** (STA 2, 3, 7, 8 only) at type−140, inside a 110×26 box. Controllers `MPD_SMS_IR_CODE(n)` and `MPD_SMS_IR_CODE_Box(n)`.

STA 1, 4, 6 and 9 use `MPD_SMS_MissleSymbol(n)`, `MPD_SMS_Pylon_Label_02(n)` for the type and `MPD_SMS_Pylon_Label_04(n)` with `Status_Set` for the status. STA 4 and 6 also have the AIM-7 test X.

### 1.3 Other STORES main-page elements

| Element | Position | Font | Controller / content |
|---|---|---|---|
| `Gun_Data_Rounds` | (0, 330) | 100 | `MPD_SMS_GunDataRound`, for example "578" |
| `Gun_Status` | (0, 288) | 100 | `MPD_SMS_GunStatus` |
| `Master_Arm_Status` | (0, 85) | 150 | `MPD_SMS_MasterArm`: SAFE / ARM / SIM |
| `STORES_HARM_SP_PB_Indication` | (0, 50) | 150 | Has an X-over 150×36, `MPD_HARM_SP_PB_Indication[_X]` |
| HARM PB range/TOF block | `MPD_HARM_PB_InRng` at (400, 400) `RightCenter`; "FLT" at (250, 303) | 120 | Children at +150 x: `%2d:%02d`. A 130-long line at (170, −20), rot 90. Controllers `MPD_HARM_PB_RNG(0..3)`. |
| Wingspan (A/A gun) | "WSPN" at (330, 390), value at +130 | 100 | `MPD_SMS_Gun_AA_WingSpan_Label`, `MPD_SMS_Wingspan_Val` |
| Weapon status, top right | (380, 357) `RightCenter` | 100 | Child of the PROG_* placeholders: JDAM/SLAM `IN RNG / IN ZONE / %.2d TMR`, Harpoon status list, GBU-24 TOT |
| TIMING | (−380, 357) `LeftCenter` | 100 | JDAM, SLAM and Harpoon: `TIMING %d:%.2d` |
| JDAM TOF | (380, 327), (380, 297) and Δ at (380, 267). "FLT" at (290, 297). A 70-long line. | 100 | `MPD_SMS_JDAM_TOF(0..3)` |
| `TOT_PP` | (0, −70) | 100 | Has an X-over 70×26 |
| ALN QUAL | "ALN QUAL" `RightCenter` at (−10, −140), value `LeftCenter` at (10, −140) | 100 | Values `01 GOOD`…`10 UNST` |
| JDAM/SLAM fuze line | (−380, −280) label, (−280, −280) value. SLAM FLT at y=−255, DIST at y=−305. | 100 | |

**PROG block** (bomb program, shown when `PROG_BOMB` is visible). `PROG_BOMB` is a placeholder at (0, +15) inside `PROG_BASE`, so add 15 to every y below:
- `"PROG "` at (0, −180) with an underline 95 long at (−45, −197), rot −90.
- The program number is at +40 x, from the set {1..5}.
- Optional cross-out: two lines 78.85 long, rot −68 and −112, controller `MPD_PROG_CROSS`.
- Column 1 labels are `LeftCenter` at x=−220: `MODE`, `MFUZ`, `EFUZ`, `DRAG`, `HT` at y=−238, −266, −294, −322, −350.
- Column 2 values are at x=−90. MODE is one of {AUTO, FD, CCIP, MAN, CLAR PP, CLAR SL}. MFUZ is one of {OFF, NOSE, TAIL, N/T, VT1, VT2, PRI, OPT}. EFUZ is one of {OFF, VT, INST, DLY1, DLY2}. DRAG is one of {FF, RET}.
- Column 3 labels are at x=40: `QTY`, `MULT`, `INT`, and either `NONE/BANK/RTCL` or `HDG`.
- Column 4 values are at x=170.

There are parallel PROG layouts for Harpoon (MODE R/BL|BOL, FLT LOW|MED|HIGH, TERM SKIM|POP, SEEK SML|MED|LRG, then HPTP, SRCH, DSTR and BRG), rockets and gun.

**A/A STT data block** (placeholder at (0, −100), `MPD_AA_STT_MODE`): RNG, VC, V, ALT, ASPCT and RMAX/RNE/RMIN rows, 40 DI apart, starting at (−380, −140).

The **DATA freeze** block draws an 800-long horizontal line at y=−100.

### 1.4 STORES OSB legends

Sides: 1-5 is the left column (5 at the top), 6-10 the top row, 11-15 the right column (11 at the top) and 16-20 the bottom row (20 at the left). All legends are controller-gated.

| PB | Legends (gating) |
|---|---|
| 1 | DLY2, HT, CODE (A/G PROG sublevels); PGU / RND (gun); ARM, ACPT (JDAM); WEP, ACPT (SLAM) |
| 2 | DRAG, MAN, N/T, DLY1; SAL (rockets); M50 (gun); ERASE + JDAM/JSOW; CNX; N/T; DLY1; SEEK (Harpoon) |
| 3 | EFUZ, CCIP, TAIL, INST, VT2, OPT, MAN; SGL; TERM; LOW |
| 4 | MFUZ, FD, NOSE, VT, RET, VT1, PRI, CLAR/SL; MAN; FLT; R/BL; MED; SKIM; **MAN + "MODE" (AIM-120)** |
| 5 | MODE, AUTO, OFF, FF, CLAR/PP; CCIP; MODE + PP/TOO (JDAM/SLAM); BOL; HIGH; POP; **AUTO + "S" (AIM-120)** |
| 6-10 | **Weapon names in inventory** (`MPD_SMS_6_10PBLabels(i, 0|1)`, where 1 = boxed when selected). "RDY" is a second line (`MPD_SMS_AG_RDY_Label`). X-over 154×36 at y−12 for a broken weapon (`MPD_SMS_AG_X_Breaker`). AIM-7/120 menus: PB6 SIZE/SML, PB7 MODE or RCS/MED/NORM, PB8 HELO/LRG, PB9 HOJ. |
| 11 | GUN (boxed per `MPD_SMS_Gun_PushButton_Box`), plus a separate "RDY" at (420, 310); DSPLY/JDAM; STP; HPTP |
| 12 | LOAD; DSPLY/JSOW; OVR/CLAR (GBU-24); DSPLY (SLAM); FXP |
| 13 | STEP |
| 14 | UFC (boxed state); TEST/SP (AIM-7) |
| 15 | SIM (boxed when active) |
| 16 | HRM OVRD + SP/TOO/PB (`add_Harm_Ovrd_PB16`) |
| 17 | DATA (boxed state) |
| 19 | TONE / TONE1 / TONE2 |
| 20 | PROG; 7F/7M/7H (AIM-7); "HI  LO" with 50×40 boxes at (−378/−296, −488) (gun); "M4  M66"/"MTR" with 60/70×40 boxes (rockets) |

The legend text in the main-page screenshot (`PROG TONE … DATA` at the bottom; `GUN STEP UFC SIM` on the right; weapon names along the top) agrees with this table.

---

## 2. ENG (`ENG.lua`): text only, no geometry

```lua
local TopYPos = 343; local DistanceBetweenRow = 60; local LabelOffset = 70
local LRLabelOffset = 250; local LDataOffset = 180; local RDataOffset = 260
```

- **Headers** (font 150, `CenterCenter`): "LEFT EPE" at (−250, 413) and "RIGHT EPE" at (250, 413).
- **Rows** (font 150): each row label is `CenterCenter` at x=0. The left value is `RightCenter` at x=**−180** and the right value is `RightCenter` at x=**260**. The x positions are asymmetric because right-aligned numbers need room on the right. The y positions run from 343 down in steps of 60.

| Row | y | Label | Controller (arg 0 = L, 1 = R) | Placeholder L/R |
|---|---|---|---|---|
| 0 | 343 | INLET TEMP | `MPD_ENG_Inlet_Temp` | −31 / −31 |
| 1 | 283 | N1 RPM | `MPD_ENG_N1_RPM` | 90 / 89 |
| 2 | 223 | N2 RPM | `MPD_ENG_N2_RPM` | 87 / 0 |
| 3 | 163 | EGT | `MPD_ENG_Exhaust_Gas_Temperature` | 673 / 677 |
| 4 | 103 | FF | `MPD_ENG_Fuel_Flow` | 2430 / 2410 |
| 5 | 43 | NOZ POS | `MPD_ENG_Nozzle_position` | 15 / 16 |
| 6 | −17 | OIL PRESS | `MPD_ENG_Oil_Pressure` | 108 / 110 |
| 7 | −77 | THRUST | `MPD_ENG_Thrust` | 0.4 / 0.9 |
| 8 | −137 | VIB | `MPD_ENG_Vibration` | 0.4 / 0.9 |
| 9 | −197 | FUEL TEMP | `MPD_ENG_Fuel_Temp` | 29 / 26 |
| 10 | −257 | EPR | `MPD_ENG_Engine_Pressure_Ratio` | 3.40 / 3.31 |
| 11 | −317 | CDP | `MPD_ENG_Compressor_Discharge_Pressure` | 97 / 96 |
| 12 | −377 | TDP | `MPD_ENG_Turbine_Discharge_Pressure` | 76 / 80 |

- **OSB**: PB16 is "RECORD", **always boxed** (`{"RECORD", nil, nil, true}`), at the bottom right.

---

## 3. FUEL (`FUEL.lua`): tank diagram (render: `figures/dcs-fuel.png`)

**Tanks.** Each tank is an `addStrokeBox` at `CenterCenter`. The value is in font 200 at the box centre. The label is in font 100 at box top + 20. "EST" or "INV" markers are permanently hidden (`HideElement`).

| Tank | Centre | W × H | Value controller | Label |
|---|---|---|---|---|
| TK 1 | (0, 385) | 350 × 160 | `MPD_FUEL_Tank_1` | "TK 1" at y=485 |
| L FD | (0, 215) | 350 × 100 | `MPD_FUEL_Tank_Feed(0)` | "L FD" at y=285 |
| R FD | (0, 90) | 350 × 70 | `MPD_FUEL_Tank_Feed(1)` | "R FD" at y=145 |
| TK 4 | (0, −85) | 350 × 200 | `MPD_FUEL_Tank_4(0,3)` | "TK 4" at y=35 |
| R WG | (350, 110) | 150 × 100 | `MPD_FUEL_Tank_Wing(1)` | "R WG" at y=180 |
| L WG | (−350, 110) | 150 × 100 | `MPD_FUEL_Tank_Wing(0)` | "L WG" at y=180 |
| Centreline external | (0, −300) | 225 × 70 | `MPD_FUEL_Tank_Ext(2)`, shown by `MPD_FUEL_Tank_Ext_Installed(0)` | Separate strings "C " at y=−235 and " L" at y=−245, which gives a staggered "CL" |
| L EXT | (−300, −300) | 225 × 70 | `..._Ext(0)`, installed(1) | "L EXT" at y=−245 |
| R EXT | (300, −300) | 225 × 70 | `..._Ext(1)`, installed(2) | "R EXT" at y=−245 |

**Quantity pointer.** `addFuelAmountPointer` places a placeholder at the box's **bottom-right corner** (x_right, y_bottom). It draws two 30-DI lines from it at rot −60 and −120, which ends at (+26, ±15) and makes a "<" caret pointing at the box edge. Controllers are `MPD_FUEL_Tank_1_Rel(H)`, `MPD_FUEL_Tank_Feed_Rel(H, side)`, `MPD_FUEL_Tank_4_Rel(H)`, `MPD_FUEL_Tank_Wing_Rel(H, side)` and `MPD_FUEL_Tank_External_Rel(70, i)`. Inferred: the caret moves up by fill fraction × box height H, so it rises along the right edge as the tank fills.

**Text:**

| Text | Position | Font | Content |
|---|---|---|---|
| "BINGO" | (350, 350) | 150 | Static |
| Bingo value | (450, 305), `RightCenter` | 200 | `MPD_FUEL_Bingo` |
| "TOTAL" | (−380, 430) | 150 | Static |
| Total value | (−380, 385) | 200 | `MPD_FUEL_Total_Total` |
| "INTERNAL" | (−380, 340) | 150 | Static |
| Internal value | (−380, 295) | 200 | `MPD_FUEL_Total_Internal` |
| CG DEGD / INVALID / 99:59 | (−330, −60), (350, −60), (350, −110) | 200 | Hidden |

**OSB:** PB10 shows "RESET" over "SDC" (top right). PB20 shows "FLBIT", boxed by `MPD_FUEL_FLBIT_Box` (bottom left).

---

## 4. FCS (`FCS.lua`): grid (render: `figures/dcs-fcs.png`)

**Channel status tables.** Each cell is a 32 × 48 box. `151-cross` (X) symbols are gated by `MPD_FCS_Status_Table(k)`, where k runs sequentially over every cell (left table, then right, then bottom).

- **Left top table.** Columns are at x = −300 + 32j (j=0..3: −300, −268, −236, −204). Rows are at y = 440 − 48i (i=0..6: 440 … 152).
  - Rows 0, 3 and 4 have cells only in columns 1 and 4.
  - Column labels "1 2 3 4" (font 120) are at y=104.
  - "SV1"/"SV2" (font 120, interchar 14) are `RightCenter` at x=−332, y = 392/344 and 200/152.
- **Right top table.** Columns are at x = 300 − 32j (300, 268, 236, 204), so the order is reversed: channel 1 is at x=204.
  - Rows 0, 3 and 4 have cells only in the **middle two** columns (x=268 and 236). The left table is not mirrored on this point, but it matches the DCS screenshot.
  - The SV labels are `LeftCenter` at x=332.
- **Right bottom table.** 11 rows × 4 columns of 32 × 40 cells, at x = 204..300 and y = 56 − 40i (56 … −344).
  - Labels are `LeftCenter` at x=88: `CAS P`, `    R`, `    Y`, `N ACC`, `L ACC`, `STICK`, `PEDAL`, `AOA`, `BADSA`, `PROC`, `DEGD`.
  - Separator lines go leftward (rot 90) from x=188. There is one 110-long line at y=76, four 30-long lines at y=36, −4, −44 and −84 (sub-rows), and seven 110-long lines at y=−124 … −364.

**Surface position block (centre).**
- Four horizontal lines, 315 long, from x=157.5 to x=−157.5, at y = 416, 320, 272 and 224.
- Row labels are `CenterCenter` at x=0: LEF at y=440, TEF at 368, AIL at 296, RUD at 248 and STAB at 176.
- The left numbers are `RightCenter` at x=−86 and the right numbers are `RightCenter` at x=152. Controller `MPD_FCS_ControlSurfacePosNumerics(0..9)`.
- Direction arrows (`076-arrow-up` with an up/down pair; `MPD_FCS_ControlSurfaceDirArrow(n, -1|1)`) are at x=−153 and x=82. RUD uses left/right arrows at x=−158 and 82.

**G-LIM.**
- "G-LIM    G" (font 200) is `LeftCenter` at (−422, 15). The value is at (−206, 15), so it fills the gap. Controllers: `MPD_FCS_GlimitSymbols(0)` and `MPD_FCS_GlimitNumerics`.
- "INVALID" at (−380, 15) shows when the state is 2.
- When the state is 1, a flattened X of four 75-long lines is drawn from (−230, 30) at rot 90±17 and −90±17.

**BLIN code.** At (−345, −190), font 120, controller `MPD_FCS_BLIN_Code_Data`.

**AOA row (y=−415).**
- A 194 × 35 box at (−3, −415).
- "AOA" is `LeftCenter` at x=−83, and the static value "-99.9" is `RightCenter` at x=83. Its controller is commented out in the Lua.
- "L" is at x=−300 with its value at −196. "R" is at x=180 with its value at 284. Both values use `MPD_FCS_AngleOfAttackNumerics(1|2)`.

**OSB:** PB2 is "BLIN", plus a channel identifier line (`MPD_FCS_Channel_Ident`). PB16 is "AOA".

---

## 5. Notes for the website

- **STORES**: the wingform is just four lines. It is cheap to draw exactly and is the most recognisable Hornet visual. It suits a Projects or Portfolio page: the 9 stations become project slots, with the name in the type slot and a status ("RDY", "SEL") under it. The 110×26 type-label box is the selection state. The OSB 6-10 top row (weapon names, boxed when selected) is a ready-made section tab bar.
- **FUEL**: the boxed tank stack with right-edge carets suits Skills or Proficiency, or a "capacity" metaphor. Each caret is a 0..1 value mapped onto the box height.
- **ENG**: a two-column left/right comparison table at fixed x positions (−180 and 260, right-aligned). It suits "stats" or "then vs now" figures.
- **FCS**: a channel grid with X marks suits a tech-stack or availability matrix. The 11-row labelled table on the right is a good checklist.
- **Gaps**: every value, symbol visibility, offset and selection box is set by C++ controllers (`MPD_SMS_*`, `MPD_FUEL_*`, `MPD_FCS_*`, `MPD_ENG_*`), whose logic is not in Lua. Three behaviours are inferred from the names and the screenshots rather than read from code:
  - the row shifting for the amount and type text (the `-28` argument);
  - the caret travel on the FUEL page;
  - the meaning of the second argument of `MPD_SMS_CurrentLaunchPylon(n, 2)`.
