# Step 4: Timeline, preview, master, verify, deliver

**Two renders, in this order, always.** The preview is not optional and not a fallback: it is how the video gets
approved. The full-resolution master is only started once the user has watched the preview and said so.

```bash
npm run timeline -- --project <slug> [--lead 0.10]   # cue sheet (+ vo.json word anchors + Beats column) → timeline.json; validates
npm run timeline -- --project <slug> --check         # rebuild without writing and report beat issues (errors exit 1)

npm run sfx -- --project <slug>                      # sound effects from the beats (alive kit): re-run after every timeline change

# 1. the preview — minutes, half size, 30fps. Show it, wait for sign-off.
npm run dual -- --project <slug> --only a --preview --source <the voiceover>   # with a splice → <slug>-preview.mp4
npm run assemble -- --project <slug> --preview                                 # no splice → <slug>.mp4 at half size

# 2. only after the user approves it — the master
npm run dual -- --project <slug> --only a --source <the voiceover>   # with a splice
npm run assemble -- --project <slug>                                 # no splice

npm run render:all -- --project <slug>               # optional: per-slide mp4 + gif clips (cached; --timed = timeline lengths)
```

## Why the preview comes first

A 4K60 master costs hours of wall clock; the preview costs minutes. Every defect found on the decks built so far
(mistimed beats, a strike that missed its line, a missing arrowhead, a slide that outstayed its line) was plainly
visible at 960×540. Rendering the master first means paying the full cost again for each of them.

`npm run dual --preview` is the one to reach for whenever the project has a `splice`, because it still splices the
intro and the end screen, so the preview has the shape of the finished video. It writes `<slug>-preview.mp4` and
keeps its own chunk dir, so it can never overwrite the master or poison a later `--resume`. `npm run assemble
--preview` is the simpler path when there is nothing to splice; it writes to the master's filename, so re-run the
full `assemble` over it before delivering.

**Gate:** the user has watched the preview end to end and approved it. Nothing at full resolution starts before that.

`assemble` runs 4 browsers in parallel (≈30 frames/s on an M-series Mac: a 2-minute video takes ≈2–3 minutes). Without a
voiceover file it produces a silent visuals-only video with the beds mixed in; `--no-audio` forces that; `--captions off`
drops the burned-in captions (the `.srt` is still written when `vo.json` exists).

## When the deck has an intro, an end screen, or too many frames for one pass

```bash
npm run captions -- --project <slug>                 # captions.json + captions.srt, the PRE-SPLICE subtitle master
npm run dual -- --project <slug> --only a --preview --source <the voiceover or the footage>   # first; get it approved
npm run dual -- --project <slug> --only a --chunk 20 --source <the voiceover or the footage>  # then the master
npm run srt  -- --project <slug>                     # shifts every cue after splice.at by the head clip's duration
```

`captions.srt` is what `npm run srt` reads, and a captions-off project never generates it, so run `npm run captions`
even when no captions are burned in. It only writes files; `defaultInject` still skips the caption layer unless
`PROJECT.captions.on`, so the picture is unchanged.

`npm run assemble` **cannot splice** and holds every PNG until the encode, so a long 4K60 deck needs tens of gigabytes of
scratch (64,000 frames ≈ 80 GB). `scripts/dual-render.js` walks the timeline in chunks, encoding and deleting each one, and
is the only path that honours `PROJECT.splice`. `--only a` is right whenever there is no footage to composite onto; pass the
voiceover as `--source`, because dual takes the master's audio from that file rather than from `tl.vo`.

Two things to get right before starting a 90-minute render:

- **`splice.at` must be both a slide boundary and a chunk boundary.** dual forces a chunk cut there automatically, but it
  throws `splice.at <n>s is not a chunk boundary` if the value falls outside the timeline. Pick the `start` of a slide from
  `timeline.json`, and pick the one that follows the spoken hook, typically the line that ends "let's get into it".
- **The clip should already match the project**, or `normalise()` re-encodes it with letterbox padding: same width, height,
  `yuv420p` and exactly `<fps>/1`. It must carry an audio track; a silent intro needs a silent AAC track baked in first.

Slide `audio` beds never reach a dual render. A sting that has to land in the master goes in `PROJECT.cta = {sfx, sfxAt, gain}`,
which mixes it into the timeline at `sfxAt` seconds.

Verify (with a splice, the finished runtime is the deck total **plus** the head and tail clips, so ffprobe's
duration will not equal `timeline.json`'s total; check a frame either side of `splice.at` and one inside the clip):

```bash
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames,color_space:format=duration,size -of csv=p=0 projects/<slug>/renders/final/<slug>.mp4
```
- duration == timeline total (voiceover length, plus the outro tail); width×height == the project's `resolution` (4k → 3840×2160,
  2k vertical → 1440×2560), fps == `project.js → fps` (60 by default), h264 + aac, `bt709`, size under the budget (assemble prints it
  and warns when over). A `--preview` file is the review draft (1× capture halved, 30fps): never deliver it, and
  never report it as the master;
- `npm run timeline -- --project <slug> --check` must end `timeline ok` with 0 errors. Errors: unresolved words, unknown element
  names, `?` placeholders, an entrance after the exit starts. Warnings: speech order inside a chain, beats < 0.35 s apart,
  dwell below 0.9 s, rows with ≥ 2 beats and no hero, rushed console slides, audio-bed motion. Example:
  ```
  warn s05: r2 → r3 only 0.21s apart (< 0.35s)
  error s08: beat badge "no name yet" not found in 71.44–86.27s (fraction fallback)
  beats: 26 slides · 110 resolved · 1 error(s) · 5 warning(s)
  ```
- extract 8 consecutive frames around two cuts (`ffmpeg -ss <cut-0.1> -i … -vf "select='lt(n,8)',scale=480:-1,tile=4x2" -update 1`):
  the first frame of the incoming slide must be its frame 0 (no finished end pose flashing before the entrance);
- extract frames at `beat − 0.2`, `beat`, `beat + 0.4` for three beats (the hero of the busiest row, a payload such as a bar or
  tag, one outro handle) and confirm absent → arriving → settled; plus one caption group when captions are on.

Finish the cue sheet: final timeline totals, what was anchored vs estimated, notes for the editor.

## Summary to the user

- Slides built (count, templates used, anything custom and why)
- Transcription: model, word count, anything corrected by hand
- Assets downloaded and their sources; anything that could not be retrieved
- Beats: how many resolved, what fell back to the fraction schedule and why
- Output paths: `projects/<slug>/renders/final/<slug>.mp4` (+ `.srt`), `renders/poster`, `renders/strip`, contact sheet, cue sheet,
  optional clips in `renders/mp4` + `renders/gif`
- Commands to re-run: `npm run review`, `npm run assemble`, `npm run preview`
- Which file is the preview and which is the master, named explicitly, so neither gets uploaded by mistake
- Limitations or decisions worth knowing (estimated timings, placeholder logos, merged lines)
