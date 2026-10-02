# Links (`/links`)

TAC PB9 `LINKS`. Format: **UFC BU**, the backup UFC on a DDI [pgB §12]. Code: `src/frontend/src/ddi/formats/ufcBu.tsx`
and `src/frontend/src/ddi/pages/links.tsx`. Content: `src/frontend/src/content/links.ts` (PLACEHOLDER, except the
resume link, which uses `RESUME.pdfPath`).

## Why this format

The suggested format fits. UFC BU is a channel table: numbered presets, a selection box, a scratchpad, a keypad spread
over the OSBs, and `ENT` to commit. A list of links is a list of presets. You pick one with its digit and open it with
`ENT`, so every legend keeps its real meaning.

## Layout constants

From `UFC_BU.lua`, except where marked:

- Columns, F120 `CenterCenter`: station number at x = −200, frequency (our name) at −20, designation (our tag) at 180.
- **Rows (ours):** y = 300 − 54·i. C++ sets the row y in DCS (`MPD_UFC_BU_CurrentGroupChannel`), so the pitch is
  unknown. 54 is the 50 DI box plus a 4 DI gap. Ten rows end at y = −186, above the bottom rule.
- Selection box 480 × 50 round the selected row. Bottom rule: 550 DI from (−270, −350).
- Scratchpad: a 200 × 50 box at (280, 380) with F100 text. It shows the selected name.
- Left edge: the `075-arrow-up` symbol at PB5 and the same symbol turned 180° at PB4. Each is raised 16 DI, as
  `selectPBSymbol` does. The vertical `C H A N` (F100 `LeftCenter`) sits at (−505, 227).
- Content limits: name ≤ 8 characters. Tag ≤ 6, so it stays inside the 480 DI box (the designation column is centred at
  x = 180, and the box ends at 240). At most 10 links, one per keypad digit.

## Interactions

All of these are in-section state (design §9.4). The URL never changes.

| PB | Legend | Action |
|---|---|---|
| 8–17 | `1`–`9`, `0` | Selects that row. Only rows that exist get a digit. |
| 4 / 5 | arrow down / up | Steps to the next or previous row, wrapping at both ends. From no selection, down selects row 1 and up selects the last row. |
| 19 | `ENT` | Opens the selected link in a new tab on press (`window.open(…, "noopener,noreferrer")`). With JavaScript off it is an `<a target="_blank" rel="noopener noreferrer">`. With no selection it is inert. |
| 20 | `CLR` | Clears the selection: no box, no scratchpad, `ENT` inert. |
| 18 | `MENU` | Opens `/` (TAC). |

The page opens with row 1 selected, so `ENT` works before JavaScript loads.

## Implementation choice

Design §12 suggests an island with a shared store for the selection. We use the frame's existing in-section state
instead: one server-rendered screen per selection, plus "none". The digits, arrows and `CLR` are `state` legends, and
`ENT` is an `external` legend whose `href` follows the screen. This needs no new client code. The cost is N + 1 small
screens in the RSC payload: six screens today, eleven at most.

## Deviations

- `PAGE` (PB3), `RET` (PB1) and `COM1`/`COM2` (PB6/PB7) are left off, because a section page draws only legends that do
  something. Keypad digits for missing rows are left off for the same reason.
- `MENU` is the PB18 legend, as on every page. The real UFC BU draws `MENU` with `addMenuLabel` at (0, −446).

## Semantic layer

`LinksSemantic`: every link as `<a target="_blank" rel="noopener noreferrer">`, with its tag.
