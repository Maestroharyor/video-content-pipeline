# LifeTech Facts intro: concept E, "Loaded"
## Cue sheet

No voiceover: one custom slide, 4.0s, choreographed in seconds (`slides/01-intro.js`); a browser window with a skeleton page and a spinner; the spinner is the mark's own orbit, so when the page has loaded it becomes the logo.
`timeline.json` is hand-written (one window, cut). Stage 1920x1080 (horizontal), rendered at `4k`, 60fps, crf 10. Final: renders/final/lifetechfacts-intro-loaded.mp4 (+ AAC sting).

## Beat map (seconds)
| Time | What happens | Sound |
|------|--------------|-------|
| 0.00-0.70 | window frame draws on, chrome fades in, skeleton blocks pop in and shimmer | soft swell, five ticks |
| 0.30-1.50 | load bar fills (stalls at 70%), two-arc spinner turns anticlockwise; status flips to `ready ✓` | blip 1.50 |
| 1.45-1.80 | window scales up and fades | whoosh from 1.45 |
| 1.75-2.60 | disc bursts under the spinner, arcs grow to full length, balls pop on their leading ends | thump 1.75, pop 1.78 |
| 2.15-3.35 | LT/F wipes in, wordmark rises, tagline opens, sheen | shimmer 2.15 |

The logo is resolved by about 3.0s; the last second is a still hold, so the clip can be trimmed to 3s in the edit.

## Variants
- Theme: `project.js → intro.theme` (`dark` shows the deck grid, `light` is flat #F2F2F2), or for one render `--var theme=light --out projects/lifetechfacts-intro-loaded/renders/light`.
- Tagline: `project.js → intro.tagline` (`·` separates the items; default `LF.TAGLINE`).
- Vertical: `npm run assemble -- --project lifetechfacts-intro-loaded --canvas vertical --res 2k --out projects/lifetechfacts-intro-loaded/renders/vertical`
- 2-second cut (tutorials): `npm run assemble -- --project lifetechfacts-intro-loaded --from 1.45 --to 3.45 --out projects/lifetechfacts-intro-loaded/renders/2s`
- Transparent: `npm run render -- --project lifetechfacts-intro-loaded --slide 01 --format mov,webm --transparent --timed`
- Sound: edit `assets/sting.json` (cue list), then `sh projects/lifetechfacts-intro-loaded/assets/build-sting.sh`; the sounds are defined in `assets/logos/lifetechfacts/build-sting.js`.

## Design notes
One of ten intro concepts (A boot, B orbit, C beats, D commit, E loaded, F silicon, G bits, H blueprint, I eclipse, J generate), all kept so the intro can change per video; the faithful rebuild of the old template intro is `projects/lifetechfacts-intro`.
The mark, wordmark, themes, shock ring and the shared ending (`LF.resolve`) come from `assets/logos/lifetechfacts/lf-logo.js` (window.LF).
