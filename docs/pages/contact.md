# Contact (`/contact`)

TAC PB8 `CONTACT`. Format: **MIDS**, the real layout of its status block, rules and cautions line [pgB §6]. Code:
`src/frontend/src/ddi/formats/mids.tsx`, `src/frontend/src/ddi/pages/contact.tsx` and the client islands in
`src/frontend/src/ddi/pages/contactIslands.tsx`. Content: `src/frontend/src/content/contact.ts` (PLACEHOLDER).

## Why this format

The suggested format fits. MIDS is the datalink's comms status page: label/value rows (`NET ENTRY:`, `DATE:`, `TIME:`,
`NETWORK:`), an empty cautions line between two rules, and an `XMIT` (transmit) legend. Contact details are label/value
rows, and "transmit a mail" is what `XMIT` means. The cautions line is the natural place for COPY feedback.

We left out the channel block (`AIC:`, `F/F 1:`, `VOICE A:`, …). Its values are 3-character channel numbers, which no
contact detail fits.

## Layout constants

- Status rows at y = 341, 274, 207, 140 (pitch 67), F120. Each value starts 25 DI after its label's right edge.
- **Row centring (ours).** DCS places each label's right edge by hand, at (25, 341), (−55, 274), (−30, 207) and
  (10, 140). With its sample values, every row is centred on x = 0 to within 13 DI. Our labels differ, so each row is
  centred exactly: label right edge = (label width − 25 − value width) / 2. A unit test checks this rule against the
  DCS positions.
- Row 1 is always `EMAIL:` with the address (the `@` glyph is ours, in `font/extraGlyphs.ts`). Rows 2–4 come from
  content. A row must stay within x = ±470, the inner edge of the side legends: about 46 characters.
- Two 725 DI rules at y = −118 and −292. Cautions line `LeftBottom` at (−330, −172).

## Interactions

| PB | Legend | Action |
|---|---|---|
| 16 | `COPY` (at `RELAY`'s position) | Copies the address on press. The cautions line shows `COPIED` for 2 s, or `COPY FAILED` if the browser refuses. A visually hidden `role="status"` announces the result. |
| 17 | `XMIT` / `MAIL` (at `XMIT`'s position; `MAIL` sits where `UPPER` does) | Opens a `mailto:` link on press. Without JavaScript it is a plain `<a href="mailto:…">`. |
| 18 | `MENU` | Opens `/ddi` (TAC). |

Both page OSBs are `island` legends. They fire on press through `useOsbPress`, which `frame/Osb.tsx` now exports. The
COPY button and the cautions line share a small store through `useSyncExternalStore`. Nothing changes the URL.

## Deviations

- MAIL is an island, not an `external` legend. `window.open("mailto:…", "_blank")` leaves an empty tab behind, so
  MAIL sets `location.href` instead.
- The channel block, the top-row sublevels and the other real legends (`IPF`, `RSET`, `ENTRY NET`, `PWR`, `O/H OVRD`)
  are left off, because a section page draws only legends that do something.

## Semantic layer

`ContactSemantic`: a `<dl>` with the email as a `mailto:` link, then the other rows.
