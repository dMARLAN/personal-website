# FCS (`/fcs`)

Showcase page. SUPT PB15 `FCS` (real position). Label "Flight controls, simulated".

## Format

The real FCS format, transcribed from `Pages/MPD/FCS.lua` [pgA §4]. It is checked against `dcs-fcs.png` and
`guide-page-83-fcs-page.png`. Code: `src/frontend/src/ddi/formats/fcs.tsx`.

| Element | Constants (DI) |
|---|---|
| Top channel tables | 32 × 48 cells. Left: channel 1 at x −300, then +32 per channel. Right: channel 1 at x 204, channel 4 at 300. Rows at y = 440 − 48i, i = 0…6. Cells exist per the Lua masks: LEF, AIL and RUD rows have channels 1 and 4 on the left and 2 and 3 on the right. |
| SV labels | `SV1`/`SV2` at rows 1, 2, 5, 6; `RightCenter` at x −332 and `LeftCenter` at x 332. Column numbers `1 2 3 4` at y 104 (F120). |
| Bottom table | 11 rows × 4 channels of 32 × 40 cells, at y = 56 − 40i. Labels `LeftCenter` at x 88 (F120). Rules run left from x 188: one 110 DI rule at y 76, four 30 DI rules (the CAS sub-rows), seven 110 DI rules. |
| Surface block | Rules 315 DI wide at y 416, 320, 272, 224. Labels `CenterCenter` at x 0 and y 440, 368, 296, 248, 176. Values `RightCenter` at x −86 and 152. Arrows (`076-arrow-up`) at x −153 and 82; RUD's left/right arrows at x −158 and 82. |
| G-LIM | `G-LIM    G` F200 `LeftCenter` at (−422, 15); the value at (−206, 15). |
| BLIN code | F120 `LeftCenter` at (−345, −190). |
| AOA row | 194 × 35 box at (−3, −415) with `AOA` at x −83 and `-99.9` at 83. `L` at −300, value right-aligned at −196; `R` at 180, value at 284. |
| Legends | PB2 `BLIN` and PB16 `AOA` (both inert, real), PB18 `MENU`. |

The SV labels and the surface block use FCS.lua's `customStringDef`: 120 % glyphs with interchar 14. It is the font
id `F120_FCS` in `ddi/constants.ts`.

## Content and mapping

Content: `src/frontend/src/content/fcs.ts` (PLACEHOLDER).

- **Kept real:** the surface block (the guide screenshot's values: `0 LEF 0`, `↓1 TEF ↓1`, `0 AIL 0`, `0 RUD 0`,
  `↑1 STAB ↑1`), the servo tables (no failures), G-LIM `7.5`, L/R AOA `1.0`. Mapping the surfaces to software felt
  forced.
- **Playful:** the bottom channel table becomes system health. Rows are services (`DB R/W/B`, `API`, `AUTH`,
  `CACHE`, `QUEUE`, `CI/CD`, `DNS`, `CRON`) and keep the real `DEGD` row. Channels 1–4 are Laptop, CI, Staging and
  Production. DNS has failed in channel 3, so DEGD is crossed there too, and the BLIN slot shows `53`, the DNS port.

## Interactions

None. The page has one in-section state. BLIN and AOA are inert. The FCS RESET switch that clears X marks is on
the cockpit panel, not the DDI.

## Deviations

- The X marks, numbers and arrows are static content; DCS drives them from C++ controllers.
- The BLIN code slot is empty in DCS (a `TODO` in the Lua). We fill it.
