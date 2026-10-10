# LifeTech Facts intro: concept H, "Blueprint"
## Cue sheet

No voiceover: one custom slide, 4.0s, choreographed in seconds (`slides/01-intro.js`); the mark is drawn as a technical drawing with its real measurements, then filled in. The quietest of the ten.
`timeline.json` is hand-written (one window, cut). Stage 1920x1080 (horizontal), rendered at `4k`, 60fps, crf 10. Final: renders/final/lifetechfacts-intro-blueprint.mp4 (+ AAC sting).

## Beat map (seconds)
| Time | What happens | Sound |
|------|--------------|-------|
| 0.00-0.85 | centre lines, disc circle, dashed ring circle, radial ticks at the arc ends with their angles | soft ticks |
| 0.60-1.40 | outlines of the orbit bands, balls and LT/F stroke on; Ø dimension and title block fade in | soft ticks |
| 1.50-2.45 | fills come in under the drawing, orbit turns 60° into place, outlines then construction lines fade | small swell 1.10, thump 1.50 |
| 1.90-3.10 | LT/F wipes in, wordmark rises, tagline opens, sheen | shimmer 1.90 |

The logo is resolved by about 3.0s; the last second is a still hold, so the clip can be trimmed to 3s in the edit.

## Variants
- Theme: `project.js → intro.theme` (`dark` shows the deck grid, `light` is flat #F2F2F2), or for one render `--var theme=light --out projects/lifetechfacts-intro-blueprint/renders/light`.
- Tagline: `project.js → intro.tagline` (`·` separates the items; default `LF.TAGLINE`).
- Vertical: `npm run assemble -- --project lifetechfacts-intro-blueprint --canvas vertical --res 2k --out projects/lifetechfacts-intro-blueprint/renders/vertical`
- 2-second cut (tutorials): `npm run assemble -- --project lifetechfacts-intro-blueprint --from 1.2 --to 3.2 --out projects/lifetechfacts-intro-blueprint/renders/2s`
- Transparent: `npm run render -- --project lifetechfacts-intro-blueprint --slide 01 --format mov,webm --transparent --timed`
- Sound: edit `assets/sting.json` (cue list), then `sh projects/lifetechfacts-intro-blueprint/assets/build-sting.sh`; the sounds are defined in `assets/logos/lifetechfacts/build-sting.js`.

## Design notes
One of ten intro concepts (A boot, B orbit, C beats, D commit, E loaded, F silicon, G bits, H blueprint, I eclipse, J generate), all kept so the intro can change per video; the faithful rebuild of the old template intro is `projects/lifetechfacts-intro`.
The mark, wordmark, themes, shock ring and the shared ending (`LF.resolve`) come from `assets/logos/lifetechfacts/lf-logo.js` (window.LF).
