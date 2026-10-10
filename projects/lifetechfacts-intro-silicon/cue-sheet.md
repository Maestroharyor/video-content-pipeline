# LifeTech Facts intro: concept F, "Silicon"
## Cue sheet

No voiceover: one custom slide, 4.0s, choreographed in seconds (`slides/01-intro.js`); circuit traces route in to a chip package, pulses charge the die; the square package rounds into the disc and the last two pulses become the orbit balls.
`timeline.json` is hand-written (one window, cut). Stage 1920x1080 (horizontal), rendered at `4k`, 60fps, crf 10. Final: renders/final/lifetechfacts-intro-silicon.mp4 (+ AAC sting).

## Beat map (seconds)
| Time | What happens | Sound |
|------|--------------|-------|
| 0.00-0.95 | traces draw in from the frame edges with 45° jogs, vias ring; package `LTF-01` pops in | swell |
| 0.50-1.45 | one pulse per trace runs into the chip, the die charges | eight ticks 0.92-1.40, low blip 1.40 |
| 1.38-1.78 | pins retract, traces pull back to the edges, the package rounds into the disc; two hero pulses hop onto the ring | whoosh from 1.45 |
| 1.78-2.65 | disc pulse, balls lap the ring with arcs trailing, shock ring + ticks | thump 1.78, pop 1.88 |
| 2.18-3.40 | LT/F wipes in, wordmark rises, tagline opens, sheen | shimmer 2.18 |

The logo is resolved by about 3.0s; the last second is a still hold, so the clip can be trimmed to 3s in the edit.

## Variants
- Theme: `project.js → intro.theme` (`dark` shows the deck grid, `light` is flat #F2F2F2), or for one render `--var theme=light --out projects/lifetechfacts-intro-silicon/renders/light`.
- Tagline: `project.js → intro.tagline` (`·` separates the items; default `LF.TAGLINE`).
- Vertical: `npm run assemble -- --project lifetechfacts-intro-silicon --canvas vertical --res 2k --out projects/lifetechfacts-intro-silicon/renders/vertical`
- 2-second cut (tutorials): `npm run assemble -- --project lifetechfacts-intro-silicon --from 1.48 --to 3.48 --out projects/lifetechfacts-intro-silicon/renders/2s`
- Transparent: `npm run render -- --project lifetechfacts-intro-silicon --slide 01 --format mov,webm --transparent --timed`
- Sound: edit `assets/sting.json` (cue list), then `sh projects/lifetechfacts-intro-silicon/assets/build-sting.sh`; the sounds are defined in `assets/logos/lifetechfacts/build-sting.js`.

## Design notes
One of ten intro concepts (A boot, B orbit, C beats, D commit, E loaded, F silicon, G bits, H blueprint, I eclipse, J generate), all kept so the intro can change per video; the faithful rebuild of the old template intro is `projects/lifetechfacts-intro`.
The mark, wordmark, themes, shock ring and the shared ending (`LF.resolve`) come from `assets/logos/lifetechfacts/lf-logo.js` (window.LF).
