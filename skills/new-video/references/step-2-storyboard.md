# Step 2: Storyboard (the approval gate)

Scaffold first so the cue sheet has a home (skip if Step 1 already created it for the audio):

```bash
npm run new -- --slug <slug> --title "<title>" --canvas vertical|horizontal --layout top|left [--captions on|off] [--dur 5 --hold 1 --fps 30 --lead 0.10]
```

Then fill `projects/<slug>/cue-sheet.md`:

```markdown
# <Title>
## Cue sheet

Voiceover runtime m:ss (transcribed | (m:ss) markers | estimated at 2.6 words/s). N slides on the timeline.
Motion is word-timed: each row's Beats column maps elements to the spoken words that trigger them (lead 0.10s, ^ phrase 0.30s,
! hero); rows without beats use the 5s fraction schedule. Push transition 0.4s; captions on/off.
Render spec: <resolution> (vertical 2k = 1440x2560 | 1080p; horizontal 4k = 3840x2160 | 1440p | 1080p) @ <fps>fps (60 default).
Final: renders/final/<slug>.mp4 (h264 crf 16, bt709, <= 2 GB budget, + AAC).
Outro carries the audio bed: pops 1.50/2.10/2.70/3.30s, shimmer 4.30-5.02s (beats are ignored on audio-bed slides).

| # | File | VO window | Template | Eyebrow | Headline | Visual / data | Accent | Interaction | Beats | Line it covers |
|---|------|-----------|----------|---------|----------|---------------|--------|-------------|-------|----------------|
| 01 | 01-title-… | 0:00-0:06 | title | … | … | hero logo + counter + chart | orange | – | hero:"server"! counter:"forty" sub:^"and then" | "you launched a server…" |
| 04 | 04-everything | 0:27-0:40.9 | cards | … | … | four cards with time bars, tag Failed | rose | cards land as named, tag pops | c*:"Two jobs","software","channel","SaaS"! c4t:"failed" em:"something" | "Two jobs, my software agency…" |

## Beat map
(paste the summary line of `npm run timeline -- --project <slug> --dry` once it reports 0 errors)

## Notes for the edit
(reads that are tight for their visual, rows you merged or split, anything estimated)

## Design notes
(accent mapping, UI mocked, logos used)
```

## Beats column grammar

```
cell   := item (space item)*             empty or – = no beats (the row falls back to the 5s fraction schedule)
item   := name:anchor | name*:anchor,anchor,…   name = the template's element beat name (see templates.md); name* fills the chain name1, name2, …
anchor := [^]"1–4 spoken words"[#n][±seconds][!]  |  @seconds[!]
^      phrase/container anchor: fires 0.30 s before the word (use for cards, quotes, panels); plain anchors lead by 0.10 s
#n     the n-th occurrence of the words inside the slide's window (the search runs forward from the previous beat of the chain)
±s     shift after resolving ("failed"+0.2);  @s = slide-relative seconds with no lead (audio-bed pops, silent moments)
!      the hero beat, at most one per row: it pulses during the hold
```
Words are matched like the line anchor (lower-case, punctuation stripped; "Hands-on" = "handson"), only inside the row's window.
Never put `|` in a cell. Phrases of 2–4 words beat single common words ("the", "and").

## Derive the beat map (before asking for approval)

1. `npm run timeline -- --project <slug> --words [--slide 04]` prints, per row, its window, when the exit starts and every word
   as `+local abs word` (`¶` marks clause starts, `··` gaps > 0.35 s). It needs only the cue sheet and `vo.json` — no slides yet.
   Without `vo.json` (script only) beats can only be `@seconds`; say so in Notes.
2. Walk the row's visual elements **in speech order** and give each the word that names it: containers on the clause start
   (`^`), payloads (number, bar, tag, strike, underline) on the exact word. One beat per element; never two elements on the
   same word unless they are container + payload.
3. Mark the hero (`!`): the word the line is about — the strike, the number, the last card, the confirm click.
4. Check dwell: an element enters at beat + 0.4 s and must stay `max(0.9 s, chars/15 + 0.4 s)` before the exit (window end − 0.4 s).
   If it cannot, anchor on the phrase start, shorten the text, or move the element to the next row.
5. Lines that name nothing visual ("But here's the thing") get no beats (fraction fallback) or only a container beat.
6. `npm run timeline -- --project <slug> --dry` must report **0 errors** (unresolved words, unknown names, `?` placeholders,
   entrances after the exit). Fix, re-run, then paste its summary under `## Beat map`.

Rules:
- One row per idea; the `File` column is the slide slug, `VO window` is `m:ss-m:ss` (decimals allowed), `Line it covers`
  quotes the first words of the line — the timeline builder snaps the slide start to that word in `vo.json`.
- Headline ≤ 2 lines at the canvas's h1 size (vertical 82px on 960px ≈ 22 chars/line; horizontal 72px on 640px ≈ 14).
- Prefer a template for every row; mark `custom` only with a one-line reason.
- Note every interaction explicitly ("cursor clicks Instance state → Stop instance → confirm"); vague rows become vague slides.
- Windows: console/click-flow slides need ≥ 4s; anything under 2s merges with a neighbour; the outro keeps 5s of motion + tail.
- The headline always enters at the start of the row even when its words come last; only the `em` underline waits for its word.

## Plan the alive kit in the same table (unless the user turned it off; read `alive-kit.md`)

- **Cast**: name the characters in *Design notes* (one per role, e.g. developer, cloud engineer, DevOps engineer, plus
  a small team for "team size" lines) with their seeds; they enter on the line that names the role and come back
  wherever that role acts. Write their bubbles (3-7 words) in *Visual / data*.
- **Stickers**: about one every 30-40 s, on an emotion or punchline word, never in the last 1.5 s of a row (move it to the
  next row's first beat). List them in *Visual / data* ("🔥 right of the headline"), beat them `mj1..` in *Beats*.
- **Moments**: a confetti `burst` on the success the script builds to, a `shake` on the failure, a pattern interrupt
  (pager, stamp, a character reacting) about once a minute.
- **Cut per idea, not per sentence**: a scene lasts 15-40 s and something small changes every 3-7 s (a reveal, a
  highlight, a camera move, a sticker). Reuse one canvas (map, workbench, pipeline) across neighbouring rows
  (`xf: 'cut'` between them) instead of cutting to a new layout mid-explanation.

**Stop here.** Show the table (with the Beats column) to the user and ask for approval or edits (AskUserQuestion or a plain
question). Only after approval, and a clean `--dry`, continue to Step 3.
