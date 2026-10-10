# LifeTech Facts intro: concept D, "Commit"
## Cue sheet

No voiceover: one custom slide, 4.0s, choreographed in seconds (`slides/01-intro.js`); a git graph draws left to right, two branches fork and merge, a version tag pops; the branch heads become the orbit balls and the merge commit bursts into the disc.
`timeline.json` is hand-written (one window, cut). Stage 1920x1080 (horizontal), rendered at `4k`, 60fps, crf 10. Final: renders/final/lifetechfacts-intro-commit.mp4 (+ AAC sting).

## Beat map (seconds)
| Time | What happens | Sound |
|------|--------------|-------|
| 0.00-1.10 | main line draws to the centre; commits `a1f3c9e` `7be02d4` `c49e1a8` pop as it passes; `feat/dev` and `feat/ai` fork and merge back | ticks on each commit |
| 1.08-1.45 | merge commit lands with a ring, `v1.0` tag pops, `merge → main` | two blips (660, 990 Hz) |
| 1.42-1.80 | lines retract into the merge commit; branch heads fly onto the ring | whoosh from 1.40 |
| 1.70-2.60 | disc bursts out, balls lap the ring with arcs trailing, shock ring + ticks | thump 1.70, pop 1.73 |
| 2.10-3.30 | LT/F wipes in, wordmark rises, tagline opens, sheen | shimmer 2.10 |

The logo is resolved by about 3.0s; the last second is a still hold, so the clip can be trimmed to 3s in the edit.

## Variants
- Theme: `project.js → intro.theme` (`dark` shows the deck grid, `light` is flat #F2F2F2), or for one render `--var theme=light --out projects/lifetechfacts-intro-commit/renders/light`.
- Tagline: `project.js → intro.tagline` (`·` separates the items; default `LF.TAGLINE`).
- Vertical: `npm run assemble -- --project lifetechfacts-intro-commit --canvas vertical --res 2k --out projects/lifetechfacts-intro-commit/renders/vertical`
- 2-second cut (tutorials): `npm run assemble -- --project lifetechfacts-intro-commit --from 1.4 --to 3.4 --out projects/lifetechfacts-intro-commit/renders/2s`
- Transparent: `npm run render -- --project lifetechfacts-intro-commit --slide 01 --format mov,webm --transparent --timed`
- Sound: edit `assets/sting.json` (cue list), then `sh projects/lifetechfacts-intro-commit/assets/build-sting.sh`; the sounds are defined in `assets/logos/lifetechfacts/build-sting.js`.

## Design notes
One of ten intro concepts (A boot, B orbit, C beats, D commit, E loaded, F silicon, G bits, H blueprint, I eclipse, J generate), all kept so the intro can change per video; the faithful rebuild of the old template intro is `projects/lifetechfacts-intro`.
The mark, wordmark, themes, shock ring and the shared ending (`LF.resolve`) come from `assets/logos/lifetechfacts/lf-logo.js` (window.LF).
