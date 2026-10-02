# ENG: home server (`/server`)

A showcase page. It draws the real DCS ENG format [pgA §2] with two fake home-server hosts in the two engine columns.
The menu legend is `ENG` at SUPT PB12, as in DCS. The route is `/server`, which the registry already reserved
(design section 9.1).

## Format

ENG is the right format because it is already a two-column comparison table. The engine columns map one-to-one to
two hosts, and the rows map to metrics without changing their meaning (a reading per side). No custom layout is
needed.

All constants come from `ENG.lua` and live in `src/frontend/src/ddi/formats/eng.tsx`:

| Element | Value |
|---|---|
| Font | F150 everywhere (18 × 30, inter-character 6) |
| Headers | `CenterCenter` at (−250, 413) and (250, 413): `TopYPos + LabelOffset` = 343 + 70 |
| Rows | 13 rows at y = 343 − 60·i |
| Labels | `CenterCenter` at x = 0 |
| Left value | `RightCenter` at x = −180 |
| Right value | `RightCenter` at x = 260 |
| PB16 | `RECORD`, always boxed |
| PB18 | `MENU` (ours, design section 9.2; DCS shows a 4-digit number there) |

## Mapping

The headers `LEFT EPE` / `RIGHT EPE` become `LEFT NAS` / `RIGHT NUC` (both PLACEHOLDER). Each row label is the DCS
label, lightly adapted. Units are not drawn, as in DCS; the semantic layer gives them.

| Row | DCS label | Ours | Metric | Unit | Why |
|---|---|---|---|---|---|
| 0 | INLET TEMP | INLET TEMP | case inlet air temperature | °C | same meaning |
| 1 | N1 RPM | CPU % | CPU load | % | N1 is percent RPM, the main load figure |
| 2 | N2 RPM | RAM % | memory used | % | second percent figure |
| 3 | EGT | CPU TEMP | CPU temperature | °C | the hot-section temperature |
| 4 | FF | PWR DRAW | power draw | W | fuel flow is energy consumption |
| 5 | NOZ POS | FAN RPM | fan speed | rpm | the moving part that follows load |
| 6 | OIL PRESS | MEM PRESS | memory pressure (PSI) | % | pressure for pressure |
| 7 | THRUST | THRUPUT | network throughput | Mb/s | output; near-homophone |
| 8 | VIB | JITTER | network jitter | ms | vibration for jitter; DCS placeholders 0.4 / 0.9 kept |
| 9 | FUEL TEMP | DISK TEMP | disk temperature | °C | fuel is storage |
| 10 | EPR | LOAD AVG | 1-minute load average | — | a ratio-like number; DCS placeholder 3.40 kept |
| 11 | CDP | DISK % | disk used | % | |
| 12 | TDP | UPTIME | uptime | days, drawn with a `D` suffix | |

In the DCS screenshot (guide p82) THRUST and TDP show no values. The Lua gives both a controller and placeholder
values, so we draw values on every row.

## Data and the future API

- `content/types.ts` defines `ServerSnapshot`: one number per metric key per host. That is the shape a live
  `GET /stats` would return (design section 13).
- `content/server.ts` holds the hosts, the 13 rows (label, semantic name, unit, decimals, suffix) and the baseline
  snapshot. All PLACEHOLDER.
- `ddi/pages/server/provider.ts` defines `ServerStatsProvider { subscribe(listener) }`. The fake provider random-walks
  each reading within `FAKE_BAND` of its baseline every 1.5 s and skips ticks while the tab is hidden. A live provider
  would poll the API and call the listener with each snapshot; nothing else changes.
- `ddi/pages/server/store.ts` adapts a provider to `useSyncExternalStore`. The server and the first client render use
  the baseline, so hydration matches. Under `prefers-reduced-motion: reduce` the provider never starts and the values
  stay static.

## Interactions

- `ENG` (SUPT PB12) opens `/server`. `MENU` (PB18) opens `/` on TAC.
- `RECORD` is inert (design section 9.2): an `aria-disabled` button that changes nothing.
- The values drift in place. The URL never changes.

## Semantic layer

`ServerSemantic` renders a `<table>`: one row per metric, one column per host, values with units. Its cells read the
same store as the glass, so both show the same readings. The plain view now hides inert OSBs and styles tables (shared
`frame.css`).

## Deviations

- Values on THRUST and TDP rows (see above).
- `MENU` at PB18 instead of the DCS number (design-wide rule).
