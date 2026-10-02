# DCS F/A-18C Early Access Guide: DDI / MPCD page formats (research notes)

Source: "DCS F/A-18C Early Access Guide EN.pdf" (Eagle Dynamics). Page numbers below are the PRINTED page numbers, which equal the PDF page index + 1 (guide p79 = PDF index 78).
Local copy: `/tmp/claude-1000/-mnt-c-Users-Chad-PycharmProjects/231311e5-8de4-4471-b03d-93ca759bc8b0/scratchpad/hornet-guide/guide.pdf`.
Figures: `/home/chad/PycharmProjects/personal-website/docs/research/figures/guide-page-<page>-<name>.png` (cropped from the guide's screenshots at 200 dpi). Files in that folder not prefixed `guide-page-` came from other workers.

IMPORTANT LIMITATION: the guide's page screenshots are in-cockpit shots of a dark, low-res display. Legends were read visually from the images (the PDF text layer has none of the OSB legends). Legend spellings are as read; ones I could not be sure of are flagged "(?)". The guide is very thin on exact layouts; it does not give a full legend table for any page except by callouts.

---------------------------------------------------------------------
## 0. Global DDI conventions (verified against the guide)

### OSB numbering (verified)
Each DDI has 20 option select buttons (OSBs / "pushbuttons"). The guide's numbering is consistent across pages and works out as:

| OSBs | Edge | Order |
|---|---|---|
| 1-5 | LEFT edge | bottom to top (1 = bottom-left, 5 = top-left) |
| 6-10 | TOP edge | left to right |
| 11-15 | RIGHT edge | top to bottom |
| 16-20 | BOTTOM edge | right to left (16 = bottom-right, 18 = bottom-centre, 20 = bottom-left) |

Evidence (all from the guide): HSI top row legends POS/INS, UPDT, SCL/10, MK1, DATA are 6-10 (p86, p121; text p204 "MK2 pb9, DCNTR pb10" for the SA/HSI top row); HSI right side WYPT=11, up arrow=12, down arrow=13 (text p141 "pushbutton 12 increments, 13 decrements"), WPDSG=14, SEQ=15; HSI bottom: AUTO=16, TIME/UFC=17, MENU=18, SENSORS=20 (p204 "AUTO pb16, MENU/TIME pb18"); FPAS CLIMB=20 and HOME down/up arrows=16/17 (p87-88); SA is pb13 on TAC (p204) which is the middle of the right edge; Stores STEP=13, UFC=14, GUN=11, SIM=15 on the right edge (p303-304, p353); "top pushbuttons (6 to 10)" are the weapon-select row (p353); ATFLIR is "PB6 on the TAC page" (p217) = top-left; ATFLIR SETUP is PB15 (p225) = bottom of right edge (in the p220 shot SETUP is the lowest right legend).
So OSB positions below are given as number + edge. Where I derived a number from pixel position rather than from guide text it is marked (px).

### MENU OSB (OSB 18, bottom centre)
- "There are two primary pages in which all other pages are selected from: SUPT and TAC. Toggle between these pages, or return to them, by pressing the pushbutton marked MENU. When airborne, the MENU pushbutton converts to a timer, but still acts as a MENU button." (p79)
- On SUPT and TAC the OSB-18 legend is the page name in a BOX ("[SUPT]" / "[TAC]") with a 4-digit number beneath (SUPT 4311, TAC 3650, p79/p89). On every other page the OSB 18 slot shows only a 4-digit number with no box (3216 checklist, 3210 ENG, 3202 FCS, 3153 FUEL, 3144 EADI, 3237 BIT, 4058 EW, 4514 FPAS, 3720 HUD, 2511 TCN, 2311 A/C DATA, 2449 WYPT DATA...). The guide never explains the number. It is NOT consistent between pages and looks like a changing counter/timer (AMBIGUITY: meaning not documented; the number differs in every screenshot, so treat as decorative or a ticking value).
- Some pages show "MENU" literally at OSB 18 (ATFLIR NOT TIMED OUT shows MENU at bottom-centre, p218).

### Rendering conventions seen in every shot
- All symbology is monochrome green on black, a blocky stroke font. Vertical OSB labels on the left/right edges are drawn rotated: letters stacked top to bottom, upright (not rotated glyphs). Examples: "C H K L S T", "E N G", "F C S", "S T O R E S". The 2-line legend case is two columns of stacked letters side by side (ATTK RDR, p89).
- Top and bottom row legends are horizontal and sit just inside the screen, centred over/under their OSB.
- Selected/active option = legend with a rectangle BOX drawn around it ("boxing"). Pressing a boxed OSB generally un-boxes it. Failed/invalid = diagonal X through the legend.
- Bottom-left of nearly every page shows an advisory strip: `ADV-FPAS,BIT,BALT,` (p84-86 etc. see figures); on the ATFLIR page `ADV- BIT,` plus "M 0.10". Looks like cycling advisory/caution text: ADV- followed by comma-separated advisory names. (Text visible in the SUPT-selected pages: A/G SMS p303 `ADV-   BIT,BALT,`; EW `ADV-FPAS,BIT,BALT,`; AIM-9 `ADV-FPAS,BIT,BALT,`.) Guide does not document. Good candidate for a ticker-style bit of flavour.
- TDC assignment indicator: a small diamond in the top-right corner of the screen (p217).
- Brightness/contrast: physical BRT and CONT knobs at bottom-left / bottom-right corners of the bezel, NIGHT/OFF/DAY switch above top centre (p50 describes the MPCD equivalents: off/brightness rotary, night/day rocker, symbology rocker, gain rocker, contrast rocker). These are bezel controls, not DDI pages.

---------------------------------------------------------------------
## 1. SUPT (Support) menu page (guide p79, fig 23)
Reached by: MENU OSB 18 (toggle with TAC). Figure: `guide-page-79-supt-menu.png`.

Legends (position derived from the callout screenshot, pixel based):
| Legend | OSB | Edge | Guide callout name |
|---|---|---|---|
| MIDS | 6 | top, first | MIDS page |
| BIT | 8 | top, middle | Built In Test page |
| MUMI | 10 | top, last | Memory Unit Mission Initialization page (N/I = not implemented) |
| HSI | 2 (px) | left | HSI page |
| ADI | 1 (px) | left, lowest | Electronic Attitude Display Indicator (EADI) page |
| CHKLST | 11 | right, first | Checklist page |
| ENG | 12 | right, second | Engine page |
| FCS | 15 (px) | right, lowest | FCS page |
| FUEL | 20 | bottom-left | Fuel page |
| FPAS | 19 | bottom, second from left | Flight Performance Advisory System |
| [SUPT] 4311 | 18 | bottom centre | boxed menu legend |

Unused OSBs are blank (3, 4, 5, 7, 9, 13, 14, 16, 17). The p252 text says HMD is at SUPT pb13, but the p79 screenshot shows no HMD legend (AMBIGUITY: HMD legend appears only when JHMCS/HMD is relevant, or screenshot is older). Page selected from here is shown on that DDI; MENU returns.
Whole page is an index of legends only. No body content.

---------------------------------------------------------------------
## 2. TAC (Tactical) menu page (guide p89, fig 33)
Reached by: MENU OSB 18 (toggle with SUPT). Figure: `guide-page-89-tac-menu.png`.

| Legend | OSB | Notes |
|---|---|---|
| STORES | 5 (px, left, topmost) | SMS page (guide calls it "Stores Management System (SMS) Page") |
| ATTK RDR (two columns: "RDR" left col, "ATTK" right col) | 4 (px) | Attack radar page |
| HUD | 3 (px) | HUD page (copy of HUD symbology) |
| AZ/EL | 1 (px) | AZ/EL format (p180) |
| FLIR | 6 (top-left), per text p217 | ATFLIR page; text says "selected from PB6"; legend NOT visible in the p89 screenshot (no pod loaded) |
| "IMRV" over "DSPLY" (reading uncertain "IMRV"?) | 10 (px, top-right, two lines) | Not described in guide |
| SA | 13 (text p204) | Situational Awareness page |
| EW | 17 (px, bottom, second from right) | EW page |
| [TAC] 3650 | 18 | boxed |
Body empty. Plain legend index like SUPT.

---------------------------------------------------------------------
## 3. STORES / SMS page (the aircraft drawing)  -- MOST IMPORTANT
Reached by: TAC menu, STORES OSB (left edge, topmost), or automatically when a weapon is selected from the control stick or when the master mode changes (A/G master mode puts SMS on the LEFT DDI, p303; A/A and gun SMS pages are "accessed through the TAC menu or automatically called up by selecting the weapon", p262/p271). Guide p90 fig 35 is a mislabeled/odd shot (shows an ARM-labelled page with TONE / DATA and a V-shaped thing: that is a HARM/A-A style format, NOT the wingform). The useful wingform figures are p263, p272, p280, p289, p303, p332, p353.
Figures (full-page screenshots): `guide-page-303-ag-sms-bombing-page.png`, `guide-page-289-aim120-stores-page.png`, `guide-page-272-aim9-sms-page.png`, `guide-page-263-aa-guns-sms-page.png`, `guide-page-280-aim7-sms-page.png`, `guide-page-332-gps-weapon-sms-page.png`, `guide-page-353-agm65f-stores-page.png`. High-zoom wingform crops: `guide-page-303-wingform-zoom.png`, `guide-page-289-wingform-zoom-aim120.png`.

### The "planform" drawing is NOT a jet silhouette
The guide itself calls it the "wingform" (p303 item 2 "Wingform Display") and "wing planform" (p332). It is a minimal line-drawing, FRONT-ON, composed of only straight lines. There is no fuselage outline, no nose, no tail, no jet image at all. Anyone building it should draw exactly:
1. A short VERTICAL bracket either side of the centreline (a left bracket and a right bracket, mirror images), each about 0.16 of the wing half-span tall. Left bracket looks like `┐`: vertical stroke on the inboard side with a short horizontal hook at its TOP going outboard. Right bracket is the mirror `┌`. The gap between the brackets is the fuselage/centreline.
2. From the BOTTOM of each bracket a single straight line runs OUTBOARD and DOWNWARD at about 25 degrees below horizontal (measured on the p303 zoom: dx=305, dy=140 px, so a gentle droop, wingtip lower than root). That line is the wing. Left wing goes down-left, right wing goes down-right. Together with the brackets it reads like a shallow "V" / bird silhouette with upturned centre.
3. Along each wing line are three stations at evenly spaced points: wingtip end (t=0), outboard pylon (t=0.34), inboard pylon (t=0.67), measured from the tip to the bracket. A short tick mark sits on the line (pointing up) at each pylon position. (Measured p289 zoom: tip x=215, outboard x~320, inboard x~420, bracket x~520.)
4. The gun round count (578 full) is printed centred above the brackets (p263, p303 "gun rounds remaining is indicated at the top of the wingform; 578 being a full load and XXX when empty").
5. Centreline station label sits in the gap, just under the bracket tops, e.g. "FUEL" (centreline tank) or the weapon code (p303 shows 83B there).
6. ARM / SAFE / SIM text is drawn larger (guide says "200% size letters", p332) centred below the wingform at roughly 40 percent of the way down the screen.

### Station numbering (confirmed by text)
Nine stations, numbered left to right as seen from the cockpit/behind (i.e. the pilot's left is 1):
| Station | Position on drawing | Facts from guide |
|---|---|---|
| 1 | left wingtip | AIM-9 / TCTS pod; "TCTS pod can be mounted to either outboard wingtip station" (p36/37 area); AIM-9 shown "9X"/"7M" at tips (p272, p332) |
| 2 | left outboard pylon (t=0.34) | AIM-120/AIM-7/bombs/Maverick; "AIM-120 up to two on stations 2, 3, 7, 8" (p289); jettison button LO |
| 3 | left inboard pylon (t=0.67) | as above; jettison LI; typically tanks/bombs |
| 4 | left fuselage station, drawn just OUTBOARD of the left bracket, level with the bracket top | AIM-120/AIM-7 mounted "directly to stations 4 and 6" (p31); ATFLIR is on left cheek (p217) |
| 5 | centreline, in the gap | centreline tank / "FUEL"; jettison CTR |
| 6 | right fuselage station, outboard of right bracket | AIM-120/AIM-7 |
| 7 | right inboard pylon | mirror of 3 |
| 8 | right outboard pylon | mirror of 2 |
| 9 | right wingtip | mirror of 1 |
Guide statements backing this: jettison buttons CTR, LI, RI, LO, RO and EMERG JETT acts on 2,3,5,7,8 (p40); Maverick priority sequence 8,2,7,3 (p352-353); laser sequence "all, 2,3,4,6,7,8" (p352); GPS example "station 3 ... station 9" (p332). So 1 and 9 are the wingtips, 2/8 outer pylons, 3/7 inner pylons, 4/6 fuselage, 5 centreline. (Standard Hornet numbering; the guide never prints a numbered diagram. The wingform itself shows NO station numbers, only contents.)

### How contents are drawn per station
- AIM-9 (and AIM-120/7 missiles): a small square glyph with crossed diagonals (like a boxed X, drawn as `¤`-looking missile-on-rail symbol) at the station position. Two glyphs side by side = twin launcher (e.g. two AIM-120 on one pylon, p289: "¤¤" with the code beneath). Beneath it: weapon code: "AB" (AIM-120B), "AC" (AIM-120C), "9X", "9M", "9L", "7M", "7F", "TST" (CATM-9M), "9X". AIM-120 on fuselage stations 4/6 is drawn at the bracket top with the code to the OUTSIDE ("AB ¤" left, "¤ AC" right, p289).
- Bombs/racks: a DIAMOND symbol on the wing tick; the number of weapons on that station is printed beneath the diamond; beneath that a weapon code (68S, "RE" (meanings not given by the guide) , "82XT", "J-82" (JDAM Mk-82), "83B" Mk-83) and status text. Statuses: RDY, STBY, SEL, LKD, ULK, plus X through the box when not ready.
- Selected station: the weapon code (not the whole station) is BOXED (p303 82XT boxed; p332 J-82 boxed with RDY beneath). For A/A missiles selection is shown with the text "SEL" under the code ("SEL" for single, "L SEL"/"R SEL" for the left/right rail of a dual launcher; p272, p289).
- A selected weapon TYPE is also boxed in the top row of OSBs (p303: legends 68S, RE, 83B, [82XT] on OSBs 6-10, one per weapon type loaded, max 5; selected = boxed; pressing again deselects; RDY printed below the box when releasable, otherwise an X through the box). Selecting automatically boxes the type on the wingform. Per type there is also "step" behaviour.

### OSB legends: A/G conventional bomb page (p303-304, fig 160)
Top (6-10): up to 5 weapon-type legends (e.g. 68S, RE, 83B, 82XT), selected one boxed.
Left edge, top to bottom (OSB 5,4,3,2,... ): MODE, MFUZ, EFUZ, DRAG (delivery program options; pressing one replaces left edge with that option's choices e.g. MODE -> AUTO, FD (N/I), CCIP, MAN; MFUZ -> OFF, NOSE, TAIL, NT; EFUZ -> OFF, VT, INST, DLY1, DLY2; DRAG -> FF, RET; p305).
Right edge: GUN (11, "Hot Gun"), STEP (13, step selected station), UFC (14), SIM (15).
Bottom: PROG (OSB 20, cycles programs 1-5), TONE (19, cycles TONE1/TONE2/off, boxed when on), 2404 (18 menu number), DATA (17? px, bottom right of centre).
Centre-lower: "PROG 1" underlined, then data block MODE CCIP / MFUZ OFF / EFUZ OFF / DRAG FF with QTY 1 / MULT 1 at right.
Master arm text: SAFE / ARM / SIM centred under wingform.
Bottom-left: advisory strip `ADV-   BIT,BALT,`.

### A/A pages
- A/A GUNS (p262-263, fig 135): gun rounds remaining (578), RND option (M50 / PGU, selected boxed), RATE option HI / LO (6000/4000 rpm; HI default; boxed when selected), ARM/SAFE/SIM cue, WSPN XXX (UFC wingspan 10-150 ft, default 40), UFC option at OSB 14.
- AIM-9 (p271-272, fig 142): wingform with AIM-9 glyphs at tips, SEL label by selected missile ("9X" + "SEL"), "FUEL" in centreline, rows of "AC" etc. for other loaded AAMs, ARM centre. No unique AIM-9 OSB functions. Selection cycles by repeatedly pressing Weapon Select (stick) in AIM-9 direction.
- AIM-7 (p279-280, fig 147): missile symbol + 7F/7M code, SEL below priority; Target size SML/MED/LRG (top-row cycle), HELO (special mode; X through when off), SP TEST (test box "TEST" boxed while tuning).
- AIM-120 (p288-289, fig 152): top row legends "SIZE MED" and "RCS MED" (cycle SML/MED/LRG; when pressed each option becomes a separate OSB across the top). Left edge vertical "AUTO S MODE MAN" (two columns; MAN boxed) (px). Right edge: STEP at OSB 13 (cycles stations loaded with AIM-120, wraps). Wingform: "AB" at left fuselage and left outer, "AC" etc., TST at tips, "R SEL" under the selected right outboard pair (station 8), ARM centred, 578 on top, "FUEL" centreline. Bottom: menu number 2048.
- GPS weapons (p332 fig 180): JDAM J-82 etc.; shows "99 TMR", ALN QUAL 01 GOOD, EFUZ INST, JDAM DSPLY (right edge text "J D A M D S P L Y" near top right), left edge PP MODE (vertical), EFUZ, ERASE, JSOW, ARM (vertical, cycling), STEP (right), top-left boxed "J-82 / RDY".
- AGM-65F (p353 fig 194): top-left boxed "MAVF" in the weapon-select row (OSB 6 area), wingform legend "MAVF" under each loaded station, "SL" at the tips (meaning not given), STEP OSB 13, UFC OSB 14, GUN OSB 11, bottom TONE / 3919 / DATA.
The ATFLIR/other pods and fuel tanks: "FUEL" shown at centreline (tank) in the figures; ATFLIR not shown on wingform in the screenshots.

### Interactions summary
- OSB 6-10 (top): choose weapon type. Boxed = selected. Press again = deselect.
- STEP (right edge, OSB 13): rotate priority station among stations with that weapon, honouring priority sequence (e.g. Maverick 8,2,7,3).
- Stick weapon-select switch repeatedly cycles stations (AIM-9 / AIM-120).
- GUN (OSB 11) toggles gun as priority A/G weapon or HOT GUN.
- UFC (14), SIM (15), PROG, TONE, DATA, MODE/MFUZ/EFUZ/DRAG as above.

---------------------------------------------------------------------
## 4. ENG (Engine) page (guide p81-82, fig 26)
Reached by: SUPT -> ENG (OSB 12, right edge). Figure: `guide-page-82-eng-page.png`, zoom `guide-page-82-eng-page-zoom.png`.
Text-only table, two numeric columns around a centre label column; headers "LEFT EPE" and "RIGHT EPE" (as read, almost certainly ENG: AMBIGUITY, glyph looks like "EPE") at top-left and top-right. Rows top to bottom (left value / centre label / right value):
INLET TEMP (°C) 54/54; N1 RPM (%) 105/105; N2 RPM (%) 99/99; EGT (°C) 846/846; FF (lb/h) 9934/9934; NOZ POS (%) 46/46; OIL PRESS (psi) 144/144; THRUST (no function, label only, no values); VIB (in/s) 0.2/0.2; FUEL TEMP (°C) 14/14; EPR 5.59/5.59 (valid only on ground static); CDP (psia) 381/381; TDP (no function, label only).
OSBs: only one shown: boxed RECORD at OSB 16 (bottom right) (px). Guide does not describe RECORD. MENU number 3210 at OSB 18. Centre column labels are centred; values right-aligned in left column and left-aligned-ish in right column.
Numbers fixed width, no gauges, no bars. Very simple to clone and with live-ticking numbers would look great.

---------------------------------------------------------------------
## 5. FUEL page (guide p83-84, fig 28)
Reached by: SUPT -> FUEL (OSB 20, bottom-left). Figure: `guide-page-84-fuel-page.png`.
Layout (px from screenshot): 
- Top-left stacked: "TOTAL" over "10180", "INTERNAL" over "10180" (lb).
- Centre: four boxed (rectangle) tank readouts stacked vertically, each with a small caret "<" to the right side that moves vertically to show quantity fraction (guide: "A moving caret on the right side of each tank indicates the ratio of fuel available to capacity"): box TK 1 (2330) with tiny label "TK 1" above; box L FD (1490) with label "L FD" above; box R FD (1440) with label above; box TK 4 (3650) larger with label "TK 4". (L FD = tank 2 left feed, R FD = tank 3 right feed.)
- Left of centre, lower: small box "L WG" 620; right: box "R WG" 620 (wing tanks), each also with caret.
- Top-right: "RESET SDC" legend at OSB 10 (px), below it "BINGO" and value (0) near OSB 11.
- Bottom-left: FLBIT at OSB 20 (guide: "FLBIT PB tests the FUEL LO warning system; during the test the FLBIT label is boxed; test takes 13 s; NO TEST shown next to feed tank if already low; produces FUEL LO caution, voice alert and master caution"), centre-bottom menu number 3153.
- Special values: INV (invalid, shows 0 lb) and EST (estimated) cues next to tank values/totals; 800 lb displayed for invalid feed tank when FUEL LO is not present. 
- BINGO value set via UFC (guide gives "Bingo Fuel Level in Lbs").
Great visual: boxed numbers plus caret markers. Good for a "skills level" display (caret = proficiency).

---------------------------------------------------------------------
## 6. FCS page (guide p82-83, fig 27)
Reached by: SUPT -> FCS (OSB 15, right edge lowest). Figure: `guide-page-83-fcs-page.png`.
Layout:
- Top-centre control surface block: rows, each "value  LABEL  value" with arrows: `0 LEF 0` (leading edge flap L/R), `1 TEF 1` with arrows `↓`/`↓` (trailing edge flap), `0 AIL 0` (aileron, boxed/underlined rows), `0 RUD 0`, `1 STAB 1` with `↑` arrows. Numbers are degrees with arrows showing direction from neutral (guide's figure: LEF 1 down both, TEF 5 down / 5 up, AIL 15, STAB 3/4 etc.). X through a LEF/TEF/AIL/RUD number = no longer commanded. Blank where unreliable. ±1 degree tolerance.
- Either side of that block: columns of small boxes representing channels: left side labels "SV1" "SV2" (servo) and columns numbered "1 2 3 4" under; right side the same mirrored. X in a box = channel failed. Left side: channels 1 and 4 for LEF/AIL/RUD, and 1 2 3 4 for TEF and STAB; right: channels 2 and 3 for LEF/AIL/RUD and 1 2 3 4 for TEF/STAB.
- Mid-left: "G-LIM 6.7G" (g limit from gross weight).
- Lower-right grid: rows labelled CAS (with P/R/Y sub-columns), N ACC, L ACC, STICK, PEDAL, AOA, BADSA, PROC, DEGD; four channel columns; an X means failure in that channel; X opposite DEGD = switch failure or single TEF/STAB shutoff valve failure; PROC X in CH1 and CH3 = no INS data to FCCs (p83).
- Bottom: "L 1.0" at left and "R 1.0" at right (?), a boxed legend (looks like "AOA -99.9" boxed) at OSB 18-19 area (AMBIGUITY: reads "AOA -99.9" boxed with "AOA" legend OSB below; not described), bottom-centre number 3202; left edge vertical "B I N" maybe "BIT" at OSB 3 (px, reads B I N / BIT?).
Good striking graphic: bars/grids. Page also contains: "RESET" function not documented (guide says "the FCS should be reset", via the FCS RESET switch on cockpit).

---------------------------------------------------------------------
## 7. BIT page (guide p79-80, fig 24)  [sub-pages largely undocumented]
Reached by: SUPT -> BIT (OSB 8, top centre). Figure: `guide-page-80-bit-page.png`, zoom `guide-page-80-bit-failures-zoom.png`.
Guide text: "each subsystem has its own built-in test; this page allows the pilot to test these systems and view status" (p79). It shows only ONE BIT screen (the "BIT FAILURES" summary). Sub-pages are not described (AMBIGUITY: no sub-page list in the guide; CONFIG, SELBIT, MI exist as OSB legends only).
Top row legends: AUTO (OSB 6), CONFIG (7), SELBIT (8), MI (9), STOP (10).
Centre title: "BIT FAILURES" (large, centred, about 1/4 down).
Centre two-column list (left column system names, right column status), starting under the title:
WPNS DEGD / IFF NOT RDY / D/L NOT RDY / MIDS NOT RDY / BCN OFF / AUG(?) DEGD (reads "AUG", possibly RUG) / DWS(?) NOT RDY / HMD NOT RDY.
Left edge (top to bottom, each an underlined header with status under it): FCS-MC GO; SENSORS GO; STORES DEGD; COMM NOT RDY; NAV NOT RDY.
Right edge: DISPLAYS NOT RDY; STATUS MONITOR (two lines) GO; EW GO.
OSB 18: 3237.
Status vocabulary: GO, NOT RDY, DEGD, OFF. These are lovely "status" words; page works well as a section for "skills / systems status" with GO/DEGD/NOT RDY ratings.

---------------------------------------------------------------------
## 8. CHKLST (Checklist) page (guide p80-81, fig 25)
Reached by: SUPT -> CHKLST (OSB 11, right edge top). Figure: `guide-page-81-checklist-page.png`.
Two plain-text columns, left aligned (no boxes, no OSB legends other than menu number 3216):
Left column header "LAND": WHEELS, FLAPS, HOOK, ANTI SKID, HARNESS, DISPENSER (each indented by 1 space under LAND).
Right column header "T.O.": CONTROLS, WINGS, TRIM, FLAPS, HOOK, HARNESS, WARN LITES, NWS LO, SEAT ARM.
Below left: "A/C WT 36533" (lb gross weight, rounded to nearest lb).
Next: "MAX NZ" (maximum vertical g of the most recent landing, nearest .01 g; blank in shot).
Bottom: "1° NU STAB POS 1° NU" (guide: "STAB POS: horizontal stabilizer position in degrees followed by NU/ND; takeoff trim = 12 NU").
OSBs: none shown. Static list = the best template for a plain text / resume bullet list page (left column and right column, 9 rows, all caps).

---------------------------------------------------------------------
## 9. FPAS (Flight Performance Advisory System) (guide p86-88, figs 31-32)
Reached by: SUPT -> FPAS (OSB 19). Figures: `guide-page-87-fpas-page.png`, `guide-page-88-fpas-climb.png`.
Layout (all text, underlined column headings):
- Top block: headings "CURRENT" over "RANGE" (centre) and "ENDURANCE" (right). Row "TO 2000 LB 329 :27"; blank; "BEST MACH .54 .41"; "TO 2000 LB 586 1:54". (Switches to TO 0 LB under 2,500 lb fuel; shows LIM if above Mach .9.)
- Navigation row: headings "NAV TO", "TIME", "FUEL REMAIN", "LB/NM" (underlined); data "WYPT 1  :14:53  9624  25". Driven by boxing TCN or WYPT on HSI.
- A horizontal green separator line across the page.
- Lower block: heading "OPTIMUM" over "RANGE" and "ENDURANCE"; rows "ALTITUDE 37901 33001", "MACH .84 .71", "TO 2000 LB 1012 2:05", "DEFAULT:".
- Bottom: boxed "CLIMB" at OSB 20 (guide: when boxed shows optimal climb airspeed on HUD above airspeed box), 4514 at OSB 18, "↓ HOME ↑" at OSB 17/16 with a small number "4" above HOME (selected home waypoint, set with arrows on pb 16 and 17; when 2,000 lb fuel remains at the home point a HOME FUEL caution and Master Caution fire).
Pure data page. Reads like a flight-plan table; useful as a "stats/metrics" section.

---------------------------------------------------------------------
## 10. EADI page (SUPT -> ADI, guide p84-85, fig 29)
Figure: `guide-page-85-eadi-page.png`. Round attitude ball (green circle outline, brown/ground half drawn filled with horizontal hatch lines, sky empty), pitch ladder labels 30, 20, 10, 0, 10, 20 along the vertical centre; small zenith circle and nadir circle-with-cross; airspeed boxed (548) top-left of ball; altitude boxed (7860) top-right with vertical velocity above; row of three small squares under the ball with one square below (rudder/turn indicator, standard rate when lower box is under an end box); bottom: "INS" (OSB at bottom-left? left of 3144) and boxed "STBY" (bottom-right, OSB 16-ish) as the attitude source toggle: STBY boxed on power-up with weight on wheels; INS boxed = INS source. Selection does not change HUD source. ILS needles appear when ILS selected (yellow if COLOR on Attack display). Visually iconic (artificial horizon).

---------------------------------------------------------------------
## 11. HSI page and DATA sub-pages (guide p86 fig 30, p121-145)
Reached by: SUPT -> HSI (OSB 2) on a DDI; default on the MPCD. Figures: `guide-page-86-hsi-page.png`, `guide-page-121-hsi-waypoint-steering.png`, `guide-page-137-hsi-tacan-steering.png`, `guide-page-144-hsi-additional-symbology.png`, `guide-page-145-hsi-course.png`.
Legends (read from p86/p121 shots):
Top row: POS/INS (6), UPDT (7), SCL/10 (8), MK1 (9, mark point), DATA (10).
Left edge (top to bottom): TCN (5), ILS (4), MODE (3), VEC (2), ACL (1).
Right edge: WYPT (11, boxed when waypoint steering), up arrow (12), selected waypoint number between (e.g. 2), down arrow (13), WPDSG (14), SEQ with seq number e.g. "SEQ 2" (15).
Bottom row: SENSORS (20), [number] (18), TIMEUFC (17), AUTO (16).
Body: compass rose dotted ring with cardinals/numerals (N, 3, 6, E, 12, 15, S, 21, 24, W, 30, 33), lubber line at top (small diamond/arrow), aircraft symbol (Y-like "aircraft" glyph) in the middle or a cross with "391T 391G" (true airspeed / ground speed) above and below; top-left block "258° / 8.1", "1:14", "TSK" (bearing/range/time to selected waypoint) in the shot; top-right "230° / 5.4" and "00:00:50" and "10319 / 5"; bottom-left clock "09:01:54EI" with "HSEL 000°", bottom-right "5.4C" "CSEL 330°". Course line with arrow end; waypoint circle on it. Moving map can be projected on the MPCD.
Symbols list (p144): compass rose, lubber line, heading select marker, course line, aircraft symbol, TAS, GS, selected heading, time (TIMEUFC selects UFC time source), selected course, ground track pointer, ADF symbol.

### DATA sub-levels (p139-142)
Selected via DATA (OSB 10). Top row on every DATA sub-page: A/C (6), WYPT (7), TCN (8), MDATA (9), HSI (10); the active one is boxed. HSI returns to main HSI.
- A/C (p139, fig 64, `guide-page-139-hsi-data-ac-sublevel.png`): centre text block: "INS", "N 42°06.75'", "E 40°43.75'", "WSPD 0KT", "WDIR 45°", "MVAR E 6°02'", then "GPS HERR 20FT", "GPS VERR 10FT", "GPS TIME 13:01:13Z". Left edge vertical legends (bottom to top): NORM (OSB1 Heading mode? actually "N O R M" / "SEC" / "NOGPS"?), "UFC BLIM TAC" (bank limit NAV/TAC), "GPS NO..." (GPS security), "SEC" (LAT/LONG display DCML/SEC). Right edge: "NAV CK" (11), "HMD GG"(?), "LD AC TM LN" (display/heading mode: LAT/LONG, mag/true) (px). Bottom: WARN ALT BARO 5000 RADAR 0 (underlined headers, left at OSB 20), menu number 2311, boxed "TAWS" at OSB 17-16. Guide: Bank limit NAV (30°) / TAC (60°); GPS Security (N/I); Warning altitudes: baro up to 25,000 ft, radar up to 5,000 ft, 0 disables; Heading mode magnetic/true; LAT/LONG DCML/SEC; Nav Check.
- WYPT (p140-141, fig 65, `guide-page-140-hsi-data-wypt-sublevel.png`): title "WYPT 2" centre; "N 42°24.05'", "E 41°26.71'", "GRID 11S KA 761174", "ELEV 2000M"; offset block "O/S RNG 0M", "O/S BRG", "O/S GRID", "O/S ELEV 0M"; green line; "TOT 00:17:15  GSPD 500"; sequence list "0- 1- 2-[3]- 4- 5- 6" with TGT boxed; bottom "WGS-84 DATUM 47 PRECISE", "2449", "OVFLY1", "FLRP", small "23" at bottom-right. Left edge: UFC, SLEW, GPS, A/A WP, SEQ UFC. Right edge: NAV CK, up arrow, selected number "2", down arrow, REF WP, SEQ1. Guide function: pb2 = set as air-to-air waypoint (bullseye); pb12/13 waypoint increment/decrement; PRECISE toggles lat/long precision; LATLN DCML/SEC toggle.
- TCN (p141-142, fig 66, `guide-page-141-hsi-data-tcn-sublevel.png`): centre "16X" then "N 41°36.65'", "E 41°36.02'", "ELEV 10FT", "MVAR E 5°59'". Left: UFC, GPS legends. Right: NAV CK, up arrow, selected index (0), down arrow. Stores up to ten TACANs; unused slots read "1X" with zeroed data; edit with PB5 and UFC. Pre-loaded with the theatre's TACANs.
- MDATA: legend exists (top row, OSB 9), not documented in the guide.
These are list-like pages (waypoint list sequence "0- 1- 2-[3]- 4- 5- 6", TACAN list 0-9). Good for blog/resume style index navigation.

---------------------------------------------------------------------
## 12. EW page (guide p409-411, figs 231, 232) and ALR-67 azimuth indicator (p412-414)
Reached by: TAC -> EW (OSB 17, bottom). Figures: `guide-page-409-ew-page.png`, `guide-page-89-ew-page.png`, `guide-page-410-ew-cmds-prog-sublevel.png`, `guide-page-411-ew-bit-images.png`, `guide-page-412-rwr-azimuth-indicator.png`, `guide-page-411-ew-symbols-text.png`.
Main page layout (p409 shot):
- Top row legends (6-9): "ASPJ / OFF" (OSB 6; under legend the mode: OFF/XMIT/REC/STBY/BIT; crossed out with a dash when off; guide says "mode indicated adjacent PB8", AMBIGUITY: shot puts ASPJ at the first top OSB = 6), "ALR-67 / RCV"? (OSB 7; shows power; under it OFF when unpowered), "[ALE-47] / MAN 2" (OSB 8; boxed when the dispenser is on; selected program MAN 1-6, S/A or AUTO displayed beneath), "ARM" (OSB 9; when pressed opens CMDS PROG sub-level; ARM legend shown only when ALE-47 OSB boxed).
- Counters: "C 60 / F 30" at upper left (chaff / flare remaining; a box appears over the number when released), "O2 0 / O1 0" upper right (GEN-X decoys). Per guide, pressing ALE-47 should show C 14, F 18, O1 14, O2 14 (from the example).
- Centre: the RWR azimuth display: three concentric circles (outer circle with 12 tick marks every 30 degrees, a middle circle, a small inner circle), ownship symbol at the centre (small aircraft glyph/cross), two pairs of short horizontal parallel bars at 9 o'clock and 3 o'clock outside the middle ring (looks like wing-bars/horizon marks), emitter symbols (e.g. "29" with a chevron above = airborne hostile, "E2" etc.).
- Right edge: boxed vertical "HUD" legend at OSB 14 (px) = displays EW contacts on HUD when boxed (guide "HUD EW").
- Left lower: "NORM" (OSB 2 px; not described in guide, likely display/limit mode (?)).
- Bottom: STEP (OSB 20; only visible in MAN mode, cycles programs), MODE (OSB 19; cycles STBY / MAN / S/A / AUTO), menu number (4058 / 3828) at 18.
- Advisory strip bottom-left `ADV-FPAS,BIT,BALT,`.
CMDS PROG sub-level (p410, `guide-page-410-ew-cmds-prog-sublevel.png`): ARM pressed. Top row now ASPJ / ALR-67 / ALE-47 / RTN (OSB 9 = RTN). Centre text "CMDS PROG 2" with columns CHAFF FLARE OTH1 OTH2 RPT INT and values "1 1 0 0 10 0.50", underlined line above. Left edge (OSB 5,4,3,2): CHAF, FLAR, OTH1, OTH2; right edge: up arrow (12), down arrow (13), RPT (14), INT (15) (the guide text says RRT/INT). Bottom: STEP (20), SAVE (19). Interaction: press an element OSB to box it, arrows change value, SAVE stores, RTN returns. 5 or 6 manual programs (guide says both; AMBIGUITY).
EW BIT (p411): test images in circles: "THE QUICK BROWN / FOXES JUMPED OVER / THE LAZY DOG", digits 0-9 with 3 "U" shapes, 10-19 numbers, and a symbol grid; 3 s apart; tones: new contact (waterfall), AAA, missile launch, radar lock, power up.
EW symbols (p411): friendly airborne, unknown airborne, hostile airborne, SAM, AAA, naval (boat), surveillance/EW (the symbols are glyphs drawn in the guide; in the sample text-layer: 29, 14, A, AE, 18, HK). Symbols: letters/numbers with a caret/chevron above for airborne; bands: critical (outermost), lethal, non-lethal (inner); status circle at centre with areas I, II, III (priority N/I/A/U/F; L for display limit; B or T for BIT/thermal).
Great for a "radar scope" hero or loading screen: concentric circle RWR with radar contacts that could be nav items.

---------------------------------------------------------------------
## 13. FLIR / ATFLIR format (brief; guide p217-232) and Litening
Reached by: TAC -> FLIR (OSB 6, top-left) with master mode A/G or NAV. Figures: `guide-page-218-atflir-not-timed-out.png`, `guide-page-219-atflir-stby.png`, `guide-page-220-atflir-opr-controls.png`, `guide-page-221-atflir-opr-display.png`, `guide-page-224-atflir-ltd-lst.png`, `guide-page-225-atflir-setup-menu.png`, Litening `guide-page-235-litening-not-timed-out.png`.
Modes: RDY (not timed out, "NOT TIMED OUT" centred), STBY, IBIT, OPR.
OPR layout (p220 shot): top-left "OPR" (mode) and below it "WFOV / Z1.0" (field of view and zoom) at OSB 6; top centre "IR" (TV/IR toggle, OSB 8) with "1° R" beneath (azimuth) and boxed "RTCL" (reticle toggle, OSB 9); left "-12°" (elevation); left edge vertical "ZOOM 1.0" and "FOCUS 0" with up/down arrows; right: coordinates block "N 36°47.30' W115°26.99' ELEV 3472 FT GRID 11S PA 383725" below the TDC diamond at upper right, vertical "VVSLV" (OSB 12 px), LST/LTD/R codes "LST 1688 / 1688 LTD/R" (right, with vertical UFC), "SETUP 01" (OSB 15); bottom: "WHT" (polarity, OSB 20 px), boxed "ALG" (auto level and gain, 19), menu number 1811 (18), "LST" (17), "DCLTR" (16); `ADV- BIT,` advisory plus "M 0.10". Centre: reticle (cross with gaps) with tick marks (MFOV area), north arrow, velocity vector, steerpoint, SA diamond. Tracking modes INR, SCENE, AUTO, designation; reticle shape depends.
SETUP menu (p225): coordinate option ALL / L/L / GRID / OFF, eye safe laser, transfer alignment mode, reinitialize alignment, grayscale, calibrate video.
Visually strong (green IR video + reticle) but needs imagery.

---------------------------------------------------------------------
## 14. Time / date / brightness related pages
- No dedicated DDI "time" page exists in the guide. Time sources: HSI "TIMEUFC" OSB (17) selects the UFC time shown on HSI (p144 item 9); A/C DATA sub-page shows "GPS TIME 13:01:13Z" (p139); WYPT page shows TOT (time on target, Zulu) (p141).
- MIDS page (SUPT -> MIDS, OSB 6; p201 fig 96, `guide-page-201-mids-format.png`; the text says "This format will be documented in a later edition"): shows "NET ENTRY: COARSE", "DATE: 6/21/16", "TIME: 15:46:09", "NETWORK: NET 1", "AIC: 127", "F/F 1: 127  F/F 2: 127", "VOICE A: 127  VOICE B: 127". Top: NONE (OSB 6), MODE NORM (8), NTR (10). Left edge: NAV RSET, MSTR RSET, IPF RSET, IPF EXER. Right: NET ENTRY, SET TIME. Bottom: MIDS O/H OVRD, NORM PWR, 4233, UPPER XMIT, RELAY. This is the only DDI page that displays a DATE in the guide. Good for a "Last updated: date/time" gag.
- Brightness: HMD SUPT page (p252, `guide-page-252-hmd-supt-page.png`): BRT cycles DAY / NIGHT / AUTO (right edge, "BRT AUTO" two columns at OSB 11), REJECT NORM / REJ 1 / REJ 2 (top, OSB 7), BLNK (OSB 12, boxed when auto-blanking), bottom ALIGN (20), REJECT SETUP (19), number 3416 (18), MIDS SETUP(?) (17); left edge UPLK RESET (?) etc. Guide says HMD legend is at SUPT pb13 (AMBIGUITY, not in p79 shot).
- MPCD physical brightness/gain/contrast/symbology controls: p50.

---------------------------------------------------------------------
## 15. HUD format page (TAC -> HUD, OSB 3 px) (p90, fig 36)
Figure: `guide-page-90-hud-page.png`. Duplicates HUD: heading tape at top (000 010 020 with carets), airspeed box (548) left, altitude box (7860) right with "0" vertical speed above, flight path/waterline crosshair in centre, left list "α 1.0 / M 0.86 / G 1.0 / 1.2", "4.3 BTM" bearing/distance right, clock "14:57:17EI" at bottom-left, pitch ladder "5" and "10" bars, number 3720 at OSB 18. Used when HUD fails or glare. No OSB legends visible.

---------------------------------------------------------------------
## 16. Other pages (brief)
- Attack radar RDR ATTK (TAC OSB 4; p91, `guide-page-91-attack-radar.png`; A/G radar p186-190 `guide-page-186-ag-radar-page.png`): B-scope with many OSBs (ECCM, AIR, FAST, azimuth scan select, CHAN, SIL, RSET, FRZ, range inc/dec, PEN/FAM beam, EXP1/2/3).
- AZ/EL (TAC OSB 1; p180, `guide-page-180-azel-format.png`): boresight view, selected sensor RDR/FLIR toggle, elevation scale ±70°x±5/15/30/70, expand, FOV cue toggle.
- SA page (TAC OSB 13; p204-215): replicates HSI buttons (MAP 6, SCL 7, MK2 9, DCNTR 10, WYPT/OAP/TGT 11, up 12, down 13, WPDSG 14, SEQ 15, AUTO 16, MENU/TIME 18), HAFU symbols, sensor sub-level, TUC data. No figure extracted (shots are inline images, not captured by my crop).
- MIDS (SUPT 6), MUMI (SUPT 10, N/I), HMD (JHMCS, p248-255), Litening II pod format (p233-246).
- MENU/INSTRUMENT: IFEI, UFC are physical, not DDI pages.

---------------------------------------------------------------------
## 17. Suitability for website sections / observations
Best fit for list or text content:
1. CHKLST (p81): two-column all-caps text list; 9 and 6 rows plus three data lines. Ideal for resume bullets, skills, or "preflight" checklist about the owner.
2. FPAS (p87): data table with headers; fits stats/metrics, timeline.
3. DATA -> WYPT and TCN sub-pages (p140-141): coordinate text blocks and an index list "0- 1- 2-[3]- 4- 5- 6" with boxed selection; up/down arrows OSB 12/13 to step through entries: a natural pager for blog posts or projects (waypoint = entry, TOT = date).
4. BIT (p80): grid of subsystem names with GO / DEGD / NOT RDY status: skills with proficiency states.
5. ENG (p82): twin-column metrics (e.g., GitHub stats, years of experience).
6. FUEL (p84): boxed numbers with carets: skill bars.
7. EW (p409): radar-scope hero; STORES wingform for portfolio "loadout" (each station = project).
8. MIDS page: has a DATE/TIME block.
Interaction patterns to copy: boxing = selected state; press boxed OSB to un-box; cycling legends (MODE, STEP, PROG, TONE); two-level menus (ARM -> CMDS PROG with RTN); up/down arrow pairs flanking a number (WYPT, HOME, TCN index).
Scrollable text: the guide documents NO scrolling lists. The only multi-item selection mechanisms are step/arrow pairs and sequential cycling. Long text would have to be paged with arrow OSBs (like waypoint selection).

Ambiguities / missing:
- OSB positions marked (px) were derived from screenshot pixels, not stated.
- Menu OSB 4-digit number unexplained.
- BIT sub-pages (CONFIG, SELBIT, MI, AUTO, STOP) not documented; only the failures page.
- Legends I could not read with confidence: "LEFT EPE / RIGHT EPE" on ENG, "AUG" and "DWS" on BIT, "IMRV DSPLY" on TAC top-right, FCS bottom boxed legend.
- Guide Fig 35 on p90 is not a wingform page.
- Exact pixel positions of the wingform vs the DDI screen are only estimated from small screenshots; real measurement should use the p303/p289 zoom crops.
