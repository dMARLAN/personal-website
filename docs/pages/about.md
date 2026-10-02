# About (`/about`)

TAC PB20 `ABOUT`. Format: **TGT DATA OWNSHIP**, the real layout [pgB §11]. Code: `src/frontend/src/ddi/formats/tgtDataOwnship.tsx`
(layout) and `src/frontend/src/ddi/pages/about.tsx` (content binding). Content: `src/frontend/src/content/profile.ts`
(PLACEHOLDER).

## Why this format

The suggested format fits, so we use it. OWNSHIP is a profile card for one aircraft: a callsign header, label/value
status rows, a stores list, a free line and IFF rows. None of its values has a controller in the Lua, so every slot is
free content. It also has an empty quadrant that holds the bio. The meanings carry over without forcing:

| DCS slot | Our content | Limit (F120) |
|---|---|---|
| `EMERG` (−385, 410) `LeftBottom` | `header`: the site name, from `SITE_NAME` | 18 chars |
| `EXER` (385, 410) `RightBottom` | `badge` | 18 chars |
| Status rows `VC:` … `PRI TN:` | `status`: 5 label/value rows (role, base, years, stack, status) | label ≤ 7 incl. `:`, value ≤ 9 |
| Stores `X - XXXX` (x 43) | `loadout`: 5 skills, written `1 - TYPESCRIPT` | 17 chars |
| Fuel/gun line (−385, −10) | `footer`: one playful line | 19 chars |
| `IFF 1:` … `IFF 3:` (x 35) | `tags`: 3 label/value rows, drawn `LABEL VALUE` | 18 chars per row |
| Empty bottom-left quadrant | `bio`, word-wrapped | 9 rows × 18 chars |

## Layout constants

All values come from `TGT_DATA_COMMON_PBs.lua` and `TGT_DATA_OWNSHIP.lua`:

- Box 800 × 840 centred on (0, −25). Horizontal divider at y = −25. Vertical divider at x = 0, full height.
- Status rows: labels `RightBottom` at x = −210, values `LeftBottom` at x = −185. Rows at y = 335 − 41·i.
- Stores at x = 43 on the same rows. IFF at x = 35, y = −85 − 45·i.
- **Bio (ours):** `LeftBottom` at x = −385 (the fuel line's x), y = −85 − 41·i for i = 0…8. It starts on the IFF rows'
  first y and uses the status pitch. 18 characters per row keeps the same 15 DI inset from the divider as `EMERG` keeps
  from the box side.

## Interactions

None. The only legend is PB18 `MENU`, which opens `/ddi` (TAC). The real legends (`CURSOR`, `ENTER`, `UFC`, `MSNCDR`,
`FLTLDR`, `ACTVTY RSET`, `GROUP`, `GO`, `NOGO`) are left off. A section page draws only legends that do something
(design §9.2).

## Deviations

- The bio quadrant is ours. DCS leaves it empty.
- `EMERG` and `EXER` hold content in place of their fixed words.
- The bio is plain word wrap. A word longer than 18 characters fails the build (`wrapWords` throws).

## Semantic layer

`AboutSemantic`: the header and badge, the bio, then `Profile` (a `<dl>` of the status rows), `Loadout` (a list), the
footer line and `Identification` (a `<dl>` of the tags).

## Tests

`ddi/pages/about.test.tsx` checks the DCS sample positions, keeps every content string inside its quadrant, checks the
bio's wrap limits, and checks that every glyph is mapped. `e2e/about.spec.ts` covers menu navigation, MENU back, the
no-JS HTML and axe in day and night (DDI and plain view).
