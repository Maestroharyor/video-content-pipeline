# House rules

Decisions the user has made across past videos. They apply to every run of `/new-video`, on any machine, on top of the
step references. Each says what to do and why it was decided, so an edge case can be judged rather than guessed.

## Setup questions

- **Always ask the outro.** Question 6 (outro + audio bed) goes in the first question batch on every run, never skipped.
  The default is NO music: the outro is the subscribe overlay (the YouTube action bar from core/components/subscribe.js,
  `PROJECT.cta.file` = projects/dns-resolution-cta's clip, scored to the channel's click sting) over the face, or as the
  deck's last slide when there is no footage. Outro music only when he asks for it (ai-concepts, 2026-10-19: "remove the
  outro song; unless asked, don't ever include it"). The footage's own close does not answer the question.
  The options always include the **personal brand outro** (the outro slide with core/brand.js's personal handles + the
  Braandly link box), on every video (free-apps-make-money, 2026-10-23: "Always include as part of the options").
- **Read "no outro song" as "the song is missing".** In review notes a terse "no X" usually reports that X is absent
  (what-makes-computer-faster, 2026-11-02: "no outro song" → he wanted the outro music added). Ask when unsure.
- **Outro is 5 to 6 seconds.** Never longer, whatever the music. Give the outro row a 5-6 s window
  (`npm run timeline -- --tail 5.5` when it is the last row; the row's VO window end wins over `--tail`). `npm run sfx`
  trims and fades longer music. Treat the timeline's "outro over 6 s" warning as an error.
- **Ask the title position on 16:9 decks.** Top (heading centred across the top, content under it) or left (heading column
  left, content right). Default top, never left silently. `npm run new --layout top|left`, `PROJECT.layout`. To compare
  an existing deck in the other layout, add a `--variant` block; never overwrite the original renders.

## Look and motion

- **A unique style per video.** Every new deck gets its own theme and motion language. Check what exists
  (`grep -H theme projects/*/project.js`), propose 3-4 genuinely different directions with a preview, ship the pick as a new
  `core/styles/<theme>.css` plus the templates it needs (dns-resolution owns `aurora` + hop/anatomy/tree,
  where-app-stores-data owns `strata` + rail/tiers/matrix/stackcode/quota). The channel publishes back to back, so a reused
  look reads as a template.
- **Content at eye level.** A slide's content block sits a little above the middle, never dead centre: keep
  `vcenter: true, vbias: 0.3` (0.5 is dead centre). On review, the block's middle sits above the frame's middle.
- **Logos everywhere, readable.** Every company or tool the script names gets its mark on the slide that names it. Rows
  with no brand get a Lucide icon instead of text only. simple-icons marks are black: on dark surfaces use a white tile
  (`.ltile`) or a light copy in the project's assets (recolour the path's `fill`, not just the `<svg>`).
  A brand simple-icons does not carry (Amazon, for one) is never skipped or replaced by a generic icon: fetch the mark
  from the internet with Puppeteer or Playwright (the brand's press/brand page first, then its Wikimedia Commons file
  page), save it in the project's assets and log the page URL in `SOURCES.md`.
- **Readable for everyone (accessibility).** Every text run on a slide meets WCAG AA against the paper it sits on
  (4.5:1, or 3:1 at 32px / 24px bold), no type under 16 stage px, and text keeps clear of its panel's edge. `npm run
  probe` checks all three on both canvases (CONTRAST, TINY, TIGHT; maths in renderer/contrast.js) and `review` will
  not pass until they are 0. Text inside a rebuilt page or app is illustration: list its containers in `project.probe.illus`.
  Never blend ink into the ground (`mix-blend-mode: multiply` made the case-file stamps vanish on the dark desk); text
  that lies straight on a dark ground takes the light ink. User, worst-week review 1 (2026-10-27): "Dont forget to
  address accessibility issues", "text overflowing, not enough padding".
- **Graphical over sparse.** A deck scene fills its content box with the thing itself (rebuilt pages, terminals, code,
  logos, figures, photos of the real artefact), not a few small cards on an empty ground. A new look restyles that
  content; it never replaces it with thinner props (worst-week review 1: the case file only won once it carried the
  news look's pages and logos).
- **Show the real UI.** When the script names a product's screen (Amazon's product page, a checkout), recreate that
  screen faithfully from a fresh Puppeteer screenshot of the live page: its header, layout, type, colours and buttons,
  not a generic stand-in.
- **Build UI mockups, code examples and code-editor UIs.** Dev explainers show the thing in code: an editor mock (tabs,
  line numbers, syntax colours, code typing on its words) beside the app screen it drives, plus DevTools and terminals
  where the script names them. Abstract tiles alone are not enough (frontend-one-click, 2026-10-24: "Ensure to include
  UI mockups, code examples and code editor UIs. Build them. Very important").
- **A sound on every point.** Every chip, tile, row or badge that lands gets a cue, and `scripts/sfx.js` varies them
  (pluck, swish, tap, boop, thump, clock tick, chime) rather than popping on everything. Name beats so they classify
  (`k<n>` chips, `c<n>` terminal typing, `x<n>` strikes, `e<n>` edges). New synth sounds go into
  `assets/logos/lifetechfacts/build-sting.js`. `PROJECT.sfx.palette = 'pop'` restores the all-pops mapping.

## New themes: four traps

1. **Alpha captures.** A theme linked after base.css that sets `#stage.theme-x{background:…}` beats
   `#stage.transparent` on source order, so every reveal window and social-cut text pass renders black. Scope the
   background to `.theme-x` without `#stage`, or add `#stage.theme-x.transparent{background:transparent}`. Only the
   composited preview shows it; master A, posters and the probe all look fine.
2. **Caption width.** base.css centres `.caps` with `left:50%; translateX(-50%)`, so it shrink-fits into ~540px and a
   five-word group drops its last word onto its own line. Add `width:max-content` to the theme's `.caps` rule.
3. **Cast and fx CSS.** Characters, speech bubbles, stickers and confetti are styled only in `core/styles/lanes.css`
   (cast block ~line 150, fx block ~line 296). Copy both blocks into the new theme or link lanes.css, or stickers pile up
   top-left. Check `renders/beats/sheet.png`. The probe does not catch it.
4. **Borrowed theme CSS hides your face cards.** Linking redline.css for its VS Code editor also brings
   `#stage.transparent .slide.ovs > :not(.rl-ov){visibility:hidden}`, which hides any other theme's over-face card in
   every `over` window (mongoose-vs-prisma preview 1: the face showed with no card). Add
   `#stage.transparent .slide.ovs > .<your-card>{visibility:visible}` after it, and check a frame inside each window.

- **Overlays on the left, splits that fill the panel, clicks that click** (ai-can-clone-apps, 2026-11-03). The
  over-the-face column goes on the LEFT of the face ("most people read from left to right"). A split slide gets its own
  compact layout scaled to fill the deck panel top to bottom, never the full slide shrunk to .75 ("it's not making use
  of the space at the top and bottom"). Every pointer press on screen gets the recorded mouse click
  (`PROJECT.sfx.clicks`, a JSON list of deck times) and a visible press.
- **The hook opens on overlays, not split.** Every face window before the intro splice is `over` (graphics on the
  full-frame face, clear of it); split comes later (php2shell, 2026-10-22: "on the first few seconds, use overlay and not
  split").
- **The intro cuts in a silence, on a slide boundary.** Put `splice.at` inside the pause before the next line's first word
  (measure it: `ffmpeg -af silencedetect` on vo.wav; the aligner's word start can trail the real onset), make it the
  boundary of both slides and face windows, and give the next slide `xf: 'cut'` so the outgoing one holds to the cut.
  php2shell: at the aligner's 27.347 a sliver of "He-" played before the intro and one frame of the wrong layout after it.

## Vertical and mobile

- **Safe zones.** On the 1080×1920 stage everything readable stays inside x 60-940, y 220-1500 (`GRID.mobile`); the
  posting apps cover the bottom ~420px and the right ~140px. `npm run probe` fails UNSAFE and SMALL (text under 28px). The
  user's explicit exceptions on social cuts: the hook band at the very top (0-124) and captions from 1560. When a placement
  request conflicts with the zone, give the measured numbers and ask.
- **Social cuts open on the face** when the master does, with the hook's slides laid over it as motion graphics, for about
  the first 10 s, so the networks' automatic cover pick is the face. `npm run social-cut` does this from
  `PROJECT.reveals` (cuts.json `"reveals"`, `"openFace"`). Check the first frame of each preview.

## Footage and face

- **Face windows: every lens stretch, and only lens stretches.** He repeats this on every video, so it is a step, not
  a judgement call. Show the face (over, split or footage) wherever he holds the lens, and never while he reads the
  prompter. Procedure, before the storyboard gate and again before the first preview:
  1. `scripts/gaze.swift` on 4 fps FULL-face crops of the footage → `gaze.csv` (an eyes-only crop gives Vision no face).
  2. `python3 -I scripts/lens-runs.py gaze.csv --timeline timeline.json` calibrates on THIS video (2-means on eye
     darkness + lid openness + pupil height) and prints every lens run of 6 s+ with the slides it covers and the
     latest `to` for it. Fixed constants from an older
     recording failed (ai-concepts: a reading stretch scored 77% "lens", lens stretches mid-video got no face).
     **The 2-means split can still be wrong on a take** (worst-week review 2: it put a reading stretch on the lens
     and missed the trend intros). Whenever he names stretches ("I'm looking at the camera here", "not looking
     here"), print the darkness median of each labelled span, pick a threshold between the two groups and rerun
     with `--dark T` (0.485 on worst-week); every one of his labels must come out right before a window is written.
     Never place a split or over window that does not start inside a lens run.
  3. Judge per frame, not per slide: a window starts and ends on word starts inside the run, mid-slide when the run
     starts mid-slide, with a .45 s ramp (`in`/`out`). Text-light scenes go `over` the face; diagram scenes `split`.
     **End the face early:** the fade-out must be finished a full second before the run ends (`to` = run end - 1 - out),
     or the ramp shows him already looking down (ai-concepts review 2, every window). The fade-in may start on the run.
     **Ramps are .3 s and seamless:** a fade between a split/over window and the full deck must dissolve one layout
     into the other, never pass through the bare full-frame footage. `npm run dual` does this for every ramp of an
     `over`/`split` window (it captures the window's alpha layout under the fading deck); after any change to
     dual-render.js, pull frames inside two ramps of the preview and confirm no frame shows the footage alone.
     **No slivers:** a window never ends or starts within ~1.5 s of a slide boundary, or the full slide flashes for
     half a second between the face and the next scene. Snap such an edge to the boundary (the ramp ends on it).
     `npm run dual` warns about every sliver; fix them all before the preview.
  4. Check any doubtful run on an eye sheet (2 fps eye crops): on the lens the iris sits centred with white below it;
     reading, the lids drop and the iris rests on the lower lid.
  5. List the windows for him at the preview. He has the last word: never keep a window he says he was not on the lens
     for, and add the ones he names.
  The teleprompter sits by the lens, so eye openness alone misleads; the older per-video constants are in
  scripts/lens-windows.py for reference. Scan the A-roll for transitions baked into his edit
  (`select='gt(scene,0.25)'`) and cut before the first blurred frame.
- **Screencast tutorials.** The screencast carries the demo. Full-frame slides only for the hook, explainers and the
  close. During the demo, footage only, with a compact card only when it says something the screen does not, and never
  over the code being typed, the element being animated, or a face-cam interlude. Check each card against the real footage
  frame. Preferred full-frame layout: heading centred on one line across the top, the scene full width underneath, no busy
  diagrams. Non-16:9 recordings get `PROJECT.sourceFit: 'contain'`. Force-align (`scripts/align.py`) before trusting slide
  starts near long pauses.

## Content and delivery

- **Screenshots whole and tall.** A webpage on a slide shows whole inside its card (scaled to fit, never cut off)
  and as a tall crop of the full capture (headline plus first paragraphs), not a thin headline strip (php2shell, preview 3).

- **Clean background noise with `npm run denoise`.** iPhone takes pick up the fan through the phone's own mic. DeepFilterNet
  (`--atten 100`, the strength he picked by ear on why-fastapi-is-fast) takes the floor from about -43 to -76 dB while every
  voice band moves by the same ~2 dB, which the script's loudness match restores; Audition's denoiser thinned his voice.
  It keeps `vo-original.*`, writes `vo.wav` and `<footage>-clean.mp4`; point `project.js → source` at the clean footage,
  because `npm run dual` takes the voice from the footage. Run it before the first preview.
- **Never denoise a finished edit.** When the footage is his own finished edit (transitions, sound effects and a music
  bed already mixed in), DeepFilterNet strips the bed and the effects (what-makes-computer-faster, 2026-11-02: "Add back
  the sound effects"). A raw take has sentence gaps below -45 dB; a mixed edit never drops that low
  (`ffmpeg -af silencedetect=n=-45dB:d=0.25` finds none). Level only: `npm run denoise -- --atten 0`.
- **Voice at -14 LUFS.** The phone apps play at about -14; a raw iPhone take sits near -22 and reads quiet in the feed.
  `npm run denoise` levels the voice there by default (gentle compressor + two-pass loudnorm, true peak -1.5 dBTP;
  `--lufs match` keeps the original level). Without denoise, run it with `--atten 0` to level only.
- **Outro music only on request.** When he asks for it, it rises under the spoken CTA: it starts with the outro slide
  and fades in over ~2.5 s (`sfx.outroFadeIn: 2.5`). Otherwise `sfx.outroBed: false` and the subscribe overlay closes.
- **Code types character by character, and only then clicks** (flutter-vs-rn-styling, preview 1, 2026-10-27: "Should be
  typing animation or if we're sticking with scroll, no sound effects"). Key clicks come from the measured typing
  (`PROJECT.sfx.typed`), never from a beat alone under code that wipes or scrolls in. The editor is an accurate VS Code
  (Dark Modern chrome, Dark+ tokens: core/templates/redline.js rlVsc, ported from frontend-one-click's FE.ed), and phones
  are accurate iPhones (Dynamic Island, status bar, side buttons), never a bare rounded rectangle.
- **Pops only where a point is listed, typing wherever text types** (ai-concepts review 7, 2026-10-21, replacing the
  10-19 rule). `PROJECT.sfx.pops = 'list'`: a numbered beat series on one slide (q1 q2 q3) and each slide's hero beat
  pop; other landings stay silent. A prompt or command that visibly types gets recorded key clicks via
  `PROJECT.sfx.keys = {'<slide>': {<beat>: <chars>}}`, a little under the pops.
- **Counted terms are shown big.** When a video counts terms (a "40 terms" list, a numbered countdown), every term is
  shown big and bold the moment it is said, then lands in the counter, so the viewer can count along
  (projects/ai-concepts/kit.js `.tc-flash`). A small tab alone is not enough.

- **Verify spoken numbers before the storyboard gate.** Check every figure in the recording against the primary source
  (the README on raw.githubusercontent.com, the vendor's blog, the GitHub API for revision history). An understated
  figure is safe to print. A contradicted or mis-attributed one means that slide shows the shape without the value, or
  the line is re-recorded. Record the comparison in the project's `SOURCES.md` and raise it at the gate as a decision.
- **Every "subscribe" line gets the subscribe bar,** mid-video too, over the face (`PROJECT.cta.also`, worst-week
  review 2: "The subscribe part shows no subscribe overlay").
- **Preview before the full render.** Render the preview, hand over the path, wait for approval, then start the master.
  With a splice: `npm run dual -- --project <slug> --only a --preview --source <vo>`; without:
  `npm run assemble -- --project <slug> --preview`.
  **Every preview of a video lands in ONE folder, `projects/<slug>/renders/previews/`**, every look/variant and every cut
  side by side, named `<slug>-<variant>[-reveal]-preview.mp4` (renderer/config.js `previewDir`; dual and assemble both write
  there). Never per-variant `renders/<variant>/final/` for a draft (user, 2026-10-27: "All previews should always be in the
  same folder"). Hand over that folder path.
- **Outputs in one flat folder.** Everything the user browses (every candidate, every review sheet) goes in one folder
  with descriptive names; review sheets prefixed `0-` so they sort first. No per-family or per-variant subfolders.
  Vertical social cuts: every cut's previews and finals in ONE folder, the first cut's own social-cut folder
  (`projects/<slug>/social/renders/social/best-of/`); link the other cuts' outputs in there. Never a new folder
  mid-video, never `deliver/` (user, 2026-10-22: "Always keep the folders consistent" / "Dont move into deliver folder
  ever again"). Image posts likewise: the image project's own `out/`, every card, carousel slide and contact sheet
  hard-linked flat into it; `review` links into `deliver/posts/`, so remove that afterwards (php2shell, 2026-10-22).
- **Copy the folder when done.** Whenever a render or delivery finishes (a preview, a master, `deliver/`), copy that
  folder's path to the clipboard (`printf '%s' <dir> | pbcopy`) and say so; never `open` it in Finder unless asked
  (what-makes-computer-faster, 2026-11-02: "Always copy dir when done").
- **Finished files in `projects/<slug>/deliver/`.** Every final for a video (masters, thumbnail, vertical cuts + `.srt` +
  transcript, the image posts and carousel from ../image-content-pipeline, all post copy) is hard-linked into that one
  folder, split into `video/` and `posts/` (user, 2026-10-21: "Video should be separate and posts separate"), by `npm run deliver`, which `dual`, `social-cut`, `social` and the image pipeline's `review`/`social` run
  after every final write. Previews never land there. Hand the user that folder, not the render folders.

## LifeTech Facts

- **The name on screen** is one word, **LifeTechFacts** (as in the wordmark), never "LifeTech Facts".
- **Handles.** @lifetechfacts on YouTube, Instagram and Facebook (the `…official` suffix is stale). No link-in-bio box,
  accent blue (`b`). `core/brand.js` defaults to the personal identity and `Object.assign` is shallow, so a LifeTech Facts
  project sets `brand.handles`, `brand.box: null` and `brand.accent` explicitly (copy the block from an existing
  LifeTech Facts project).
- **Published videos** (watch-next links; reuse the live thumbnail from `i.ytimg.com/vi/<id>/maxresdefault.jpg`, since the
  thumb projects hold many candidates and do not record which shipped):
  - DNS Explained: The 4 Servers Behind Every Page Load, https://youtu.be/cF1y_R49NJM
  - I Disappeared From YouTube. Here's What Actually Happened, https://youtu.be/qxa6_sVpoVk
  - Why AI Forgets: Context Windows Explained, https://youtu.be/dOr7FnwLAIM
  - LocalStorage vs IndexedDB vs SQLite: Which Should You Use?, https://youtu.be/YnKJV6QJ7u4
  - MCP Server Tutorial: Turn Your REST API into AI Tools, https://youtu.be/FIe3RBiwA3A
  - MCP vs API: Why MCP Won't Replace Your APIs, https://youtu.be/ytRfvVsWnBE
  - Learn Every AI Term in 12 Minutes (ai-concepts), https://youtu.be/EcVsa3kXfj4
  - Every Backend Technology Explained in One Click (backend-one-click), https://youtu.be/i8RKMpUtCBc
  - Web Rendering Patterns: All You Need To Know, https://youtu.be/JB2wRNqKZFE
  - The PHP Bug That Made Governments Go Offline (PHP2Shell), https://youtu.be/aLFcdcoWBdI
- **Never delete renders without asking** (user, 2026-11-04: "Why did you delete the directions and other variants?
  Always ask for approval"). Candidates, variants, directions, drafts and any render the user has not named for
  deletion stay on disk until the user approves that exact deletion in their own words. A pick, an "ok", or an offer
  ("…and delete the rest?") left unanswered is not approval: list what would go, ask, wait. Pipeline steps the user
  asked to automate (a master deleting its own preview) are the only exception.
- **Thumbnails are made with `/new-thumbnail`** (skills/new-thumbnail; user, 2026-11-04: "the pipeline … should have [a]
  skill for thumbnail creation and should include research, suggestions, checks against various screens"). Research
  first (`npm run yt-research`, the topic sheet, a web pass on YouTube's specs), directions approved before building,
  `npm run thumb-check` on every candidate (every screen size with YouTube's overlays, the edge crop, the shelf test).
  The pick ships as one PNG under 2 MB (see the export rule below).
  Offer a Test & compare trio (YouTube tests up to 3 and picks by watch time share, not clicks).
- **Thumbnails.** KoHo only (`--var font=koho`). Once one is picked, ask whether to delete the other candidates (keep
  them until the user says yes); the slide code always stays. A competitor's thumbnail is an idea to borrow, never a layout to clone: recompose it in the brand (huge white KoHo
  type, real logos, the LF mark) and offer two or three distinct compositions. **Ground: the video's own theme**, never
  the default plum radial with a blue glow (he dislikes it; backend-one-click uses the metro charcoal, coloured lines and
  ring stations). **Ask before using the face**; backend-one-click's thumbnail is faceless.
- **A question thumbnail never answers itself** (user, 2026-11-04, ai-can-clone-apps: "we shouldn't have the not equal
  sign to not give hint as to the conclusion. Should be or or /", "to show we're weighing options"). Two sides go
  under equal light with equal spacing, joined by OR or "/", never ≠, and neither side gets a winner colour (both labels
  in one neutral colour). A struck-out hook word also gives the verdict away, so offer the plain question first.
- **Thumbnail safe space** (user, 2026-10-28: "enough safe space so the texts are readable in all screen sizes"). On
  the 1920x1080 stage every word and logo sits inside x 96-1824, y 108-972 (wider players and some feeds crop ~10% top
  and bottom). Nothing goes in the timestamp corner (x > 1530 and y > 850: the badge is a fixed size, so it covers about
  a fifth of a sidebar thumbnail), and nothing goes in the hover corner (x > 1730 and y < 330: Watch later, Add to
  queue). The hook is at least 120 px and every other word at least 44 px. `npm run probe` enforces all of it
  (`GRID.thumb`, THUMB-SAFE/BADGE/HOVER/SMALL) on any project with `PROJECT.thumbs`; the channel mark (`.pt-mark`) is
  exempt and sits bottom-left.
- **Thumbnail export: `npm run thumb`, never by hand.** It probes the design (and refuses a failing one), renders the 4K
  poster, then keeps the best **PNG under 2 MB** (user, 2026-11-04: "Render always in png and under 2mb"; this replaces the
  2026-10-28 JPEG fallback): lossless from 2560 down to 1920 px wide, then 256 colours dithered at 2560/2240, then lossless
  1760-1280, then 256 colours at 1920. Never a JPEG, never over 2,000,000 bytes, one file for phone and desktop uploads (the
  3840x2160 desktop twin was tried and dropped the same day). `--pick` writes `renders/<slug>-thumbnail.png` and refreshes
  deliver/.
- **YouTube copy.** Descriptions tease (two to four lines on the problem, never the answer), then links (watch-next, subscribe,
  Instagram, Facebook), then hashtags. No timestamps or chapters unless asked, never on a Short. Titles come from niche
  research (`npm run yt-research -- --only scrape`), offered as 3-4 options. The social-copy skill encodes the same rules.
- **YouTube chapters (when asked).** YouTube's documented rules: the first timestamp is 0:00, at least three in ascending
  order, every chapter at least 10 s, no active strike on the channel, nothing that "may be inappropriate to some viewers".
  It states no maximum. Past those rules YouTube may still withhold a list, without saying why: on this channel 25, 20 and 8
  chapter lists were rejected (worst-week: 8 in 9:02), while 11 in 4:57 (php2shell) and 16 in 18:00 were accepted, so neither
  count nor density alone decides it. What has fixed it every time is a shorter, broader list saved again (worst-week: 6).
  Start with one chapter per 60-90 s and one per named topic. Check a live video with curl: `DESCRIPTION_CHAPTERS` on the watch
  page means it was accepted; `MARKER_TYPE_TIMESTAMPS`, or no marker at all, means it was not.
