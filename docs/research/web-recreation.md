# Web recreation research: F/A-18C DDI on the web

Scope: fonts, real-world and DCS visuals, existing recreations, web rendering techniques, and examples of instrument-themed personal sites. Other workers cover the DCS Early Access Guide, the Hoggit wiki and the `0x408/hornet-display` repo, so those are only cross-referenced here.

Confidence labels: **[verified]** means a primary or first-hand source was read. **[community]** means forum or simulator-community statements. **[measured]** means I sampled pixels myself. **[inferred]** means my own reasoning, which should be checked before you rely on it.

---

## 1. Fonts

### 1.1 The DCS Hornet DDI font
- **`0x408/hornet-display`** is described as the "Font used in HUD, DDIs and MPCD of DCS World F/A-18C", under the **MIT** licence (GitHub API, checked 2026-10-02). https://github.com/0x408/hornet-display. A sibling repo, https://github.com/0x408/viper-display, covers the F-16C and is also MIT. **[verified: licence and description only. The glyph content is covered by another worker.]**
- **This is the primary recommendation for on-screen DDI text.** It is the only openly licensed font found that targets the DCS Hornet DDI specifically. Load it with `next/font/local` (https://nextjs.org/docs/app/api-reference/components/font) so it is self-hosted, preloaded and free of layout shift.
- DCS draws its cockpit display text from in-game font textures, not from a system TTF. User mods recolour those textures, for example "F/A-18C Colored MPD: White Font and Green Symbology" (https://www.digitalcombatsimulator.com/fr/files/3331688) and "AMPCD Off-White Text + Strong Outline" (https://files.digitalcombatsimulator.com/fr/files/3351025/). These are Eagle Dynamics (ED) assets: **do not extract or ship them.** **[inferred from the mods' existence]**

### 1.2 Fonts used on the real F/A-18 displays
- No public document was found that names the font in the real Kaiser DDI symbol generator. Displays of that era drew characters as stroke (calligraphic) vectors from a symbol generator ROM, not from a typeface. See §2.5.
- MIL-STD-1787 is the US standard for aircraft display symbology. It "describes symbol geometry, font, recommended dimensions, and mechanizations". https://man.fas.org/dod-101/sys/ac/equip/mil-std-1787.htm **[verified summary page. The standard's font tables were not obtained.]**
- **Do not invent a "real DDI font".** For on-screen text, use hornet-display, which reproduces DCS.

### 1.3 Bezel legend font (BRT, CONT, NIGHT/OFF/DAY)
- The bezel legends are panel lettering, not display text. Military panel lettering follows **MS33558**. Helios ships `MS33558.ttf`, whose name table reads "(c) 2000 Derek Higgs … MS33558 Is the US Military standard font for aircraft instrument dials" with the licence field **"Postcardware"**. https://github.com/HeliosVirtualCockpit/Helios/tree/master/Helios/Fonts **[verified: I read the TTF name table]**. Postcardware is a vague, informal licence. Either contact the author, or **trace the legends as SVG paths**.
- OpenHornet publishes the DDI legend plates as vector SVG cut files: `RMWK_OH1A3-14 … BRT`, `-15 … CONT` and `-16 … MODE`, all under CC BY-NC-SA 4.0. https://github.com/jrsteensen/OpenHornet/tree/master/release/OH1_Upper_Instrument_Panel **[verified]**. NonCommercial terms apply. A personal portfolio is arguably non-commercial, but it is cleaner to redraw the legends.

### 1.4 Open-licence fallbacks
| Font | Licence | Use |
|---|---|---|
| hornet-display (0x408) | MIT | DDI on-screen text **(primary)** |
| B612 / B612 Mono (Airbus, Intactile) | OFL-1.1 + EPL (https://github.com/polarsys/b612, Google Fonts https://fonts.google.com/specimen/B612+Mono) | Plain-view body text and a fallback stack. It was designed and tested for cockpit screens (https://gigazine.net/gsc_news/en/20190121-b612-font-family) |
| DSEG7/14 Classic (keshikan) | OFL-1.1 (https://github.com/keshikan/DSEG) | Only for 7- or 14-segment readouts such as the UFC or IFEI, **not the DDI** |
| Helios `FA-18C_Hornet_Up_Front_Controller.ttf` | MIT-style ("Copyright 2019 Neil Larmour, Permission is hereby granted…"), from the font's name table | UFC segment display only |
| Helios `FA-18C_Hornet_IFEI.ttf` | "Freeware for personal use" (Style-7), from the name table | Avoid. The licence is restrictive |

---

## 2. Real-world and DCS visuals

### 2.1 Is the DDI green monochrome?
- **The real F/A-18C (USN Lot 20, as modelled by DCS) has a green-dominant DDI with yellow and red highlights.** It is not full colour.
  - The pdt-usa.com CRT supplier lists the F/A-18C/D DDI as a 5.00" × 5.00" "Color CRT" (P/N 0800-107505-0C) and a "Tri Color CRT Display" (P/N 0800-107505-0A). https://www.pdt-usa.com/f-18.htm **[verified]**
  - The VRS Superbug documentation says the DDIs are "tri-color multifunction CRTs". https://forums.vrsimulations.com/support/index.php/Cockpit_Systems **[community]**
  - DCS forum: "It is always green, with yellow and red symbols" (BarTzi). "The LOT 20 hornet we have (US Navy) did not have the Multi-Color DDI's" (Strikeeagle345, ED beta tester). "USN legacy Hornets never got full colour DDI's" (Kev2go). The F/A-18A++, upgraded Swiss and Finnish aircraft, and post-modernisation CF-18s did get colour LCD DDIs. https://forum.dcs.world/topic/204349-f-18-ddis-color/ **[community]**
  - NASA's 1995 F/A-18 caption reads: "a left- and right-side cathode-ray tube display, referred to as the DDIs … The 20 pushbuttons located on the periphery of each DDI…". https://www.nasa.gov/image-article/f-18-chase-aircraft-9 **[verified]**
- **DCS behaviour:** the DCS DDI renders green symbology on a near-black screen, with yellow and red reserved for specific symbols. Targeting pod video is shown in green on all three displays. https://forum.dcs.world/topic/208971-tgp-display-question/ **[community]**

### 2.2 Exact hue
- Phosphor: no source names the DDI CRT phosphor. The common green display-tube phosphor is P43 (Gd₂O₂S:Tb), which peaks at **545 nm** (https://en.fh-muenster.de/ciw/downloads/personal/juestel/juestel/CRT-Phosphors.pdf). In sRGB that is a yellowish green near `#7CFF00` to `#8CFF20`. **[inferred: the P43 assignment is unconfirmed]**
- **Measured from DCS screenshots on the Hoggit wiki** (`figures/hoggit-DDI_Labels_2.png` and `hoggit-HSI_Labels_1.png`) **[measured]**:
  - Symbology core: **`#6CD214`** (with a range of `#6BD20B` to `#6DD31A`). On the HSI capture it reads `#50B01A`, because in-cockpit lighting and brightness settings vary.
  - Screen background: **`#0A1B13`** to `#0A1B16`, a very dark green-black, not pure black.
  - Treat these values as approximate, because the screenshots include DCS post-processing. If the hornet-display worker or the DCS Lua files give an authoritative material colour, prefer that.
- Recommended tokens:
  - `--ddi-green: #6CD214`
  - `--ddi-green-dim: #3F7F10` (for de-emphasis)
  - `--ddi-bg: #0A1B13`
  - Yellow and red values should come from DCS captures. None were measured here.

### 2.3 Is the AMPCD colour?
- **Yes.** NAVAIR, 19 February 2004: the AMPCD is "a form fit function replacement for the Cathode Ray Tube (CRT) based Multi-Purpose Color Display (MPCD) … With a high resolution, full color, active matrix liquid crystal display". It shows "background raster video such as digital moving map and FLIR video with stroke symbology". VFA-151 was the first squadron to receive it. https://www.navair.navy.mil/node/11691 **[verified]**

### 2.4 Bezel: colour, OSBs, knobs and dimensions
- **Display size:** 5.00 × 5.00 in active area. pdt-usa: https://www.pdt-usa.com/f-18.htm. The DCS forum says "It's 5x5" CRT" (https://forum.dcs.world/topic/224290-fa-18c-ddi-dimensions/). Honeywell's later AMPD family is also "5-by-5-inch forward avionics displays" (https://www.militaryaerospace.com/communications/article/16714767/navy-orders-101-advanced-multipurpose-displays-ampd-for-carrierbased-combat-jet-avionics).
- **Finishes, from OpenHornet's 1:1 replica drawing** `OH1A3-1 ASSY, DDI v2` (CC BY-NC-SA 4.0, saved as `figures/web-openhornet-ddi-assy-OH1A3-1.pdf`, source https://github.com/jrsteensen/OpenHornet/tree/master/release/OH1_Upper_Instrument_Panel) **[verified]**:
  - Bezel and finger guards: **FED-STD-595 FS37038 (flat black)**, about `#343236`.
  - OSB buttons: **FS36231 (Dark Gull Grey)**, about `#7E7E87`. Hextoral gives `#7F8487`.
  - Button legend inserts: **FS37875 (Insignia White)**, about `#F1EAEE`.
  - Hex values come from the w3schools FS595 table (https://www.w3schools.com/colors/colors_fs595.asp) and Hextoral (https://hextoral.com/hex-color/7F8487/federal-std-595c/). FS595 to sRGB conversion is approximate.
- **Layout, from the OpenHornet front view, Helios geometry, and photographs:**
  - The outline is a **rectangle with large 45° chamfers on the two top corners**. The bottom corners are square. The screen opening is a rounded square.
  - There are **20 square OSBs, 5 per side.** **Raised finger-guard ribs** sit between adjacent buttons. OpenHornet uses 14 full-length guards plus 2 short guards, one at each end.
  - The **MODE rotary knob** (OFF / NIGHT / DAY) is at **top centre** above the top OSB row. In Helios its positions are OFF at 270°, NIGHT at 330° and DAY at 30°. The NASA photo shows the legend "NIGHT OFF AUTO DAY" on that aircraft.
  - The **BRT knob is bottom-left** and the **CONT knob is bottom-right**, both outside the bottom OSB row.
  - **There are no rocker switches on the DDI.** The AMPCD has rockers: Helios ships `MFD Rocker L/R/V` images and an AMPCD frame with DAY/NGT, SYM, GAIN, CONT and BRT. The AMPCD also has HDG and CRS switches on its upper corners.
- **Helios DDI geometry**, from `Aircraft FA-18C Plugin/Gauges/MFD/MFD-FA18C-Type-1.cs` (GPL-3.0, https://github.com/HeliosVirtualCockpit/Helios) **[verified]**:
  - Native frame: **656 × 706 px**. Screen rect: x72 y137, **497 × 493 px**.
  - Each OSB is 40 × 40 px, at a pitch of about 80 px horizontally and 85 px vertically.
  - OSB numbering:
    - **OSB 1 to 5** run up the left side from bottom to top (y = 540 down to 200).
    - **OSB 6 to 10** run along the top from left to right.
    - **OSB 11 to 15** run down the right side from top to bottom.
    - **OSB 16 to 20** run along the bottom from right to left.
  - Mode knob at (298, 14). BRT at (14, 632). CONT at (592, 632). Knob size 50 px.
  - Scale: if the 497 px screen is 5.00 in, the bezel works out to about **6.6 in wide × 7.1 in tall**, and the screen takes about 76% of the bezel width. **[inferred: the Helios art is derived from the DCS model, not from a factory drawing]**

### 2.5 Raster vs stroke: should there be scanlines?
- The CRT-era Hornet displays drew symbology by **stroke (calligraphic)** writing and overlaid raster only for video. NAVAIR's AMPCD text explicitly says "raster video … with stroke symbology" (https://www.navair.navy.mil/node/11691). Hybrid stroke and raster CRTs were standard in avionics (US4631532, https://patents.google.com/patent/US4631532).
- **Conclusion:** stroke-written symbology has **no scanlines and no pixel grid**, and DCS shows none either. DCS draws clean vector symbology with a soft glow (observed in `figures/guide-page-82-eng-page.png`). LCD subpixel or scanline overlays would be **inaccurate**. At most, add a faint glass reflection or vignette. **[inferred plus observed]**

### 2.6 Reference images (downloaded and viewed)
| File | What it shows | Source / licence |
|---|---|---|
| `figures/web-nasa-fa18-cockpit-E95-43155-7.jpg` | A full, sharp 1995 NASA F/A-18 front panel: both DDIs, the MPCD, the UFC, and the NIGHT/OFF/AUTO/DAY, BRT and CONT legends | https://commons.wikimedia.org/wiki/File:309510main_E95-43155-7_full.jpg, public domain (NASA) |
| `figures/web-f18d-front-cockpit-swiss.jpg` | Close-up of Swiss F/A-18D front-cockpit DDIs, showing the grey square OSBs, black bezel, chamfered top, knobs, and the MPCD below | https://commons.wikimedia.org/wiki/File:F-18D_vorderes_Cockpit.jpg, CC BY-SA 3.0 (Hornet Driver) |
| `figures/web-swiss-fa18-cockpit-img6182.jpg` | Swiss F/A-18 cockpit with DDIs, UFC (lit green) and colour AMPCD | https://commons.wikimedia.org/wiki/File:F-18_IMG_6182.jpg, CC BY-SA 2.0 fr (Rama) |
| `figures/web-helios-ddi-frame-gpl3.png` | Helios DDI bezel art (656×706) with OSB rib layout and legends | Helios, GPL-3.0. The art is likely derived from DCS textures, so **reference only, do not ship** |
| `figures/web-helios-ampcd-frame-gpl3.png` | Helios AMPCD bezel (727×746) | Same as above |
| `figures/web-openhornet-ddi-assy-OH1A3-1.pdf` | 1:1 replica assembly drawing with front view, parts list and FS595 finishes | OpenHornet, CC BY-NC-SA 4.0 |

---

## 3. Existing recreations and data sources

| Project | What it has | Licence | Notes |
|---|---|---|---|
| **Helios Virtual Cockpit** https://github.com/HeliosVirtualCockpit/Helios | F/A-18C plugin: DDI and AMPCD frames, OSB up and down images, rockers, knob images, exact OSB coordinates, viewport rects, and many cockpit fonts | GPL-3.0 | Best source of **geometry data** (§2.4). Copying code or art pulls in GPL obligations. Re-deriving the numbers is fine |
| **OpenHornet** https://github.com/jrsteensen/OpenHornet | 1:1 Lot 20 replica: DDI bezel 3D files (3MF), legend SVGs, PDF drawing with finishes | CC BY-NC-SA 4.0 | Best source for **physical colours and proportions** |
| **DCS-BIOS** https://github.com/DCS-Skunkworks/dcs-bios | Export of cockpit control state, including OSB and knob identifiers per aircraft. Has a web dashboard on port 5010 (https://dcs-bios.readthedocs.io/en/latest/dashboard.html) | GPL-3.0 | Does not export display symbology. Useful for naming controls |
| **nodejs-dcs-bios-websocket-example** https://github.com/jboecker/nodejs-dcs-bios-websocket-example | Node and socket.io bridge to DCS-BIOS | None stated | Shows the browser-panel pattern |
| **Iris Screen Exporter** https://github.com/HeliosVirtualCockpit/Iris-Screen-Exporter | Streams DCS viewport images to remote clients | None stated | Captures video frames only, not symbology data |
| **Browser access to exported displays** https://forum.dcs.world/topic/318452-accessing-exported-monitors-helios-iris-via-web-browser-with-touch-functionality | Websocket client UI that crops exported video with CSS | Forum | Pattern only |
| **FlightGear Canvas MFD framework** https://wiki.flightgear.org/Canvas_MFD_framework | An SVG file defines OSB label positions with one group per page. Based on F-15 MPCD-style displays | fgdata is GPL | The **architecture to copy**: an SVG page per format, plus a shared OSB-label layer |
| **0x408/hornet-display** | DCS Hornet display font | MIT | See §1.1 |

What these projects do well:
- Helios and OpenHornet separate the bezel (a static asset) from the screen (dynamic content), and drive buttons from a numbered OSB table.
- FlightGear keeps each format as SVG with named groups and toggles visibility per page, which suits React components well.

None of them publishes **DCS display symbology geometry** under an open licence. The page layouts must be redrawn from the Early Access Guide and Hoggit references, which other workers have covered.

No meaningful open-source web (React/SVG) recreation of a military DDI was found. GitHub searches for "F/A-18 DDI", "hornet mfd" and "fighter mfd svg" returned nothing relevant. The closest web work is MSFS and FlyByWire glass cockpits (https://forums.flightsimulator.com/t/avionics-web-simulator/346630). Generic "HUD" design systems such as https://open-design.ai/systems/hud/ use invented palettes (`#00FF41`) that do **not** match the Hornet, so avoid them.

---

## 4. Rendering techniques

### 4.1 SVG vs canvas vs WebGL
**Recommendation: inline SVG for the display and bezel, with React components per format.**
- **SVG** has a resolution-independent `viewBox`, so it stays crisp at any zoom. Text is real and selectable, and readable by assistive tech and Google. OSBs can be real `<button>`s overlaid in HTML. It suits a mostly static, page-switching display.
- **Canvas 2D** can be faster for thousands of moving primitives, but its text is invisible to accessibility tools and search engines. It also needs manual devicePixelRatio handling and redraws on resize. Use it only for a moving element such as a radar sweep, optionally in an `OffscreenCanvas` worker (https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas).
- **WebGL** is only justified for a full post-process bloom or a 3D cockpit. It is overkill here, and costly on mobile.

### 4.2 Glow and bloom
- DCS shows a soft halo around strokes, with no scanlines (§2.5).
- **Cheapest and crisp:** draw each symbol twice. Use one blurred, low-opacity copy under a sharp copy. Apply a single SVG `<filter>` with `feGaussianBlur` (stdDeviation about 0.6 to 1.2 user units) merged with `SourceGraphic` via `feMerge` on **one static group**. https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feGaussianBlur
- For HTML text, use CSS `text-shadow: 0 0 2px currentColor, 0 0 6px color-mix(in srgb, currentColor 40%, transparent)`. https://developer.mozilla.org/en-US/docs/Web/CSS/text-shadow
- **Performance warning:** blur cost grows with radius × area, and animating it is expensive. Chrome's guidance is to avoid animating blur and to pre-render it instead (https://developer.chrome.com/blog/animated-blur/). Codrops calls SVG filters "pretty horrific for performance" when animated over large areas (https://tympanus.net/codrops/?p=23824). So:
  - Apply the filter to the static page group.
  - Re-render only on page change.
  - Never animate `stdDeviation`.

### 4.3 Crisp text and lines at any size
- Use one fixed `viewBox`, for example `0 0 656 706` to match Helios proportions. Keep the screen at a 1:1 square such as `0 0 500 500`, and size all text in user units.
- `vector-effect="non-scaling-stroke"` keeps a constant hairline width if wanted (https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/vector-effect). For the DCS look, let strokes scale instead, so they stay proportional.
- `text-rendering="geometricPrecision"` (https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/text-rendering) avoids hinting jumps while scaling. `shape-rendering="geometricPrecision"` keeps anti-aliasing on (https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/shape-rendering).
- Self-host hornet-display through `next/font/local` with `display: 'block'` or a short swap. This avoids a fallback-font flash inside the instrument, because a metric mismatch would break the OSB label alignment.

### 4.4 Responsive scaling of a fixed-aspect instrument
- Wrap the instrument in a container with `aspect-ratio: 656 / 706` (https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio), and set `width: min(100%, calc((100dvh - chrome) * 656/706))`.
- Make it a size container. HTML overlays such as OSB hit targets and plain-text panels can then use `cqw` and `cqmin` units (https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries). Prefer putting everything inside the SVG so a single `viewBox` scales it all.
- **Mobile:** at 360 px wide the whole DDI is about 340 px, which gives OSBs of about 21 px. That is close to the WCAG 2.2 minimum target of 24 × 24 CSS px (https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Options:
  - Enlarge the invisible hit areas beyond the drawn button. The guide ribs give spacing.
  - Below a breakpoint, show the screen full-width with OSB labels as a tappable list.

### 4.5 Keyboard and accessibility for OSB navigation
- **Make each OSB a real `<button>`.** Use HTML positioned over the SVG, or SVG `<a>`/`<g role="button" tabindex="0">`. HTML buttons are more robust. Set `aria-label` to the OSB's on-screen legend, for example "STORES", and use `aria-pressed` or `aria-current` for the selected page.
- Treat each side's OSB row, or the whole bezel, as an APG **toolbar** with a **roving tabindex**. One Tab stop reaches the bezel, and the arrow keys move between OSBs (https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/, https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/). Optional shortcut keys 1 to 0 and Shift+1 to 0 could map to OSB 1 to 20.
- **Disable OSBs that have no function** (blank legend) or remove them from the tab order. A blank OSB should not be announced.
- Wrap the screen in a **live region** (`aria-live="polite"`) with a heading per page, so page changes are announced. Mark purely decorative symbology `aria-hidden="true"`, and expose the content as text.
- Honour `prefers-reduced-motion` (no boot or flicker animations) (https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion), and handle `prefers-contrast` and `forced-colors` (https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors). In forced-colours mode, drop the glow and use system colours.
- Show a visible focus ring on the OSB itself. A white or amber outline contrasts with the grey button.
- The SVG accessibility mappings are in https://www.w3.org/TR/svg-aam-1.0/.

### 4.6 SEO for content inside the instrument
- Google crawls only `<a href>` links: "Google can only crawl your link if it's an `<a>` HTML element … with an `href` attribute" (https://developers.google.com/search/docs/crawling-indexing/links-crawlable). **Every DDI "page" should be a real route** (for example `/stores` or `/hsi`) reached through `<a href>` OSBs, using Next `<Link>`. The OSBs can then be links styled as buttons.
- Text inside inline SVG can be indexed, but it lacks semantic structure (https://gurubase.io/g/html/can-svgs-in-html-be-indexed-by-search-engines, a secondary source). Server-render (RSC) a **semantic HTML equivalent** of each page's content with `<h1>`, lists and links. It can sit in a visually hidden region or the plain view (§5). Give each route its own `generateMetadata` (https://nextjs.org/docs/app/api-reference/functions/generate-metadata).

### 4.7 Performance
- Keep the bezel as one static SVG, or a pre-rendered image for photographic texture. Re-render only the screen group on route change.
- Use a single shared `<filter>` definition. Avoid per-element filters and animated blur (§4.2).
- Use `content-visibility` or lazy-mount for any off-screen second DDI or AMPCD.
- Subset the hornet-display font to the glyphs actually used (A–Z, 0–9 and the symbols). Preload it with next/font.

---

## 5. Instrument-themed and skeuomorphic personal sites: UX lessons

| Site | Theme | Lesson |
|---|---|---|
| Henry Heffernan, https://henryheffernan.com (code MIT: https://github.com/henryjeff/portfolio-website) | A 3D room with a retro PC. The inner OS is a separate app | The inner "OS" is also reachable directly at **https://os.henryheffernan.com/**, so a 2D path exists without the 3D wrapper |
| Dustin Brett, https://dustinbrett.com (https://github.com/DustinBrett/daedalOS) | A full desktop OS in the browser | Commits fully to the metaphor. Heavy, with a long first load |
| Poolsuite, https://poolsuite.net | Classic Mac OS | Consistent metaphor with good keyboard and window behaviour |
| Bruno Simon, https://bruno-simon.com | A drivable 3D car (Three.js) | Awwwards Site of the Year 2020 (https://www.awwwards.com/sites/brunos-portfolio, https://www.creativebloq.com/news/3d-car-portfolio). Delightful, but the content is hard to scan |
| Lynn Fisher, https://lynnandtonic.com | Annual themed redesigns | Commits to a theme while keeping the content constant, and makes every breakpoint intentional (https://web.dev/community-highlight-lynn-fisher/) |

Lessons:
1. **Provide a plain view.** Add a top-level "Plain / Text view" toggle and a semantic HTML route set. It serves recruiters skimming on phones, screen-reader users, and SEO. The Heffernan split between the 3D shell and a directly reachable OS is the pattern to follow.
2. **Get to content quickly.** Any boot animation (a BIT sequence, say) should be under about 1 s, skippable, and skipped under `prefers-reduced-motion`.
3. **Use the metaphor functionally, not decoratively.** NN/g notes that skeuomorphism lowers the learning curve but that excess "creates cluttered interfaces, slower load times" (https://www.nngroup.com/articles/skeuomorphism/). OSB labels must clearly read as navigation, for example "ABOUT", "WORK" and "CONTACT" placed at the positions DCS uses for menu items.
4. **Design for mobile deliberately.** Either scale the DDI with enlarged hit areas, or switch to the screen plus a list of OSB labels. Do not shrink 20 buttons to 15 px.
5. **Respect accuracy.** Every symbol drawn should trace to DCS, Hoggit, or a public photo. Where real content is not reproducible, as on STORES, use original abstract symbology clearly styled as custom, rather than a fabricated jet image.

---

## 6. Summary of recommendations
- **Font:** hornet-display (MIT) for display text. Use traced SVG paths for the bezel legends (MS33558 is Postcardware). Use B612 Mono (OFL) for the plain view and as a fallback.
- **Colours:**
  - Screen: `#0A1B13` background with `#6CD214` symbology (DCS, measured). Yellow and red are reserved for alerts.
  - Bezel: FS37038 `#343236`.
  - OSBs: FS36231 `#7E7E87`.
  - Legends: FS37875 `#F1EAEE`.
- **Rendering:** inline SVG with `viewBox` 656×706 (screen 497×493 at 72,137), and one static `feGaussianBlur` glow layer. No scanlines or subpixel effects (the real display is stroke-written). Use HTML `<a>`/`<button>` OSBs with a roving tabindex, one route per page, and a server-rendered semantic HTML mirror plus a plain-view toggle.
