# LifeTech Facts intro: concept A, "Boot"
## Cue sheet

No voiceover: one custom slide, 4.0s, choreographed in seconds (`slides/01-intro.js`); a terminal types the start command, three checks pass, the line wipes into its caret, the caret becomes the orbit ball.
`timeline.json` is hand-written (one window, cut). Stage 1920x1080 (horizontal), rendered at `4k`, 60fps, crf 10. Final: renders/final/lifetechfacts-intro-boot.mp4 (+ AAC sting).

## Beat map (seconds)
| Time | What happens | Sound |
|------|--------------|-------|
| 0.00-0.85 | `~/lifetechfacts $ ./start --tech --dev --ai` types itself | key ticks |
| 0.92-1.25 | three `✓` checks pop in | three rising blips |
| 1.32-1.95 | line wipes into the caret; caret rounds into a dot and flies to the ring | whoosh from 1.60 |
| 1.90-2.80 | disc bursts out, both balls lap the ring anticlockwise with arcs trailing, shock ring + ticks | thump 1.95, pop 1.98 |
| 2.30-3.05 | LT/F wipes in, wordmark rises, sheen | shimmer 2.30 |
| 2.75-4.00 | tagline opens; caret blinks after it; still hold | fade 3.5-4.0 |

The logo is resolved by about 3.0s; the last second is a still hold, so the clip can be trimmed to 3s in the edit.

## Variants
- Theme: `project.js → intro.theme` (`dark` shows the deck grid, `light` is flat #F2F2F2), or for one render `--var theme=light --out projects/lifetechfacts-intro-boot/renders/light`.
- Tagline: `project.js → intro.tagline` (`·` separates the items).
- Vertical: `npm run assemble -- --project lifetechfacts-intro-boot --canvas vertical --res 2k --out projects/lifetechfacts-intro-boot/renders/vertical`
- 2-second cut (tutorials): `npm run assemble -- --project lifetechfacts-intro-boot --from 1.6 --to 3.6 --out projects/lifetechfacts-intro-boot/renders/2s`
- Transparent: `npm run render -- --project lifetechfacts-intro-boot --slide 01 --format mov,webm --transparent --timed`
- Sound: `sh projects/lifetechfacts-intro-boot/assets/build-sting.sh` rebuilds `lf-intro-sting.wav`; its cue times follow the beat map.

## Design notes
One of ten intro concepts (A boot, B orbit, C beats, D commit, E loaded, F silicon, G bits, H blueprint, I eclipse, J generate), all kept so the intro can change per video; the faithful rebuild of the old template intro is `projects/lifetechfacts-intro`.
The mark, wordmark, themes and draw-on helpers come from `assets/logos/lifetechfacts/lf-logo.js` (window.LF).
