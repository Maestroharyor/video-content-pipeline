# video-content-pipeline (vid): script-to-slides video pipeline

Data-driven slides and overlays written in plain HTML/CSS/JS, rendered frame-by-frame with Puppeteer (headless Chrome)
and encoded with FFmpeg into GIF previews, H.264 MP4s and, on request, transparent WebM/ProRes.

Every video is a folder under `projects/`; the engine (`core/`), renderer and shared assets are reused. New decks are
created with the **`/new-video`** skill: paste a script, answer a few questions (aspect ratio, clip length, outro, brand,
UI to mock), approve a storyboard, and the skill builds and renders `projects/<slug>/`.

```
video-content-pipeline/
├── CLAUDE.md                 how Claude should work in this repo (the most complete map of every folder and command)
├── skills/new-video/         the skill (SKILL.md + references/); linked into .claude/skills, .agents/skills, .opencode/skills
├── core/                     engine: styles, grid.js, timeline.js, anim.js, registry.js, brand.js, captions.js,
│                             components/ (fx, cast, awsConsole, costChart, vpcDiagram, subscribe, figure…), templates/, skeleton/, social/
├── projects/                 one folder per video (only the reference decks, intros and test fixtures are in git)
├── assets/                   fonts/, logos/, audio/, SOURCES.md (provenance of every file); .cache/ is downloaded, never committed
├── renderer/                 discovery, capture, assemble, encode, timeline, captions, social cuts
├── scripts/                  one file per npm script (setup, transcribe, timeline, dual-render, social-cut, align.py…)
├── test/                     node:test suites
└── generated/                the original deck's source (reference only; not a build input)
```

## Setup on a new machine

### 1. Prerequisites

| Tool | Version | Installed by `setup.sh` / `setup.ps1`? | Used for |
|---|---|---|---|
| git | any | no | cloning |
| Node.js | ≥ 22.12 (`.nvmrc` = 22) | yes (Homebrew, nvm on Linux, winget) | everything |
| ffmpeg + ffprobe | any recent build | yes | encoding, probing, audio mixing |
| whisper.cpp (`whisper-cli`) | any recent build | yes (Homebrew, built from source on Linux, prebuilt zip on Windows) | transcription |
| Chrome for Testing | pinned by Puppeteer | yes (`npm install`, ~200 MB into `~/.cache/puppeteer`) | rendering |
| curl, unzip | any | yes on macOS/Linux; **not on Windows** (see below) | `npm run assets`, `photos`, `kit` |
| Claude Code (`claude`) | any | no | the `/new-video` and `/social-copy` skills; `npm run video` hands over to it |

Optional, only for the features that need them:

- **Python 3 + torch/torchaudio 2.8** for `scripts/align.py` (forced alignment, needed by `npm run social-cut`). Not set up
  by the setup scripts:
  ```bash
  python3 -m venv assets/.cache/align-venv
  assets/.cache/align-venv/bin/pip install torch==2.8.0 torchaudio==2.8.0   # the ~1.2 GB model downloads on first run into ~/.cache/torch
  ```
- **Swift (Xcode command line tools, macOS only)** for `scripts/cutout.swift`, the thumbnail cutouts.

### 2. Clone both pipelines side by side

The video and image pipelines share the `/social-copy` skill and find each other by folder name, so clone them into the same
parent folder **under these exact names**:

```bash
mkdir -p ~/Documents/content-pipeline && cd ~/Documents/content-pipeline
git clone https://github.com/Maestroharyor/video-content-pipeline.git
git clone https://github.com/Maestroharyor/image-content-pipeline.git
```

Clone the image pipeline before running setup here (or re-run `npm run setup` after cloning it). Without it, setup prints
`social-copy not linked` and the committed `.claude/skills/social-copy` links stay broken. Everything else still works.

### 3. Run setup

```bash
cd video-content-pipeline
./setup.sh                                          # macOS (Homebrew) and Linux (apt/dnf/pacman + nvm; builds whisper.cpp)
powershell -ExecutionPolicy Bypass -File setup.ps1  # Windows (winget: Node 22, ffmpeg, whisper.cpp prebuilt)
```

Both are safe to re-run and install only what is missing. They install the tools above, run `npm install`, fetch any
missing shared asset (fonts, outro marks, audio beds), link the skills into this repo and into `~/.claude/skills`, and
print a health report. Then:

```bash
npm run doctor     # every line should read ok
npm test           # ~2 min; renders the template gallery in both canvases, so it proves Chrome + ffmpeg work
```

`npm run setup` re-does the Node-side part (tool check, skill links, assets) on its own. Open a new Claude Code session
afterwards so it picks up the skills.

### 4. What a fresh clone does not have

Git carries the engine, the shared assets, the reference decks and the test fixtures. Everything per-machine or heavy stays
local (see `.gitignore`):

| Missing after clone | How to get it back |
|---|---|
| `projects/<slug>/` for most videos | Only the whitelisted projects are committed (template-gallery, aws-forgotten-resources, cloud-vs-devops, ai-in-every-app*, lifetechfacts-intro*, lifetechfacts-endscreen). Copy any other project folder across by hand. |
| Voiceovers (`vo.*`), A-roll (`aroll.*`), source footage | Copy the recordings into the project folder. Several projects pointed at `~/Downloads/...` on the original machine. |
| Renders (`renders/**/final`, `gif`, `mp4`, `webm`, `strip`, `social`), `frames/` | Re-render: `npm run assemble -- --project <slug>`. Posters and contact sheets are committed. |
| Intro and end-screen clips that `npm run dual` splices in (`PROJECT.splice.head/tail`) | Re-render them from the `lifetechfacts-intro*` / `lifetechfacts-endscreen` projects, or copy them over, to the path in that project's `project.js`. Paths may start with `~` (your home folder on any OS), so the same `project.js` works on every machine that keeps the clips in the same place. `dual` stops with an error naming the missing file. |
| `assets/sfx.wav` | `npm run sfx -- --project <slug>` |
| `assets/.cache/` (whisper models, AWS icon zip, align venv) | Downloaded on first use; the venv as shown above. |

### 5. Windows notes

- **Symlinks.** The skill links and the `projects/ai-in-every-app-*` folders are committed as symlinks. Turn on Developer Mode
  (Settings → For developers) and clone with `git clone -c core.symlinks=true …`, or they arrive as small text files.
  `npm run setup` falls back to copying the skill folders when it cannot link; re-run it after editing a skill.
- **unzip.** `npm run assets` unpacks the AWS icon package with `unzip`, which Windows does not ship. Put one on PATH
  (for example `scoop install unzip`) before fetching AWS icons.
- `cutout.swift` is macOS only.

### 6. Claude Code on the new machine

`npm run setup` links the skills, but three things live in your Claude Code account or home folder, not in git:

- **MCP connections.** Context7 (library docs) and, for posting drafts from the image pipeline, SocialPilot. Connect them
  again in Claude Code on each machine (`/mcp`).
- **Your global `~/.claude/CLAUDE.md`.** Copy it across if you want the same personal defaults.
- **Claude's per-machine memory.** The standing decisions from past videos are already in
  `skills/new-video/references/house-rules.md`, which the skill reads on every run, so nothing is lost.

### Keeping machines in sync

```bash
git pull && npm install && npm run setup
```

### The skill

`npm run setup` wires the skill for this repo (`.claude/skills/new-video` → `skills/new-video`, same for `.agents/` and
`.opencode/`) and for your account (`~/.claude/skills/new-video` symlink), so `/new-video` works here and from anywhere.
Other install paths:

```bash
/plugin marketplace add "$(pwd)"                         # Claude Code plugin marketplace (uses .claude-plugin/)
rsync -a skills/new-video/ ~/.claude/skills/new-video/   # plain copy instead of the symlink
```
Codex CLI and opencode discover it through `.agents/skills/` and `.opencode/skills/`.

## Making a new video

**One command from the terminal:**

```bash
npm run video            # asks: title, aspect ratio, captions, the recording (or a script) — then does everything it can
```
It scaffolds the project, copies and transcribes the recording, drafts the cue sheet (one row per spoken line), and opens
Claude Code on it (`claude "/new-video --project <slug>"`) for the creative part: the storyboard you approve and the slides.
Once the slides exist, the same command finishes the job: `npm run video -- --project <slug>` runs review → timeline →
assemble and prints the path of the finished MP4. Every question can be pre-answered with a flag
(`--title --canvas --captions --audio --script --no-claude --yes`) for scripted use.

**Or start inside Claude Code:**

```text
/new-video --audio ~/Downloads/take3.m4a --format vertical
(or paste the script / "(0:00) …" transcript)
```
The skill asks what flags did not cover (format, voiceover file, captions & timing, outro & audio bed, brand accent + logos + UI to
mock), transcribes the recording locally, scaffolds `projects/<slug>/`, writes the storyboard into `cue-sheet.md`, stops for
approval, then builds, reviews (probe + posters + filmstrips), builds the timeline and assembles the finished video. Manual equivalent:

```bash
npm run new -- --slug my-video --title "My video" --canvas vertical      # scaffold (captions on by default for vertical)
cp ~/Downloads/take3.m4a projects/my-video/vo.m4a
npm run transcribe -- --project my-video                                 # vo.json (word timestamps) + transcript.txt
npm run storyboard -- projects/my-video/transcript.txt --md              # VO windows for the cue sheet
# write projects/my-video/cue-sheet.md and slides/NN-slug.js (see projects/template-gallery/slides for every template)
npm run review -- --project my-video                                     # probe + posters + strips + contact sheet
npm run timeline -- --project my-video                                   # cue sheet + vo.json → timeline.json
npm run assemble -- --project my-video                                   # → renders/final/my-video.mp4 (+ .srt)
npm run preview -- --project my-video                                    # optional: scrub / play it in a browser
```

### The production flow, end to end

```
recording ──transcribe──▶ vo.json + transcript.txt ──storyboard──▶ cue-sheet.md (approved) ──build──▶ slides/*.js
      │                                                                                        │
      │                                                                    review: probe, posters, strips, contact sheet
      │                                                                                        │
      └──────────────────────────────▶ timeline.json ◀──── timeline (cue sheet + word anchors) ◀┘
                                              │
                                     assemble: one continuous render (transitions, drifting background, captions)
                                              + voiceover + outro bed mixed in ──▶ renders/final/<slug>.mp4 + .srt
```

No recording? Paste a script with `(m:ss)` markers (or SRT/VTT), or plain prose (timings estimated at 2.6 words/s). The
assembled video is then silent (visuals only, beds still mixed) and you add the audio in your editor. Per-slide clips
(`npm run render:all`) remain available as intermediates for editors.

## The `/new-video` workflow in detail

Invocation flags (anything not given is asked with a single question set):

| Flag | Values | Default |
|---|---|---|
| `--format` | `vertical` (1080×1920 stage, Shorts/Reels/TikTok) · `horizontal` (1920×1080 stage, YouTube) | always asked |
| `--res` | horizontal: `4k` (3840×2160) · `1440p` · `1080p` — vertical: `2k` (1440×2560) · `1080p` | asked; `4k` horizontal, `2k` vertical |
| `--audio` | path to the voiceover recording (wav/m4a/mp3/flac/ogg) | asked |
| `--script` | text file: `(m:ss)` markers, SRT/VTT, whisper JSON or prose | script pasted in chat |
| `--captions` | `on` / `off` burned-in word-highlight captions (needs the recording) | on for vertical, off for horizontal |
| `--duration` | motion seconds per slide (then holds until its line ends) | `5` |
| `--transition` | `push` / `fade` / `cut` | `push` 0.4s |
| `--fps` | `60` · `30` frames per second | asked; `60` |
| `--max-size` | size budget of the final MP4 (`2G`, `800M`) | `2G` |
| `--title` / `--slug` | deck title / folder name under `projects/` | inferred from the script |
| `--no-outro` / `--no-audio` | skip the outro slide / its audio bed | outro + bed on |
| `--accent` | `teal violet green rose amber blue orange` | asked |
| `--ui` | `aws-console` `phone` `dashboard` `none` | asked |

Steps and gates (details in `skills/new-video/references/`):

1. **Read the script / transcribe** — `npm run transcribe` (whisper.cpp, word timestamps) or `npm run storyboard` on pasted text; an 8-question rubric (hook, sections, claims needing visuals, UI, logos, numbers, interactions, outro line).
2. **Storyboard** — `npm run new` scaffolds the project; the storyboard table goes into `projects/<slug>/cue-sheet.md`. **The skill stops here for your approval.**
3. **Build & review** — one slide file per row using templates, logos fetched from official sources, `npm run review` → every poster and filmstrip looked at → fix loop.
4. **Timeline, assemble, deliver** — `npm run timeline`, `npm run assemble`, ffprobe on the final MP4, frames around cuts and captions checked, cue-sheet notes, summary.

If `projects/<slug>/` already exists the skill writes to `projects/<slug>-YYYYMMDD-HHmm/` instead of overwriting.

## Rendering

### The finished video (timeline render)

```bash
npm run timeline -- --project my-video [--xf push|fade|cut --xf-dur 0.4 --motion 5 --tail 6 --lead 0.10] [--words [--slide 04] | --dry | --check]
npm run assemble -- --project my-video [--jobs 4] [--captions on|off] [--audio take3.m4a | --no-audio] [--preview] [--res 4k|1440p|2k|1080p] [--fps 60] [--crf 16] [--preset slow] [--max-size 2G] [--keep-frames] [--force]
```

`timeline` turns the cue sheet's VO windows (snapped to the first spoken word of each line when `vo.json` exists) and its
`Beats` column (element → spoken words, e.g. `c*:"Two jobs","software","SaaS"! badge:"failed"`) into `projects/<slug>/timeline.json`:
each element then enters 0.10 s before its word (`^` phrase anchors 0.30 s), earlier siblings dim, the hero (`!`) pulses during
the hold. `--words` prints every slide's words with times to author beats, `--dry` resolves without writing (the storyboard
gate), `--check` rebuilds and reports beat errors/warnings, validating that slides are contiguous and warning about rushed click flows. `assemble` renders
the whole timeline as one continuous frame sequence (each slide plays its motion, holds its end pose, then pushes out over the
last 0.4s; the background drifts and the captions run throughout), using one headless Chrome per worker, and encodes a single
MP4 with the voiceover padded to the total length and every audio bed delayed to its slide (`adelay` + `amix`). A 2-minute
vertical video takes about 2–3 minutes with 4 workers. `--preview` gives a half-resolution, 30fps hardware-encoded draft (captured at 1×) in a fraction of the time. A 4K 60fps master is about
8× the pixels per second of 1080p30: a 4.5-minute horizontal video captures ~16,000 frames (roughly 25 GB of temporary PNGs, deleted after the encode).

### Per-slide clips

```bash
npm run render -- --project aws-forgotten-resources --slide 04-ec2-spin-up            # mp4 + gif for one slide
npm run render -- --project aws-forgotten-resources --slide 04 --format gif
npm run render -- --project aws-forgotten-resources --slide 04 --format webm,mov --transparent   # alpha outputs
npm run render:all -- --project aws-forgotten-resources                               # every slide, mp4 + gif (unchanged slides are skipped)
npm run render:all -- --project aws-forgotten-resources --timed                       # clips at their timeline lengths (motion + hold)
npm run poster -- --project aws-forgotten-resources                                   # final-frame PNGs
npm run strip -- --project aws-forgotten-resources [--slide 07] [--no-timed]          # 10-frame filmstrip per slide (across the timeline window, beat tiles marked)
npm run render -- --project aws-forgotten-resources --slide 07 --poster --t 0.55      # mid-motion PNG
npm run render -- --project aws-forgotten-resources --list
```

`--project` can be omitted when `VID_PROJECT` is set or only one project exists. `--overlay` is an alias of `--slide`.
Other flags: `--canvas vertical|horizontal` (override), `--res 4k|1440p|2k|1080p`, `--fps 60`, `--crf 16`, `--preset slow`, `--hold 1`, `--out <dir>`, `--frames <dir>`, `--keep-frames`,
`--force` (ignore the render cache in `renders/.cache.json`).

### Outputs (per project, under `projects/<slug>/renders/`)

| Kind | Where | What |
|------|-------|------|
| **Finished video** | `final/<slug>.mp4` | full timeline at the project resolution (4K horizontal / 2K vertical by default) and 60fps, H.264 crf 16 tagged bt709, bitrate capped to the 2 GB size budget, + AAC 192k (voiceover + beds); `final/<slug>.srt` sidecar when captions exist |
| GIF preview | `gif/<slug>.gif` | half resolution, palette-optimised, loops, 1s hold on last frame |
| Standard MP4 | `mp4/<slug>.mp4` | one clip per slide at the project resolution, H.264 yuv420p crf 16 bt709, faststart; AAC only on slides that declare `audio` |
| Transparent WebM | `webm/<slug>.webm` | VP9 `yuva420p` with alpha, background layer hidden (`--transparent`) |
| ProRes 4444 MOV | `webm/<slug>.mov` | `--format mov`: editing intermediate with alpha |
| Poster PNG | `poster/<slug>.png` | final frame of each slide (`@t` suffix for mid-motion posters) — committed |
| Filmstrip PNG | `strip/<slug>.png` | 10 frames across the motion, for reviewing animation |
| Contact sheet | `contact-sheet.png` | `npm run contact -- --project <slug>` — committed |

Transparency: standard H.264 MP4 cannot carry alpha. `--transparent` (implied by `--format webm` or `mov`) hides the
background grid/vignette, makes the stage transparent, captures PNGs with alpha and encodes VP9 WebM / ProRes 4444.

## CLI reference

```
node renderer/cli.js      [--project <slug>] [--slide <slug|sNN|prefix>]… [--format all|mp4|gif|webm|mov|mp4,gif] [--timed] [--force]
                          [--canvas vertical|horizontal] [--res 4k|1440p|2k|1080p] [--fps N] [--crf N] [--preset P] [--max-size 2G] [--hold S] [--width W --height H]
                          [--transparent] [--poster [--t 0..1]] [--keep-frames] [--out <dir>] [--frames <dir>] [--list]
node renderer/assemble.js [--project <slug>] [--jobs N] [--captions on|off] [--xf push|fade|cut] [--xf-dur S]
                          [--audio <file> | --no-audio] [--preview] [--from S --to S] [--resume] [--keep-frames] [--force]
node scripts/transcribe.js --project <slug> [--audio <file>] [--model medium.en] [--prompt "…"] [--threads 8] [--dtw] [--no-download]
node scripts/timeline.js   --project <slug> [--xf …] [--xf-dur S] [--motion S] [--tail S] [--no-anchor] [--check]
node scripts/captions.js   --project <slug> [--max-words 5] [--max-chars 22] [--gap 0.6] [--max-dur 2.5] [--accent t] [--y 1450]
node scripts/preview.js    --project <slug> [--port 4173] [--canvas …] [--open]
node scripts/strip.js      --project <slug> [--slide …] [--frames 10]     node scripts/review.js --project <slug>
node scripts/setup.js [--check] [--no-install]                            node scripts/new-project.js --slug … --title … --canvas … [--captions on|off]
```
Unknown flags are an error. Rendering cost: about 30 frames/s with 4 assembly workers (≈2–3 min for a 2-minute video),
about 5 frames/s for single-slide clips; encoding is a few seconds.

### Other commands

| Command | What it does |
|---|---|
| `npm run social -- --project <slug> [--rules \| --init \| --check]` | per-network post copy: you write `social/<slug>.json`, this counts and gates it into `.md` |
| `npm run dual -- --project <slug> [--preview] [--reveals <set>]` | two masters from one capture: deck only, and deck composited over the talking-head footage, with intro/end-screen splices |
| `npm run srt -- --project <slug>` | shifts `captions.srt` for the spliced master |
| `npm run social-cut -- --project <slug> [--plan \| --faces \| --cut <name\|all>]` | vertical social cuts from `cuts.json` (needs the align venv) |
| `npm run sfx -- --project <slug>` | sound effects from timeline beats into `assets/sfx.wav`; re-run after every timeline |
| `npm run kit -- --project <slug> --emoji "rocket"` | Fluent emoji and DiceBear characters into the project's assets |
| `npm run photos -- --project <slug> --subject "server rack"` | openly licensed photos plus provenance |
| `npm run beat-frames -- --project <slug>` | frames at short-lived beats, as a review sheet |
| `npm run yt-research -- --out <dir>` | scrapes YouTube search and channels, scores thumbnails and titles against each channel's median |
| `npm run timeline:finish -- --project <slug> [--end S]` | after `timeline`: clamps the last slide to the footage runtime and cross-fades joins between same-template slides |

CLAUDE.md documents every flag of these.

## Project reference

```
projects/<slug>/
├── project.js        settings (below)
├── index.html        loads core + project.js + slides; the renderer rewrites the <!-- core:start/end --> and <!-- slides:start/end --> blocks
├── slides/NN-slug.js one file per slide; name order = deck order; ids derive from the leading number (s01, s02 …)
├── assets/           project-only logos/images (+ SOURCES.md written by `npm run assets -- --project <slug>`)
├── cue-sheet.md      storyboard: VO window ↔ slide, Beats (element ↔ spoken words), edit notes, design notes
├── vo.m4a            the voiceover recording (git-ignored); vo.json + transcript.txt from `npm run transcribe` (committed)
├── timeline.json     slide start/end seconds on the voiceover clock (`npm run timeline`); captions.json (`npm run captions`)
└── renders/          final/ gif/ mp4/ webm/ poster/ strip/ contact-sheet.png .cache.json   (frames/ and .whisper/ are temporary)
```

`project.js`:

```js
window.PROJECT = {
  slug: 'my-video', title: 'My video',
  canvas: 'vertical',            // 'vertical' 1080×1920 | 'horizontal' 1920×1080 (the CSS stage)
  resolution: '2k',              // encoded pixels = stage × scale. vertical: '2k' 1440×2560 | '1080p'; horizontal: '4k' 3840×2160 | '1440p' | '1080p'
  fps: 60, dur: 5, hold: 1,      // motion seconds per slide; hold = clip tail for per-slide renders (on the timeline the line length decides)
  captions: { on: true, y: 1450, accent: 't', size: 46, group: { maxWords: 5, maxChars: 22, gap: 0.6, maxDur: 2.5 } },  // burned-in captions (needs vo.json)
  bg: { drift: 1, a: 'rgba(255,153,0,.08)', b: 'rgba(139,92,246,.12)' },   // ambient background: drift amplitude (0 = static) and the two glow colours
  locale: { currency: '$' },     // used by money()/money4()
  brand: { accent: 'o', handles: [...], box: {...}, audio: 'outro.wav', outro: { eyebrow, h1 } },  // any subset overrides core/brand.js
  assets: { aws: ['ec2', 'rds'], brands: ['docker', 'python'], urls: { acme: 'https://acme.com/press/logo.svg' } },  // fetched by `npm run assets -- --project my-video`
  probe: { sel: ['.my-widget'] },                                  // optional extra selectors for the layout probe
};
```

Renderer resolution order: CLI flags → `project.js` → defaults (`resolution` 4k horizontal / 2k vertical, `fps 60`, `crf 16`, `maxSize 2G`, `hold 1`, `dur 5`). `--project` falls back to the
`VID_PROJECT` env var, then to the only folder in `projects/`.

Audio: a slide's `audio: 'file.wav'` is looked up in the project dir, then `projects/<slug>/assets/`, then `assets/audio/`, and
mixed into that slide's MP4 as AAC (`-shortest`) and, on the assembled video, delayed to the slide's start and mixed under the
voiceover. GIFs and WebMs are silent. The voiceover itself is `projects/<slug>/{vo,voice,voiceover}.{wav,m4a,mp3,flac,ogg}`
(or `--audio`), git-ignored.

`timeline.json` (written by `npm run timeline`, read by the renderer and injected into the page):

```json
{ "version": 1, "fps": 30, "total": 123.4, "vo": "vo.m4a", "words": "vo.json", "xf": { "type": "push", "dur": 0.4 }, "motion": 5,
  "slides": [ { "id": "s01", "slug": "01-title", "start": 0, "end": 6.12 }, …, { "id": "s22", "slug": "22-outro", "start": 117.4, "end": 123.4, "motion": 5, "audio": "outro.wav" } ] }
```
A slide's `motion` = `min(end - start, dur)`; `frame(u)` gets `u = min(1, elapsed / motion)`, so short lines compress the
choreography and long lines hold the end pose. Per-slide `xf`/`xfDur` override the transition. Without a timeline the slides
simply run back to back at `dur + hold` (what `index.html` shows when opened directly).

## How a slide works

Template slide (most slides):

```js
defineSlide({
  slug: '05-running-means-paying', template: 'console',     // dur defaults to PROJECT.dur (5s) + 1s hold when encoding
  data: { eyebrow: 'The rule', accent: 'r', h1: 'Running<br>means paying', foot: '…',
          console: { /* awsConsole spec */ }, badges: [{ text: '24 / 7', cls: 'a', x: 600 }], sub: '…' }
});
```

Custom slide (escape hatch):

```js
defineSlide({
  slug: '13-something-unique', dur: 5, audio: 'outro.wav',    // audio resolved from the project dir, then assets/audio
  data: { … },
  html: (d, ctx) => `${heading(ctx.p, d)} …markup built from d, ids prefixed with ctx.p…`,
  setup: (root, d, ctx) => { /* optional: measure the DOM */ },
  frame: (t, ctx) => { up(ctx.p + 'eb', seg(t, .02, .14)); /* pure function of t */ }
});
```

`frame(t)` is called for every captured frame, so it must not depend on time, `requestAnimationFrame`, transitions or
randomness. Helpers live in `core/anim.js`; the template data schemas are in `skills/new-video/references/templates.md`.

### Add a slide / change things
- **New slide**: add `projects/<slug>/slides/NN-name.js`; the renderer keeps `index.html`'s slide list in sync (name order = deck order).
- **Text**: edit the slide's `data`. **Duration**: `dur` on the slide or `dur` in `project.js`; the hold is `hold` in `project.js` (or `--hold`).
- **Logos**: declare what the video needs in `project.js → assets` and run `npm run assets -- --project <slug>`:
  `aws: ['ec2', 'lambda', …]` (official AWS Architecture Icons, looked up by name), `brands: ['docker', 'python', …]` (simple-icons,
  thousands of brands), `urls: { acme: 'https://…/logo.svg' }` (anything else, from the official brand page). AWS and brand marks land in the
  shared `assets/logos/{aws,brands}` cache and are used with `logo('ec2')` / `logo('docker', true)`; URL downloads land in
  `projects/<slug>/assets` and are used with `passet('acme.svg')`. Every fetch is recorded in the project's `SOURCES.md`.
- **Aspect**: `canvas` in `project.js` (`vertical` 1080×1920 or `horizontal` 1920×1080 stage); the grid comes from `core/grid.js`.
- **Resolution**: `resolution` in `project.js` or `--res` (`4k`, `1440p`, `2k`, `1080p`). It is a device scale factor at capture time, so text, SVG logos and
  shadows are rasterised at full output resolution (not upscaled) and the layout is identical at every resolution.
- **File size**: `maxSize` in `project.js` or `--max-size` (default 2 GB). Quality is crf-targeted; the budget only caps the bitrate (`budget ÷ duration`).
- **FPS**: `fps` in `project.js` or `--fps`. **Outro brand**: `core/brand.js`, overridable in `project.js → brand`.
- **Fonts**: declared in `core/styles/tokens.css`; the renderer forces every face to load and fails the run if one is missing.

## Template catalogue

All templates take `eyebrow`, `accent` (`t v g r a b o`), `h1` (use `<br>` for the line break), `h1size` (`''|sm|xs`) and `foot`,
and size themselves to the canvas. See `projects/template-gallery/slides/` for a working example of each and
`skills/new-video/references/templates.md` for the full schemas.

| Template | Use for | Required data | Optional data |
|---|---|---|---|
| `title` | opening slide, hero + stat | `eyebrow h1` | `sub hero:{logo,brand} badge:{text,cls,counter:{from,to,fmt}} chart` |
| `statement` | one big claim / rule / misconception | `eyebrow h1 quote` | `label cls strike badge sub` |
| `compare` | A vs B with a separator | `eyebrow h1 left:{lb,qt,cls} right:{lb,qt,cls}` | `sep strike:'left'|'right' icons sub` |
| `list` | icon rows, numbered nodes, check rows | `eyebrow h1 items:[{text}]` | `style:'rowbar'|'node'|'chk' icon/brand/sub/num/tail/cls badge sub` |
| `logos` | tech-stack row | `eyebrow h1 items:[{icon,brand,label}]` | `size note sub` |
| `code` | script/config with line reveal | `eyebrow h1 file lines` | `tiles ok note` |
| `console` | AWS console screen with optional click flow | `eyebrow h1 console` | `rowsIn select menu modal flow states stateRow badges sub extra` |
| `chart` | growing bars + counter | `eyebrow h1 chart:{title,unit,bars,max,fmt}` | `counter badges sub` |
| `checklist` | closing checklist + chart | `eyebrow h1 items` | `chart badge` |
| `diagram` | boxes/nodes/edges (VPC-style) | `eyebrow h1 vpc:{boxes,nodes,edges,cloud,h}` | `seq dim hot badge` |
| `outro` | follow / handles / link-in-bio | – | `eyebrow h1 foot handles box` (defaults from `core/brand.js`) |
| custom | anything else | `html(d,ctx) frame(t,ctx)` | `setup(root,d,ctx) dur audio` |

Components available to custom slides and templates: `awsConsole awsMenu awsModal awsFlash awsBilling` (Cloudscape mock),
`costChart`, `vpcDiagram`, `logoStack checkRow chip xMark pointer heading`. Animation helpers in `core/anim.js`:
`seg eo eio bk up pp sx fd draw code bars fill tick ripple cursor pulse status`; `clickFlow` + `centerOf` in `core/components/misc.js`.

### Adding a template

Create `core/templates/<name>.js`:

```js
defineTemplate('<name>', {
  check: d => req(d, ['eyebrow', 'h1'], '<name>'),        // readable error when data is missing
  defaults: () => ({ ... }),                                // optional
  html: (d, ctx) => `${heading(ctx.p, d)}<div class="content"><div class="rel">…ids prefixed with ${ctx.p}…</div></div>`,
  setup: (root, d, ctx) => {},                              // optional, may measure the DOM
  frame: (t, ctx) => { headIn(t, ctx.p); … footIn(t, ctx.p); }
});
```

Add a `<script>` line for it in `core/skeleton/index.html` and in every existing project's `index.html`, add a sample slide to
`projects/template-gallery/slides/`, and run `npm test` (the gallery is rendered in both canvases).

## Canvas and grid

Geometry comes only from `core/grid.js` (CSS variables on `#stage`, `window.GRID` in JS):

| | vertical 1080×1920 | horizontal 1920×1080 |
|---|---|---|
| eyebrow | 60 / 132, 34px | 60 / 84, 30px |
| headline | 60 / 206, 960 wide, 82px | 60 / 134, 640 wide, 72px |
| content box | 60 / 455, 960 × 1200 | 760 / 84, 1100 × 920 |
| footnote | 60 / 1740, 960 wide | 60 / 924, 640 wide |
| safe area | 58–1022 × 96–1858 | 58–1862 × 56–1024 |

Templates lay out inside the content box; the same slide data renders on either canvas (`--canvas` overrides a project's
setting for a one-off render). Custom slides that hardcode 960px widths are vertical-only.

## Brand and outro

`core/brand.js` holds the saved handles (Instagram/X/TikTok @maestroharyor, LinkedIn ayomide-odewale), the braandly box, the
`outro.wav` audio bed (pops at 1.50/2.10/2.70/3.30s, shimmer 4.30–5.02s) and the outro headline. Override any field per project
in `project.js → brand`; the `outro` template then needs no data.

## Checks

```bash
npm run review -- --project <slug>  # probe + posters + filmstrips + contact sheet (exit 1 when the probe finds anything)
npm run probe -- --project <slug>   # steps every slide to t=0.5/1, reports margin/overflow/clip issues and JS errors
npm run preview -- --project <slug> # http://localhost:4173: scrub/play the timeline with the voiceover, switch canvas
npm test                            # timeline/caption/transcript maths; gallery in both canvases (geometry, fonts, determinism,
                                    # safe area, gif/mp4/webm via ffprobe); setTime/transitions/captions; parallel capture +
                                    # one-pass encode; every project loads; scaffolder smoke test (~2 min, needs ffmpeg + Chrome)
npm run doctor                      # toolchain + skill links
```

## Troubleshooting

- **`DECK_READY never set`** — a slide threw while building. Open `projects/<slug>/index.html` in Chrome and read the console; usual causes: missing required template data (the error names the field), duplicate element ids (the registry throws), a typo in a helper name.
- **`FONTS not loaded`** — a face in `core/styles/tokens.css` failed to load; check the file exists under `assets/fonts/`.
- **`REQUESTFAILED …`** — an `<img src>` or script path is wrong. Asset paths are relative to the project's `index.html` (`logo()`, `passet()` build them for you).
- **`--project <slug> is required`** — more than one project exists; pass `--project` or set `VID_PROJECT`.
- **Console header clips the orange button** — keep title + Info + ≤3 buttons + primary at 960px.
- **Something animates but never appears / appears at frame 0** — id collision or a `frame(t)` that never sets the element; run `npm run probe` and check `renders/poster/<slug>@0.png` (`--poster --t 0`).
- **`no timeline.json`** — run `npm run timeline -- --project <slug>` (needs the cue-sheet table with `File` and `VO window` columns).
- **`whisper-cli not on PATH`** — `./setup.sh` / `setup.ps1` install it (Homebrew, a source build into `~/.local/bin` on Linux, a prebuilt zip on Windows); on Linux open a new shell so `~/.profile` adds `~/.local/bin`; elsewhere build whisper.cpp and add `whisper-cli` to PATH. The model downloads on first `npm run transcribe` (≈1.5GB for the default medium.en) into `assets/.cache/whisper/`.
- **Captions missing in the final video** — captions need `vo.json` (transcribe first) and `captions.on` in `project.js` (or `--captions on`).
- **Assembly is slow** — check `--jobs` (default min(4, cores/2)); each worker is a Chrome process with ~300MB.
- **`social-copy not linked`** in setup: `../image-content-pipeline` is not cloned next to this repo; clone it and run `npm run setup`.
- **Skill folders are text files on Windows**: symlinks were off at clone time; see Windows notes above, then `npm run setup`.
- More lessons: `skills/new-video/references/pitfalls.md`.

## Assets and licensing

Nothing vendor-specific is part of the shared setup: `npm run assets` only guarantees the fonts, the outro marks and the audio
beds. Each project declares its own logos (`project.js → assets`) and they are fetched on demand, so a video about Stripe or
Kubernetes never touches the AWS icon package. See `assets/SOURCES.md` (shared) and each project's `assets/SOURCES.md`.
AWS service/resource icons come from the official AWS Architecture Icons package; brand marks from simple-icons; fonts Inter,
Inter Display, JetBrains Mono and Open Sans are SIL OFL.
LinkedIn does not ship in simple-icons, so the outro uses a typographic "in" tile. Amazon Ember (the real console font) is not
redistributable; the console mock uses Open Sans, which AWS's open-source Cloudscape design system ships with.

