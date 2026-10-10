# LifeTech Facts intro (rebuild of the original)
## Cue sheet

No voiceover: one custom slide, 5.6s, choreographed in seconds (`slides/01-intro.js`). `timeline.json` is hand-written (one window, cut, no transition).
Stage 1920x1080 (horizontal), rendered at `4k`, 60fps, crf 10. Final: renders/final/lifetechfacts-intro.mp4 (+ AAC sting).

| # | File | Window | Template | Visual | Audio |
|---|------|--------|----------|--------|-------|
| 01 | 01-intro.js | 0.00-5.60 | custom | HUD rings → bar square → circle → mark fills, orbit draws on, wordmark rises | assets/lf-intro-sting.wav |

## Beat map (seconds)
| Time | What happens | Sound |
|------|--------------|-------|
| 0.0-1.6 | two arc pairs sweep round, dotted core, tick ring, crosshair, small square | air rises |
| 1.2-2.3 | bars rise in a tilted square, thicken to a solid block (1.78), tilt springs flat, corners round to a circle | soft pop 1.76 |
| 2.3-3.1 | disc hollows to a ring, C arc spins, horizon lines flick, shock ring | whoosh from 2.62 |
| 2.7-4.0 | blue disc springs out (peak 2.95), balls pop 3.00 / 3.08, orbit draws on while rotating home, LT/F wipes in, facets, sheen | sub thump 2.95, pops |
| 3.7-4.6 | wordmark rises letter by letter, particles drift off both flanks | shimmer 3.78 |
| 4.6-5.6 | still lockup (mark breathes 1%) | fade 5.1-5.6 |

The logo is fully resolved at 4.6s, so the clip can be trimmed anywhere from 4.6s to 5.6s in the edit.

## Variants
- Theme: `project.js → intro.theme` (`light` = the original look, `dark`), or for one render `--var theme=dark --out projects/lifetechfacts-intro/renders/dark`.
- Vertical: `npm run assemble -- --project lifetechfacts-intro --canvas vertical --res 2k --out projects/lifetechfacts-intro/renders/vertical`
- Transparent (no background, for laying over footage): `npm run render -- --project lifetechfacts-intro --slide 01 --format mov,webm --transparent --timed`
- Sound: `sh projects/lifetechfacts-intro/assets/build-sting.sh` rebuilds the sting; cue times there follow the beat map above.

## Design notes
Rebuild of the 8s 720p template intro ("LTF White.mp4") at 5.6s. Same beats, same order; the glitch on the wordmark became a masked letter rise.
The three 4s redesign concepts are `projects/lifetechfacts-intro-boot`, `-orbit` and `-beats`; `renders/compare/` holds them back to back.
The mark, wordmark and draw-on helpers come from `assets/logos/lifetechfacts/lf-logo.js` (window.LF); see assets/SOURCES.md.
