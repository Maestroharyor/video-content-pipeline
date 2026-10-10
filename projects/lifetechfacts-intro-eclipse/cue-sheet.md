# LifeTech Facts intro: concept I, "Eclipse"
## Cue sheet

No voiceover: one custom slide, 4.0s, choreographed in seconds (`slides/01-intro.js`); the disc is hidden behind an unseen body that slides away, so the mark appears as a growing crescent while the balls finish one long lap. Flat shapes only.
`timeline.json` is hand-written (one window, cut). Stage 1920x1080 (horizontal), rendered at `4k`, 60fps, crf 10. Final: renders/final/lifetechfacts-intro-eclipse.mp4 (+ AAC sting).

## Beat map (seconds)
| Time | What happens | Sound |
|------|--------------|-------|
| 0.00-0.50 | thin rim line, first ball appears, a hair of a crescent | blip 0.10 |
| 0.45-1.90 | the hiding body slides off to the lower left; second ball 0.55; arcs trail the balls (ink colour over the hidden part, white over the disc) | long swell 0.30-1.85, blip 0.55 |
| 1.85-2.55 | disc whole: one soft ring leaves it | thump 1.88 |
| 1.95-3.15 | LT/F wipes in, wordmark rises, tagline opens, sheen | shimmer 1.95 |

The logo is resolved by about 3.0s; the last second is a still hold, so the clip can be trimmed to 3s in the edit.

## Variants
- Theme: `project.js → intro.theme` (`dark` shows the deck grid, `light` is flat #F2F2F2), or for one render `--var theme=light --out projects/lifetechfacts-intro-eclipse/renders/light`.
- Tagline: `project.js → intro.tagline` (`·` separates the items; default `LF.TAGLINE`).
- Vertical: `npm run assemble -- --project lifetechfacts-intro-eclipse --canvas vertical --res 2k --out projects/lifetechfacts-intro-eclipse/renders/vertical`
- 2-second cut (tutorials): `npm run assemble -- --project lifetechfacts-intro-eclipse --from 1.2 --to 3.2 --out projects/lifetechfacts-intro-eclipse/renders/2s`
- Transparent: `npm run render -- --project lifetechfacts-intro-eclipse --slide 01 --format mov,webm --transparent --timed`
- Sound: edit `assets/sting.json` (cue list), then `sh projects/lifetechfacts-intro-eclipse/assets/build-sting.sh`; the sounds are defined in `assets/logos/lifetechfacts/build-sting.js`.

## Design notes
One of ten intro concepts (A boot, B orbit, C beats, D commit, E loaded, F silicon, G bits, H blueprint, I eclipse, J generate), all kept so the intro can change per video; the faithful rebuild of the old template intro is `projects/lifetechfacts-intro`.
The mark, wordmark, themes, shock ring and the shared ending (`LF.resolve`) come from `assets/logos/lifetechfacts/lf-logo.js` (window.LF).
