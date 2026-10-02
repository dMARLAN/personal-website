# Work history (`/work`)

Menu legend: `WORK` at TAC PB7. One URL. The employer and role shown are in-section state with no URL.

## Format: a custom layout from DCS ingredients

Recommendation: a custom page, not a real DCS format. It reads as a work history: a tab per employer, the employer's
roles as a dated list, and the selected role's highlights.

Candidates considered:

| Candidate | Verdict |
|---|---|
| BIT FAILURES (design section 9.1) | Rejected by Chad: BIT means system tests. |
| TGT DATA GROUP | A fixed 4-row table with 4–5 characters per column. Highlights do not fit, and a table of job bullets does not read as a table. |
| HSI DATA WYPT | 27 characters per row at its 150 % font; too few for highlights. Its tab strip and stepper are reused below. |
| MUMI | A one-record status page (ID, versions, errors). It has no list or stepping. |

So the page combines conventions from three real formats:

- **Tab strip (HSI DATA, [pgB §9]).** Employers sit on the top row from PB6, newest first. The current one is boxed.
  Like HSI DATA's `"  A/C  "` and `" WYPT "`, tab legends are padded to the same length, so the boxes match.
- **Stepper (HSI DATA WYPT, [pgB §9]).** `124-arrow` up on PB12 and down on PB13 step through the employer's roles.
  The role number (100 %) sits between them at (505, 60), where DCS shows the waypoint number.
- **Rows and boxing (TGT DATA GROUP, BIT, UFC BU).** The role list uses TGT DATA's 46 DI row pitch. A 790 × 36 box
  marks the selected role, as UFC BU's box marks a channel. Highlights use BIT's 37 DI list pitch. Full-width rules
  separate the blocks, as under the MUMI title and above HSI DATA WYPT's TOT line.

## Layout (DI, +y up)

Constants live in `src/frontend/src/ddi/formats/workHistory.tsx` (`WORK_HISTORY`).

| Element | Value |
|---|---|
| Width | Text and rules span x = ±400, the width of the TGT DATA frame box. |
| Employer name | 150 %, `CenterCenter` at (0, 410). ≤ 30 characters. |
| Location / span | 120 %, `LeftCenter` at (−400, 360) and `RightCenter` at (400, 360). |
| Upper rule | 800 DI at y = 335. |
| Role list | Up to 4 rows at y = 295 − 46k. Span `LeftCenter` at x = −380 (≤ 9 characters); title at x = −160 (≤ 27). |
| Selection box | 790 × 36, centred on the selected row. |
| Lower rule | 41 DI below the last role row, so the highlights follow the list. |
| Highlights | 120 %, first row 40 DI below the lower rule, pitch 37. A `-` marker at x = −400; the text at x = −370 wraps to 38 characters. The lowest row is at y = −406, so 14 rows fit under 4 roles. |
| Stepper | PB12 / PB13 arrows; the number at (505, 60), 100 %, `RightCenter`. Drawn only when an employer has more than one role. |

## Interactions (all local state; the URL stays `/work`)

| Input | Result |
|---|---|
| PB6–PB10, an employer tab | That employer, newest role first. Its tab is boxed. |
| PB12 (up arrow) | The previous role, up the list. Wraps from the first to the last. |
| PB13 (down arrow) | The next role, down the list. Wraps from the last to the first. |
| PB18 `MENU` | `/ddi` (TAC). This changes the URL. |

The page opens on the newest employer's newest role at every mount. Each state is a server-rendered screen keyed
`<employer id>/<role number>`.

## Content

`src/frontend/src/content/work.ts` (PLACEHOLDER): 4 invented employers with 2–3 roles each and short highlights.
Types are in `content/types.ts` (`Employer`, `Role`). The `Employer` and `Role` types replaced the BIT-shaped ones
(`short`, `code`, `location` per role).

Limits, enforced by `ddi/pages/work.test.tsx`: 1–5 employers with unique ids; tab ≤ 7 characters; 1–4 roles; each
role's wrapped highlights fit under its role list; every string fits its slot and has a glyph. A word longer than a
highlight line throws at build time (`ddi/font/wrap.ts`).

## Semantic layer

`src/frontend/src/semantic/WorkSemantic.tsx`: an `<h2>` per employer with its location and span, then an
`<article>` per role with an `<h3>` (title and span) and a `<ul>` of highlights. It lists every state, since the
glass shows one at a time.

## Deviations from DCS

- In HSI DATA WYPT the up arrow increments the waypoint number. Here the arrows follow the list on screen: up moves
  the box up (to a lower role number).
- The lower rule moves with the role count. DCS layouts are fixed, but a fixed rule left up to 120 DI of empty space
  above the highlights.
- The `-` marker is ours. DCS lists have no bullets.

## Open questions for Chad

1. The tabs need a short name (≤ 7 characters) per employer. Are abbreviations such as `NWIND` acceptable, or should
   names be capped at 7 characters?
2. Up to 5 employers fit (PB6–10). Is that enough, or should older jobs share one tab?
