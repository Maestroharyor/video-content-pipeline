# Checks: before the user sees a candidate

## 1. The probe (npm run thumb, automatic)
`GRID.thumb` (core/grid.js): every word and logo inside x 96-1824, y 108-972; nothing in the duration-badge corner
(x > 1530 and y > 850) or the hover corner (x > 1730 and y < 330); the hook (`.pt-title`) ≥ 120 px, every other word ≥ 44 px.
`.pt-ground`, `.pt-mark`, `.pt-face` are exempt (`PROJECT.probe.thumbSkip`). The export refuses any issue: fix the layout,
never `--force`. A stacked title's line box is taller than its glyphs: tightening `lh` moves the top line box up, so move
`y` down by the same amount.

## 2. Every screen (npm run thumb-check)
`npm run thumb-check -- --project <slug>-thumbs --all` (or `--file`, or no flag for the pick) writes per image into
`research/visibility/`:
| Sheet | Read it for |
|---|---|
| `<name>-large.png` | 1280 (TV, big player), 640 (desktop home) and the edge crop (5% sides, 10% top/bottom): nothing important under the badge, the hover icons or the progress bar; nothing cut |
| `<name>-small.png` | 360 (search, mobile feed), 246 (mobile up-next), 168 (sidebar), 120 (smallest lists), 2x nearest: the hook and the picture must read at 168; at 120 the hook and picture must still read (small labels may go) |
| `<name>-shelf.png` | the candidate at 168 px among 11 research winners: does it stand out (brightness, contrast, size of the hook)? A thumbnail darker and quieter than its neighbours loses the scroll |

## 3. By eye
Every candidate at full size (type edges, cutout halos, logo quality: a 256 px icon is soft above ~400 px on stage) and
at 168 px. Check the face cutout for background leaks (`--mode subject`) and that nothing hints at the video's answer.

## 4. The files
Always a PNG under 2 MB (house rule): `npm run thumb` walks a PNG-only ladder (lossless 2560→1920, 256 colours at
2560/2240, lossless 1760→1280, 256 colours at 1920) and keeps the first under 2,000,000 bytes. A grain texture or soft
gradients push lossless over; if the winner is a 256-colour step, look at the gradients at full size for banding.
`--pick` writes `renders/<slug>-thumbnail.png`; ffprobe it; `deliver/video/` gets it.
