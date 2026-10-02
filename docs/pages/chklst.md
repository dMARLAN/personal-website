# CHKLST (`/chklst`)

Showcase page. SUPT PB11 `CHKLST` (real position). Label "Pre-flight checklist".

## Format

The real CHKLST format, transcribed from `Pages/MPD/Checklists.lua` [pgB §2]. It is checked against
`dcs-chklst.png` and `guide-page-81-checklist-page.png`. Code: `src/frontend/src/ddi/formats/checklist.tsx`.

Every string is F150 (18 × 30) and `LeftCenter` unless noted. With B = 30:

| Element | Constants (DI) |
|---|---|
| Rows | y = 408 − 46.5k (pitch 1.55·B) |
| Left column | heading at x −289.5 (row 0); items at −264.5 (indent B − 5), rows 1–6 |
| Right column | heading at x 60 (row 0); items at 85, rows 1–9 |
| A/C WT | label at −289.5, value at −79.5, row 9 |
| MAX NZ | at −289.5, row 12; no value |
| STAB POS | label `CenterCenter` at x 0, row 14; values at −264.5 and 115 |
| Legends | none in DCS; PB18 `MENU` only |

## Content and mapping

Content: `src/frontend/src/content/checklist.ts` (PLACEHOLDER). The headings stay `LAND` and `T.O.`:

- **T.O.** is the start of the working day: `COFFEE`, `KEYBOARD`, `DUAL MONITORS`, `CHAIR HEIGHT`, `HEADPHONES`,
  `GIT PULL`, `CI GREEN`, `PINGS LO` (after `NWS LO`), `FOCUS MODE`.
- **LAND** is the end of the day: `TESTS PASS`, `GIT PUSH`, `PR OPENED`, `NOTES SAVED`, `LAPTOP SHUT`,
  `DESK CLEAR`.
- A/C WT (`36533`, the guide's value), MAX NZ and STAB POS (` 1° NU`) keep their real DCS text.

Limits (tested): left items ≤ 13 characters, so they clear the right heading at x 60; right items end by x 470;
the A/C WT value clears the right items at x 85.

## Interactions

None, as in DCS. The page has one in-section state.

## Deviations

None in layout. The semantic layer lists T.O. before LAND, because that is the order of a day.
