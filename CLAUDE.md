# vid — voiceover-to-video pipeline

HTML/CSS slides, animated deterministically, rendered with Puppeteer + FFmpeg into one finished MP4 timed to a voiceover
(plus per-slide GIF/MP4 clips). Every video is a project folder; the engine is shared.

## When the user asks for captions or post copy for something already finished
Run the **`/social-copy`** skill (lives in `../image-content-pipeline/skills/social-copy`, linked into this repo by `npm run setup`).
It asks the brand, the networks and the link, then writes one body per network into `projects/<slug>/social/<slug>.md`. Markdown
only: nothing is posted. Inside `/new-video` this is Step 5 and uses the same script.

## When the user asks for a thumbnail
Run the **`/new-thumbnail`** skill (`skills/new-thumbnail/SKILL.md`): research (`npm run yt-research` + the topic's shelf + a
web pass on YouTube's specs), directions approved before building, `npm run thumb-check` on every candidate, then `npm run
thumb --pick`. Never delete candidates without the user's explicit approval.

## When the user hands over a recording, pastes a script or a "(0:00)" transcript, or asks for slides/animations for a video
Run the **`/new-video`** skill (`skills/new-video/SKILL.md`). It asks the aspect ratio and a few settings, transcribes the audio
(whisper.cpp), writes a storyboard into the project's cue sheet, waits for approval, then builds, reviews, times and assembles.
Do not hand-build slides outside that flow.

## Layout
```
core/        engine: styles (tokens/base/aws-console/diagrams), grid.js (canvas presets + caption band; horizontal safe.b is 870, not the frame edge: a YouTube caption box covers the bottom ~18% of the player), timeline.js (pure maths),
             bg.js (ambient drift), captions.js, anim.js, registry.js (setFrame/setTime, transitions), brand.js, preview.js,
             components/ (fx = emoji stickers, confetti burst, shake and slow push-in layered on any slide (data.emoji/burst/shake, PROJECT.drift; see skills/new-video/references/alive-kit.md); cast = characters + speech bubbles; awsConsole, costChart, vpcDiagram, misc, subscribe = the YouTube action bar CTA (Like, Subscribe, bell, notify menu; four clicks scored to a sting cut from the channel's own recording, picked by spectrum not by level), shared by a deck outro and a transparent overlay; figure = schematic scenes for the optional `figure` slot on statement/title), templates/ (title statement compare list logos code console chart checklist diagram cards hop anatomy tree outro), skeleton/
projects/    one folder per video: project.js · index.html · slides/NN-slug.js · assets/ · cue-sheet.md · vo.* (ignored) · vo.json · transcript.txt ·
             timeline.json · captions.json · social/<slug>.{json,md} · renders/{final,gif,mp4,webm,poster,strip}
             aws-forgotten-resources/ (reference deck, 22 slides) · template-gallery/ (one slide per template; test fixture) ·
             lifetechfacts-intro*/ (logo intros: one custom slide written in seconds, no voiceover, hand-written timeline.json, drawn with window.LF;
             -intro = 5.6s rebuild of the original; ten 4s concepts, all kept (rendered horizontal + vertical, dark + light): -intro-boot / -orbit / -beats / -commit / -loaded / -silicon / -bits /
             -blueprint / -eclipse / -generate, each its own opening + the shared ending LF.resolve; light/dark via --var theme=, both canvases; sound = assets/sting.json cue list)
             lifetechfacts-comeback-thumbs/ (YouTube thumbnails: ten static 16:9 slides drawn with window.LFT, faces = cutouts in assets/faces; render each with --poster; KoHo Bold headlines by default, --var font=inter for Inter Display Black, scale to 1280x720 JPG)
             where-app-stores-data/ (17:58 16:9 master, deck only, no face; on the cloud-vs-devops layout: a `vertical` block (captions on at 1600)
               and social/, cuts.json = best-of + part-1..11, words.json force-aligned, youtu.be/YnKJV6QJ7u4. Its strata templates
               gained 9:16 branches: rail stacks top to bottom, stackcode stacks its panes, tiers wraps chips under the row, matrix
               turns its row labels on their side)
             where-app-stores-data-thumbs/ (twelve thumbnails in three design families, built from measured YouTube data in its research/findings.md; window.WT in its own kit.js; object photos under CC licences in assets/photos + assets/cut; no face anywhere. -v1/ is the superseded sixteen.
               slide 13 is the follow-up: ten curiosity hooks for the design that landed, one slide picked with --var v=01..10, each hook on a different photograph, rendered with --out renders/hook/vNN.
               slide 14 is family D: the w14 wordmark from dns-resolution-thumbs, a huge noun + an unskewed brand-blue bar set to the noun's
               width + cards down the right, on the plum radial ground. --var lock=app|local|device|where, --var flow=cats|plat|fan|chain|number,
               --var font=koho, --var bar=center, --var tune=1 (aligned stack + bigger card type); --out renders/word/<name>, uploads in renders/wordjpg. flow=platlogo carries real brand marks
               (Chrome/Firefox/Safari, Apple/Android, Apple/Windows/Linux) instead of drawn sprites. Sixteen combinations were explored and narrowed to five
               that ship, all lock=app font=koho. The other renders were deleted, the slide's tables were not, so any combination is one command away)
             dns-resolution/ + dns-resolution-cta/ (the CTA project holds one transparent slide: the subscribe bar that
             version B composites over the speaker's face; render it with --format mov --transparent)
             ai-in-every-app/ + -overlay/ + -reveal/ (one vertical talking-head rant, three treatments of the same 18 slides:
             the standalone full-frame deck · the superseded lower-half card pinned over the face for the whole runtime
             (PROJECT.overlay) · the reveal cut, full-frame deck that fades out inside a window so the face carries the line,
             with two named cuts in revealSets (tight = 5 windows, loose = 7); slides/assets/vo are symlinks, aroll.mp4 is the footage)
             dns-resolution-thumbs/ (YouTube thumbnails, two families, window.DT in its own kit.js. slide 01 = design 09 from the storage set
               rebuilt: one constant claim bar and ten curiosity hooks, --var v=01..10, --out renders/hook/vNN, uploads in renders/jpg.
               slide 02 = the DNS wordmark: huge noun + "how does it work" + a domain-through-rack-to-IP arrow, --var w=01..14 (+ 14.1 in KoHo),
               --out renders/word/wNN, uploads in renders/wordjpg; w14/w14.1 are the ones to ship, as 2560x1440 lossless PNG)
             dns-resolution-social/ + lifetechfacts-comeback-social/ (vertical social cuts of a finished master: cuts.json lists them
               (spans in force-aligned VO time, a best-of + a parts series with no internal edits, each <= 2:16 + a 4s end card =
               2:20), the master's splice to skip, the face windows [a, b, faceX] and `deck` = the horizontal project. The audio is
               cut first and the deck built for it: `npm run social-cut` rebuilds the source deck's windows and beats on words.json
               (scripts/align.py; whisper's own times drift up to 0.6s and clip words at an edit), keeps the slides the cut covers
               and re-times them to it (renderer/socialcut.js cutTimeline, a `subset: true` timeline), renders that deck on the
               project's vertical grid (safe.b 1560, above the caption band at 1600), dissolves the master's talking head in
               full-bleed (crop centred on the face), then burns in captions, the hook band at the top and the end card: the
               video's own thumbnail (assets/yt-thumb.jpg), its youtu.be shortlink and the end-screen sting. slides/ is a link per
               source slide + 990-hook/991-endcard (core/social/; 990 so they never collide with a deck's own numbers). Outputs in renders/social/<cut>/. The comeback master is
               ~/Downloads/LTF Comeback-.mp4, re-transcribed without its sting in source/; the root timeline/vo/captions.json are
               whichever pass rendered last. hop/anatomy/tree/figure and the DNS outro carry the vertical geometry tables these decks use)
             cloud-vs-devops/ (one project for the whole video, the layout new videos should copy: the 16:9 master, a `vertical: {…}`
               block in project.js (npm run assemble -- --variant vertical → renders/vertical/, frames/vertical/; slides carry data.v
               positions for the 9:16 stage, core/registry.js vfit scales the 800px column up to 960), and social/, a NESTED project
               for the social cuts: its index.html loads ../project.js first and social/project.js takes the vertical block, slides/
               links ../slides + core/social, cuts.json has deck "..", words.json is force-aligned. The cut's per-render
               timeline/vo/captions.json live in social/, so the master's are never overwritten. npm run social writes its post copy
               into the same social/ folder. Thumbnails: cloud-vs-devops-thumbs/)
             lifetechfacts-endscreen/ (20s branded plate for YouTube's end screen: empty video slots + subscribe circle; --var layout=one|two --var style=<intro concept>, ten styles in one slide's STYLES table)
assets/      shared fonts, outro marks, audio beds, logos/lifetechfacts (vector mark, wordmark, lockup + lf-logo.js, the kit intro slides draw with, + lf-thumb.js, the thumbnail kit, + build-sting.js, the sound builder: a projects/<slug>/assets/sting.json cue list becomes a wav, with synthesised cues plus `sample` for a supplied recording), SOURCES.md; logos/aws + logos/brands are on-demand caches filled per project (project.js → assets); .cache/ ignored
renderer/    project.js (discovery, syncIndex) · brand.js (core/brand.js in a sandbox, normalised) · platforms.js (every
             network: caps, targets, per-network shape strings) · config.js · args.js · browser.js (launch/openPage/inject) · pool.js · capture.js · assemble.js ·
             video.js (mp4/webm/mov/assembleMp4) · gif.js · cache.js · timeline.js · transcribe.js · captions.js · storyboard.js · cli.js
scripts/     thumb-export.js (npm run thumb: a thumbnail probed for YouTube's crops and overlays, exported as a PNG under 2 MB) · social.js (social.json → social.md, counts + gates) · social-cut.js (cuts.json → vertical social cuts: the cut's audio, a deck built for it, the master's face; maths in renderer/socialcut.js) · align.py (forced alignment of a vo.json with torchaudio MMS_FA, in the private venv assets/.cache/align-venv: torch/torchaudio 2.8, ~1.2 GB model in ~/.cache/torch) · dual-render.js (one capture → two masters, chunked, with optional intro/end-screen splicing and a CTA overlay) · splice-srt.js (captions.srt → the spliced master's .srt) · cutout.swift (macOS: person or object cutout PNG for thumbnails, Apple Vision; --mode subject works on hardware, not just people) · yt-research.js (Puppeteer: scrapes YouTube search + channel tabs, scores each video against its own channel's median, downloads a winner set, a matched control set and the topic's own shelf (topic.txt + topic-480.png), measures at 168x94; --queries required) · thumb-new.js (scaffold a -thumbs project) · thumb-check.js (screen-size + overlay + shelf sheets) · fetch-photos.js (CC0/PD/CC-BY object photos from Openverse + Wikimedia into a project's assets/photos, provenance straight into its SOURCES.md) · new-project · transcribe · script-to-storyboard · timeline · captions · fetch-assets · probe · strip · review · contact-sheet · preview · setup
skills/      new-video/ + new-thumbnail/ (every skills/* folder symlinked into .claude/skills, .agents/skills, .opencode/skills and ~/.claude/skills by `npm run setup`;
             setup also links social-copy from ../image-content-pipeline when that checkout exists)
test/        timeline (pure) · pipeline (gallery, both canvases) · projects (every project loads) · assemble (setTime, pool, encode) ·
             social (counts, caps, hashtag placement, the platform table) · socialcut (span snapping, splice mapping, face windows)
generated/   the original cursor-pagination deck. Reference only; never edit, never a build input.
```

## Commands
```bash
npm run video [-- --project <slug>]                                     # THE one command: wizard for a new project, or review → timeline → assemble for an existing one
./setup.sh  |  setup.ps1                                                 # one-shot bootstrap (Node, ffmpeg, whisper, npm install, assets, skill links)
npm run setup / npm run doctor                                          # Node-side part of that: tool check, missing assets, skill links
npm run new -- --slug <slug> --title "…" --canvas vertical|horizontal [--res 4k|1440p|2k|1080p] [--fps 60] [--captions on|off]
npm run transcribe -- --project <slug> [--audio file] [--model medium.en] [--prompt "brand words"]   # → vo.json + transcript.txt
npm run storyboard -- <transcript|script> --md                          # VO windows (whisper json, SRT/VTT, (m:ss) markers, prose)
npm run assets -- --project <slug>                                      # fetch the logos this project declares (aws / brands / urls); bare = fonts + outro marks
npm run review -- --project <slug>                                      # probe (must be 0/0) + posters + filmstrips + contact sheet
npm run preview -- --project <slug>                                     # scrub/play the deck at real time on localhost:4173
npm run timeline -- --project <slug> [--words [--slide 04] | --dry | --check] [--lead 0.10]   # cue sheet (+ word anchors + Beats) → timeline.json
npm run assemble -- --project <slug> [--jobs 4] [--preview] [--res 4k|1440p|2k|1080p] [--fps 60] [--max-size 2G] [--captions off] [--no-audio] [--var key=value] [--from S --to S]   # → renders/final/<slug>.mp4 (+ .srt); --var reaches slides as window.VARS (intros: theme=light); --from/--to = just that stretch as its own clip (2s intro cuts)
npm run social -- --project <slug> [--rules | --init [--platforms a,b] | --check]   # per-network post copy: you write social.json, this counts and gates it
npm run yt-research -- --out <dir> --queries "a,b" [--channels "@x,@y"] [--top 60] [--topic 24] [--min-age 21] [--only scrape|download|measure]   # what performs in a niche (thumbnails, and titles via --only scrape): winners + a control set, scored against each channel's own median
npm run photos -- --project <slug> [--subject "server rack"] [--per 3] [--dry]        # openly-licensed object photos + their provenance
npm run kit -- --project <slug> [--emoji "rocket, thinking face"] [--character dev --seed x [--options q] [--gestures point,ok]]   # alive kit: Fluent 3D emoji (MIT) + DiceBear Notionists characters (CC0) into assets/, logged in SOURCES.md
npm run sfx -- --project <slug> [--dry]                                  # sound effects from timeline beats → assets/sfx.wav (mixed by dual via PROJECT.cta.sfx); re-run after every timeline
npm run beat-frames -- --project <slug> [--match mj,burst,shake] [--off 0.7]   # frames at short-lived beats (stickers, bursts, shakes) → renders/beats/sheet.png
npm run render -- --project <slug> --slide 07 [--format gif|mp4|all|webm,mov --transparent] [--poster --t 0.5] [--timed]
npm run render:all -- --project <slug>                                  # every slide as clips (cached; --force to redo)
npm run thumb-new -- --video <slug> [--title "…"] [--out dir]           # scaffold projects/<slug>-thumbs from core/thumbs-skeleton (window.TK kit, starter slide, render.sh, research/)
npm run thumb -- --project <x>-thumbs --slide 03 [--var v=2 ...] [--name f] [--pick] [--force]   # one YouTube thumbnail: probe (GRID.thumb crop box, timestamp + hover corners, hook >= 120px, words >= 44px) → 4K poster → always a PNG under 2 MB (lossless 2560→1920, then 256 colours, then smaller lossless) in renders/candidates/; --pick → renders/<x>-thumbnail.png + deliver/
npm run thumb-check -- --project <x>-thumbs [--file f | --all]          # every screen: 1280/640/360/246/168/120 px with YouTube's badge, hover icons and progress bar drawn on, the edge crop, and a shelf test among the research winners → research/visibility/
npm run dual -- --project <slug> [--chunk 20] [--only a|b] [--resume] [--limit N] [--reveals <set>]   # two masters (deck-only + composited on footage) from one capture; PROJECT.reveals/splice/cta. PROJECT.revealSets = several named cuts (how much face the video shows); the name keys the work dirs and B's filename. Burned-in captions are re-added over every reveal from their own alpha capture, so they survive the ramp
npm run srt -- --project <slug>                                         # captions.srt (pre-splice master) → renders/final/*.srt, shifted for PROJECT.splice
npm run check-code -- --project <slug> [--allow-unchecked]               # every code file the video shows (projects/<slug>/code/) checked with the real tool (node --check, nginx -t, caddy validate, bash -n) → code.js (window.CODE); slides never retype code
npm run deliver -- --project <slug>                                     # projects/<slug>/deliver/: every finished file for the video, in video/ (masters, thumbnail, vertical cuts + srt + transcript, video copy) and posts/ (image posts + carousel + copy from ../image-content-pipeline), hard links, previews left out; dual, social-cut, social and the image pipeline's review/social refresh it themselves
npm run social-cut -- --project <slug> [--plan | --faces | --cut <name|all> [--preview]]   # vertical social cuts from cuts.json: the cut's audio, a deck built for it, the master's face, captions, YouTube end card; a cut whose master opens on the face opens on it too (PROJECT.reveals → faces + over slides as 9:16 overlays, cuts.json "reveals": open|all|off)
                                                                        # one-project layout: --project <slug>/social (the nested cuts project, see cloud-vs-devops)
npm run assemble -- --project <slug> --variant vertical                  # the same deck on project.js's `vertical` block → renders/vertical/final/<slug>-vertical.mp4 (any command taking --project accepts --variant)
assets/.cache/align-venv/bin/python scripts/align.py <vo.json> <out.json>   # force-align whisper's words (venv: python3 -m venv assets/.cache/align-venv && pip install torch==2.8.0 torchaudio==2.8.0)
npm test                                                                # node:test; needs ffmpeg + puppeteer's Chrome (~2 min)
```
`--project` may be omitted when `VID_PROJECT` is set or only one project exists. Slides can be given as slug, id (`s07`) or prefix (`07`).

## Defaults and conventions
- **House rules:** `skills/new-video/references/house-rules.md` holds the user's standing decisions from past videos (outro,
  safe zones, face windows, themes, thumbnails, LifeTech Facts handles and links). Read it before any video, thumbnail or copy work.
- **Timing comes from the voiceover, per word.** Each slide owns its line's window in `timeline.json`; the cue sheet's `Beats`
  column maps elements to spoken words (`r*:"a","b" badge:"word"! em:"key"`, `^` phrase −0.30s, `!` hero, `@s` explicit) and every
  element enters 0.10s before its word (`npm run timeline -- --words` to author, `--dry`/`--check` to validate); `dur` (default 5s)
  is only the fallback schedule. Holds are ambient (drift, breathe, headline sweep, hero ring), then the slide pushes out over
  0.4s. Canvas: ask (vertical 1080×1920 or horizontal 1920×1080; that is the CSS stage). Captions default on for vertical, off for horizontal.
- **Output quality: ask the resolution.** `project.js → resolution` (`--res` overrides) scales the capture, never the layout: horizontal
  `4k` 3840×2160 (default) · `1440p` · `1080p`; vertical `2k` 1440×2560 (default) · `1080p`. 60fps default (`fps`, 30 halves render time).
  H.264 crf 16 tagged bt709, bitrate capped so the final stays under `maxSize` (2 GB; `--max-size`; every vertical / social video is capped at 512 MB, which nothing raises). `--preview` = 1× half-size 30fps draft,
  never a deliverable but **always the first render**: every video gets a preview, the user watches it, and only then does the
  full-resolution master start. `npm run dual --preview` splices the intro and end screen like the master does and writes
  `renders/previews/<slug>[-variant]-preview.mp4` (assemble --preview too): every draft of a video, all looks, in that one folder, never beside the master. Once the full master is written, the run deletes its own draft (dual: the draft's mp4 and its frames/dual…-preview chunk cache; assemble: the -preview mp4 + srt; social-cut: the cut's -preview mp4/srt and its deck/source drafts), and an emptied previews/ folder goes too. `cfg.width/height` are the stage; `cfg.outWidth/outHeight` are the encoded pixels. GIFs stay ≤ 30fps.
- A slide is `defineSlide({slug, template, dur?, data})`; custom slides give `html(data, ctx)` + `frame(u, ctx)`. Ids auto-derive from the slug number.
- `frame(u, ctx)` must be a pure function of its arguments (no transitions, timers, `Date`, randomness); `ctx.local/T/hold/out/beats/exit` carry
  the clock; templates time elements with `const B = beats(c)` → `B.p(name, a, b, kind)` (beat when given, fraction fallback otherwise).
  Element ids are prefixed with the slide id; duplicates throw.
- Text lives in `data`, never hardcoded in templates. Badges/rowbars in sentence case. Key phrase of a headline in `<em>`.
- Grid geometry only from `core/grid.js` (CSS vars on `#stage`, `window.GRID` in JS; `GRID.cw`, never 960). Asset URLs are document-relative: `logo()`, `passet()`.
- Logos: official sources only (AWS Architecture Icons, simple-icons, brand pages); log every download in `SOURCES.md`.
  A brand simple-icons lacks (e.g. Amazon, removed for its brand terms) is never skipped: fetch it from the internet
  with Puppeteer or Playwright (the brand's own press/brand page first, then its Wikimedia Commons file page) into the
  project's `assets/`, and log the page URL in `SOURCES.md`.
- Keep `renders/{final,gif,mp4,webm,strip}`, `frames/`, `.whisper/` and voiceover recordings out of git; posters, contact sheets,
  `vo.json`, `transcript.txt`, `timeline.json`, `captions.json` and `social/` are committed so a review is reproducible.
- Before declaring a video done: `npm run review` clean and every poster + strip looked at, `npm test` green, ffprobe on `renders/final/<slug>.mp4`.
- Hand over `projects/<slug>/deliver/`, the one folder of finished files (video/ + posts/, git-ignored: it is links to renders), never the render folders.
- Brand defaults (handles, link-in-bio, audio bed) live in `core/brand.js`; override per project in `project.js → brand`.
- **`PROJECT.reveals` edges go on slide boundaries.** A ramp fades the whole captured frame, plate included, so a ramp
  that brings the deck *back* inside a slide's 0.4s push-exit shows that slide swimming up out of the footage just
  before the next one replaces it, and leaves a few frames of opaque, near-empty plate. Reveal edges and slide windows
  are both snapped to voice lines, so they collide unless placed deliberately: the deck leaves as a slide ends (`at` =
  a boundary) and returns as the next one starts building (`to` = a boundary). `npm run dual` warns when a return
  lands in an exit. `out: 0` runs the footage straight on with no return, e.g. into a splice.
