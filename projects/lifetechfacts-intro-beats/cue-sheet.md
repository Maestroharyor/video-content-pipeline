# LifeTech Facts intro: concept C, "Three beats"
## Cue sheet

No voiceover: one custom slide, 4.0s, choreographed in seconds (`slides/01-intro.js`); LIFE / TECH / FACTS hit full-frame 0.42s apart, the blue iris contracts into the mark's disc.
`timeline.json` is hand-written (one window, cut). Stage 1920x1080 (horizontal), rendered at `4k`, 60fps, crf 10. Final: renders/final/lifetechfacts-intro-beats.mp4 (+ AAC sting).

## Beat map (seconds)
| Time | What happens | Sound |
|------|--------------|-------|
| 0.00 | LIFE on the theme background | hit 1 |
| 0.42 | panel wipe, TECH | hit 2 |
| 0.84 | brand-blue iris opens, FACTS | hit 3 |
| 1.26-1.74 | iris contracts to the lockup disc, FACTS shrinks away, beat counter fades | whoosh from 1.28, thump 1.70 |
| 1.55-2.55 | wordmark rises, balls lap the ring, LT/F wipes in, shock ring + ticks | pops 1.76 / 1.82, shimmer 1.90 |
| 2.45-4.00 | tagline, sheen, still hold | fade 3.5-4.0 |

The logo is resolved by about 3.0s; the last second is a still hold, so the clip can be trimmed to 3s in the edit.

## Variants
- Theme: `project.js → intro.theme` (`dark` shows the deck grid, `light` is flat #F2F2F2), or for one render `--var theme=light --out projects/lifetechfacts-intro-beats/renders/light`.
- Tagline: `project.js → intro.tagline` (`·` separates the items).
- Vertical: `npm run assemble -- --project lifetechfacts-intro-beats --canvas vertical --res 2k --out projects/lifetechfacts-intro-beats/renders/vertical`
- 2-second cut (tutorials): `npm run assemble -- --project lifetechfacts-intro-beats --from 1.26 --to 3.26 --out projects/lifetechfacts-intro-beats/renders/2s`
- Transparent: `npm run render -- --project lifetechfacts-intro-beats --slide 01 --format mov,webm --transparent --timed`
- Sound: `sh projects/lifetechfacts-intro-beats/assets/build-sting.sh` rebuilds `lf-intro-sting.wav`; its cue times follow the beat map.

## Design notes
One of ten intro concepts (A boot, B orbit, C beats, D commit, E loaded, F silicon, G bits, H blueprint, I eclipse, J generate), all kept so the intro can change per video; the faithful rebuild of the old template intro is `projects/lifetechfacts-intro`.
The mark, wordmark, themes and draw-on helpers come from `assets/logos/lifetechfacts/lf-logo.js` (window.LF).
