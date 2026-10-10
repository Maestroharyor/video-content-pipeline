# House rules

Decisions the user has made across past videos. They apply to every run of `/new-video`, on any machine, on top of the
step references. Each says what to do and why it was decided, so an edge case can be judged rather than guessed.

## Setup questions

- **Always ask the outro.** Question 6 (outro + audio bed) goes in the first question batch on every run, never skipped.
  Suggest a full-frame outro with music by default. The footage's own close does not answer the question.
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
- **A sound on every point.** Every chip, tile, row or badge that lands gets a cue, and `scripts/sfx.js` varies them
  (pluck, swish, tap, boop, thump, clock tick, chime) rather than popping on everything. Name beats so they classify
  (`k<n>` chips, `c<n>` terminal typing, `x<n>` strikes, `e<n>` edges). New synth sounds go into
  `assets/logos/lifetechfacts/build-sting.js`. `PROJECT.sfx.palette = 'pop'` restores the all-pops mapping.

## New themes: three traps

1. **Alpha captures.** A theme linked after base.css that sets `#stage.theme-x{background:…}` beats
   `#stage.transparent` on source order, so every reveal window and social-cut text pass renders black. Scope the
   background to `.theme-x` without `#stage`, or add `#stage.theme-x.transparent{background:transparent}`. Only the
   composited preview shows it; master A, posters and the probe all look fine.
2. **Caption width.** base.css centres `.caps` with `left:50%; translateX(-50%)`, so it shrink-fits into ~540px and a
   five-word group drops its last word onto its own line. Add `width:max-content` to the theme's `.caps` rule.
3. **Cast and fx CSS.** Characters, speech bubbles, stickers and confetti are styled only in `core/styles/lanes.css`
   (cast block ~line 150, fx block ~line 296). Copy both blocks into the new theme or link lanes.css, or stickers pile up
   top-left. Check `renders/beats/sheet.png`. The probe does not catch it.

## Vertical and mobile

- **Safe zones.** On the 1080×1920 stage everything readable stays inside x 60-940, y 220-1500 (`GRID.mobile`); the
  posting apps cover the bottom ~420px and the right ~140px. `npm run probe` fails UNSAFE and SMALL (text under 28px). The
  user's explicit exceptions on social cuts: the hook band at the very top (0-124) and captions from 1560. When a placement
  request conflicts with the zone, give the measured numbers and ask.
- **Social cuts open on the face** when the master does, with the hook's slides laid over it as motion graphics, for about
  the first 10 s, so the networks' automatic cover pick is the face. `npm run social-cut` does this from
  `PROJECT.reveals` (cuts.json `"reveals"`, `"openFace"`). Check the first frame of each preview.

## Footage and face

- **Face only on lens contact.** Reveals and splits go only where he looks into the lens, never while he reads the
  script. The teleprompter sits by the lens, so contact sheets and eye openness alone mislead. What separated them on
  mobile-frameworks-2026: per-frame Vision eye outlines on 4fps face crops, then the centroid of the darkest 30% of pixels
  in each outline. On the lens it sits at 0.46-0.49 of the eye box height with lids open past 0.30; reading, 0.52-0.55 with
  lids near 0.28. Calibrate on a stretch he confirms as reading, and give face windows to slides with 60%+ lens frames.
  Where he holds the lens, use the face generously (splits, cards over the face, the opening). Scan the A-roll for
  transitions baked into his edit (`select='gt(scene,0.25)'`) and cut before the first blurred frame.
- **Screencast tutorials.** The screencast carries the demo. Full-frame slides only for the hook, explainers and the
  close. During the demo, footage only, with a compact card only when it says something the screen does not, and never
  over the code being typed, the element being animated, or a face-cam interlude. Check each card against the real footage
  frame. Preferred full-frame layout: heading centred on one line across the top, the scene full width underneath, no busy
  diagrams. Non-16:9 recordings get `PROJECT.sourceFit: 'contain'`. Force-align (`scripts/align.py`) before trusting slide
  starts near long pauses.

## Content and delivery

- **Verify spoken numbers before the storyboard gate.** Check every figure in the recording against the primary source
  (the README on raw.githubusercontent.com, the vendor's blog, the GitHub API for revision history). An understated
  figure is safe to print. A contradicted or mis-attributed one means that slide shows the shape without the value, or
  the line is re-recorded. Record the comparison in the project's `SOURCES.md` and raise it at the gate as a decision.
- **Preview before the full render.** Render the preview, hand over the path, wait for approval, then start the master.
  With a splice: `npm run dual -- --project <slug> --only a --preview --source <vo>`; without:
  `npm run assemble -- --project <slug> --preview`.
- **Outputs in one flat folder.** Everything the user browses (every candidate, every review sheet) goes in one folder
  with descriptive names; review sheets prefixed `0-` so they sort first. No per-family or per-variant subfolders.

## LifeTech Facts

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
- **Thumbnails.** KoHo only (`--var font=koho`). Once one is picked, delete the other candidate renders but keep the slide
  code. A competitor's thumbnail is an idea to borrow, never a layout to clone: recompose it in the brand (plum or two-tone
  ground, huge white KoHo type, the brand-blue hook bar, house cards with mono header strips, real logos, the LF mark, a
  white sticker outline on the face) and offer two or three distinct compositions.
- **YouTube copy.** Descriptions tease (two to four lines on the problem, never the answer), then links (watch-next, subscribe,
  Instagram, Facebook), then hashtags. No timestamps or chapters unless asked, never on a Short. Titles come from niche
  research (`npm run yt-research -- --only scrape`), offered as 3-4 options. The social-copy skill encodes the same rules.
