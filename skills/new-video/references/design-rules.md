# Design rules

## Grid (from `core/grid.js`; never hardcode these)
| | vertical 1080×1920 | horizontal 1920×1080 |
|---|---|---|
| eyebrow | 60 / 132, 34px | 60 / 84, 30px |
| headline | 60 / 206, 960 wide, 82px (sm 70, xs 62) | 60 / 134, 640 wide, 72px |
| content box | 60 / 455, 960 × 1200 (× 940 with captions) | 760 / 84, 1100 × 920 (× 800 with captions) |
| caption band | 1450–1600, centred | 960–1040, centred (footnote lifts to 870) |
| footnote | 60 / 1740, 960 wide | 60 / 924, 640 wide |
| safe area | 58–1022 × 96–1858 | 58–1862 × 56–1024 |

Templates position inside the content box; on horizontal the headline column sits left and the content right, and body type
scales by `--ts` (0.9). Never hardcode 960: use `GRID.cw` / `var(--cw)`.

## Palette
Background #0A0E18, panel #111A2B, border #23304A/#2E3D5C, text #F2F6FF / #A8B6D1 / #6E7F9E.
Accents: teal #2DD4BF (t), violet #8B5CF6 (v), green #34D399 (g), rose #FB7185 (r), amber #F59E0B (a), blue #38BDF8 (b), orange #FF9900 (o).
One accent per section; the eyebrow, the section's badges and the intro slide share it.

## Type
Inter Display 800 for headlines, Inter for body, JetBrains Mono for ids/prices/badges, Open Sans inside console mocks.
Badges and rowbars in sentence case ("Still billing", not "still billing"). Numbers in JetBrains Mono.

## Console mock (Cloudscape)
Dark nav #0F1B2A with the AWS mark, breadcrumb strip, side nav (active #0972D3), container header with ≤3 buttons
(more will clip the orange primary), Cloudscape table with checkbox column, status pills (ok green, prog amber, stop/neg grey).
Interactions go through `clickFlow`: pointer → dropdown button press → menu → item → confirmation modal → confirm → status change.

## Retention
- **Never give the list away in its intro slide.** "Three things…" slides tease: numbered rows with `?` tiles and redacted
  name bars plus a one-line hook per row ("The one you overlook"); the real name and icon appear on that section's own intro
  slide. The same goes for punchlines, prices and the final answer: show the setup, hold the reveal for the line that says it.
- The first two seconds of every slide should raise a question the voiceover is about to answer.

## Motion (beat-driven)
Every visual element enters on the word that names it. The cue sheet's `Beats` column maps element names to spoken words; the
timeline resolves them to seconds (`ctx.beats`), and templates start each element `lead` (0.10 s) before its word — a graphic
that lands slightly early reads as "on the word", one that lands late reads as broken. Fractions of the motion window are only
the fallback for rows without beats.

- **Numbers**: lead 0.10 s (word) / 0.30 s (`^` phrase = container); entrance 0.40 s; focal pop 0.30 s with ~4% overshoot;
  sibling stagger 0.08 s (spread capped at 0.48 s); bars 0.60 s; strokes 0.50 s; counters ≤ 0.80 s (never longer than the word);
  dim 0.30 s to 50%; exits stay engine-owned (0.4 s push/fade). Everything settles ≥ 0.20 s before the exit starts.
- **Container on the phrase, payload on the word**: the card/quote/panel enters at the clause start (`^"words"`), the number,
  bar, tag, strike or underline fires on the exact word. One focal pop per beat.
- **Easings by role**: rises/slides `eo4` (`up`, `sx`); pops `bk` (`pp`); hero `spring`; headline wipe `expo` (`h1In`); dims `eo`.
- **Headline**: `heading()` splits the h1 at `<br>` into masked lines that wipe up (`h1In`, 0.10–0.90 s in beat mode); the
  `<em>` phrase takes the accent and its underline draws on the `em` beat (or with the headline when none is given).
- **De-emphasise, don't remove**: when a later beat fires, earlier siblings of a group dim to 50% (`dim`); nothing leaves
  the composition before the slide's exit.
- **Holds** (after the last beat + 1 s): only life, nothing new — `bg.js` drift, `idle()` breathing on hero tiles, a light
  `sweep` across the headline every 6 s, and a `ring` pulse (2 s period) around the hero beat's element (`!` in the cue sheet).
- **Hero moment**: one per slide — the strike, the number, the last card, the confirm click. Mark it `!`; give it the pop.
- **Depth**: panels carry the shared shadow + top highlight; hero tiles glow; keep `filter: blur()` out of frames (slow captures).
- **Captions**: 3–5 words per group, the spoken word in the accent; the band is reserved — no slide content below `GRID.ch`.

## Readability floors
- Dwell: an element stays settled for `max(0.9 s, chars / 15 + 0.4 s)` before the exit (`npm run timeline --check` warns below 0.9 s).
- Headline settled ≥ 1.2 s; badges ≥ 0.8 s; beats on one chain (`r1 → r2`) ≥ 0.35 s apart; console click flows ≥ 4 s of screen time.
- A beat that cannot settle before the exit is clamped and flagged: move it to the phrase start (`^`), shorten the text, or move
  the element to the next row — never speed the entrance.

## Motion-graphics vocabulary (`core/anim.js`, all pure in `p`)
| Device | Helper | Use it when |
|---|---|---|
| highlight sweep | `sweep(id, p)` (CSS `--swx` band over `.h1 em`) | the narration returns to the headline during a hold |
| underline draw | `h1In` `--ul` / `em` beat | the key phrase is spoken |
| counter | `tick(id, p, from, to, fmt)` | a number is said (≤ 0.8 s, lock ≥ 0.2 s before the next beat) |
| bar grow | `fill(id, p)` · `bars(prefix, n, p, 0, 1)` | proportions, "X of Y", card rows |
| line draw → pop | `drawPop(lineId, targetId, p)` | a relationship between two things is stated |
| masked wipe | `wipe(id, p, dir)` | reveal a block, chart or quote in reading order |
| pop with overshoot | `pp(id, p, from)` | the single focal item of a beat |
| pulse ring | `ring(id, sec, {period, color})` | keep attention on the element still being discussed (holds) |
| de-emphasis | `dim(id, f, to)` | the narration moved on to the next sibling |
| rise / slide | `up(id, p, dy)` · `sx(id, p, dx)` | containers and rows (default entrance) |
