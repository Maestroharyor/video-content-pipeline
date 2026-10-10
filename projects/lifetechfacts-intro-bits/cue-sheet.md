# LifeTech Facts intro: concept G, "Bits"
## Cue sheet

No voiceover: one custom slide, 4.0s, choreographed in seconds (`slides/01-intro.js`); a memory test sweeps the frame, then the mark appears as a bitmap that doubles its resolution three times and snaps to vector.
`timeline.json` is hand-written (one window, cut). Stage 1920x1080 (horizontal), rendered at `4k`, 60fps, crf 10. Final: renders/final/lifetechfacts-intro-bits.mp4 (+ AAC sting).

## Beat map (seconds)
| Time | What happens | Sound |
|------|--------------|-------|
| 0.00-1.15 | sweep crosses a grid of cells, `MEM CHECK 0x…` counts up to `OK` | swell, ten ticks |
| 0.95-1.92 | mark as a bitmap: 6×6, 12×12, 24×24, 48×48 (readout `RES n×n`) | four rising blips 0.95 / 1.20 / 1.45 / 1.68 |
| 1.92 | snap to the vector mark with a pulse and the shock ring (readout `RES VECTOR`) | thump + pop 1.92 |
| 1.95-3.15 | wordmark rises, tagline opens, sheen | shimmer 2.00 |

The logo is resolved by about 3.0s; the last second is a still hold, so the clip can be trimmed to 3s in the edit.

## Variants
- Theme: `project.js → intro.theme` (`dark` shows the deck grid, `light` is flat #F2F2F2), or for one render `--var theme=light --out projects/lifetechfacts-intro-bits/renders/light`.
- Tagline: `project.js → intro.tagline` (`·` separates the items; default `LF.TAGLINE`).
- Vertical: `npm run assemble -- --project lifetechfacts-intro-bits --canvas vertical --res 2k --out projects/lifetechfacts-intro-bits/renders/vertical`
- 2-second cut (tutorials): `npm run assemble -- --project lifetechfacts-intro-bits --from 1.4 --to 3.4 --out projects/lifetechfacts-intro-bits/renders/2s`
- Transparent: `npm run render -- --project lifetechfacts-intro-bits --slide 01 --format mov,webm --transparent --timed`
- Sound: edit `assets/sting.json` (cue list), then `sh projects/lifetechfacts-intro-bits/assets/build-sting.sh`; the sounds are defined in `assets/logos/lifetechfacts/build-sting.js`.

## Design notes
One of ten intro concepts (A boot, B orbit, C beats, D commit, E loaded, F silicon, G bits, H blueprint, I eclipse, J generate), all kept so the intro can change per video; the faithful rebuild of the old template intro is `projects/lifetechfacts-intro`.
The mark, wordmark, themes, shock ring and the shared ending (`LF.resolve`) come from `assets/logos/lifetechfacts/lf-logo.js` (window.LF).
