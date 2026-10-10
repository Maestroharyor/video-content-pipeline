# LifeTech Facts intro: concept B, "Orbit"
## Cue sheet

No voiceover: one custom slide, 4.0s, choreographed in seconds (`slides/01-intro.js`); a service graph with code / chip / cloud / shield nodes swirls onto the mark's ring and becomes its two balls.
`timeline.json` is hand-written (one window, cut). Stage 1920x1080 (horizontal), rendered at `4k`, 60fps, crf 10. Final: renders/final/lifetechfacts-intro-orbit.mp4 (+ AAC sting).

## Beat map (seconds)
| Time | What happens | Sound |
|------|--------------|-------|
| 0.00-0.85 | 14 nodes pop in and drift, links draw, packets travel along them | soft pops |
| 0.85-1.70 | gravity swirls every node anticlockwise onto the ring; links and glyphs fade | air swell, whoosh from 1.33 |
| 1.60-2.55 | disc bursts out, merged nodes become the balls, balls lap the ring with arcs trailing | thump 1.62, pops 1.64 / 1.70 |
| 2.10-3.05 | LT/F wipes in, wordmark rises, tagline, sheen | shimmer 2.15 |
| 2.30-4.00 | dotted satellite ring turns behind the mark; still hold | fade 3.5-4.0 |

The logo is resolved by about 3.0s; the last second is a still hold, so the clip can be trimmed to 3s in the edit.

## Variants
- Theme: `project.js → intro.theme` (`dark` shows the deck grid, `light` is flat #F2F2F2), or for one render `--var theme=light --out projects/lifetechfacts-intro-orbit/renders/light`.
- Tagline: `project.js → intro.tagline` (`·` separates the items).
- Vertical: `npm run assemble -- --project lifetechfacts-intro-orbit --canvas vertical --res 2k --out projects/lifetechfacts-intro-orbit/renders/vertical`
- 2-second cut (tutorials): `npm run assemble -- --project lifetechfacts-intro-orbit --from 1.3 --to 3.3 --out projects/lifetechfacts-intro-orbit/renders/2s`
- Transparent: `npm run render -- --project lifetechfacts-intro-orbit --slide 01 --format mov,webm --transparent --timed`
- Sound: `sh projects/lifetechfacts-intro-orbit/assets/build-sting.sh` rebuilds `lf-intro-sting.wav`; its cue times follow the beat map.

## Design notes
One of ten intro concepts (A boot, B orbit, C beats, D commit, E loaded, F silicon, G bits, H blueprint, I eclipse, J generate), all kept so the intro can change per video; the faithful rebuild of the old template intro is `projects/lifetechfacts-intro`.
The mark, wordmark, themes and draw-on helpers come from `assets/logos/lifetechfacts/lf-logo.js` (window.LF).
