---
name: new-video
description: Turn a voiceover recording, a script or a timestamped transcript into a finished animated video (HTML/CSS slides rendered by Puppeteer + FFmpeg, timed to the voiceover, with optional burned-in captions) in this repo. Use when someone says "/new-video", pastes a script or "(0:00)" transcript, hands over an audio file, or asks for slides, a deck or video animations for a script. Asks the aspect ratio and a few settings, writes a storyboard for approval, then builds, reviews and assembles projects/<slug>/.
---

# /new-video

Audio or script in, finished video out. The engine lives in this repository (`core/`, `renderer/`, `assets/`); every video is a
folder under `projects/<slug>/` with its own slides, cue sheet, timeline and renders. Nothing in this skill works outside the repo,
so locate it first: the checkout that contains this skill (`git rev-parse --show-toplevel` when invoked inside it, otherwise
`cd "$(dirname "$(readlink -f ~/.claude/skills/new-video)")/../.."`), and `cd` there before running any command.
If `npm run doctor` reports something missing, run `npm run setup` (installs ffmpeg / whisper-cli, links the skill).

**Read [references/house-rules.md](references/house-rules.md) before the first question.** It holds the user's standing decisions
(always ask the outro, 5-6 s outros, title position, unique theme, safe zones, face only on lens contact, preview first, LifeTech
Facts handles and links, never delete a render without explicit approval) and overrides any default in the step references.

## Invocation dispatch (must happen first)

Parse the whole invocation before doing anything else. Flags pre-answer the questions below; unflagged settings are asked.

```
/new-video                                   (script pasted in the same message, or asked for next)
/new-video --audio ~/Downloads/take3.m4a --format vertical
/new-video --script path/to/transcript.txt --format horizontal --title "…" --captions off
/new-video --audio ~/Downloads/take3.m4a --format vertical --social youtube,instagram,x
/new-video --project my-video                (resume a project created by `npm run video`: see "Resuming" below)
```

| Option | Values | Default |
|---|---|---|
| `--project` | slug of an existing `projects/<slug>/` | new project |
| `--format` | `vertical` (1080×1920 stage, Shorts/Reels/TikTok) · `horizontal` (1920×1080 stage, YouTube) | **always asked** unless flagged |
| `--res` | horizontal: `4k` (3840×2160) · `1440p` · `1080p` — vertical: `2k` (1440×2560) · `1080p` (1080×1920) | **asked**; `4k` horizontal, `2k` vertical |
| `--audio` | path to the voiceover recording (wav/m4a/mp3/flac/ogg) | asked ("do you have the recording?") |
| `--script` | path to a text file (`(m:ss)` markers, SRT/VTT, whisper JSON or prose) | script pasted in chat |
| `--captions` | `on` · `off` — burned-in word-highlight captions (needs the recording) | `on` for vertical, `off` for horizontal |
| `--layout` | horizontal only: `top` (heading centred across the top, content in a wide column under it) · `left` (heading column left, content right) | **always asked**; `top` |
| `--duration` | fallback motion seconds for rows without beats (each slide holds its end pose until its VO window ends) | `5` |
| `--lead` | seconds a graphic leads the word that triggers it (`^` phrase anchors lead by 0.30) | `0.10` |
| `--transition` | `push` · `fade` · `cut` | `push` (0.4s) |
| `--fps` | `60` · `30` frames per second (30 halves the render time; Instagram plays 30 anyway) | **asked**; `60` |
| `--max-size` | size budget for the final MP4 (`2G`, `800M`): caps the bitrate, quality stays crf-targeted | `2G` |
| `--title` / `--slug` | deck title / folder name under `projects/` | inferred from the script |
| `--no-outro` / `--no-audio` | skip the outro slide / its audio bed | outro on, bed on |
| `--intro` | `off`, a style name (`beats` `boot` `bits` `commit` `loaded` `silicon` `blueprint` `eclipse` `orbit` `generate`) or a path to an mp4 — the 4s channel sting, spliced in at a slide boundary **after** the hook, never in front of it | asked; `off` for vertical |
| `--intro-at` | seconds — the slide boundary the intro cuts into (`0` prepends). Decided with the storyboard, not up front | first boundary after the hook |
| `--end-screen` | `off` · `on` (the 20s plate matching `--intro`) · a path — appended after the last slide so YouTube's end-screen cards land in its empty slots | follows `--intro` |
| `--accent` | `teal` `violet` `green` `rose` `amber` `blue` `orange` | asked |
| `--ui` | `aws-console` `phone` `dashboard` `none` | asked |
| `--social` | `off`, or a comma list of networks for `social/<slug>.md` | asked; default the eight |
| `--social-cuts` | `off` · `on`: vertical best-of + parts clips of the finished master (Step 6) | asked; `off` |
| `--alive` | `off`, or a comma list of `characters,emoji,sfx,motion` (the alive kit, references/alive-kit.md) | asked; all four on |

## Questions (ask with AskUserQuestion, one call, only for what flags did not answer)

1. **Aspect ratio** — vertical or horizontal. Always ask unless `--format` was given.
2. **Resolution & frame rate** — options depend on the aspect ratio (first = default). Horizontal: 4K 3840×2160 (best for
   YouTube: a 4K upload gets the high-bitrate re-encode) · 1440p · 1080p. Vertical: 2K 1440×2560 · 1080p 1080×1920 (social apps
   deliver 1080 wide; 4K is not offered). Frame rate: 60 (default) or 30. Saved as `resolution` and `fps` in `project.js`; the
   layout never changes with resolution (the stage stays 1080/1920 CSS px, Chrome rasterises it finer). When the aspect ratio is
   itself still being asked, put both resolution lists in this question's options and keep the one that matches.
3. **Voiceover** — do they have the recording (path) or only text? With a recording the video is timed to it and captions are
   possible; with text only, the timing comes from `(m:ss)` markers or is estimated.
4. **Title position, captions & transition** — horizontal only: where the slide title sits, **top** (default: heading centred
   across the top, content under it) or **left** (heading column left, content right). Never pick it silently; it is
   `--layout` on `npm run new` and `layout` in `project.js`. Then burned-in captions on/off (default on for vertical) and
   transition style (default push). Timing itself is not asked: every element enters on the word that names it (Beats
   column, lead 0.10 s).
5. **Intro sting & end screen** — splice the channel's 4s intro in after the hook, and append the 20s end-screen plate?
   The clips live in `.../LifeTech Facts intros and end screens/` (ten styles: 01 boot · 02 orbit · 03 beats · 04 commit ·
   05 loaded · 06 silicon · 07 bits · 08 blueprint · 09 eclipse · 10 generate), each with a matching end screen, and the
   source decks are `projects/lifetechfacts-intro-*`. House rule from the clip folder's own README: **hook first (5-15s),
   then the intro; never open on the intro; no intro on vertical.** Where it cuts in is decided in Step 2, once the
   storyboard shows the slide boundaries, not here. Saved as `PROJECT.splice = {at, head, tail}` and delivered by
   `npm run dual` + `npm run srt`, never by `npm run assemble`.
6. **Outro & audio bed** (never skipped: ask it on every run, also for overlay decks on talking-head footage and when
   resuming a project; default suggestion is the subscribe overlay with NO music (music only when he asks); **the outro is 5-6 s, never longer**) — reuse the saved brand (handles, link-in-bio box from `core/brand.js`), edit it, or none; and
   the outro's sound: the pop + shimmer bed (`outro.wav`, default) or outro music (`brand.audio:
   'outro-music-tropicorp.wav'`, 9s, CC0). **The outro is 5-6 s whatever the bed:** give the row a 5-6 s window (`npm run timeline -- --tail 5.5`
   when it is the last row); `npm run sfx` trims longer music and fades it out on the outro's last beat, and `npm run timeline`
   warns when an outro runs past 6 s. With `npm run dual` (reveal cuts, splices)
   also set `sfx.outroBed: true`, or the outro is silent: dual never plays a slide's own bed. New music only from a
   source whose licence you can read (CC0/public domain checked on the track's own page), logged in `assets/SOURCES.md`.
7. **Brand, accent & UI** — main accent for eyebrows/badges, which company/tool logos the script needs, and the reference UI to
   recreate (AWS console mock is built in; phone; dashboard; none).
8. **Social copy** — write per-network post copy for the finished video into `social/<slug>.md`? `multiSelect`, four groups, all
   ticked by default: *YouTube (title + description)* · *Instagram + TikTok* · *X + LinkedIn* · *WhatsApp status +
   WhatsApp/Telegram post*. Anything else (Facebook, YouTube Community) comes through "Other" as a free-text list.

   **Social cuts**: in the same question group, offer vertical clips of the finished master (best-of + parts, each
   ≤ 2:20 with a "watch the full video" end card) for Reels, TikTok, Shorts and LinkedIn/X. Step 6.

9. **Make it alive**: `multiSelect`, all ticked by default: *Characters* (a recurring cast of illustrated people, CC0,
   with speech bubbles) · *Emoji stickers* (Fluent 3D, MIT, one every 30-40 s on the punchline words) · *Sound effects*
   (subtle whoosh, key clicks, pops, a thump on failure, synthesised from the beats) · *Motion extras* (confetti on a
   success, a shake on a failure, a slow push-in on long scenes). Sources and rules: references/alive-kit.md.

AskUserQuestion takes four questions per call, so this is two or three calls. Do not ask anything else up front. Everything after this is driven by the script.

## Resuming a project made by `npm run video`

`npm run video` (the terminal wizard) may already have: created `projects/<slug>/` (so canvas, resolution, fps and captions are answered by
`project.js` — do not ask again), copied the recording to `vo.<ext>`, transcribed it (`vo.json`, `transcript.txt`) and written a
**draft** cue sheet with one row per spoken line, `?` in the Template column and clause-start candidates (`?:"…"`) in the Beats
column. With `--project <slug>`: skip whatever exists, ask only the questions `project.js` cannot answer (outro/audio bed, accent,
logos, UI to mock), treat the draft rows as Step 1's VO windows, and rewrite them into a real storyboard in Step 2 (merge/split
lines, pick templates, write headlines, rename the `?` beat targets to element names). After Step 4 the user can also re-run
`npm run video -- --project <slug>` to review/time/assemble again.

## Output directory

`projects/<slug>/`. If it already exists and the user did not ask to overwrite, use `projects/<slug>-YYYYMMDD-HHmm/`.
The finished video is `projects/<slug>/renders/final/<slug>.mp4` (+ `.srt`); the post copy, when asked for, is
`social/<slug>.json` + `social/<slug>.md`; review images live in `renders/{poster,strip}` and
`renders/contact-sheet.png`; the storyboard is `cue-sheet.md`, the timing `timeline.json`.

---

## Step 1 — Read the script (or transcribe the audio)

**Read:** [references/step-1-script.md](references/step-1-script.md)

With a recording: copy it to `projects/<slug>/vo.<ext>` and run `npm run transcribe -- --project <slug>` → `vo.json` +
`transcript.txt`. Then `npm run storyboard -- <transcript> --md` for VO windows and answer the 8-question rubric.

**Gate:** rubric answered in your notes; VO windows table produced (transcribed, marked, or estimated).

## Step 2 — Storyboard

**Read:** [references/step-2-storyboard.md](references/step-2-storyboard.md), [references/templates.md](references/templates.md) and, unless the kit is off, [references/alive-kit.md](references/alive-kit.md)

Scaffold with `npm run new -- --slug <slug> --title "…" --canvas <format> --layout top|left [--captions on|off]`, then write the storyboard into
`projects/<slug>/cue-sheet.md`: one row per slide with VO window, template, eyebrow, headline, visual, accent, interaction,
**beats** (element → spoken words, derived from `npm run timeline -- --project <slug> --words`) and line.

**Gate: the user approves the storyboard** (stop, show the table, ask; do not write slides before approval) **and**
`npm run timeline -- --project <slug> --dry` reports 0 errors.

## Step 3 — Build and review

**Read:** [references/step-3-build.md](references/step-3-build.md), [references/design-rules.md](references/design-rules.md), [references/pitfalls.md](references/pitfalls.md), [references/alive-kit.md](references/alive-kit.md)

One slide file per row using templates (`custom` html/frame only when no template fits). Fetch logos (`npm run assets -- --project <slug>`)
and the alive kit (`npm run kit -- --project <slug> --character … / --emoji …`),
run `npm run timeline -- --project <slug>` so the strips are timed, then `npm run review -- --project <slug>` and **look at every
poster and every filmstrip** (elements must arrive spread across the line on their beats, not bunched in the first tiles), fix, repeat.

**Gate:** `npm run check-code -- --project <slug>` reports 0 FAIL (every snippet on screen comes from a checked file in `code/`, any UNCHECKED file raised with the user); probe reports 0 layout issues and 0 load errors; `npm run timeline -- --project <slug> --check` has 0 errors; every
poster and strip reviewed; click flows visible mid-motion; with stickers or bursts, `npm run beat-frames` sheet reviewed.

## Step 4 — Timeline, preview, master, deliver

**Read:** [references/step-4-deliver.md](references/step-4-deliver.md)

`npm run timeline -- --project <slug>` (validates, resolves beats), `npm run sfx -- --project <slug>` when the kit has sound
(re-run after every timeline change), then **two renders, never one**.

**4a — the preview, always first.** `npm run dual -- --project <slug> --only a --preview --source <the voiceover>` when the
project splices an intro or end screen (dual splices in preview too, so the draft has the shape of the finished video and lands
at `<slug>-preview.mp4`), otherwise `npm run assemble -- --project <slug> --preview`. Half size, 30fps, minutes rather than
hours. Hand the user the path and wait. A full-resolution pass costs hours and every defect found so far was plainly visible at
960×540, so the master is not worth starting on an unreviewed deck.

**Gate 4a:** the user has watched the preview and approved it. **Do not start the master before that**, even when the deck looks
finished and every earlier gate is green.

**4b — the master.** `npm run assemble -- --project <slug>`, ffprobe the final MP4, look at 8 consecutive frames around two cuts
(no end-pose flash), frames at three beats and one caption group, finish the cue sheet (Beat map), summarize. **With an intro or
end screen, or when the frame budget is too big for one pass, deliver through `npm run dual -- --project <slug> --only a --source
<the voiceover>` instead, then `npm run captions` and `npm run srt`**: `assemble` cannot splice, and it holds every PNG until the
encode (a 4K60 feature-length deck is ~80 GB, where `dual` chunks and peaks under 2 GB).

**Gate 4b:** `renders/final/<slug>.mp4` exists at the project's resolution (e.g. 3840×2160 for `4k`) and fps, tagged bt709, under
the size budget (2 GB unless `--max-size`), with an AAC track when a voiceover was given, and a duration equal to the deck total
plus any spliced head and tail. Check the join itself: a frame either side of `splice.at` and one inside the clip. Say which file
is the master and which is the preview.

## Step 5 — Social copy (when asked)

**Read:** [references/step-5-social.md](references/step-5-social.md) and [references/social-writing.md](references/social-writing.md)

```bash
npm run social -- --project <slug> --rules
npm run social -- --project <slug> --init --platforms <list>
npm run social -- --project <slug>
```
You write every word, one body per network, from `transcript.txt` and `cue-sheet.md`. The script supplies the rules, counts every
block and fails anything over a network's hard cap. Load the `brand-voice` skill first.

**Gate:** `npm run social` exits 0 with zero `⚠ OVER`, and no two networks share a body. Markdown only: nothing is posted.

## Step 6 — Social cuts (when asked)

**Read:** [references/step-6-social-cuts.md](references/step-6-social-cuts.md)

```bash
assets/.cache/align-venv/bin/python scripts/align.py projects/<slug>/vo.json projects/<slug>-social/words.json
npm run social-cut -- --project <slug>-social --plan
npm run social-cut -- --project <slug>-social --faces
npm run social-cut -- --project <slug>-social --cut best-of --preview
npm run social-cut -- --project <slug>-social --cut all
```
Cut the audio first, then build the deck for the cut: `social-cut` re-times the source deck's slides to each cut's own
audio (on the force-aligned words), lays the talking head over it, then the hook band, captions and end card.

**Gate:** every span opens and closes on its intended word (`--plan`, then a transcript of the preview at every edit),
the user watched each best-of preview before `--cut all`, and every file is 1080×1920, 30fps, bt709, AAC, ≤ 140s.

## Step 7 — Thumbnail (when asked)

Run the **`/new-thumbnail`** skill (`skills/new-thumbnail/SKILL.md`): research the topic's shelf and YouTube's current
specs, propose directions for approval, build them in `projects/<slug>-thumbs`, check every candidate on every screen size
(`npm run thumb-check`), then `npm run thumb --pick` (one PNG under 2 MB into `deliver/`). Copy the
pick to `projects/<slug>/assets/yt-thumb.jpg` before Step 6, so the social cuts' end card shows it.

---

## Laws (apply to every deck)

- **One idea per scene.** A scene covers one idea (often several lines, 15-40 s); the lines inside it add, highlight or
  zoom rather than cut. Split when the idea changes, never cram two ideas into one scene.
- **Social cuts are built, not chopped.** Cut the audio to the spans first and build the vertical deck for that cut;
  never cut clips out of a finished deck video, and never place an edit on whisper's word times (force-align first).
- **Copy is written, not assembled.** `social.md` comes from reading the transcript, never from stitching the cue sheet
  together, and no two networks get the same body.
- **Beat-driven.** Every visual element enters on the word that names it (graphic leads by 0.10 s, container on the phrase,
  payload on the word, one hero per row); no fixed fractions of a 5 s window when a recording exists; holds are life only
  (drift, breathe, sweep, hero ring), nothing new enters.
- **Mobile safe zone (vertical).** Cards, captions, stickers and cameos stay inside y 220-1500 and x 60-940 of the
  1080x1920 stage: Reels/TikTok/Shorts lay their caption block over the bottom ~420px and the like/comment column over
  the right ~140px. When a placement request conflicts, show the numbers and ask. Over footage whose look changes
  (face only vs a split with a screen recording), measure eyes and mouth per look and give each look its own band;
  `PROJECT.captions.yAt = [{from, to, y}]` moves the caption band per stretch of time.
- **Every point pops.** A chip, tile, row or card landing gets a pop (`npm run sfx` does it for every element beat that
  is not text or fx). Name chips `k<n>`; `c<n>` is a terminal command and types.
- **Readable.** Headline settled ≥1.2s, badges ≥0.8s, dwell ≥ max(0.9 s, chars/15 + 0.4 s) before the exit; the end pose must
  be a clean composition because long lines hold it for seconds.
- **Show the thing.** If the script names a product UI, recreate it (console mock, phone, dashboard); never abstract filler.
- **Make it alive.** A recurring cast, a sticker on the punchline, sound on reveals, one canvas that evolves instead of a
  cut per sentence (references/alive-kit.md). Every asset from a listed, licensed source, logged in `SOURCES.md`.
- **One hero moment per slide.** The thing the line is about (a click, a number, a diagram edge) gets the biggest motion; the
  rest supports it with staggered entrances.
- **Data-driven.** Text, rows and logos live in the slide's `data`; markup and animation come from templates.
- **Deterministic.** `frame(u, ctx)` is a pure function of its arguments. No transitions, timers, randomness or `Date`.
- **Sentence case** in badges and rowbars; unique element ids (prefix with the slide id).
- **Logos** from official sources (AWS Architecture Icons, simple-icons, brand pages); record every download in `SOURCES.md`.
