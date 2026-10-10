# LifeTech Facts intro: concept J, "Generate"
## Cue sheet

No voiceover: one custom slide, 4.0s, choreographed in seconds (`slides/01-intro.js`); a prompt pill is clicked, bursts into a swarm of tokens that swirls and condenses into the mark, which arrives in three denoise steps. The fastest of the ten.
`timeline.json` is hand-written (one window, cut). Stage 1920x1080 (horizontal), rendered at `4k`, 60fps, crf 10. Final: renders/final/lifetechfacts-intro-generate.mp4 (+ AAC sting).

## Beat map (seconds)
| Time | What happens | Sound |
|------|--------------|-------|
| 0.00-0.55 | pill `✦ Generate intro` pops in, pointer arrives | pop 0.00 |
| 0.55-0.85 | click (ripple), pill closes to a dot | click + blip 0.55 |
| 0.85-1.75 | 64 tokens and particles are flung out, swirl anticlockwise, then pull onto the ring and into the disc | whoosh 0.80, swell 1.20 |
| 1.70-1.94 | mark arrives blurred 18px → 7px → sharp; disc bursts, shock ring | thump 1.70, three rising blips |
| 2.10-3.30 | balls lap, LT/F wipes in, wordmark rises, tagline opens, sheen | shimmer 2.10 |

The logo is resolved by about 3.0s; the last second is a still hold, so the clip can be trimmed to 3s in the edit.

## Variants
- Theme: `project.js → intro.theme` (`dark` shows the deck grid, `light` is flat #F2F2F2), or for one render `--var theme=light --out projects/lifetechfacts-intro-generate/renders/light`.
- Tagline: `project.js → intro.tagline` (`·` separates the items; default `LF.TAGLINE`).
- Vertical: `npm run assemble -- --project lifetechfacts-intro-generate --canvas vertical --res 2k --out projects/lifetechfacts-intro-generate/renders/vertical`
- 2-second cut (tutorials): `npm run assemble -- --project lifetechfacts-intro-generate --from 1.4 --to 3.4 --out projects/lifetechfacts-intro-generate/renders/2s`
- Transparent: `npm run render -- --project lifetechfacts-intro-generate --slide 01 --format mov,webm --transparent --timed`
- Sound: edit `assets/sting.json` (cue list), then `sh projects/lifetechfacts-intro-generate/assets/build-sting.sh`; the sounds are defined in `assets/logos/lifetechfacts/build-sting.js`.

## Design notes
One of ten intro concepts (A boot, B orbit, C beats, D commit, E loaded, F silicon, G bits, H blueprint, I eclipse, J generate), all kept so the intro can change per video; the faithful rebuild of the old template intro is `projects/lifetechfacts-intro`.
The mark, wordmark, themes, shock ring and the shared ending (`LF.resolve`) come from `assets/logos/lifetechfacts/lf-logo.js` (window.LF).
