# Resume (`/resume`)

Menu legend: `RESUME` at TAC PB6. One URL, one screen, no in-section state.

## Format: S/W CONFIGURATION, exact

The page is the real S/W CONFIGURATION format (`BIT/SW_CONFIG.lua` [pgB §3], render `dcs-sw-config.*`), as design
section 9.1 proposed. It fits because it is a name/value table, and a skills and qualifications overview is a
name/value table. The title "S/W CONFIGURATION" also reads as a pun for a software engineer. Line two, `USN` in
DCS, holds a placeholder.

| Element | Value (DI) | Source |
|---|---|---|
| Title | 2 lines, 200 %, `CenterCenter` at (0, 300). The lines centre at y = 326 and 274. | `CONFIG_titlePosY` |
| Rows | 12 per column at y = 180 − 37k | `CONFIG_ItemPosY` = 300 − 120; pitch 24 + 13 |
| Font | `BIT_PageFont`: 120 % (14 × 24, interchar 6), interline 8 | `BIT_defs.lua` |
| Left column | name `LeftCenter` at x = −370, value at −220 | `firstColumnPosX`, `softwareIdIdentX` = 150 |
| Right column | name at x = 80, value at 230 | `secondColumnPosX` |

Constants live in `src/frontend/src/ddi/formats/swConfig.tsx`. The format takes props and never imports content.

## Content

`src/frontend/src/content/resume.ts` (PLACEHOLDER). The left column is skills (`PYTHON  EXPERT 10 YR`); the right
column is qualifications (`DEGREE  BS COMP SCI`). Each column has a heading that only the semantic layer shows.

Limits, enforced by `ddi/pages/resume.test.tsx`:

- At most 12 rows per column.
- Name ≤ 6 characters. The Lua fits 7 before the value column, but a 7-letter name touches its value (16 DI gap).
  The longest DCS name, `ALE-47`, is 6.
- A left value ends before the right column (x = 80): 15 characters.
- A right value ends at x ≤ 470, the inner edge of the right-side legends: 12 characters.
- Title lines ≤ 24 characters.

## Legends

| PB | Legend | Action |
|---|---|---|
| 20 | `PDF` | Downloads `public/resume.pdf` on press (`<a download>`). PB20 is `OVRD` in DCS, the format's only action OSB. |
| 18 | `MENU` | Opens `/` (TAC). |

DCS also shows PB8 `BIT` (back), PB9 `MI` and PB10 `STOP`. They are left out: section pages draw only legends that
do something (design section 9.2).

`public/resume.pdf` is a one-page placeholder PDF that says "PLACEHOLDER RESUME".

## Semantic layer

`src/frontend/src/semantic/ResumeSemantic.tsx`: `<h2>Skills</h2>` and `<h2>Qualifications</h2>`, each with a
`<dl>` in the content's original case, then a download link to the PDF.

## Deviations

- PB20's legend is `PDF`, not `OVRD`.
- The DCS blank row (the ATARS slot, row 4 on the left) is not kept: rows fill from the top.

## Open questions for Chad

1. **Focus out of view.** With pages shipped, the visually hidden semantic layer has links (TAC lists its pages; this
   page has the PDF link). Tab reaches them before the OSBs, so keyboard focus goes out of view. That breaks WCAG
   2.4.7. Options: show the semantic layer while it holds focus, or give its links `tabindex="-1"` in DDI mode. The
   `keyboard.spec.ts` check now skips the in-view assertion for those links until this is decided.
2. Line two of the title: keep a placeholder, or use something like your role?
