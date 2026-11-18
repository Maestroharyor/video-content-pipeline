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

- **Every vertical / social-media video stays under 512 MB** (the user, 2026-11-08). renderer/config.js caps `maxSize` at
  512 MB on the vertical canvas (masters, social cuts, previews); neither project.js nor `--max-size` can raise it. 16:9
  masters keep their 2 GB budget. ffprobe the size before handing a cut over.
- **Safe zones.** On the 1080×1920 stage everything readable stays inside x 60-940, y 220-1500 (`GRID.mobile`); the
  posting apps cover the bottom ~420px and the right ~140px. `npm run probe` fails UNSAFE and SMALL (text under 28px). The
  user's explicit exceptions on social cuts: the hook band at the very top (0-124) and captions from 1560. When a placement
  request conflicts with the zone, give the measured numbers and ask.
- **Social cuts open on the face** when the master does, with the hook's slides laid over it as motion graphics, for about
  the first 10 s, so the networks' automatic cover pick is the face. `npm run social-cut` does this from
  `PROJECT.reveals` (cuts.json `"reveals"`, `"openFace"`). Check the first frame of each preview.
- **A best-of is self-contained.** Never one item of a numbered series (a lone "Fix 3" with the tracker's 1-2 done and 4
  "?") or a line that calls back to cut material: the whole series or none (sessions-vs-jwt, 2026-11-15: "Remove the fix
  part as its cut and some parts arent making sense"). On the portrait slides, drop what the cut never sets up (analogy
  tags, a fixes tracker) with `data.v.pos[id].drop: true`.
- **Measure every span edge before a social preview.** The aligner can end a word early when the next one follows with no
  pause, and the cut drops a final "s" (sessions-vs-jwt: "Usually in redis gets cut off. The 's' isnt pronounced").
  Check 2.5 kHz+ energy 40 ms either side of each edge; if the kept side is loud, fix that word's times in words.json
  to the measured audio and end the span in the gap. Whisper on the preview does not catch it.

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
     or the ramp shows him already looking down (ai-concepts review 2, every window).
     **His own times are exact** (reverse-proxy review 3: "You didn't follow the timestamps I provided"): when he lists
     the stretches he was on the lens, each window starts and ends on his times (mapped to deck time, shifted for any
     pauses), never trimmed by the early-fade rule and never snapped to a slide boundary. The early fade is only for
     runs the detector proposes.
     **Confirm the clock his times are on** (review 5: a whole round of windows was 4 s early because his times were
     read without the intro while they were mapped as preview times). Before writing windows, check one of his times
     against a frame: what is on screen at that second of the preview, and is he on the lens there. Say which clock
     you used when you report the windows. The fade-in may start on the run.
     **Ramps are .3 s and seamless:** a fade between a split/over window and the full deck must dissolve one layout
     into the other, never pass through the bare full-frame footage. `npm run dual` does this for every ramp of an
     `over`/`split` window (it captures the window's alpha layout under the fading deck); after any change to
     dual-render.js, pull frames inside two ramps of the preview and confirm no frame shows the footage alone.
     **No slivers:** a window never ends or starts within ~1.5 s of a slide boundary, or the full slide flashes for
     half a second between the face and the next scene. Snap such an edge to the boundary (the ramp ends on it).
     `npm run dual` warns about every sliver; fix them all before the preview.
  4. Check any doubtful run on an eye sheet (2 fps eye crops): on the lens the iris sits centred with white below it;
     reading, the lids drop and the iris rests on the lower lid.
  4b. **Before every preview, an eye sheet for every window** (2 fps eye crops across the whole window, not just its
     edges). A window with frames off the lens is cut back to where he is on it. Reverse-proxy review 1 (2026-11-11): four
     windows were drawn where he read the prompter ("Not looking at the camera here"); the 2-means split had to be
     recalibrated with --dark from his labels.
  4c. **Over = the backend-one-click overlay**: the left of the frame darkens under a gradient fade, the heading sits
     top-left and each point is its own row under it, terms in their own style. Never an opaque card on the face, never a
     single card holding every point. The fade covers only the text column. Diagram scenes inside a lens run go
     **split** (face on the left third, the slide in the right two thirds on its own plate; reverse-proxy review 2:
     "Still no split view"); text-light scenes go over.
  5. List the windows for him at the preview. He has the last word: never keep a window he says he was not on the lens
     for, and add the ones he names. **A window he watched and did not flag stays** when the detector is recalibrated
     (reverse-proxy review 2: a stricter cutoff silently dropped s24, s30, s35, "places I'm showing my face and not
     showing again now"): recalibration removes only what he flagged, and anything else it would drop gets an eye sheet
     first.
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
- **No real names on screen: a neutral made-up one** (reverse-proxy-lb-gateway review 1, 2026-11-11). Terminal prompts,
  usernames, file paths and sample accounts use a plain made-up first name such as josh (`josh@MacBook-Pro ~ %`,
  `/Users/josh/…`), never the user's own name or handle.
- **Code is never cut off and always formatted like prettier** (same review: a JS line ran past the editor's edge, nginx
  upstreams sat on one line). One statement per line, blocks on their own lines (`upstream products {` / one `server` per line
  / `}`), JS through prettier (printWidth 80). The editor fits its longest line (the font steps down to a floor of 16 px; past
  that the file is reformatted, never clipped). `npm run check-code` fails long lines and one-line blocks.
- **Nothing answers before the voice does** (same review: "It covers the core" was on screen before he asked "So is Nginx a
  full API gateway?"). A heading or item that states an answer enters on the words that say it, never on the slide's first
  frame; a slide whose line opens with a question shows the question first.
- **Arrows guide every flow.** A request path, a routing decision, someone pointing a guest: an arrow (drawn on, arrowhead)
  shows where it goes, and a request that travels does so along a visible path that stays on screen long enough to follow
  (same review: "No arrow guiding", the three-jobs path "only shows for half a second").
- **Requests move as arrows, on straight lines** (reverse-proxy review 2: "all the dots have curved movements, I don't like
  that and I prefer it with arrow moving"; "the dots is very wrong and annoying"). A request is an arrow drawing itself
  along a straight drawn path with the head at the tip, never a glowing dot easing along a curve or sliding in from
  somewhere else before it snaps to its path (an entrance animation stacked on a walk does exactly that). No `bend` on
  flow edges. Load balancing shows an arrow to every backend in turn, and a backend that is taken out stops getting them.
- **No overlap, checked by the probe** (same review, "No overlap. Add to pipeline"). No text runs into other text (a pill
  laid over a pill, a callout over a caption) and no diagram line crosses a label. `npm run review` / `scripts/probe.js`
  reports `OVERLAP a × b` and `OVERLAP line <edge> through <label>`; it must be 0 like every other probe check. Labels sit
  centred on the thing they name (a "Layer 7" pill level with its request card).
- **No left accent bars on pills or rows** ("I don't really like border left AI-like look"). A row is a filled, tinted icon
  chip + text; a card can carry its role colour on the top edge.
- **Characters are never colour-inverted.** Black line-art characters on a dark ground get a light sticker outline instead.
- **Editors scroll like the real app** ("the UI should scroll like a normal UI"). The line being typed is always in view;
  code written above it scrolls away naturally and the view glides back up when the voice returns to it (bistro `scroll:
  [{b, row}]`). Never hide the top of a file while it is typed, never number lines out of order.
- **The ground moves** (same review, "like the backend video"): grain, faint routes and the video's objects watermarked at
  about 5%, drifting slowly. A flat dot grid is not enough.
- **The outro shows the YouTube channel itself** (a screenshot of the channel page, captured with Puppeteer and logged in
  SOURCES.md), not a list of other networks.
- **An arrow never crosses a card or starts before its card** (review 3, "arrow moves across cards and even before cards
  show up"). A path through several stations is one arrow per hop, in the gap between two cards, drawn on that station's
  word after its card is in, left drawn so the path builds up. An arrow runs exactly along its drawn line (no bends the
  line does not have). The probe's SPILL check also fails text running out of its own card (review 3: "overflow issues").
- **The face window decides the layout, not the slide** (review 4: a split window ran into a slide that was not marked
  split and drew it full width over the face). bistro reads PROJECT.reveals at render time: inside a split window any slide
  shrinks into the right two thirds with the moving ground on its plate; inside an over window the slide's overlay rows
  sit on the face (a slide with no rows goes split). Nothing in a split may sit left of the panel edge (the tracker moves in).
- **The overlay stays clear of the face and every row has an icon** (review 3: "All overlays should have icons", "overlap
  with my face"). The over column is about 520 px from the left edge, heading ~50 px, rows ~26 px and wrapping inside it;
  nothing is added to the right of a row. An icon tile is a filled colour with the icon dark on it.
- **Raw footage is always asked about, and never cut before the take list is approved** (user, 2026-11-11: "whenever I
  supply a raw video that is uncut, prompt me whether to cut it, and I provide the script so it cuts according to that").
  Every recording handed over gets the question raw or edited; raw goes through `npm run rough-cut` against the script
  (or `--no-script`), the user reviews `source/takes.md` (last complete take of each line by default, doubtful ones
  flagged), and only then `--stage cut` (Step 1a).
- **A cut raw take flows: no pause inside a sentence, no repeated word** (undo-git-mistakes, 2026-11-11: "Pauses in
  between sentences or sentences that should flow without pause. Fix ... Remove all repeated words"). Mid-sentence joins
  0.12 s (`edit.json` → `joins`, classified against the script, never whisper's punctuation), sentence joins 0.2-0.3 s
  (`maxGap` 0.3), sections 0.6 s. Whisper drops a repeated phrase inside one island, so a slow island is checked at its
  quiet dips (each side transcribed with no padding) and cut only at a real dip, never at whisper's word times.
- **An extra beat in the voice comes from the raw take, or not at all** (review 4: "Don't just pause and insert empty frame.
  Check the original video, there should be space to cut"). First measure the raw silence at that join (source/islands.json,
  edl.json); if the take has the room, widen the gap in the edit. Only when he asks for it anyway and the face is on screen,
  `npm run pauses` with `fill: { hold: 'bounce' }`; a bounce he can see (it read as a glitch before "the load balancer") is
  dropped. Every time after a pause shifts: re-time windows, cues and the CTA.
- **Split windows wipe, they never dissolve** (reverse-proxy-lb-gateway, review 6: "why is the code editor transparent"). A
  crossfade between the split view and the full deck drew both layouts at half strength for the ramp, so an editor read
  as see-through. With `split: { …, wipe: true }` the deck's plate grows over the face (or shrinks off it) and dual-render
  lays that capture on the face with no dissolve. Footage that turns unusable inside a window (a cut to black before the
  intro splice) is held on its last clean frame with `split.freeze` (review 6: "a black bar on the left").
- **The same file on consecutive slides stays put** (review 6: "same code block here, no need to transition"). The next
  slide cuts in (`xf: 'cut'`) with the editor at the same place and size, the shared lines already there (`pre`/`keep`, so the
  rows match the slide before one for one) and only the new lines typed. The gutter numbers the rows on screen, like a real
  editor: lines still to be typed push nothing down.
- **The line being typed is always on screen** (review 7: "plays the typing sound while it scrolls up, as if something is
  still being typed"). Typing finishes before a scroll entry moves the view (`blocks[].by`), the view never leaves the caret
  while keys sound, and it keeps two rows of room under the typed line, gliding there when typing jumps down ("should
  scroll down when typing this").
- **A route not taken is still drawn, muted** (review 7, the load balancer picking orders #2: "show the arrow to the others
  also, but not active, greyed out"). The choice reads as one of several.
- **Icons draw their dots as filled circles,** never zero-length strokes: those vanish wherever the icon is drawn without
  round caps, and the "?" read as cut off in the cards (review 7).
- **A check goes to the thing that checks** (review 6, the maître d': "should the reservation check point to the
  reservations desk?"). When a scene names a desk or service for a step, that step's arrow reaches it.
- **Restaurant-style metaphors read best as a floor plan from above** (review 3: "closer to the initial diagram, easier to
  show the request path"): rooms in a row, the door in a wall, one straight lane the request walks.
- **Illustrations stay simple.** One idea lit at a time, few props and people; a busy scene with labels everywhere was
  "too crowded".
- **Every code example is real and checked, and shown in a real UI** (reverse-proxy-lb-gateway, 2026-11-11: "ensure all the
  code examples and snippets are correct and use real UI mockups where possible"). The complete files a video shows live in
  `projects/<slug>/code/`; `npm run check-code -- --project <slug>` checks each with the real tool (`node --check`,
  `nginx -t` in a scratch prefix, `caddy validate`, `bash -n`, JSON.parse, and every `.sql` file run statement by statement
  on a real Postgres, see step-3-build.md) and writes `code.js` (window.CODE). Slides read
  `CODE[file]` or an excerpt of it with the file's own line numbers (`start`), never retyped lines, and a stage of a file
  that changes on screen (a header added, a method swapped) is its own checked file. The run must report 0 FAIL; an
  UNCHECKED file (no checker on this machine) is raised with the user, never passed silently. Claims about defaults
  ("random if you leave it out") are checked against the tool's own docs and noted in the cue sheet. Code, commands and
  screens sit in real app UIs (VS Code Dark Modern, macOS Terminal, Chrome + DevTools, the AWS console), never a bare
  code card.
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
  **This covers vertical social cuts too:** every new cut renders `npm run social-cut -- … --cut <name> --preview` first,
  and the full cut waits for his approval of that preview (user, 2026-11-15, how-llms-are-trained best-of rendered
  straight to final: "Never render full version until preview is approved").
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
  - Client - Server Authentication: Authentication Methods Explained (With Pros & Cons), https://youtu.be/k-Be8fVJ3G8 (older upload, no project in this repo; the watch-next for any auth video)
  - JWT vs Session Authentication: Logging Out Doesn't Log You Out (sessions-vs-jwt), https://youtu.be/QRLxsBZJ1nI (thumbnail: 07-row v9, Session OR JWT)
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

## undo-git-mistakes, review 1 (2026-11-12)

- **A fresh made-up name per video.** josh was reverse-proxy's; "Dont use josh. Use another name". Set `PROJECT.prompt`
  (bistro and gitgraph terminals read it) and use the same name for any scripted repo's author and remote owner.
- **Code is readable before the slide leaves.** "Whenever we're dealing with code, at least the user should be able to see
  it briefly before it just transitions." The last typed command and its output get ~2 s on screen before the exit; when
  the voice moves on sooner, `npm run pauses` inserts a hold in the silence before the next slide's first word, then the
  cue sheet, splice and reveals are mapped into paused time (renderer/pauses.js `shiftTime`).
- **Gaze wins over slide boundaries.** A face window ends (fade done) a second before his lens run ends and starts inside
  the run, even when that leaves part of a slide full frame; never stretch a window to a boundary past the run ("We should
  not have this frame where I changed my gaze"). dual's sliver warnings are then expected; only a ramp inside a slide's own
  exit must still be moved.
- **The probe catches item overlap, card padding and clipped text** ("Add to the pipeline. There should be no overlap and
  overflow"): `OVERLAP item a × b` (scene items crossing without one holding the other), `TIGHT … from its card edge`
  (10 px inside any filled or bordered item, gradients included) and `CLIP` (text a box cuts off). All must be 0.
- **Graphs name their commits.** Story commits carry their letter (A, B, C, D) beside the ring so viewers can follow; a
  reset leaves the commit as a dashed ghost (unreachable, not deleted) so the reflog can bring it back.
- **The ground stays out of the text.** Theme marks and lanes live in the margins outside the content box, at ~5%.
- **Status letters are explained where they appear** (lines from M / D / A / U to their meaning), and named UIs (Chrome's
  History page) are rebuilt from a live capture, not from memory.
- **Every subscribe bar clicks on its word and sounds**: start the tour SUB.CLICK (2.98 s) before "subscribe"
  (`over.sub.lead`, item `t0`) and place the channel sting there (sfx cues).

## undo-git-mistakes, review 2 (2026-11-12)

- **A sound needs something on screen.** Key clicks over the face with nothing typing ("there is a typing sound … without
  showing anything") are wrong: an over window whose slide types gets a small Terminal in the overlay column
  (`over.term`, bistro), typing on the same beats as the deck.
- **App code is TypeScript, and real-sized** ("use TypeScript … the real life function, slightly bigger, more complex"):
  `.ts` files, VS Code's TS icon and TypeScript mode, a function with types and branches, not a three-line stub.
  check-code parses `.ts` with Node's own TypeScript parser (syntax, not types).
- **An analogy that tags a recurring panel tags it every time**, quietly (outline, 16 px mono), once it is taught; a tag
  on some scenes and not others "feels orphaned". Taught solid on its own slide, quiet everywhere after.
- **No slide shows for under a second at a face window's edge** ("this frame only shows for a split second"): pin the
  neighbouring slide boundary to the window edge (cue sheet `=m:ss`, xf cut), run a window that reaches a splice into it
  (out 0), and end the outro with the footage (`PROJECT.tail`).
- **A pause can also cut** (`[at, -seconds]` in PROJECT.pauses removes that much silence; review 4 halved the gap before "So, which one" this way).
- **A reading hold sits in the quietest 10 ms of its silence**, measured on the unpaused voice, never a fixed offset
  before the next aligned word: aligned starts run late, and a hold placed 0.03 s early cut the "S" off "So". A word the
  aligner straddles across a hold moves after it (renderer/pauses.js shiftWord).
- **The probe checks text laid on a panel and Terminal room**: `TIGHT … from the edge of the panel under it` (a commit or
  chip on a panel keeps 10 px) and `TERM` (a Terminal's last row keeps 14 px above its bottom; nothing cut).
- **A choice with modes shows the modes, aligned** (26: `git reset` then `--soft` `--mixed` `--hard` as equal chips, each
  lit on its word with what it does under it), and each answer enters on its own command word.
- **Mention the general form, not only the default** (stash: pop / apply / drop `stash@{n}`, not just the last stash).
- **The ground is a quiet picture of the subject**, not empty: for Git, coloured lanes with branches and breathing commit
  rings in the margins, soft colour pools behind; still never behind a word.

## undo-git-mistakes, review 5 (2026-11-13)

- **Every typing animation clicks.** "Whenever we have typing animation, there should always be sound effects": the VS Code
  typing on s23 was silent because the hand-kept `sfx.keys` map only listed terminal commands. Key clicks come from the
  typing measured on the page (bistro's `typeRows` records `window.PL_TYPED`, redline `RL_TYPED`; a project `typed.js`
  writes `typed.json`, `sfx.typed` reads it). With `typed` set, `keys` only marks typing beats as silent.
- **File icons are Material Icon Theme's** ("CSS icon is wrong. Also use material icons for ts, css, md etc everywhere"):
  the VS Code explorer, tab, breadcrumb and the gitgraph file chips all draw `bistro.js MI` (MIT, assets/SOURCES.md).
- **An over window ends on a cut.** A 0.3 s return dissolve laid the next slide's heading over the face, and the slide's
  own 0.4 s push exit took the overlay off early, leaving a bare face ("Should end in 4:28 but I can still see still
  frame"). The window ends with `out: 0` and the next slide enters with `xf: 'cut'`, so the overlay holds to the frame
  the deck cuts back in. Split windows keep their wipe.
- **Check every rough-cut join for a clipped word.** A take that ended on half of "in" was joined to a retake starting
  "in your current folder" ("sound like two in in but one is half"). Fixed with a pause cut (`[72.1, -0.15]`); at the cut
  stage, look at the energy across each join, since whisper hides a half word inside its neighbour.
- **Terminal output keeps Git's own layout.** `modified:   payment.ts` is tab-indented under "Changes not staged for
  commit:"; a filtered excerpt keeps that header line so the indent reads as Git's, not as a stray space.
- **Notes on an approved master go straight to 4K** ("You should have fixed the 4k directly"); the preview round is for a
  first master or a change he has not seen. **A finished master deletes every preview** of the project ("Whenever you render
  4k, delete all previews"): renderer/previews.js, called by dual and assemble.
- **Captures cannot half-paint.** On long 4K runs Chrome dropped slide 12's panels and terminal on many frames (2:47-2:50,
  the same frames every run). Cause: the ground's two glows were their own moving composited layers (`will-change`);
  base.css now paints them into the ground (drawn quarter size, scaled x4: identical look). Never give a full-frame moving
  background element `will-change`. After every master, scan the frame-to-frame difference for single-frame drop-outs
  before handing it over; a fresh page at the bad second renders clean, so test by starting the capture at the chunk start.

## what-makes-laptop-faster-4, review 1 (2026-11-12)

- **Face cards sit at the bottom** ("Should be towards the bottom"), their foot at y 1320 just above the caption band,
  replacing part 3's top card. kit.js `over.foot` (default 1320); `over.top` only when he asks for it.
  **Part 5 (2026-11-17) flipped it back: "This should be at the top"** (`over.top: 220`, clear of his face in this
  framing). The latest note wins; state the card position at the storyboard gate so he can flip it before the preview.
- **Motion graphics from the first frame.** A hook that opens on the face carries its card from frame 0 ("No motion
  graphics first few frames"), with an icon row that ticks along with the words (`over.ill` items, `st` badges on beats).
  Every over card carries an animated icon row, not text alone.
- **Captions need `npm run captions` before `npm run dual`.** Without captions.json dual renders no captions and says
  nothing ("Whys there no captions"). Run it after every transcript or timeline change, and check a frame for them.
- **Long holds keep moving.** Bars stream data at their own speed, meters track what fills them; the user asked for
  "more illustrations and animations" on a deck that held still after its bars filled.


## sessions-vs-jwt, review 1 (2026-11-14)

- **Typing is done before the line is explained** ("We didn't finish typing before the explanation already passed. Maybe
  we type faster"). bistro's typeRows treats every `hl` beat that lights a row of a typing block as a deadline, like
  `by`, and types up to 160 chars/s to meet it. When even that is too fast, start the block on an earlier word or split
  it; check a frame at each highlight beat.
- **A curiosity gap: never name an item before the voice does** ("Don't reveal all at once ... show question marks or
  something"). Trackers, agendas and lists show the items still to come as numbered "?" placeholders (signed `trk`
  shows fixes after `lit` as "?"), and the current one is named on its own word, not from the slide's first frame.
- **No Nigerian names** ("I don't want to use Nigerian names solely or at all if possible"): sample users, terminal
  prompts, guest lists and characters' labels use neutral made-up names (Leo, Mia, Sam, Nora …), a fresh one per video.
- **Say "or the database", show the database**: when the voice names two stores, both are drawn.
- **A face window never ramps in from the previous slide.** A ramp-in that reaches back into the slide before draws
  that slide's whole layout over the face (s21's cards floated over his face). Windows that open on a boundary use
  `in: 0`; `npm run dual` warns about any ramp that crosses a boundary.
- **Phones and apps are real mockups**: an iPhone shows a real app screen (nav bar, list rows, tab bar), never a bare
  white screen with one card. Over-the-face channel rows carry the LF mark and the channel screenshot, never an empty
  icon tile.
- **A JWT example carries a real payload object** (a `user` object with id, name, role), signed by the library the
  code uses (jsonwebtoken here), decoded on the live jwt.io.

## sessions-vs-jwt, review 2 (2026-11-14)
- The YouTube channel screenshot is captured fresh for every video (Puppeteer, youtube.com/@lifetechfacts), never copied from an older project.
- A face window over an aside runs to its slide's end boundary: ending it a second or two early turns the rest of the slide into full-frame graphics.
- The tagline slide before the outro shows the subscribe bar too (over.sub {at, lead} on the outro's clock); the channel sting starts with the first slide that shows the bar, never under an earlier slide (sub-cue skip in build-sting).
- "Real UI" means real images too: app mockups (product lists, avatars, feeds) use openly licensed photos (npm run photos, cropped), never drawn shapes for the content.

## how-llms-are-trained, review 1 (2026-11-14)

- **The slide after a splice starts on the splice.** A slide whose first word comes a few frames after `splice.at` left
  the previous slide on screen for those frames right after the intro ("Right after the intro there is a frame of this
  for a split second"). Pin the next row to the splice (`=m:ss` = `splice.at`) and give it `xf: 'cut'`.
- **The deck ends exactly with the footage.** A deck even 0.05 s longer than the A-roll renders its last frames as a
  full-frame chunk after the last face window, a flash of the outro slide before the end screen ("We have this frame
  show up too before the outro"). Set `vo.json` duration to the footage length and `tail` so the last row ends there;
  `npm run dual` must not list a `full` chunk after the last over window.
- **The subscribe bar only on the slide that says "subscribe".** Not on the tagline slide before it ("Remove in this slide
  since the next slide is for it"); that slide starts the tour mid-way (`t0`) so the click still lands on the word.
- **Analogies drawn as real UIs.** A group-chat analogy is a real messaging app on an accurate iPhone (header, avatars,
  bubbles with names and times, a swipe-reply quote), a chat with a model is a real chat app window (sidebar, model picker,
  thread, input box): "Group chat design is wrong", "Make them closer to a real UI".
- **Real things, not icons.** Named hardware gets real photos (GPUs: openly licensed photos, credited), named sources get
  their live page (the dataset page, the paper on arXiv, the vendor's announcement): "Include real images of gpus",
  "include screenshot of common crawl website".
- **Compositions centred, text padded.** A row of chips or cards sits centred in the frame, and card text keeps its
  padding (the probe's TIGHT misses text that wraps against the card edge when the card is narrow: check posters).
- **A progress tracker on long explainers** (studio `PROJECT.stages`): the current stage named top right, done stages
  filled, later ones "?"; hidden on slides that draw the road map and over the face.
- **A window that ends in a pause ends before the look-away** (how-llms-are-trained review 2: "a frame right before 'in
  the next 10 minutes' where I stopped looking at the camera"). He often drops his eyes to the prompter in the silence
  before a new line, so a window that runs to the next word's start shows that glance. End it at the last frame he is
  still on the lens inside the pause (gaze score at 0.125 s steps; 10 fps eye sheet), and pin the next slide there with a cut.
- **Name the method in full when the script names it** (review 2: "DPO isn't showing the full meaning"): an acronym gets
  its expansion on screen, and the line's contrast (what it does without) is drawn, e.g. the reward model struck out.

## sessions-vs-jwt, review 4 (2026-11-14)
- Named websites are rebuilt as the whole page in HTML inside the Chrome window (header, title, every panel), scrolled like a real visit (signed item.pscroll), never cropped screenshots; a paste swaps the page state at once, like the site.
- File icons: every JS flavour (.js, .mjs, .cjs) gets the Material JS icon. Demo code is named app.js with "type": "module" (viewers know .js; .mjs reads as a mistake).
- Talking-head voice: run the full DeepFilterNet clean (--atten 100 --expand) even on a mixed edit; he still hears the room at -52 dB.
  **Superseded 2026-11-17 (what-makes-laptop-faster-5): "Dont use full strength".** One pass, `--atten 24`, no `--expand`,
  then highpass 80 Hz + loudnorm -14 LUFS. Full strength only if he says it is still noisy.
- Punch-in zooms on hero words (dual --punch) only when asked: he found them unnecessary.
- **Strikethroughs draw left to right** (review 3: "All the strikethroughs should animate from left to right like a normal
  strike through animation"). A strike is a stroke drawn from its left edge on its word (studio `data-sk="<beat>"`,
  .35 s), through the middle of the text, never a bar that slides or fades in, and never printed already struck.

## sessions-vs-jwt, review 5 (2026-11-15)
- **The outro is the tagline frame, in both masters** ("we still have this frame. Remove"). Review 3 asked for the outro to reuse the tagline frame; that was done for B (the overlay) but A still cut to a new "See you in the next one" scene. In A the outro slide repeats the tagline slide exactly (eyebrow, heading and items already up: data.headPre + item pre) and only the subscribe bar joins. Check A and B separately for every frame-continuity note.
- The subscribe bar's notification menu opens upward by default; when text sits right above a deck bar, move it beside the bell (cafe item menuAt {x, y}, bar-local units) so it never covers the line. The cursor follows it.

## postgres-for-everything, review 1 (2026-11-17)
- **The script's shot markers decide the face windows** ("You didn't follow the script for face windows"). When the script
  carries `[SHOT: ON CAMERA]` / `[SHOT: SPLIT]` / `[SHOT: FULL ANIMATION]` (each holds until the next), anchor every marker on
  the first words after it in vo.json (projects/postgres-for-everything/source/shots.js) and make those the windows: ON CAMERA
  = the full face with at most a small tag, SPLIT = face beside the animation (an overlay beside him in the hook), FULL = deck.
  The gaze model is only for scripts without markers.
- **Dark mode by default** ("I prefer dark mode"): look directions are dark unless he asks for light.
- **No split-second frames at a face edge, no dissolves between face and deck**: a 0.3 s crossfade ghosted the slide's heading
  and the corner tracker over his face, and a hook slide showed full frame for 1.2 s after its window. Windows open and close
  with a cut on a slide boundary.
- **Every code example and every fact is correct, checked in the pipeline**: SQL runs on a real Postgres (scratch cluster;
  extensions through their official Docker images), not just a syntax pass; facts against their primary source.
- **Channel screenshots never show view counts or upload dates.**
- **Braandly on screen = braandly.com + a real capture of the site.**
- **Grade the A-roll** before the first preview: his studio reads too blue ("the aroll is too blueish").
- **Phones are accurate iPhone mockups** with real app icons in the dock, never coloured placeholder squares; a queue
  metaphor shows a queue (several tickets on the rail before and after the one being pinned); a "workers pick" demo shows
  each pick as a visible move from the worker to the row.
- **A closing checklist can carry accurate items the voice doesn't name**, to fill its columns.

## postgres-for-everything, review 2 (2026-11-17)
- **Script shots, then a gaze check.** Every ON/SPLIT window from the script gets its frames looked at; where he is not
  looking at the lens it turns FULL (s12, s25, s35 here). A window that must end mid-slide gets its own slide boundary: a
  letter-suffixed slug (`13b-…`, `40b-…`) is its own slide id (core/registry.js, renderer/timeline.js), so nothing renumbers.
  Seed timeline.json from the cue sheet (the project's source/tl-seed.js) before `npm run timeline` when slides are added.
- **The hook can be full motion graphics** when he asks; the overlay-beside-the-face hook is the default, not a must.
- **Grade by measurement.** A colour-temperature filter left the white wall lavender ("you didn't adjust the bluish hue").
  Neutralise a measured white patch with per-channel gains (colorchannelmixer) and show a before/after still.
- **No key clicks where the typing is hidden.** Typed rows inside ON / overlay windows are dropped (the project's typed.js);
  a SPLIT shows the slide, so its typing keeps its clicks.
- **Overview lists hide what is coming** ("Don't show the extensions names. Should make them curious"): "?" rows until each
  item is said, built-in features included.
- **Product results carry real product photos** (openly licensed, looked at before use), never grey placeholder squares.
- **Transformations keep the source visible** (running → run, runs → run): the reader must see both ends to connect them.
- **Graph edges stop at node edges**, never inside a translucent circle; captions never sit on a chart's line or axis.
- **Rebuilt sites are checked against the capture icon by icon** ("the dropdown icons are off" on braandly.com).
- **Code:** check-code runs pgvector on a local Postgres install that ships it (Postgres.app) when Docker is unreachable.

## postgres-for-everything, review 3 (2026-11-18)
- His review times are preview times: footage + the intro's length after the splice. Convert before moving anything.
- Face-window ends are cut on the last frame he is on the lens: eye-sheet the last ~1.4 s of every window and pin the next slide there.
- Split windows wipe, and the wipe is the pipeline default ("the split view transition should be the default in the pipeline"): 0.4 s, inside the split's own first/last slide. ON windows push ("still no transition from overlay to full motion graphics"): the deck slides off the face and back over it, 0.4 s, never a dissolve. Where an end is trimmed for a look-away, the push finishes by that frame. A split that meets an ON window, or a window at a splice, cuts.
- Slides push between each other ("we don't have any transitions in between views anymore?"): `xf: 'cut'` only at the intro splice or a deliberate same-picture continuity cut. Face-window edges cut by themselves (slate xhold).
- Reveal edges are written from timeline.json slide starts, exactly: `npm run dual` refuses edges 1-50 ms off a boundary (a one-frame flash of the wrong layout).
- A slide that opens on a cut from the face shows its eyebrow and headline from its first frame (slate: automatic).
- JSON on screen is pretty-printed: one key per line, closing braces on their own lines.
- Rulers / spectra show three zones when the script is "does a lot / needs a specialist / breaks": green, amber, red.
- The channel page shows the newest upload first, including one going live the same day (title from its project.js, duration from its master).
