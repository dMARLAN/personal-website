# Projects page (`/projects`)

The Projects section is drawn on the STORES format [pgA §1]. It has one URL. Selecting a station, `STEP`, the
categories and the DATA sublevel are all local state. The page opens on the first category's first station.

## Format choice

STORES fits without forcing anything. A loadout is a set of named things on numbered stations, grouped by type, with a
health word under each. Projects map onto that one to one:

| STORES | Projects |
|---|---|
| Weapon type on the top row (PB6–10), boxed when selected | Category (`WEB`, `TOOLS`, `HOMELAB`) |
| Station | One project |
| Type text under the station | Project code, 6 characters or fewer |
| Status (`RDY`, `STBY`, `DEGD`, `HUNG`) | Project health: live, paused, partly broken, stuck |
| Symbol (missile, LAU-115 pair, BRU-33 rack and amount, none for a tank) | Flavour chosen per project |
| `STEP` (PB13) | Next project in the category, wrapping |
| PROG block | Project name (as the underlined `PROG 1` title) and up to 5 × 2 fact rows |
| `DATA` (PB17) and the DATA freeze block | Project description |

## Geometry (all from STORES.lua)

`src/frontend/src/ddi/formats/storesWingform.tsx` computes every position with the Lua's own formulas, including its
`math.floor` calls, and tests pin the results to the [pgA §1.1–1.2] goldens.

- Wingform: four lines. Fuselage sides 45 DI at rot 177°/183° from (∓45, 243); leading edges 350 DI at rot
  115°/−115° from (−48, 198) and (47, 198). The 1 DI asymmetry is real.
- Station anchors: STA1 (−363, 48), STA2 (−258, 98), STA3 (−153, 148), STA4 (−45, 243), STA5 (0, 230), STA6 (45,
  243), STA7 (152, 148), STA8 (257, 98), STA9 (362, 48). Pylon ticks: 5 DI down at STA2/3/7/8, 5 DI outboard at
  STA4/6.
- Slot stacks, 28 DI rows, all F100:
  - STA2/3/7/8: symbol at anchor.y − 28, then amount (rack only), type and status one row each below it.
  - STA5: the same stack starting at y = 174. A tank has no symbol, so its type sits at 174, like `FUEL`.
  - STA4/6: symbol at (∓73, 243), type at (∓101, 243) and status at (∓101, 202), aligned away from the centreline.
  - STA1/9: symbol 8 DI outboard of the tip, type at y = 104 and status at y = 132 (above the type, as in the Lua),
    STA1's labels 10 DI further left than STA9's.
- Selection: the 110 × 26 box (110 × 22 on STA5) round the type text on STA2/3/5/7/8. STA1/4/6/9 have no box in
  the Lua, so a selected project there shows `SEL` in its status slot, as DCS does for A/A missiles [gpg §3].
- Which loads a station can show follows its Lua: STA1/4/6/9 missile only; STA5 rack or tank; STA2/3/7/8 any.
  A content test enforces it.
- PROG block: title at (0, −165), underlined 7 DI left and 4 DI right of the ink (as under `PROG 1`); labels at x =
  −220 and 40, values at −90 and 170, rows at y = −223 … −335.
- DATA sublevel: the 800 DI rule from (−400, −100); rows at y = −140 − 40i from x = −380. Row 0 is the project name,
  rows 1–7 the description wrapped at 47 characters.

## Legends

| PB | Legend | Action |
|---|---|---|
| 6–10 | Category legends, the selected one boxed | Select the category's first station (lowest number) |
| 13 | `STEP` | Next station in the category, wrapping |
| 17 | `DATA`, boxed while open | Toggle the DATA sublevel |
| 16 | `REPO` (DATA sublevel only) | Open the repository in a new tab, on press |
| 19 | `DEMO` (DATA sublevel only) | Open the demo in a new tab, on press |
| 18 | `MENU` | `/` (TAC) |

`STEP` and the categories keep the DATA sublevel open, so a visitor can step through descriptions. Only legends
that do something are drawn (design section 9.2): no `GUN`, `UFC`, `SIM`, `PROG` or `TONE`.

## State

The page passes the frame one screen per state: each project × {main, DATA}, so at most 18. The state key is the
project slug, with `/data` appended on the sublevel. Every state OSB is a `state` action; the URL never changes.

## Deviations (ours)

- The DATA title is underlined like the PROG title, so it reads apart from the description below it.
- `REPO` and `DEMO` have no DCS counterpart. They sit at PB16 and PB19, either side of `MENU` and `DATA`.
- The description is drawn in the symbology square, not the prose layer (design section 4.3). The DATA block is
  800 DI wide in DCS. A wide-tier wrap would run text past the rule, and every description already fits the square
  tier's 7 rows.
- The gun rounds (`578`) and master arm (`SAFE`) are left out: they would carry no content.
- The `RDY` line under the selected top-row weapon and the X-over for a broken weapon are left out.

## Semantic layer

`ProjectsSemantic` lists every category (`h2`) and project (`h3`) with its description, code, status in words,
station and load, the PROG facts and the link-outs, so the plain view and crawlers get every state's content.

## Open questions

1. Which real projects, categories and links? Everything in `content/projects.ts` is a placeholder.
2. Keyboard focus reaches the semantic layer's links while they are visually hidden in the display view (found while
   updating `e2e/keyboard.spec.ts`). That fails WCAG 2.4.7 once any page ships links there. It needs a site-wide
   decision, for example revealing the semantic layer on focus or taking its links out of the tab order.
