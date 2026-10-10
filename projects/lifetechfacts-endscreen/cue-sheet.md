# LifeTech Facts end-screen plate
## Cue sheet

No voiceover: one custom slide, 20.0s (YouTube's maximum end-screen length), choreographed in seconds (`slides/01-endscreen.js`). It is a branded background for
YouTube's end screen: it frames the spots where the clickable elements go and leaves them empty; the elements themselves are added in YouTube Studio.
`timeline.json` is hand-written (one window, cut). Stage 1920x1080, rendered at `4k`, 60fps, crf 10. Ten styles (one per intro concept) x two layouts:
renders/<style>-<layout>/final/lifetechfacts-endscreen.mp4, e.g. renders/commit-one/…, renders/bits-two/….

## Styles (the shared parts never move, so the YouTube elements go in the same spots in every style)
| Style | Motif during the hold |
|-------|-----------------------|
| boot | a terminal line types `~/lifetechfacts $ ./watch --next`, caret blinks |
| orbit | dotted satellite ring round the mark, a small drifting network |
| beats | a panel wipes through each slot on the beat at the start, three beat bars keep counting |
| commit | git-graph lines with commits run to the slot and the subscribe circle (layout two: a trunk drops between the slots and merges into both); a pulse travels them |
| loaded | a load bar fills along the top of each slot, a shimmer crosses it, a two-arc spinner turns round the subscribe circle |
| silicon | three parallel circuit traces with 45° jogs and vias to the same targets, pulses running along them |
| bits | a sweep lights a grid of cells, then cells twinkle; readout `RES 3840×2160 · 60 FPS` |
| blueprint | centre lines through the mark, dashed construction ring, a `16 : 9` dimension on the slot, title block |
| eclipse | the mark is revealed as a crescent; a small body circles the mark and another the subscribe circle |
| generate | tokens and particles burst from the mark and keep drifting round it; a `✦ Watch the next one` prompt pill |

## Beat map (seconds)
| Time | What happens | Sound |
|------|--------------|-------|
| 0.05-0.80 | slot frames stroke on, corner brackets settle, faint play mark | soft swell 0.00-0.50 |
| 0.15-1.75 | lockup resolves (disc burst, orbit lap, LT/F, wordmark, tagline, sheen) via `LF.resolve` | pop 0.18, shimmer 0.60 (quiet: peak about -18 dB) |
| 0.50-1.25 | subscribe circle pops, labels open | |
| 0.45-1.80 | the style's own motif builds (see Styles) | |
| 1.20-20.0 | ambient hold: a highlight laps each slot every 5s, subscribe rings breathe and turn, chevrons run toward the slot (layout `one`, styles without connectors), a sheen crosses the disc every 6s, background glows drift, plus the style's motif | silence (talk over it) |

The hold can be trimmed anywhere after 1.8s.

## Where the YouTube Studio elements go (fractions of the frame)
| Layout | Element | Left | Top | Width |
|--------|---------|------|-----|-------|
| one | Video | 56.8% | 21.5% | 33.3% |
| one | Subscribe (centre) | 62.6% | 70.7% | any: the ring is 10.8% of the frame wide and takes whatever size YouTube gives the button |
| two | Video 1 | 18.3% | 27.0% | 29.2% |
| two | Video 2 | 52.5% | 27.0% | 29.2% |
| two | Subscribe (centre) | 33.3% | 71.3% | as above |

Everything stays above the bottom 12% of the frame (player controls). Video elements can be resized in Studio: drag them to fill the brackets.
YouTube rules: the video must be at least 25s long, the end screen covers the last 5 to 20s, up to four elements, at least one must be a video or playlist.

## How to use it (from the research)
Put the plate under the last 10 to 20s and **keep talking over it**: point at the next video and say why it is worth the click. Do not say goodbye first
("that's everything", "thanks for watching"): viewers leave the moment a video signals that it is over. Shorts have no end screens.

## Variants
- Layout and style: `project.js → endscreen.layout` / `.style`, or for one render `--var layout=two --var style=commit --out projects/lifetechfacts-endscreen/renders/commit-two`.
- Text: the slide's `data` (`watch`, `more`, `subscribe`, `subNote`, and each style's own strings), tagline from `LF.TAGLINE`. Light theme: `--var theme=light` (not rendered; the channel uses dark).
- Shorter: `npm run assemble -- --project lifetechfacts-endscreen --to 12 --out …` or trim in the editor.
- Sound: `assets/sting.json` → `sh projects/lifetechfacts-endscreen/assets/build-sting.sh`; `--no-audio` for a silent plate.
