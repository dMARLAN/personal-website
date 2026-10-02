# FUEL (`/fuel`)

Showcase page. SUPT PB20 `FUEL` (real position). Label "Fuel, simulated".

## Format

The real FUEL format, transcribed from `Pages/MPD/FUEL.lua` [pgA §3]. It is checked against `dcs-fuel.png` and
`guide-page-84-fuel-page.png`. Code: `src/frontend/src/ddi/formats/fuel.tsx` (static parts), `FuelReadouts.tsx`
(client island), `fuelModel.ts` (geometry and maths), `fuelClock.ts` (time).

| Element | Constants (DI) |
|---|---|
| Tanks | `CenterCenter` boxes. TK 1 (0, 385) 350 × 160; L FD (0, 215) 350 × 100; R FD (0, 90) 350 × 70; TK 4 (0, −85) 350 × 200; wings (±350, 110) 150 × 100; externals (−300 / 0 / 300, −300) 225 × 70. |
| Tank text | Label F100 at box top + 20. Quantity F200 at the box centre, to the nearest 10 lb. |
| Caret | `addFuelAmountPointer`: two 30 DI lines at −60° and −120° from the box's bottom-right corner, raised by fill fraction × box height. |
| TOTAL / INTERNAL | F150 labels at (−380, 430) and (−380, 340); F200 values at (−380, 385) and (−380, 295). |
| BINGO | F150 at (350, 350); F200 value `RightCenter` at (450, 305). |
| Legends | PB10 `RESET`/`SDC` (inert, real), PB20 `FLBIT` (works), PB18 `MENU`. |

EST, INV, CG DEGD, INVALID and the 99:59 timer are hidden in DCS (`HideElement`) and are left out.

## Content and mapping

Content: `src/frontend/src/content/fuel.ts` (PLACEHOLDER). The tanks become energy reserves:

| Tank | Label | Motion |
|---|---|---|
| TK 1 | `COFFEE` | drains from full to 15 % over 3 min, then refills at once |
| L FD | `FOCUS` | wave, 80 % ± 15 %, 70 s |
| R FD | `PATIENCE` | wave, 65 % ± 10 %, 110 s |
| TK 4 | `MOTIVATION` | wave, 85 % ± 10 %, 150 s |
| L WG / R WG | `SLEEP` / `SNACKS` | waves |
| L EXT / CL / R EXT | `MUSIC` / `PTO` / `HOBBIES` | waves |

TOTAL, INTERNAL and BINGO keep their labels. TOTAL sums every tank; INTERNAL leaves out the externals, as in DCS.

## Interactions

- **Motion (ours).** The levels and carets move on a 250 ms tick (4 Hz). Time advances only while the page is
  visible and `prefers-reduced-motion` is off, so under reduced motion the page is static. The server, and
  hydration, draw t = 0. The clock is a module store (`useSyncExternalStore`), so it survives the FLBIT screen
  swap and a return visit resumes where it stopped.
- **FLBIT.** PB20 runs the fuel low BIT: `FLBIT` is boxed for 13 s, then returns [gpg §5]. It is two in-section
  states, `FUEL` and `FLBIT`. The `FLBIT` screen mounts `FlbitTimeout`, which switches back after 13 s. The URL
  never changes. The real test also raises a FUEL LO caution and a voice alert; we leave those out.

## Deviations

- The caret travel (fraction × box height) is inferred from the controller names and screenshots [pgA §5].
- The centreline label is one centred string. DCS staggers `C ` and ` L` 10 DI apart to draw "CL".
- Design section 2 says only the radar animates. This page also moves, gently, as the assignment asks.
