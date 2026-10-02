# DCS F/A-18C Early Access Guide: DDI hardware and display system

Source: "DCS F/A-18C Early Access Guide EN" (PDF, 424 pages). Page numbers below are the printed page numbers, which equal the PDF page indices (1-based). Items marked (INFERRED) were read off screenshots rather than stated in text.

Figures are in `/home/chad/PycharmProjects/personal-website/docs/research/figures/`.

## 1. Physical DDI unit

### 1.1 Bezel and OSBs
- The DDI is a "3-color (green, yellow, and red)" display. There are 20 pushbuttons (PB) (p39).
- Numbering (p39): "PB 1 is the lowest button on the left side, and then each PB button is numbered sequentially in a clockwise manner."
- Resulting layout, 5 buttons per edge (the edge grouping is INFERRED from the figures on p79, p89, p205 and p117, and confirmed by the SA text on p204 and the HSI text on p87):
  - Left edge, bottom to top: OSB 1, 2, 3, 4, 5.
  - Top edge, left to right: OSB 6, 7, 8, 9, 10.
  - Right edge, top to bottom: OSB 11, 12, 13, 14, 15.
  - Bottom edge, right to left: OSB 16, 17, 18, 19, 20.
- Text confirmation (p204, SA page): MAP=6, SCL=7, MK2=9, DCNTR=10 (top row); WYPT/OAP/TGT=11, up arrow=12, down arrow=13, WPDSG=14, SEQ=15 (right edge, top to bottom); AUTO=16, MENU/TIME=18 (bottom edge). SA is selected from PB 13 on the TAC page (p204). The sensors sublevel is PB 5 (p205).
- FPAS (p87-88): CLIMB is at PB 20 (bottom-left); the HOME up and down arrows are PB 16 and 17 (bottom-right).
- MENU is therefore OSB 18, bottom centre. This matches the figures on p79, p89, p205 and p117, where the MENU legend sits above the middle bottom button (INFERRED).
- The bezel is a rounded-square screen opening. The corners are chamfered, with a larger chamfer toward the cockpit centre (see `guide-left-instrument-panel-ddi-p39.png`). (INFERRED)
- The OSBs are round, dark-grey, knurled buttons with a single white line (INFERRED from `guide-ddi-supt-menu-p79.png`):
  - Left and right edge buttons carry a horizontal line.
  - Top and bottom edge buttons carry a vertical line.
- There are small separator bars between button pairs (INFERRED).

### 1.2 Other bezel controls
- **Brightness selector knob** (p39): a rotary knob at the top centre, above OSB 8. Marked OFF / NIGHT / DAY, with the OFF label at the lower left and NIGHT/DAY at the upper left/right of the knob (INFERRED from the p79 figure).
  - OFF prevents the DDI from operating.
  - NIGHT gives a lower brightness control range.
  - DAY gives a brighter default setting.
  - It is shown as a rotary knob with a pointer, three positions.
- **BRT (brightness control)** (p39): a rotary knob at the bottom-left corner of the bezel. It varies the intensity of symbols and text. Clockwise increases and counter-clockwise decreases. The "BRT" label sits just above and right of the knob (INFERRED).
- **CONT (contrast control)** (p39): a rotary knob at the bottom-right corner. It varies the contrast between symbology and the dark background. It is listed "(N/I)", meaning not implemented in the Early Access build.
- There are no other bezel controls on the DDI. The master mode, master arm and jettison controls are separate panels next to the left DDI (p39).
- The left DDI is on the left instrument panel (p39). The right DDI is on the right instrument panel (p52). On the right DDI the BRT/CONT knobs are in the same positions (INFERRED from p85, p87).

### 1.3 AMPCD / MPCD (p50-51)
- The AMPCD ("generally referred to as just the MPCD", p50) is a full-colour, NVG-compatible digital display that can show any MENU-selectable format except the A/G radar display.
  - It is driven by the Digital Map Set (DMS) for HSI, and by the left DDI for all other formats.
- It has the same 20 OSBs and the same edge layout as the DDI (INFERRED from the p50 figure).
- Differences from the DDI, as listed on p50-51 ("Four momentary two-position rocker switches and a rotary knob", numbered on Figure 9):
  1. Off/Brightness rotary knob. It powers on the AMPCD when rotated out of OFF. It sits top centre, with an "OFF" label to its left (INFERRED).
  2. Night/Day brightness selector: a rocker switch labelled DAY / NGT, at the top-left.
     - DAY gives manual brightness, using the rotary.
     - NGT gives automatic brightness.
     - Brightness is always automatic when HSI is shown.
  3. Symbology control (SYM): a rocker, top-right. The upper half narrows the symbology, making it sharper and dimmer. The lower half widens it, making it brighter and less sharp.
  4. Gain control (GAIN): a rocker, bottom-left. The upper half raises background video brightness and the lower half lowers it.
  5. Contrast control (CONT): a rocker, bottom-right. The upper half increases contrast and the lower half decreases it.
  6. HDG and CRS set switches, one at each upper corner outside the bezel (HDG at the left, CRS at the right).
     - They are spring-loaded to centre.
     - Held up they increase degrees and held down they decrease.
     - Keyboard bindings: LAlt+LShift+2/1 for HDG up/down and LAlt+LShift+4/3 for CRS up/down (p51).
- The AMPCD is colour, so the HSI can show a moving map and coloured symbology (p86, p50). The DDI is monochrome green with yellow and red used for cautions, according to p39. The ILS needles on the EADI turn yellow "when COLOR is selected on the Attack display" (p84).
- The MENU legend behaves the same on the MPCD. The HSI MENU option "Displays the TAC menu page" (p120).
- The p50 figure labels the AMPCD labels "POS/INS UPDT SCL/5 MK1 DATA" along the top and TCN ILS MODE VEC ACL down the left. These are the same HSI legends as on the DDI.

## 2. Display conventions

### 2.1 Colour and typography
- DDI is monochrome green in the screenshots (bright green on near-black), with a 3-colour capability (p39).
  - Figures p79, p89, p205 show a green phosphor, pixel-style monospaced font with a squared look.
  - The characters are roughly 5x7 dot-matrix style, uppercase only, with a slashed or dotted zero. (INFERRED)
- AMPCD is full colour (p50).

### 2.2 Selected options are boxed
- A selected or active option is shown with a rectangle around its legend. Examples:
  - STBY boxed on the EADI (p84-85).
  - FLBIT is boxed during the fuel BIT test (p83).
  - CLIMB is boxed on FPAS (p87).
  - WYPT, TCN and TIMEUFC are boxed on the HSI (p119, p144).
  - The page legend of the current page is boxed at the MENU position (SUPT is boxed on the SUPT page, TAC on the TAC page; see p79, p89).
- Pressing an unboxed option boxes it (select) and pressing a boxed option unboxes it (deselect), as with the UFC option windows ("select or deselect the displayed options", p49). (N/A to DDI specifically; this is the general convention.)

### 2.3 Legend placement and orientation
- Legends sit just inside the screen edge next to the OSB they belong to, one legend per OSB.
- Top and bottom edge legends are horizontal text, centred over or under the OSB (p79, p89, p205, p117).
- Left and right edge legends are vertical text. The letters are rotated 90 degrees clockwise and read top to bottom (INFERRED from the zoomed crop in `guide-ddi-tac-menu-p89.png`).
  - Examples: "STORES", "HSI", "CHKLST".
  - They are not upright letters stacked one under another.
  - They are right-aligned or left-aligned against the screen edge on the respective side.
- Two-line legends are possible. On the TAC page, "RDR" has "ATTK" as a second line beside it, set further from the bezel edge (see crop of p89).
- The MENU legend (OSB 18) is a boxed page name above a four-digit number (p79: SUPT / 4311; p89: TAC / 3650; p205: 4346; p117: 3144 on HSI/EADI/etc.).
  - The text says "When airborne, the MENU pushbutton converts to a timer, but still acts as a MENU button" (p79).
  - AMBIGUOUS: the meaning of the four-digit number is not explained in the guide. It differs between pages in the screenshots, so it may be a clock or timer reading from different moments.

## 3. Page hierarchy and navigation
- "There are two primary pages in which all other pages are selected from: The Support (SUPT) page and the Tactical (TAC) page. You can toggle between these pages, or return to them, by pressing the pushbutton marked MENU" (p79).
- Behaviour:
  - Pressing MENU on a normal page (HSI, ENG, FUEL etc.) returns to the top-level menu. The HSI's MENU option "Displays the TAC menu page" (p120). INFERRED: the menu returned to is whichever of TAC or SUPT the DDI last showed, or TAC by default. The guide says only "toggle between these pages, or return to them".
  - Pressing MENU on TAC shows SUPT, and vice versa (toggle).
- Pressing a page-legend OSB on a menu selects that page. Pages are selected from the menu pages (p79).
- Page names given in the guide: the EADI is "selected by pressing the ADI pushbutton on the MENU" (p84). The HSI is selected "from the SUPT DDI page" (p117). SA "is selected from pushbutton 13 (SA) on the TAC page" (p204). FPAS "from the SUPT menu" (p86).
- Sublevels: some pages have sub-levels reached through an OSB (e.g. HSI POS/INS shows four options along the top with an HSI OSB to return, p118; HSI MODE shows sub-options down the left side, p120; HSI DATA shows a sublevel, p119; SA SENSR is a sub-level via PB 5, p205; SA DCLTR shows five options on PB 6-10, p204).
- Pages are selectable on either DDI. The MPCD can show any format except A/G radar (p50).

### 3.1 SUPT page, legend per OSB (p79, Figure 23)
OSB numbers are INFERRED from legend positions relative to the buttons. See `guide-ddi-supt-menu-p79.png`.

| OSB | Edge | Legend | Page | Orientation |
|---|---|---|---|---|
| 1 | left | ADI | Electronic attitude display indicator | vertical |
| 2 | left | HSI | Horizontal Situation Indicator | vertical |
| 3, 4, 5 | left | blank | | |
| 6 | top | MIDS | MIDS page | horizontal |
| 7 | top | blank | | |
| 8 | top | BIT | Built In Test | horizontal |
| 9 | top | blank | | |
| 10 | top | MUMI | Memory Unit Mission Initialization (N/I) | horizontal |
| 11 | right | CHKLST | Checklist | vertical |
| 12 | right | ENG | Engine | vertical |
| 13, 14 | right | blank | | |
| 15 | right | FCS | Flight Control System | vertical |
| 16, 17 | bottom | blank | | |
| 18 | bottom | SUPT (boxed) over number | MENU | horizontal |
| 19 | bottom | FPAS | Flight Performance Advisory System | horizontal |
| 20 | bottom | FUEL | Fuel | horizontal |

The page legends in the p79 callout list are: Built In Test, MIDS, HSI, EADI, Fuel, FPAS, Memory Unit Mission Initialization (N/I), Checklist, Engine, FCS (p79). The FUEL page has FLBIT at an OSB (p83), and the ENG, FCS, FUEL, CHKLST pages are described p80-84.

AMBIGUITY: callout leader lines on p79 are loose, so the OSB numbers above come from vertical or horizontal alignment of each legend with the nearest button in the screenshot.

### 3.2 TAC page, legend per OSB (p89, Figure 33)
See `guide-ddi-tac-menu-p89.png`. OSB numbers INFERRED from alignment in the screenshot.

| OSB | Edge | Legend | Page | Orientation |
|---|---|---|---|---|
| 1 | left | AZ/EL (reads "AZ/EL" in the screenshot; not described in the p89 text) | AZ/EL radar format (see p180) | vertical |
| 2 | left | blank | | |
| 3 | left | HUD | HUD page | vertical |
| 4 | left | RDR with ATTK as a second line | Attack radar page | vertical, two columns |
| 5 | left | STORES | SMS | vertical |
| 6-9 | top | blank | | |
| 10 | top | IMRV over DSPLY (two lines, horizontal; "IMRV" is hard to read at this resolution and may read INRV) | not described in the guide | horizontal |
| 11, 12 | right | blank | | |
| 13 | right | SA | Situational awareness (p204) | vertical |
| 14, 15 | right | blank | | |
| 16 | bottom | blank | | |
| 17 | bottom | EW | Electronic warfare | horizontal |
| 18 | bottom | TAC (boxed) over number | MENU | horizontal |
| 19, 20 | bottom | blank | | |

The p89 callouts name only SMS, RDR, HUD and EW. The SA, AZ/EL and IMRV DSPLY legends are visible in the screenshot but described elsewhere (SA on p204, AZ/EL on p180) or not at all.

## 4. Pages

### 4.1 HSI page (p86, p117-120, p144-145)
Figures: `guide-hsi-page-options-p117.png`, `guide-hsi-page-annotated-p144.png`.

Legends by OSB (from the p117 screenshot, with the option list on p118-120):

| OSB | Legend |
|---|---|
| 1 | ACL (left edge, vertical; N/I) |
| 2 | VEC (N/I) |
| 3 | MODE (sublevel T UP, N UP, DCTR, MAP, SLEW (N/I); p120) |
| 4 | ILS (N/I) |
| 5 | TCN (TACAN as navigation method) |
| 6 | POS/xxx (e.g. POS/INS; position keeping source: AINS, TCN, ADC, GPS; p118) |
| 7 | UPDT (N/I) |
| 8 | SCL/nn (range scale 5, 10, 20, 40, 80, 160 NM; the selected scale is shown right of "SCL"; p118) |
| 9 | MK1 (markpoint, up to nine; p119). "MK1" in the figures indicates the next mark number. |
| 10 | DATA (p119) |
| 11 | WYPT (vertical; boxed for waypoint steering; changes to TGT when designated; p119) |
| 12 | up arrow (next waypoint) |
| 13 | down arrow (previous waypoint). The selected waypoint number is shown between the arrows (p119). |
| 14 | WPDSG (vertical; waypoint designate) |
| 15 | SEQ n (vertical; sequence 1-3; p119) |
| 16 | AUTO (auto sequencing; p119) |
| 17 | TIMEUFC (p119) |
| 18 | MENU (TAC menu; p120), with the number legend below |
| 19 | STD HDG as read in the p117 figure (not described in the text; it may be a heading selection option, unclear) |
| 20 | SENSORS (p120; "Coming later in early access") |

The p118 callout numbering (1-18) lists the options but does not give OSB numbers, so the OSB column is INFERRED from the figure.

Main symbology (p144):
1. Compass rose with cardinal letters and numeric marks every 30 degrees (e.g. 3, 6, 12, 15, 21, 24, 30, 33 shown as digits) and a ring of dots.
2. Lubber line.
3. Heading select marker on the compass rose.
4. Course line through the selected TACAN or waypoint (an arrow marks the set course direction, p145).
5. Aircraft symbol, centred or de-centred (DCTR).
6. Ownship true airspeed (e.g. "229T", left of aircraft symbol).
7. Ground speed (e.g. "253G", right of aircraft symbol).
8. Selected heading readout, lower left (e.g. "HSEL 195").
9. Time, lower left.
10. Selected course CSEL, lower right (also shows distance to the course line).
11. Ground track pointer.
12. ADF symbol.
- TACAN data, top-left: bearing/range/time. Waypoint data, top-right (p144 figure).
- Compass orientation modes: track-up by default, N UP for magnetic north, N UP plus TRUE heading for true north (p144).
- On the MPCD a moving map can be projected behind it (p86).

### 4.2 SA page (p204-206, Figure 98)
Figure: `guide-sa-page-p205.png`.
- Selected from TAC PB 13 (p204).
- Top row as in the p205 figure: MAP (6), DCLTR (7), SCL/40 (8), MK2 (9), DCNTR (10). AMBIGUITY: the p204 text says "SCL, pushbutton 7" and "DCLTR... pushbutton 7"; the figure shows DCLTR at 7 and SCL at 8, so the text is internally inconsistent.
- Right: WYPT (11), arrows with the waypoint number between (12/13), WPDSG (14), SEQ (15), AUTO (16).
- Left: SENSR at OSB 5 (p205), then further left-edge legends (the figure shows "C2" or similar at about OSB 3).
- Bottom: EXP (20), STEP (19), MENU number (18), TXDSG (17), AUTO (16).
- Symbology: compass rose, lubber line, waypoint/OAP/TGT head and tail, bullseye (A/A waypoint) and BRA, aircraft symbol, TDC assignment symbol, selected waypoint bearing/range/time at top right, selected TACAN at top left (p204).
- Bottom-left countermeasures: bars labelled C (chaff), F (flares), O1, O2, each with a count (p205).
- EW symbols with 1-3 lines indicating threat level; air defence ring symbols (p205).
- DCLTR options on OSB 6-10: OFF, REJ1, REJ2, MREJ1, MREJ2 (p204).

### 4.3 ADI / EADI page on DDI (p84-85, Figure 29)
Figure: `guide-adi-page-p85.png`.
- Selected by the ADI pushbutton on the SUPT MENU (p84).
- Pitch/roll ball: a circle, with a small circle for zenith and a circle with an inscribed cross for nadir. The ladder is in 10-degree increments. The ball is filled green below the horizon (p84; figure).
- Airspeed in a box at the top left. Altitude in a box at the top right, with the vertical velocity above it and the altitude source to the right of it (p84; the text says altitude "top left" in places, but the figure shows airspeed left and altitude right).
- Three small boxes under the ball form the turn indicator (FCS yaw rate), with a lower box that is displaced. A standard-rate turn is shown when the lower box is under one of the end boxes (p84).
- Bottom row (figure): INS at OSB 20, a MENU number at OSB 18, STBY at OSB 16. STBY is boxed on power-up with weight on wheels. INS or STBY selects the attitude source (p84).
- ILS needles appear when ILS is selected, referenced to the waterline symbol (p84).

## 5. Other SUPT pages (brief)
- BIT (p79-80), CHKLST (p80-81), ENG (p81-82), FCS (p82-83), FUEL (p83-84), FPAS (p86-88).
- FPAS: current range, endurance, nav-to data, optimal range/endurance, CLIMB (PB 20), HOME up/down (PB 16/17). See Figure 31 on p87.

## 6. Figures saved
In `/home/chad/PycharmProjects/personal-website/docs/research/figures/`:
- `guide-ddi-supt-menu-p79.png`: DDI with the SUPT menu, annotated.
- `guide-ddi-tac-menu-p89.png`: DDI with the TAC menu (cockpit screenshot crop).
- `guide-left-instrument-panel-ddi-p39.png`: left instrument panel, with the DDI and bezel.
- `guide-ampcd-controls-p50.png`: AMPCD with numbered controls.
- `guide-hsi-page-annotated-p144.png`: HSI symbology, numbered.
- `guide-hsi-page-options-p117.png`: HSI with all option legends visible.
- `guide-sa-page-p205.png`: SA top-level page.
- `guide-adi-page-p85.png`: EADI page on the DDI.

## 7. Open ambiguities
1. OSB numbers per legend on SUPT, TAC and HSI come from screenshot alignment, not text (except where cited from p87, p204, p205).
2. The four-digit number under the MENU legend is unexplained.
3. The "IMRV DSPLY" legend on TAC (OSB 10) is not documented and is hard to read.
4. The AZ/EL legend position is read from the screenshot only.
5. Exact font, glyph size and colours need to come from other sources (the guide's figures are low resolution).
6. It is not stated whether MENU from a sub-page returns to the last-used top menu or always TAC (the HSI text says TAC, p120).
7. The SA text/figure mismatch for OSB 7 and 8 (see 4.2).
