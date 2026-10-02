# MUMI (`/mumi`)

A showcase page: the real DCS MUMI (Memory Unit Mission Initialization) format, with the site's deployment as the
mission data. Its menu legend is the real one, `MUMI` at SUPT PB10 (`Menu_SUPT.lua`). The page is noindexed and left
out of the sitemap. It hides the easter egg: a load that ends on the admin console, `/admin`.

## Format

Transcribed from `Pages/MPD/MUMI.lua` [pgB §5] and checked against `figures/dcs-mumi.png`. Code:
`src/frontend/src/ddi/formats/mumi.tsx`.

| Element | Constants (DI) |
|---|---|
| `MU ID ` (trailing space kept) | F150 `CenterCenter` at (−180, 370) |
| MU ID value | F150 `LeftCenter` at (−100, 370); a 570 DI rule from (−300, 340) |
| ID fields 1 and 2 | F120 `CenterCenter` at (−190, 250) and (100, 250); 200 DI rules from (−290, 220) and (0, 220) |
| Vertical rule | 290 DI down from (−50, 220) |
| `MC` / value, `SMS` / value | F120 `CenterCenter`; labels at x −350, values at x −200; y 170 and 100 |
| `DATA XFER` | F120 `CenterCenter` at (−210, 10) |
| ERRORS band | two 750 DI rules from (−400, −100) and (−400, −250); `ERRORS: ` at (−300, −140), the list at (−70, −140) |
| `MU LOAD` | F150 `CenterCenter` at (−320, −330), parented to the page root |
| `MENU` | `addMenuLabel`, unboxed, at the title position (0, −446). PB18 has no legend of its own. |

Two legend sets, switched by PB10 (in-section state):

| Set | Legends |
|---|---|
| Main | 1 `RECCE`, 2 `HARM`, 3 `RDR`, 4 `TCN`, 5 `WYPT`, 6 `BIT`, 7 `MI`, 8 `IFF`, 9 `DL 13`, 10 `MORE`, 11 `ID`, 12 `MON` `FATG`, 13 `COMM`, 14 `HOLD`, 15 `ERASE`, 16 `ALR67`, 17 `D/L`, 19 `ALM` `GPS`, 20 `WYPT` `GPS` |
| More | 1 `PB`, 2 `NET3`, 3 `NET2`, 4 `NET1`, 5 `SA`, 7 `JSOW`, 8 `JDAM`, 9 `SLAMR`, 10 `RETURN`, 14 `CAS` `DCS`, 15 `NETS` `DCS`, 16 `FLRP`, 17 `WIND`, 19 `PROG` `ROE`, 20 `GPI` |

Content limits (ours, checked with `measure` in `mumi.test.tsx`): MU ID value ≤ 15 (ends on its rule), ID fields
≤ 10 (over their rules), MC and SMS values ≤ 10 (a character clear of the label and the vertical rule), ERRORS list
≤ 15 (a character clear of `ERRORS:`).

## Content

The `mumi` content section (PLACEHOLDER), served by the API and edited in `/admin` like the other showcase pages'
fake data (`docs/design.md` section 13). The API schema is `src/api/src/content/mumi.py`, which enforces the limits
above; the page reads it through `getMissionData()`.

| Slot | DCS sample | Ours | Meaning |
|---|---|---|---|
| MU ID | `ABCDEFGH` | `HOMELAB-01` | the home server the site loads from |
| ID fields | `ABCD`, `ABCD` | `WEB`, `API` | the two images the cluster runs |
| MC | `15C-XXXU` | `WEB-26.10` | the site build |
| SMS | `15C-XXXU` | `CDB-0042` | the content database schema |
| ERRORS | `HARM, NET 1` | `FONTS, CDN` | what failed in the last load |

## The load (easter egg)

MUMI.lua has no `LOAD` legend. Its load vocabulary is the `MU LOAD` cue (visible while a load runs), `DATA XFER`,
the per-legend boxes (`MPD_MUMI_<NAME>_Box`) and the ERRORS list. So the load runs from a data-type legend, as
boxing a data type selects it for loading: `ID` at PB11, the identity that the admin console needs.

| Time | Glass | URL |
|---|---|---|
| press | `ID` boxes; `MU LOAD` shows and blinks (200 ms); the ERRORS list clears | `/mumi` |
| 1.2 s | `MU LOAD` goes out; MU ID reads `ADMIN` | `/mumi` |
| 1.6 s | `window.location.assign("/admin")`, a normal navigation out of the DDI | `/admin` |

- It fires on press (`useOsbPress`) and on Enter or Space. A press while a load runs does nothing.
- Under `prefers-reduced-motion: reduce` it navigates at once.
- The OSB is an `<a href="/admin">`, so it works without JavaScript too. The semantic layer has a plain
  "Admin console" link.
- `/admin` is the admin console (`docs/design.md` section 13.8). It is reachable only over Tailscale in production,
  so on the public host the load ends on the ingress's block page. That is fine.
- The load state is a small `useSyncExternalStore` store (`pages/mumi/store.ts`). It resets when the page unmounts and
  when the browser restores the page from the back/forward cache, so Back from `/admin` shows an idle page.

## Interactions

- `MUMI` (SUPT PB10) opens `/mumi`. PB18 opens `/ddi` (TAC).
- `MORE` (PB10) shows the More set; `RETURN` (PB10) goes back. No URL change.
- `ID` (PB11) runs the load. Every other data-type legend is inert.

## Deviations

- The load sequence, its timing and the `MU LOAD` blink rate are ours. DCS runs the load in C++, and the Lua defines
  no blink rate [pgB §14 item 5].
- `ID` as the load trigger is ours (see above).
- The MU ID changing to `ADMIN` after the load is ours: `MPD_MUMI_MU_ID_Text` is a controller, so a new memory unit's
  ID is plausible, but the DCS behaviour is not visible.
- `DATA XFER` always shows, as in the render; its controller's behaviour is not visible.
