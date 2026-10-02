# Hoggit Wiki F/A-18C: DDI / MPCD research notes

Source: https://wiki.hoggitworld.com/view/F/A-18C (raw: https://wiki.hoggitworld.com/index.php?title=F/A-18C&action=raw, 320,339 bytes, single monolithic page; there are NO separate subpages for DDI/HSI/SA/STORES, all are sections of this page).
Image URLs resolve via `api.php?action=query&titles=File:<name>&prop=imageinfo&iiprop=url`.

## Version / freshness (important)
- Last edit: **2021-06-23** (user Jak, lastrevid 13487). Content describes the DCS Early Access era, roughly 2.5.6 to 2.7.x. Aircraft: USN Lot 20, mid-2000s, APG-73, ATFLIR, MIDS/Link 16.
- Many items say "Not yet implemented" (listed below). Several have been implemented in DCS since 2021 (e.g. ACLS, S/A and AUTO CMDS modes, MDATA, HMD/MIDS sublevels, more). **Treat "not yet implemented" as stale and verify against current DCS / the DCS manual.** The wiki is therefore a *subset/older* snapshot; the DCS EA Guide is likely newer on those.
- The wiki says the Hornet "mid 2000s" with a `guidelink` to Chuck's Guide (mudspike).

## 1. DDI hardware and controls
- Two DDIs (LDDI, RDDI): "**tricolor (green, red, and yellow)** multifunctional screens". AMPCD (MPCD): all-color, bottom center, normally HSI or SA.
- **20 pushbuttons (OSBs), 5 per side.** Numbering is clockwise: PB1 = left column BOTTOM; PB1-5 left column bottom to top; PB6-10 top row left to right; PB11-15 right column top to bottom; PB16-20 bottom row right to left (PB16 = bottom-right, PB18 = bottom center, PB20 = bottom-left). Confirmed by figure `hoggit-DDI_Labels_2.png` (PB1, PB6, PB11, PB16 labelled).
- **PB18 (bottom center) is always the "return to menu" key.** On any format it invokes [TAC]; pressing it on the TAC menu invokes [SUPT] and vice versa. The current menu legend ("TAC" or "SUPT", boxed in the figure) is displayed at PB18. Under it: system time (digits like `2910`) when weight-off-wheels... (text: "With weight off wheels, the system time value is displayed here for maintenance purposes. Otherwise, MENU is displayed.") NOTE: the wiki wording is odd; the figure shows time digits under the boxed TAC on the menu.
- Physical bezel (visible in figures): top-centre rotary **OFF / NIGHT / DAY** switch (per display), lower-left **BRT** knob, lower-right **CONT** knob, 5 top, 5 bottom, 5 per side square grey pushbuttons with a horizontal (side) or vertical (top/bottom) white tick mark. MPCD bezel differs: DAY/NGT and SYM rocker switches at the top corners, OFF-BRT knob, GAIN and CONT rockers at the bottom corners (see `hoggit-SA_Format_3.png`).
- **Cautions** (large text) and **Advisories** (regular text, comma-separated, preceded by `ADV-`) are shown on the LEFT DDI bottom area on the menu. They "spill over" LDDI -> MPCD -> RDDI. Advisories move to MPCD if LDDI is off/failed, showing a weapon video format (Maverick) or BIT. A new advisory is spaced away from the `ADV-` line; pressing Master Caution twice acknowledges and it "stacks" next to `ADV-`. Figure shows caution examples `L GEN`, `FCS`, `FLAPS OFF` (in caution position) and `ADV- BIT,L HEAT,R HEAT,FPAS,`.
- Selecting a format already shown on another display replaces that other display with the [TAC] menu. Exception: HSI may be on AMPCD plus one DDI simultaneously, but not on both DDIs.
- Master-mode auto-config: A/G master mode -> STORES on LDDI, RDR ATTK on RDDI. A/A master mode (or A/A weapon select switch) -> STORES on LDDI, RDR ATTK on RDDI. NAV: nothing forced.
- Radar knob (right console): OFF / STBY / OPR / PULL EMERG. WoW => radar never scans.

### TDC / Sensor Control (Castle) switch
- TDC (throttle) must be *assigned* to a format; assignment is shown by a **diamond in the upper right corner** of that format (see `hoggit-SA_Format_3.png` and RDR ATTK figure, diamond near top right).
- Sensor Control switch on stick (left / right / aft): assigns TDC to LDDI / RDDI / MPCD in all master modes. Forward = HUD/HMD (in NAV/A-G). A subsequent bump toward an already-assigned display performs a format-specific function (e.g. in ATTK: designate/acquire to STT). **Aft bump invokes HSI on MPCD; bumping aft again swaps to SA** (and vice-versa; TDC assigned to SA + bump toward SA/HSI swaps them).
- Depressing the Sensor Control switch over an MSI track = pointed IFF interrogation.
- RAID switch (throttle) with TDC on FLIR cycles WFOV/MFOV/NAR; on ATTK commands RAID.
- Cursor can select options in lieu of pushbuttons on ATTK.
- Undesignate/NWS button and Cage/Uncage have context functions (see wiki, not DDI-visual).
- No explicit DCS keybind names in the wiki; it describes physical HOTAS only. (Keybinds must come from DCS controls UI/manual.)

## 2. Menus
The wiki gives no per-OSB list of the TAC/SUPT menus (see the Early Access Guide figs `guide-ddi-tac-menu-p89.png`, `guide-ddi-supt-menu-p79.png` already in the figures folder for that). What the wiki states:
- TAC menu: weapon/sensor formats: STORES (SMS), RDR ATTK, FLIR, HUD (repeater), AZ EL, SA, EW, etc. SUPT menu: HSI, FCS, FPAS, HMD, BIT, CHKLST, ENG ... ("navigation and technical interfaces").
- From `hoggit-DDI_Labels_2.png` (TAC menu): left column text rotated vertical reading bottom-to-top AZ EL (PB1), HUD (PB3), RDR ATTK (PB4), STORES (PB5); right column SA (PB13); bottom row `EW` just left of PB16 (PB17); `TGT DATA` appears bottom-left area. Layout inferred from the pixel positions, not stated in text: verify.
- Side-column legends are written **rotated: vertical letters stacked top to bottom** ("S/T/O/R/E/S"), left column legends sit just inside the left bezel, right column just inside the right bezel. Top/bottom legends are horizontal.

## 3. Display conventions
- **Colour:** LDDI/RDDI green-dominant, with yellow and red for threat/caution items. Examples from figures: HAFU upper shape colour (green friendly, yellow unknown/ambiguous, red hostile); RWR bearings yellow; L&S heading, unknown track in yellow; red diamond hostile (SA). The ATTK **DATA sublevel "Color Option" toggles all coloured (red/yellow) elements** off (so monochrome-green mode exists). AMPCD "all-color" (HSI/SA map can use chart overlay in MAP mode; MAP overlay visible only on AMPCD).
- Green is a bright lime (approx #5EE020 / #6FEF2A in screenshots; text looks rendered slightly dim on a very dark green-black background `#0A140C`-ish). These are eyeballed from the PNGs, not from source data.
- **Boxing:** a selected / active option is drawn with a thin rectangle around the legend ("boxed"), e.g. `TAC` at PB18, `NCTR` (rotated vertical, boxed) in ATTK, `ALE-47` boxed. Unboxed = not selected. Toggle pushbuttons cycle states with legend changes. RSET boxes for 2 s after press.
- **Crossed out ("X'd")**: an option/weapon with a failed ready or interlock; e.g. selected weapon X'd on STORES/ATTK when interlocks false; FLIR FOV option crossed out when FLIR unpowered; ALE-47 option crossed out when OFF (and a single line through it in BYPASS).
- **Font:** monospace stroke-style "stencil-like" proportional digits with slashed-less zero (figure: `0` often slashed in some places, e.g. `000°`, `O` vs `0` distinguishable in `01: 0`). Text height uniform for legends; larger text for cautions. The font is the DCS DDI font; exact family not stated in wiki. (Need font from DCS assets or community recreation.)
- Compass rose conventions (HSI): numbers = hundreds-of-degrees x10 (24 = 240), dots every 10 deg between; heading/ground-track data in the top-right block.
- Format-specific tick-mark display on the RWR: 12 o'clock tick at top, ticks every half clock position (15 deg? displayed ~24 ticks => 15 degrees); two thick horizontal double bars at left/right at 9/3 o'clock.
- Display switching legends (rotated vertical text on left/right) plus status text at bottom (`MODE`, 4-digit number `4232`... that number at PB18 is the system time).

## 4. Page formats and OSB legends (with figure-verified OSB positions)
For all: legends in "(PBn)" come from the figures, wiki numbers refer to the figure callouts, **not** PB numbers, except where noted.

### HSI (SUPT -> HSI; also AMPCD via Sensor Control aft) , `hoggit-HSI_Labels_1.png`
Top row (left to right, PB6-10): `POS/INS` (PB6; position reference: INS/TCN/ADC/GPS), `UPDT` (PB7, shown in figure as callout 25), `SCL/40` (PB8: range scale 5/10/20/40/80/160, DCTR doubles), `MK1` (PB9, markpoint), `DATA` (PB10).
Left column (top to bottom PB5 to PB1): `TCN` (TACAN steering), `ILS`, `MODE` (cycles MAP / T UP / N UP / DCTR / SLEW[n.i.]), `VEC`, `ACL` (the last is not described: likely ACLS, n.i.). Rotated vertical legends.
Right column (top to bottom PB11-15): `WYPT` (waypoint steering), up-arrow / waypoint number (`1`) / down-arrow (waypoint selection), `WPDSG` (waypoint designate -> becomes `TGT` boxed when designation exists), `SEQ 1` (cycle sequences 1-3 and toggles courseline).
Bottom row (PB20 to PB16, left to right on screen): `SENSORS` (PB20, shown as callout 18), blank, blank, `TIMEUFC` (PB17), `AUTO` (PB16; auto waypoint sequencing).
Also: `HSEL 000°` and `CSEL` (heading select / course select, bottom-left and bottom-right inner corners), 4-digit time under compass, centre aircraft symbol with `442T` (TAS, left) and `420G` (ground speed, right), lubberline (vertical line top, under range), ground-track diamond, compass rose, waypoint data block top-right (`268°/ 7.1`, `00:00:57`, `ARY1` name), TACAN block top-left when selected, W (waypoint symbol circle-with-dot, "triangle with a dot when steered to" for TACAN).
Selected bearing pointers: triangle with circle (waypoint), triangle with `T` (TACAN); reciprocals a line (waypoint) and oval (TACAN). ADF = circle on rose.
Time UFC options: SET, ET (up to 59:59), CD (default 06:00), ZTOD, LTOD.
Range scale options 5/10/20/40/80/160 nm; DCTR doubles.
**DATA sublevel** tabs across top: HSI (return), A/C, WYPT, TCN, MDATA (n.i.).
- A/C tab: TAWS toggle; warning altitudes (RDR/BARO soft altitude, "altitude, altitude"); MAG/TRUE; coordinate format DCML/SEC; position source; lat/long, wind speed/dir, magvar; GPS errors & zulu.
- WYPT tab: PRECISE toggle (8-digit vs 6-digit), SEQUFC (GSPD, TGT, TOT, INS, DEL), A/A WP (bullseye designate), UFC (POSN, ELEV, GRID n.i., O/S n.i.), waypoint list (boxed when TOT target).
- TCN tab: cycle TACAN database, frequency, lat/long/elev/magvar, UFC edit.

### FPAS (SUPT), `hoggit-FPAS_Labels_1.png`
Climb mode (optimum climb IAS above HUD airspeed), Home WP ("HOME FUEL" caution at 2000 lb), optimum range/endurance (altitude/Mach, `TO 2,000LBS` / `TO 0LBS` below 2500 lb), BEST MACH, NAV TO / TIME / FUEL REMAIN / LB/NM.

### SA format (TAC), `hoggit-SA_Format_3.png` (this is an AMPCD screenshot)
Top row: `MAP` (PB6; boxed when chart overlay), `DCLTR` (PB7, cycles REJ1/REJ2/MREJ1; callout 5), `SCL/80` (PB8), `MK2`, `DCNTR` (PB10).
Left column: `SENSR` (PB5, to SENSR sublevel), `PLID` (PB3, pilot ID: friend/unk/hostile; only when TDC over track or STEP box).
Right column: `WYPT`, arrows + wp number, `WPDSG`, `SEQ 1`.
Bottom row (PB20 to PB16): `EXP` (PB20; 5 nm expand about track), `STEP` (PB19), blank, `TXDSG` (PB17), `AUTO` (PB16).
Info: top-left `077/31.4` (TDC bullseye bearing/range), bottom-left countermeasure bars `C: 30  F: 14  O1: 0  O2: 0` with horizontal bars (green fill proportional to remaining, dashed outline), bottom-right trackfile block `UKN` / `414 / 320` (type or GS/ground track) / `BRA 102/20` / `BE 076/32`. Cursor (TDC) = crosshair with `0.7` Mach left, `10` altitude kft right, drawn with two yellow vertical bars around a yellow shield (HAFU unknown with rank `1`). Bullseye = circle with number and north arrow. Hostile = red diamond with stem. Friendly = green circle with dot and stem (F/F donor dot on left). SAM = emitter ID with dashed green circle for range ring.
REJ1 removes compass rose, ground-track diamond, SAM rings; REJ2 additionally removes WP/TGT block; MREJ1 hides SAM.
SENSR sublevel: F/F, PPLI, SURV, UNK toggles; friendly RWR bearings (OFF / NO ID / RWR ID); RWR bearings (unboxed / ALL / CRIT LETH / CRIT); FLIR FOV (small green square on SA).
HAFU: upper shape = onboard ID, lower inverted shape = offboard ID, vector stem, centre symbol (star = L&S, diamond = DT2, number = rank 1-8, `A` = angle-only, big dot = SURV donor, dot left = F/F donor, `J` replaces Mach when jamming).
HAFU classification: hostile if negative IFF AND (NCTR print hostile OR offboard hostile); ambiguous if negative IFF; friendly on positive IFF or PPLI contribution; else unknown.

### STORES (A/G), `hoggit-AG_STORES_Labels_1.png`
Wingform: a rear-to-front V of stations 1-9 (left to right); diamond = dual rack; quantity number above weapon type; X shape = A/A missile (shown as `9X` with X-with-circle icon, `AC` for AMRAAM). Station contents shown with ticks along the wing line: `J-84`, `4 10S` (with diamond), `82XT` (right wing), `MAV STBY`. Centre text `FUEL` (as legend between wing roots), gun rounds count `578` at top (shows `XXX` when none), master arm `SAFE` / `ARM` / `SIM` below.
Top row labels = A/G weapon types loaded (PB6-10): `J-84` (GBU-?? labelled J-84 = JDAM family name?), `10S`, `82XT`, `MAV`, selected one boxed; X'd if not ready; `RDY` below when ready.
Right column: `GUN` at PB11 (A/G gun, `RDY` to the left when ready), `SIM` at PB15 (only when master arm SAFE).
Bottom row: `TONE` (PB19; cycles TONE / TONE1 / TONE2, only when ARM), a 4-digit number (system time? `1930`) at PB18, `DATA` (PB17).
A/G Ready status text under stations: `RDY`, `RDY-D`, `STBY`, `BIT`, `FAIL`. Universal ready requires gear up, weapon selected, master arm ARM, A/G master mode. Per-weapon extras: LGB = laser code; GPS = TOO/PP mission valid; AGM-65F = alignment complete + uncaged and locked; AGM-65E = 30 s warm-up + locked on laser; HARM = emitter selected/handed off; Harpoon = alignment complete + program complete.
Other STORES variants: A/A gun (wingspan 10-150 ft default 40 ft, LO 4000/HI 6000 rpm, MK-50/PGU-28), AIM-9 (`9L/9M/9X`, `SEL`, `SEL L`/`SEL R`), AIM-7 (L/M/MH look identical), AIM-120 (`AC`/`AB`, `L SEL`/`R SEL`, target RCS and size options, `hoggit-AIM120_STORES_Format.png`).
JDAM/JSOW: STORES + DSPLY with PP MSN and TOO MSN sublevels. HARM: SP / TOO / PB modes. Harpoon: BOL, R/BL. Walleye: WEDL DSPLY, DL13. Maverick: AGM-65E/F MAV formats.

### RDR ATTK, A/A, `hoggit-RDR_ATTK_Common_Labels_1.png`
Top-left: radar status `OPR` and channel `C11`; mode `RWS`. Top row: `4B 2` (PB7?; scan volume bars/azimuth) then `SIL` (PB8) and `ERASE` (PB9); top-right: AIM-9 `9M-2` selected weapon (crossed out when interlocks fail, as in figure) with TDC-assigned diamond and range `40`. Heading/range indicator `202°` top centre. Right column: up/down arrows (range scale), `SET`, `RSET`, `NCTR` (boxed; vertical text). Left column: `RDR PRI` stack and `HI`/`INTL` (aspect/interleave?) plus `7`. Bottom row: `MODE` (PB20), `140°` (azimuth width), 4-digit time, `CHAN` (PB17), `DATA` (PB16). Lower left `363` IAS / `M 0.73`, lower right `14760` altitude. Elevation bar `7`/... , L&S symbol `27` altitude over HAFU with `3` rank, horizon line + velocity vector (circle with ticks and wing bars) mirrors HUD.
Note: the figure shows `RWS`, `ERASE`, and `4B 2` which the wiki text does not discuss in the "Common Top-Level" list; those are legends worth recording.
Cursor = two vertical lines; altitude min/max above/below shown at cursor. Range caret on right when L&S exists, differential altitude, closure rate `Vc`, L&S heading top-left.
DATA sublevel: LTWS toggle, MSI toggle, **Color Option**, One-Look RAID (n.i.), aging setting, DCLTR (none/DCLTR1/DCLTR2, DCLTR2 is initial), BRA toggle, RWR ATTK.
Search modes: RWS, TWS, VS. ACM modes; STT; RAID; EXP. (Details lines 1277 to 1500 of raw wikitext.)
A/G ATTK: tactical region = conical scan, ground-track up, three vertical lines at 30 deg (120 deg total), four range arcs; options: operating mode toggle (MAP / EXP1-2-3 (EXP2 12.6 deg fixed "DBS Patch") / SEA / GMT / TA / AGR), beam width PENCIL/FAN, max/min range, FRZ, RESET, SIL, azimuth cycles 120/20/45/90, `A/A` radar, TDC cursor, gain, antenna elevation caret +-60 deg with 10 deg ticks. Azimuth/Elevation (Az/El) format available only in A/A.

### EW (TAC), `hoggit-RWR_EW_Format_Labels_1.png` and `hoggit-ALE47_EW_Format_Labels_1.png`
Top row legends (two-line): `ASPJ / OFF`, `ALR-67 / RCV`, `ALE-47 / STBY` (boxed when selected), and, when ALE-47 boxed, `ARM` (PB9, to ARM sublevel for profile edit). `C 30  F 14` (chaff/flare counts) top-left and `O2 0  O1 0` (decoys) top-right only when the dispenser switch is ON. Bottom-left `NORM`? wait the figure shows `NORM` at the left (display reject/ priority mode), `STEP` (PB19) and `MODE` (PB18 area, cycles STBY / MAN / S/A / AUTO), 4-digit time. Right column: rotated `HUD` (PB13, toggles HUD emitter bearings).
Display: three rings: outer circle = non-lethal band (outside), middle ring = lethal, inner small circle = critical; tick every 15 deg; own-ship T-shaped symbol in centre; double horizontal bars at 9 and 3 o'clock. Emitters shown as NATO ID in a house-shaped (triangle/roof) symbol; modifiers: half-circle below = tracking; triangle above = hostile A/C; half-circle above = friendly A/C; staple above = unknown A/C; triangle+rectangle-no-bottom = SAM; line above with two small up lines = AAA; line below = sea-based; flashing = missile guidance; line to bearing in critical band.
ALE-47 modes: STBY, MAN (aft = selected profile, forward = profile 5), S/A and AUTO were "not yet implemented" at wiki time.
SA also shows chaff/flare/O1/O2 bars regardless of dispenser switch.

### HMD format (SUPT)
Brightness cycles AUTO / DAY / NIGHT; automatic blanking; reject modes NORM / REJ 1 / REJ 2; reject setup sublevel; MIDS sublevel priority/range (HMD MSI indications, up to 7 tracks).

### HUD format (TAC): repeater of HUD symbology on a DDI.

### Other (not in wiki as DDI pages): FLIR, FCS, BIT, CHKLST, ENG, BIT, A/G FLIR, MAV, HARM, DSPLY pages appear only as sections for weapons; FCS format is mentioned as section "FCS Format" (line 105 of raw) but described briefly.

## 5. UFC / non-DDI items worth noting
- UFC: 20 UFC? no: 5 option windows + keypad; scratchpad; ILS/TCN/IFF/D/L/BCN/A/P menu; COMM1/2 with 20 presets + G (243.000)/M/S/C.
- HUD, JHMCS rules, reject modes (REJ1 / REJ2).
- Master modes: NAV forced when throttle > 27 deg on the ground; gear down in air forces NAV.

## 6. "Not yet implemented" (as of 2021 wiki; likely stale)
HSI: SLEW mode, several options in the A/C tab, MDATA tab, MGRS grid, O/S, ACLS, BCN; ECCM on A/G ATTK; UFC items; HMD format items (3 options); ALE-47 S/A and AUTO modes; SA MREJ2; RWR pushbutton 3. Check each against current DCS before mimicking.

## 7. Contradictions / things the EA Guide may not cover
- Hoggit documents (and the EA Guide may not) the **Color Option** monochrome toggle in ATTK DATA, **SA format SENSR sublevel**, **PLID**, **STEP/EXP** SA functions, **HAFU** symbol construction and ID logic, **RWR band geometry** with symbol modifiers, **A/G Ready conditions table**, **"cautions spill over to the MPCD then RDDI"** and acknowledge-by-double-press-of-master-caution, and **HSI-on-both-DDIs exclusion rule**.
- Possible EA Guide conflict areas: HSI can be on MPCD and ONE DDI, never both DDIs (wiki); numbering: wiki says PB1 = bottom-most left. Verify against guide.
- The wiki's A/G ATTK text and early STORES wording is pre-2021. Anything added after June 2021 (e.g. later Radar/FLIR/ATFLIR changes, AIM-120D etc.) is absent.

## 8. Further references to chase
- Chuck's Guide: https://www.mudspike.com/chucks-guides-dcs-f-a-18c-hornet/ (linked from wiki ModuleInfo).
- Wags tutorial videos (list in wiki Resources): Cockpit Tour https://www.youtube.com/watch?v=gb1KmccK-3w ; HUD, UFC and IFEI https://www.youtube.com/watch?v=0PwG_SC5TNU ; ADF/TACAN https://www.youtube.com/watch?v=W4JOEyshsZA ; Waypoint nav https://www.youtube.com/watch?v=gNd84BEFyYE ; FPAS https://www.youtube.com/watch?v=N3DtCVdz_Rk ; AIM-120/7/9 and bombs/Maverick videos.
- Reddit primer "I Read the Manual So You Don't Have To": https://www.reddit.com/r/hoggit/comments/8kvmhs/
- Armament Matrix (Twisted-Biscuit, Google Drive): https://drive.google.com/file/d/1MVSjjVTikZ00UTeuOIX9Sh2Teo2skIcB/view
- Startup checklist https://i.imgur.com/mLq8d2e.png ; Official feature list https://forums.eagle.ru/showpost.php?p=3285514&postcount=13
- RedKite CMDS tutorial https://www.youtube.com/watch?v=FAKuuaemFUs
- Wiki images worth pulling for pixel reference (all under https://wiki.hoggitworld.com/images/): `DDI_Labels_2.png`, `HSI_Labels_1.png`, `AC_HSI_Labels_2.png`, `WYPT_HSI_Labels_1.png`, `TCN_HSI_Labels_1.png`, `SA_Format_3.png`, `SA_SENSR_Labels_1.png`, `AG_STORES_Labels_1.png`, `AA_Gun_STORES_Labels_1.png`, `AIM-9_STORES_Labels_1.png`, `RDR_ATTK_Common_Labels_1.png`, `RDR_ATTK_Format_-_DATA.png`, `AG_ATTK_Labels_2.png`, `HAFU_Labels_3.png`, `FPAS_Labels_1.png`, `HMD_Format_Labels_1.png`, `RWR_EW_Format_Labels_1.png`, `ALE47_EW_Format_Labels_1.png`. Not covered by the wiki: real NATOPS PDFs (search "NATOPS F/A-18C 165533 pocket checklist", "A1-F18AC-NFM-000") and community DDI recreations, which the wiki does not link.

## 9. Figures downloaded (in docs/research/figures/, all viewed)
- `hoggit-DDI_Labels_2.png`: TAC menu on a DDI; shows bezel, PB1/6/11/16 numbering, TAC boxed at bottom centre with `2910` below it, `STORES`, `RDR ATTK`, `HUD`, `AZ EL` (left), `SA` (right), `EW`, `TGT DATA`; cautions `L GEN`, `FCS`, `FLAPS OFF`; advisory line `ADV- BIT,L HEAT,R HEAT,FPAS,`. Green on near-black.
- `hoggit-HSI_Labels_1.png`: HSI with numbered callouts 1-25 (see section 4).
- `hoggit-AG_STORES_Labels_1.png`, `hoggit-SA_Format_3.png` (AMPCD), `hoggit-RWR_EW_Format_Labels_1.png`, `hoggit-ALE47_EW_Format_Labels_1.png`, `hoggit-RDR_ATTK_Common_Labels_1.png`: viewed and described above.
- Downloaded but not viewed/described in depth: `hoggit-AG_ATTK_Labels_2.png`, `hoggit-AIM120_STORES_Format.png`, `hoggit-FPAS_Labels_1.png`.
