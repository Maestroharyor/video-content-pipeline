# Step 1a: Rough cut (raw footage only)

When the user hands over a recording, always ask whether it is **raw** (retakes, false starts, stutters and long pauses
still in it) or **already edited**. Raw footage is cut against the script here, before transcription and storyboarding.
House rule: **never cut before the user has approved the take list.**

## 1. Get the script

Ask for the script: pasted, or a path. Accepted:

- **The usual LifeTech Facts layout**: a title, date and byline, a `YouTube script | …` line, then `[mm:ss] Section`
  markers, the spoken lines, `(ON SCREEN: …)` directions, code or diagram lines, and a `Review notes` block at the end.
  Everything before the first `[mm:ss]` marker and from `Review notes` on is ignored; directions are ignored; code,
  commands, diagrams and short `Label: …` sub-headings are **optional** (matched if spoken, never reported missing).
- Plain text or Markdown (headings or blank lines become sections when there are no `[mm:ss]` markers).
- Prompter exports: `.rtf`, `.docx`, `.doc`, `.odt`, `.html` are converted with macOS `textutil`.
- **No script**: `--no-script`. The transcript is its own reference: an island repeated by the next one is a retake.

A pasted script: save it to `projects/<slug>/source/script.md` and pass that path. The script is copied into `source/`
either way. It may carry the user's name in a byline: it is only read, never shown on screen.

## 2. Islands and the take match

```bash
npm run rough-cut -- --project <slug> --raw <file> --script <file>    # or --no-script
```

1. **Islands**: the raw voice is split at silences (`-38 dB` for `0.18 s`, the threshold both hand cuts used). One
   whisper pass over the whole raw gives every island its words; islands whisper was unsure of (no words, or average
   confidence under 0.55) are re-transcribed alone. → `source/islands.json` (cached; `--force` redoes it).
2. **Match** (`renderer/roughcut.js`): each island is aligned to the script (Smith-Waterman on words), then:
   - **last take wins**: an island whose script words a later island says again (≥ 60% overlap) is a retake, dropped;
   - **fluffed retake**: when the later take reads clearly worse (coverage 15+ points lower) and the earlier one is clean,
     the earlier one is kept and flagged `check` (the hand cuts did this: a clipped "door", a slurred line);
   - **false start**: a short island the next take restarts and runs past, dropped;
   - **cut off**: an island ending in `-` or `...` (abandoned mid-word or mid-thought), dropped;
   - **no speech**: `[BLANK_AUDIO]` and noise islands, dropped;
   - **mid-sentence fragments**: a short island between two kept takes that fills the script words between them is kept
     (his own pauses split sentences; whisper often mis-hears these one-word pieces);
   - **ad-lib**: an island matching no script line is kept if 4+ words, dropped if shorter, always flagged; a repeated
     ad-lib keeps only its last take;
   - **stutter**: repeated words at an island's start, kept and flagged (trim it in `edit.json` if wanted);
   - **incomplete**: a line whose kept islands together cover under 80% of its words; a whole earlier take, if one was
     dropped, is offered as the alternative;
   - **missing**: a required line no kept island covers.
3. Writes `source/edit.json` (the cut, editable) and **`source/takes.md`** (the approval sheet), then stops.

Measured against the two hand-cut videos (same islands, transcript as script): 90% (reverse-proxy-lb-gateway) and 89%
(kafka-vs-rabbitmq) of islands decided the same way; most differences are one-word fragments whisper mis-heard. That is
why the list is always reviewed.

## 3. The review (gate)

Show `takes.md`: the **Needs your eye** list first, then the table by script line (kept take with its raw time, dropped
takes and why), the ad-libs and the missing lines, and the cut length against the raw length. The user approves or
overrides by island number ("keep 131 instead of 132", "drop the ad-lib at 4:12"). Apply overrides in
`source/edit.json`:

- `keep`: the island numbers kept, in order;
- `trim`: `{ "<island>": { "a": <new start>, "b": <new end>, "room": <pause seconds> } }` to cut inside an island at a
  measured inner pause (a stutter, a mid-island restart);
- `sections`: islands that open a section (they get the 0.85 s beat before them);
- pacing (house rule, retake-cut pacing): `maxGap 0.6`, `minJoin 0.3`, `maxJoin 0.55`, `sectionGap 0.85`, `endTail 0.3`.

Re-running the match overwrites these overrides, so it refuses without `--force`.

## 4. The cut

```bash
npm run rough-cut -- --project <slug> --stage cut [--audio-only]
```

Frame-exact on the 60 fps grid: every cut sits inside a pause, never padded, the voice spliced at 48 kHz with 8 ms fades
(800 samples a frame, so the voice matches the picture to the sample). Picture: `hevc_videotoolbox` 40 Mbps on macOS
(libx264 crf 16 elsewhere), in chunks of 40 spans, each chunk's frame count verified. Writes `aroll.mp4` + `vo.wav` +
`source/edl.json` (raw → cut time map). Audio-only recordings write `vo.wav` only.

Then Step 1: `npm run transcribe` on the cut, `npm run denoise` when the floor is high, and the rest of the flow.

## Fixing one take later

A take found wrong after the cut (a clipped word the user re-exports from his edit): splice it into `aroll.mp4` and the
voice at its EDL span instead of re-cutting everything. `projects/reverse-proxy-lb-gateway/source/splice-know.js` is the
pattern: frame-exact swap, the clip's audio padded to its picture length, words re-timed, everything after shifted, then
`npm run pauses` (if used), `npm run timeline`, the cues and `npm run sfx`.
