# Pitfalls (learned while building the first deck)

- **Duplicate element ids** silently break animation: `document.getElementById` returns the first match, so a handle row that shared
  `s22-h1` with the headline never animated. The registry now throws on duplicates; keep ids prefixed with the slide id (`ctx.p`).
- **Class name collisions**: `.aws` is the console frame. A tile that used `.ltile.aws` inherited `position:absolute;width:960px`.
  Use `.sq` for square AWS icon tiles.
- **Fonts do not load for hidden slides**; the renderer forces every face with `document.fonts.load` before capture. Do not remove that.
- **Console header width**: title + Info + 3 buttons + primary is the maximum at 960px; a fourth button clips the orange primary.
- **The probe reports margins only at t=1**; entrances legitimately start off-grid mid-motion.
- **Pointer under the menu**: the pointer must sit above menus/modals (`.cur` z-index 60). Keep the click visible: press + ripple + menu + modal.
- **Hold**: per-slide clips add the 1s hold with FFmpeg (`tpad`); on the assembled timeline the hold is however long the line
  runs past `dur`. `dur` is motion only either way.
- **Class names**: `.cur` is the pointer (opacity 0 by default) — a caption's current word could not reuse it; the caption uses
  `.now`. Check `base.css` before inventing a short class.
- **`file://` pages cannot fetch JSON**: `timeline.json` / `captions.json` are injected by the renderer
  (`page.evaluateOnNewDocument`); `npm run preview` injects them server-side. Opening `index.html` directly shows the deck
  without timing, which is fine for authoring.
- **Parallel capture uses one Chrome per worker**: several pages of one browser deadlock on screenshots (only the foreground
  tab paints). Do not "optimise" the pool back to pages.
- **`will-change: transform` on text** makes Chrome rasterise glyph edges differently depending on layer history, so a cold
  browser and a warm one disagree by a pixel. Keep it on the background layers only.
- **whisper-cli** reads wav/mp3/flac/ogg only (the transcriber converts m4a to 16kHz wav first) and its `t_dtw` marks token
  onsets, not ends; word ends come from the segment. Always read the transcript back before building captions.
- **xstack grids** need a full grid; the contact sheet uses an explicit layout instead.
- **BSD sed** has no `\b`; use perl for word-boundary edits on macOS.
- **Relative paths are document-relative**: assets resolve from `projects/<slug>/index.html` (`../../assets/`), audio through the renderer
  (`project dir → project assets → assets/audio`).
- **Spacing after code blocks**: leave ≥30px between a code panel and the next row; compute from line count (62 + 58 + 47·lines).
- **A `setFrame`/`setTime` wrapper must leave the DOM at the requested frame.** `core/overlay.js` once measured the end pose
  *after* the requested frame was drawn and never re-rendered it, so the first capture of every slide in every worker (= every
  cut) showed the finished pose for one frame. Measure first (`OVERLAY.warm()` runs after the fonts load), then render the frame.
- **Fractions of the motion window are not timing.** `seg(t, .42, .74)` lands at 2.1 s on a 5 s window and at 5.8 s on a 13 s
  line — never on the word. Use beats (`ctx.beats` via `B.p()`); keep fractions only as the fallback for rows without a recording.
- **Word tokens in `vo.json` can be merged** ("didn't slow" after a manual fix): a phrase anchor matches token by token, so
  anchor on a neighbouring word (`--words` shows the exact tokens).
- **`omitBackground` only clears Chrome's default white.** `html,body{background:#000}` still painted under the stage, so every "transparent"
  clip (ProRes 4444 / VP9) came out fully opaque. Alpha captures now add `.transparent` to `html`, `body` and `#stage` (base.css makes all three
  transparent). Verify a clip with `ffmpeg -i clip.mov -vf alphaextract -frames:v 1 -f rawvideo -pix_fmt gray -` (must contain zeros), not by eye.
- **Alpha PNG sequences change pixel format mid-stream.** Chrome writes RGB (no alpha plane) for a fully opaque frame, e.g. a `full: true`
  outro over footage, and RGBA elsewhere. ffmpeg then re-initialises the filter graph at the switch, which resets `setpts` and the
  overlay's timestamps — the composite lost the whole outro. `assembleMp4` with `over` now runs `-reinit_filter 0` with a `scale` filter first
  (it converts changing input formats on the fly); never put `setpts=PTS-STARTPTS` on an image-sequence input.
- **Killing `assemble.js` does not kill its ffmpeg.** An orphaned encoder kept writing the same `renders/final/*.mp4` for an hour and fought
  the next run for CPU. `pkill -9 -f "ffmpeg -hide_banner"` before re-running, and check `pgrep -fl ffmpeg` when an encode looks slow.
- **A sticker on the last words of a line never shows**: it pops in and is forced out before the exit in the same breath.
  Put it on the next slide's first beat (`mj1:"In simple"-0.2`) or on an earlier word.
- **Audio-bed slides ignore beats** (the outro): the timeline drops the whole Beats cell, so a sticker there needs `at: <seconds>`.
- **Stickers over the eyebrow**: the eyebrow sits 30-40 px above the headline and runs past it on long chapter labels; put a
  sticker right of the headline at y ≥ 150 (horizontal), and check `renders/beats/sheet.png`.
- **A success burst on the beat fires too early**: a pipeline stage runs .45 s after its beat before it turns green; shift
  the burst `+0.5`. Time celebration to the visible result, not the word.
- **Clip boxes crop a zooming camera**: the map used to clip its world to the content box, so a zoom cut nodes in half
  mid-screen. Canvases that zoom must clamp the framing (map.js `mapFit`), not clip it.
- **Edges draw from their first node**: author an edge in the direction the thing travels (S3 → CloudFront → Viewers), so the
  line draws and the pulses flow the way the viewer's mental model does.
- **Labels on a box border need `z-index` over the edges** (map box labels are `z-index:3` with an opaque background), or a
  line runs through the label.
- **A re-edited voiceover moves every window**: transcribe the new file, remap each slide's VO window by word alignment
  against the old `vo.json` (snap into the real pause before the first word with `silencedetect`), re-check every anchor
  whose words Whisper now hears differently (`--dry` lists them, and look for beats that jumped several seconds), move the
  splice to the new pause, then `npm run timeline` and `npm run sfx`. Keep the old vo/cue sheet/timeline in `vo-v1/`.
- **Voice "breaking" is often in the recording**: a hard noise gate leaves digital silence (below -80 dB) inside words. Compare
  the source and the render's spectrogram before touching the mix; the fix is a re-export without the gate, or room tone /
  gap fill under the voice (`projects/cloud-vs-devops/audio-fix/repair.py`).
- **ffmpeg amix over hundreds of inputs runs slower than real time** (a 206-cue effects track hung for 20+ minutes).
  `build-sting.js` renders each cue alone and sums the samples in Node; keep it that way.
- **A chunk index is not time / 20 once a splice exists**: the splice adds a boundary, so every chunk after it shifts by one.
  Read the `chunk N/M a-bs` lines of the render log before deleting chunks for a `--resume`.
