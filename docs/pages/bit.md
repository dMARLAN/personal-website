# BIT (`/bit`)

A showcase page: the real DCS BIT format, with a software engineer's checks in place of aircraft systems. Its menu
legend is the real one, `BIT` at SUPT PB8.

## Format and why

The real BIT formats from `Pages/MPD/BIT/*.lua` [pgB §3], all of them: BIT FAILURES, the eight sublevels (FCS-MC,
SENSORS, STORES, COMM, NAV, DISPLAYS, STATUS MONITOR, EW) and S/W CONFIGURATION. A showcase reproduces its format
exactly, so every legend, row and group block sits where the Lua puts it. Only the item names, the statuses and the
S/W CONFIGURATION values are ours.

Each DCS equipment item becomes one check, themed by its group:

| Group | Theme | Examples |
|---|---|---|
| FCS-MC | build pipeline | `LINT`, `TYPECHECK`, `FLAKY E2E` (`RESTRT`) |
| SENSORS | observability | `LOGS`, `ALERTS` (`OFF`) |
| STORES | storage | `CACHE` (`DEGD`), `FRI PROD` (`NOT RDY`, forever) |
| COMM | people | `STANDUP` (`OVRHT`), `ZOOM` (`RESTRT`) |
| NAV | finding your way | `MERGE` (`MUX FAIL`), `DNS` (`DEGD`, a retest does not fix it) |
| DISPLAYS | frontend | `CSS`/`HTML`/`JS` bracket, `JS` (`DEGD+OVRHT`) |
| STATUS MONITOR | the engineer | `COFFEE`, `SLEEP`, `DUCK`; fuel-low rows `MUG 1` (`NO TEST`), `MUG 2` |
| EW | security | `NPM AUDIT` (`DEGD`), `2FA`, `TLS` |

Statuses use only `BIT_StatMsgs` words, plus `NO TEST` on the fuel-low rows, as in `BIT_STAT_MON.lua`.

## Files

| File | Holds |
|---|---|
| `src/frontend/src/content/bit.ts` | The themed checks (`BIT_CHECKS`, keyed by DCS item), legend-only names and S/W CONFIG. PLACEHOLDER. |
| `src/frontend/src/ddi/formats/bitFormat.tsx` | Lua constants and drawing: title, rows, group block, item legend, DISPLAYS bracket, S/W CONFIG table. |
| `src/frontend/src/ddi/pages/bit/structure.ts` | The DCS structure: groups and PBs, each sublevel's rows, item legends and fixed legends, `EquipItems` order. |
| `src/frontend/src/ddi/pages/bit/screens.tsx` | Binds content to the format: one screen per level. |
| `src/frontend/src/ddi/pages/bit/status.ts`, `store.ts`, `islands.tsx` | Test state, status rules and the client islands. |
| `src/frontend/src/semantic/BitSemantic.tsx` | The semantic layer. |

## Layout constants (DI, from the Lua)

| Constant | Value | Source |
|---|---|---|
| Title | 200 %, `CenterCenter` at (0, 237) | `BIT_titlePosY` |
| List rows | y = 161 − 37k, 17 per page; name `LeftCenter` at x −173, status at x 29 | `BIT_ItemPosY`, `BIT_FAILURES_AT_ONE_PAGE` |
| Group block | label `LeftBottom` at (PBx + off, PBy + 13); 200 DI rule from x − 3; status `LeftTop` at PBy − 13; off 0 left, −200 right | `add_BIT_EquipmentGroup` |
| Item legend | 24 DI tick centred on the PB; `"   NAME"` `LeftCenter` (left) or `"NAME   "` `RightCenter` (right) | `add_BIT_item_PB_label` |
| DISPLAYS bracket (PB5) | three names at PBy + 24 / 0 / −24; two 80 DI rules from x + 54 at ±18; a 96 DI tick | `BIT_DISPLAYS.lua` |
| STATUS MONITOR fuel-low rows | rows 12 and 13 (y −283, −320) | `BIT_STAT_MON.lua` |
| S/W CONFIG | title `S/W CONFIGURATION\nUSN` 200 % at (0, 300); rows y = 180 − 37k; names at −370 / 80, values +150; left row 4 blank | `SW_CONFIG.lua` |
| Font | `BIT_PageFont`: 14 × 24, interchar 6, interline 8 | `BIT_defs.lua` |

Content limits, enforced by `content/bit.test.ts`: list names ≤ 9 characters (one clear space before the status
column; the Lua allows 10 but the result runs into the status), item-legend names ≤ 7, S/W CONFIG names ≤ 6 (the
DCS maximum, `ALE-47`) and values ≤ 8 (the DCS sample `XXXXXXXX`).

## Legends

| Level | Legends |
|---|---|
| BIT FAILURES | PB6 `AUTO` (test all), PB7 `CONFIG`, PB8 `SELBIT` (inert), PB9 `MI` (inert), PB10 `STOP`, group blocks PB1–5 and 11–13 (open the sublevel), PB16 `PAGE`, PB18 `MENU` |
| Sublevels | PB6 `ALL` (test the group), PB8 `BIT` (return), PB9 `MI`, PB10 `STOP`, item legends (test that check), the real fixed legends (`MAD CAL`, `ADC MAINT`, `INS MAINT`, `INS GB`, `RDR MAINT`, `SMS MAINT`, `UFC MAINT`, `HMD MAINT`, `FIRAM MAINT`, `STATION`, `MSP`; inert) |
| FCS-MC | as above, plus PB16 `FCS OPTION`, which cycles PB17 through the 16 real labels (`FCS MAINT` … `FCS TG12`) |
| S/W CONFIG | PB8 `BIT` (return), PB9 `MI`, PB10 `STOP`, PB20 `OVRD` (inert) |

Legends with no list row on their page are inert: DISPLAYS `UFC` (themed `KEYS`), STATUS MONITOR `DFIRS`
(`OUTAGES`) and `FXFR` (`KETTLE`). `FQTY` (`MUGS`) tests both fuel-low rows.

## Interactions

All local state on one URL (design section 9.4).

- **Levels.** Every level is one in-section state (`MAIN-1`, `MAIN-2`, the eight sublevel ids, `CONFIG`). Group OSBs,
  `BIT`, `CONFIG` and `PAGE` are state OSBs. `PAGE` cycles and wraps. `MENU` links to `/`.
- **Tests (ours).** A check's legend, `ALL` or `AUTO` starts a test: the status shows `IN TEST` for 1.5 s, then the
  check's `afterTest` status. `STOP` aborts every running test; the checks keep their old status. Group blocks
  summarise their checks: `IN TEST` while any runs, else the most severe failing status, else `GO`. Results survive
  level changes and reset when the page unmounts.
- **Reduced motion.** Under `prefers-reduced-motion: reduce` a test resolves at once and never shows `IN TEST`.
- **How it is built.** Tests live in a small `useSyncExternalStore` store, not in screen states: every state is
  server-rendered, so a state per test would multiply the HTML. Test legends are `island` OSBs (`BitOsbButton`), which
  fire on press like every OSB. Each status cell is a client component (`LiveStatus`) that receives every status it
  can reach, pre-drawn on the server, and picks one, so the stroke font never ships to the browser.

## Deviations

- **No reflow after a test.** In DCS the failure list is C++ and presumably drops items that pass. Here the list is
  fixed at load, so a fixed check stays listed and shows `GO`. Reflowing would change the page count after `AUTO`.
- **Group status rule** is ours (the DCS controller is C++). See `SEVERITY` in `status.ts`.
- **List order** follows `EquipItems`, an assumption: the C++ that fills the list is not visible.
- **`MI` and `SELBIT` are inert**, so the memory-inspect arrows at PB6/PB7 never show and `AUTO`/`CONFIG`/`ALL` never
  hide.
- **`PAGE` is always shown** because the mock content has 20 failures (two pages). DCS shows it only when needed.
- **Test timing** (1.5 s) is ours.

## Open questions for Chad

- Are the themed checks and the jokes right for the site's tone?
- S/W CONFIG shows the site's real stack with snapshot versions. Keep it static, or generate it from the lockfiles?
