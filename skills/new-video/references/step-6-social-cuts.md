# Step 6 — Social cuts (when asked)

Only when the user asked for it. The 16:9 master is finished and published; this turns it into vertical clips for
Reels, TikTok, Shorts and LinkedIn/X: a best-of and a parts series, each at most 2:20 including a 4s end card that
sends the viewer to the full video on YouTube.

**The audio is cut first and the deck is built for the cut.** Never render a full vertical deck and chop it: a deck
timed to the whole voiceover lands every edit mid-animation (a slide jumps, freezes or starts half-built). Each cut gets
its own deck, re-timed to its own audio, with every element entering on its word in the cut.

```bash
assets/.cache/align-venv/bin/python scripts/align.py projects/<slug>/vo.json projects/<slug>-social/words.json
npm run social-cut -- --project <slug>-social --plan            # every cut's spans, lengths and edit count (no render)
npm run social-cut -- --project <slug>-social --faces           # talking-head windows from the master → cuts.json "faces"
npm run social-cut -- --project <slug>-social --cut best-of --preview
npm run social-cut -- --project <slug>-social --cut all         # after the user signs off on the previews
```

## Set up `projects/<slug>-social/`

- `project.js`: `canvas: 'vertical'`, `resolution: '1080p'`, `fps: 30`, `hold: 0`, `captions: { on: true }`, the
  source deck's `theme`, `bg`, brand (with its `outro`), `assets` and `probe`, plus a vertical `grid` with
  `safe: { l: 60, r: 940, t: 220, b: 1480 }` so every slide stays in the phone safe zone, above the caption band at
  y 1560. Start from the `vertical` block in `projects/deno-is-dying/project.js`.
- `slides/`: a symlink per source slide (`../../<slug>/slides/NN-name.js`), plus `990-hook.js → ../../../core/social/hook.js`
  and `991-endcard.js → ../../../core/social/endcard.js`. Only the slides a timeline lists are rendered.
- `assets/`: symlinks to the source project's assets, plus `yt-thumb.jpg` (the published video's own thumbnail,
  `i.ytimg.com/vi/<id>/maxresdefault.jpg`), `end-sting.wav` (the first 4s of
  `projects/lifetechfacts-endscreen/assets/lf-endscreen-sting.wav`, 0.6s fade-out) and `SOURCES.md` logging both.
- `cuts.json`: `source` (the published master), `deck` (`../<slug>`), `words` (`words.json`), `splice` (the master's
  spliced intro `{at, head}`, or null), `thumb`, `ytTitle`, `ytUrl` (the youtu.be shortlink shown on the end card),
  `cuts` and `faces`.

## Force-align the words first

Whisper's word times drift up to 0.6s, which is enough for a cut placed on them to clip a word ("example dot com"
came out as "exam"). `scripts/align.py` re-times every word against the recording with torchaudio's MMS_FA. It runs
in a private venv: `python3 -m venv assets/.cache/align-venv && assets/.cache/align-venv/bin/pip install
torch==2.8.0 torchaudio==2.8.0` (2.9 removed the aligner). The first run downloads a 1.2 GB model. Spans are
written in aligned time.

## Pick the spans

Read `transcript.txt`, not the cue sheet. A span is "this line's first word .. the next line's first word", in VO
time (the voiceover without any spliced intro); `snapSpan` closes it just after the last word and opens it in the
middle of the pause before the first.

- **Best-of**: the video's argument in at most 2:16 of speech, every step the title promises included (a DNS video
  keeps all four servers). Edits on paragraph breaks only.
- **Parts**: continuous stretches with no internal edit, each at most 2:16, split where a new idea starts.
- A span may start on a word inside a line when the user asks ("start at *that*"): give that word's aligned start.
- Hooks: one line each, the key phrase in `<em>`, at most ~34 characters so the band stays on one line.

**Gate:** `--plan` shows every span opening on its intended first word and closing on its intended last word, every
cut at or under 2:16 + 4s, and the user approved the list.

## Phone safe zone and readability

Reels, TikTok and Shorts cover the top ~220px, everything below ~1500 and the right ~140px. The pipeline keeps every
readable thing inside x 60-940 × y 220-1500 (`GRID.mobile` in core/grid.js):
- captions run from 1560, centred on the frame and at most 800 wide (x 140-940). That's below the zone, the user's explicit call so the
  slides get the room; the hook band also sits at the very top (0-124) for its 3.2s, by the same call;
- deck slides end by 1480 (the deck's `vertical` grid uses `safe: { l: 60, r: 940, t: 220, b: 1480 }` and heading at
  236).

On vertical, `npm run probe` / `review` fails:
- any visible text, logo or sticker outside the zone (UNSAFE);
- any text under 28px after scaling (SMALL; `probe.minPx` overrides).

Fix with `data.v` (wider nodes, shorter tags) and theme `.canvas-vertical` sizes. Never loosen the zone. A cut's deck
pass caches on its timeline only, so pass `--force` after CSS or geometry changes.

## Open on the face

When the master opens on the speaker, the cut opens on the speaker too. The first frame is the cover a network picks
automatically, so it should be the face, not a slide. `social-cut` does this from the deck's own `PROJECT.reveals`.
The reveal window that holds a cut's first moment joins the face windows. Luma detection (`--faces`) can't see a face
under an over window's cards, so it misses these windows on its own. The face has no fade-in at frame 0.

The window's `over` slides become motion graphics on the face (`overFace`). Each is captured with alpha and shown only
while the face is behind it. On 9:16 they lay out by `base.css`:
- the heading high over the wall;
- the content stacked over the shirt, ending at 1560;
- a fade at the top and bottom.

A theme scopes its 16:9 over-face rules to `.canvas-horizontal` so they don't fight that layout (dusk, arena `.ovl`).
`cuts.json` `"reveals"` controls which windows count:
- `"open"` (the default): only the window a cut opens in.
- `"all"`: every reveal window.
- `"off"`: none.

Split windows and the window over the CTA are never taken; neither fits a 9:16 crop.

The opening face shot is the cover, not the whole hook. It holds about `"openFace"` seconds (default 10; 0 keeps the
whole window) and hands over to the full-frame deck on the nearest slide boundary. From there the deck and the face
alternate on the face windows as usual.

**Check:** the first frame of every cut whose master opens on the face is the face, with the over slides readable and
clear of the eyes and mouth.

## Check before showing

Transcribe each preview's audio around every edit (a 3-5s clip each side, `whisper-cli -nt`): every word whole, nothing
from the neighbouring line. Look at a frame strip across every edit (no jump, freeze or half-built slide), the
opening (hook band at the top, face centred) and the end card (thumbnail, title, shortlink). The deck's cut timeline
reports beats whose words were cut (they fall back to the template's schedule); look at those slides.

**Gate:** the user watched each best-of preview and signed off before any `--cut all`. Then ffprobe every file
(9:16, bt709, AAC, ≤140s, **≤512 MB**: renderer/config.js caps every vertical render at 512 MB, whatever project.js or `--max-size` says) and write the copy per cut with `/social-copy` (Step 5), linking the full video.
