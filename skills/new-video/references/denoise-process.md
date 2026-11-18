# Denoise: the full process

How background noise (fan, AC hum, room tone) is removed from a recording in this pipeline, and how the voice is
levelled for delivery. One command does the work: `npm run denoise` (scripts/denoise.js).

## Tool

- **DeepFilterNet v0.5.6** (open source, by Rikorose), the `deep-filter` command-line binary.
- Fetched once from the official GitHub release into `assets/.cache/deepfilter/deep-filter`, SHA-256 checked on every
  run (a mismatch deletes the download and stops).
- Chosen over Adobe Audition's denoiser, which thinned the voice. DeepFilterNet drops every speech band by the same
  ~2 dB, so a loudness match restores the voice as it was.

## 1. Decide whether to denoise

1. **Raw take or finished edit?**
   - A raw take (straight from the iPhone) has pauses between sentences that fall below -45 dB.
   - A finished edit (music bed, sound effects, transitions already mixed in) never drops that low.
   - Check: `ffmpeg -i <file> -af silencedetect=n=-45dB:d=0.25 -f null -`. No silences found means it is a mixed edit.
   - **Never denoise a finished edit.** DeepFilterNet treats the music and effects as noise and strips them. Level
     only: `npm run denoise -- --project <slug> --atten 0`.
2. **Measure the noise floor** of a raw take: the loudness of its quietest 5% of 50 ms frames.
   - Above about -55 dB: offer denoise (a fan through the phone's mic usually sits near -43 dB).
   - Below that: level only.
3. Do it **before the first preview**, so every render after it carries the clean voice.

## 2. Run it

```bash
npm run denoise -- --project <slug>
```

| Option | Default | What it does |
|---|---|---|
| `--atten <dB>` | `100` | Cap on how much noise is removed. 100 = full strength (picked by ear on why-fastapi-is-fast); 24 keeps a little room air; 0 = no denoise, level only |
| `--passes 1\|2` | `1` | 2 runs DeepFilterNet again on its own output, for a loud floor with few pauses (about 8 dB more) |
| `--expand` | off | A gentle downward expander (3:1, at most -24 dB, slow release) so the leftover hiss in pauses is not raised with the voice. Never a hard gate |
| `--lufs <n>\|match` | `-14` | Delivery loudness. `match` keeps the original level instead |
| `--no-footage` | off | Skip writing the clean copy of the footage |

## 3. What the script does, step by step

1. **Keeps the original.** The untouched recording is copied to `vo-original.<ext>`. Every re-run starts from it,
   never from an already cleaned file.
2. **Converts** it to 48 kHz mono 16-bit WAV (DeepFilterNet works at 48 kHz).
3. **Denoises** with `deep-filter -D -a <atten>`. `-D` compensates the model's delay, so lip-sync holds.
4. **Optional expander** (`--expand`) on the pauses.
5. **Levels the voice** to -14 LUFS, the playback loudness of Shorts, Reels and TikTok (a raw iPhone take sits near
   -22 and reads quiet in the feed):
   - a gentle compressor first (threshold -24 dB, ratio 2.5, attack 8 ms, release 120 ms) so the phrases sit evenly;
   - then two-pass `loudnorm`: measure, then apply linearly with the measured values, target `I=-14, TP=-1.5, LRA=9`;
   - with `--lufs match`, a plain gain to the original's loudness plus a limiter instead.
   - Result: `vo.wav`, 48 kHz 24-bit.
6. **Swaps the footage's sound.** The project's footage (`project.js → source`) gets a copy with the clean track:
   `<name>-clean.mp4`, video stream copied untouched, audio AAC 256k at the footage's own rate and channel count,
   padded so it never ends before the last frame.
7. **Leaves the timing alone.** `vo.json`, captions and `timeline.json` are not touched: the words and their times do
   not move.

## 4. After it runs

1. Point the project at the clean footage: `project.js → source: '<name>-clean.mp4'`. `npm run dual` takes the voice
   from the footage, not from vo.wav.
2. Listen to a stretch with pauses on headphones. If hiss is still audible between sentences, re-run with
   `--passes 2` and/or `--expand`.
3. Check the floor again (quietest 5% of frames). On why-fastapi-is-fast it went from about -43 dB to -76 dB.
4. Render the preview.

## Audio added in later passes (not denoised)

Splices and fills (e.g. narration recovered from an unedited take for a cheat-sheet hold) are cleaned the same way
on their own: DeepFilterNet on the clip, then levelled to the main take, then transcribed once more to catch false
starts before they go in.

## Voice separated from music (not in use)

When the only source is a finished edit with a music bed, real noise removal would need the voice on its own track.
The option discussed is **Demucs** (open-source voice/music separation): split, denoise the voice alone, remix the bed
under it. It is a new install (1-2 GB with its models) and can leave artefacts, so it is never installed without asking,
and would be tested on a short clip first.
