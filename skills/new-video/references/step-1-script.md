# Step 1: Read the script (or the audio)

## If the user has a voiceover recording

Copy it into the project as `projects/<slug>/vo.<ext>` (wav, m4a, mp3, flac, ogg) — scaffold the project first if it does
not exist (Step 2's `npm run new`) — then transcribe locally with whisper.cpp:

```bash
npm run transcribe -- --project <slug> [--audio /path/file.m4a] [--model medium.en] [--prompt "AWS, EC2, RDS, NAT gateway"]
```

- Writes `vo.json` (every word with start/end seconds) and `transcript.txt` (`(m:ss.ss)` markers per sentence).
- First run downloads `ggml-medium.en.bin` (≈1.5GB) into `assets/.cache/whisper/`; `--model small.en` or `base.en` is faster but less accurate on names and technical words.
- Pass the product names the script uses as `--prompt`; it improves recognition of brand vocabulary.
- If `whisper-cli` is missing: `npm run setup` installs it (Homebrew/apt) or prints how.
- Read `transcript.txt` back to the user and fix obvious mis-hearings in `vo.json` **and** `transcript.txt` before going on
  (captions are burned in from these words).

## Get VO windows

```bash
npm run storyboard -- projects/<slug>/transcript.txt --md   # from the transcription
npm run storyboard -- script.txt --md                        # (m:ss) markers, SRT/VTT or plain prose
npm run storyboard -- script.txt                             # JSON (start, end, window, words, estimated, text)
```

- Timestamped input (`(m:ss)`, `(m:ss.ss)`, `(h:mm:ss)`, SRT/VTT, whisper JSON): exact windows.
- Plain prose: sentences become lines, timed at 2.6 words/s and flagged `estimated`. Say so in the cue sheet header.
- Group lines into slides of one idea each. A slide owns its VO window on the timeline: 2–3s for a quick line, up to ~12s for
  a demonstration. Lines under 2s should share a slide with a neighbour; lines over 12s should be split.

## The 8-question rubric (answer before storyboarding)

```
1. What is the hook?              The first line the viewer must read. It becomes slide 01's headline.
2. What are the sections?         Numbered items ("number one … EC2"), phases, or a single arc. Each gets an intro slide.
3. Which claims need a visual?    Costs, counts, comparisons → chart / compare / statement. Rules → statement.
4. Which UI must be recreated?    Console, app screen, dashboard. Note the exact screens (e.g. EC2 › Instances, RDS › Databases).
5. Which logos / tech stack?      Companies, services, tools named or implied. Map each to an icon source.
6. Which numbers animate?         Prices, counters, percentages → counter badges or growing bars.
7. Which interactions to show?    Clicks, menus, confirmations, scrolling, typing → console click flow or custom sequence.
8. What is the outro line?        "Follow for more" style close → outro template with the saved brand.
```

## Colour language

Pick one accent per section and keep it: e.g. orange = the vendor, amber = warnings, rose = costs/surprises, blue = databases,
violet = networking, green = fixes/checks, teal = title/outro. Write the mapping down; it goes in the cue sheet.
The key phrase of a headline can be wrapped in `<em>…</em>`: it takes the accent colour and gets an animated underline.
