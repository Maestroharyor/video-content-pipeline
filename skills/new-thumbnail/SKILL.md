---
name: new-thumbnail
description: Design a YouTube thumbnail for a video in this repo, research first. Scrapes what already performs on the video's topic (npm run yt-research: winners, a control set, the topic's own shelf), checks current best practice and YouTube's official specs on the web, proposes 2-3 design directions with hooks for approval, builds them as KoHo slides in projects/<slug>-thumbs, then checks every candidate against YouTube's safe zones and on every screen size (TV to the 120 px mobile list, with the duration badge, hover icons and progress bar drawn on, the edge crop, and a shelf test among the winners) before the user picks. Use when someone says "/new-thumbnail", asks for a thumbnail, thumbnail ideas, thumbnail research, or "make the thumbnail for <video>".
---

# /new-thumbnail

Video in, a researched, checked YouTube thumbnail out. Thumbnails are built with the same engine as the videos: each design is
a still slide in `projects/<slug>-thumbs/`, rendered by Puppeteer, probed for YouTube's zones, exported under YouTube's caps.
Locate the repo first (`git rev-parse --show-toplevel` inside it, otherwise
`cd "$(dirname "$(readlink -f ~/.claude/skills/new-thumbnail)")/../.."`) and `cd` there before any command.

**Read [../new-video/references/house-rules.md](../new-video/references/house-rules.md) before the first question** (the
Thumbnails section and the deletion rule). They override anything here.

## Invocation dispatch

```
/new-thumbnail                       (asks which video)
/new-thumbnail ai-can-clone-apps     (the video's project slug)
/new-thumbnail ai-can-clone-apps --face off
```
Resuming: if `projects/<slug>-thumbs/` exists, read its `research/findings.md` and `renders/candidates/` and continue at the
first unmet gate. Never re-scaffold over it.

## Questions (one AskUserQuestion call)

1. **Video**: which project (skip when given). Read its `project.js` title, `cue-sheet.md` (the story, the hook lines) and its
   theme CSS (the ground and palette come from the video, never the plum default).
2. **Face**: on, off, or both (cut from the A-roll at expressive moments: `swift scripts/cutout.swift <frame> <out.png>
   --mode subject --crop`; `subject` keeps the mic, `person` leaves a hole where it was). Some videos are faceless by rule (memory).
3. **Ground**: the video's theme (default), or the theme plus one contrast ground chosen from the research.
4. **Hooks**: any words the user already wants (otherwise they come from the research).

## Step 1: Research

**Read:** [references/research.md](references/research.md) and [references/best-practices.md](references/best-practices.md)

```bash
npm run thumb-new -- --video <slug>
npm run yt-research -- --out projects/<slug>-thumbs/research --min-age 0 --queries "<8-10 searches a viewer would type>" --channels "<6-8 channels on the topic>"
```
Read `topic-480.png` (the topic's own shelf: what a viewer sees beside this video), `top-480.png` / `control-480.png` (what
separates winners from misses on these channels), `topic.txt` (the numbers). Then a WebSearch pass: how the press and the
top videos phrase the story (a ready-made hook word beats repeating the title), and whether best-practices.md needs a refresh.
Write `research/findings.md` (sections in research.md).

**Gate 1:** findings.md names the formats the shelf already owns, the angle nobody draws, faces vs faceless on this topic, the
dominant grounds, and title patterns, each backed by a row in topic.txt or a tile in a sheet.

## Step 2: Suggestions

**Read:** [references/design.md](references/design.md)

Present 2-3 design directions, each with 2 hooks, each tied to a finding ("the shelf is all doom words, so we ask"; "nobody
draws the façade"). Say which you recommend and why. The title and thumbnail work as a pair: the thumbnail does not repeat it.

**Gate 2:** the user approves the directions and hooks (or edits them). Nothing is built before that.

## Step 3: Build

Set `TK.C` in `kit.js` from the video's theme, add the video's own props to the kit, one slide per direction
(`slides/NN-name.js`, hooks on `--var v`, the face on `--var face`). Real logos only (official sources, logged in
`assets/SOURCES.md`; a mark simple-icons lacks is fetched from the brand's page). Draft with
`./projects/<slug>-thumbs/render.sh "01 02 03" "off tNN" "1 2"` and look at every draft before exporting.

## Step 4: Checks

**Read:** [references/checks.md](references/checks.md)

```bash
npm run thumb -- --project <slug>-thumbs --slide 02 --var v=2 [--var face=t46]   # probe (0 issues, never --force) → renders/candidates/
npm run thumb-check -- --project <slug>-thumbs --all                            # every screen, overlays, crop, shelf
```
**Gate 4:** every candidate exported with 0 probe issues; every `-small.png` read at 168 and 120 px (hook and the main
picture readable; secondary labels may fade at 120); every `-shelf.png` looked at (does it stand out among the winners?);
fixes made before the user sees anything. Show the user the candidates and the sheets.

## Step 5: Pick and ship

```bash
npm run thumb -- --project <slug>-thumbs --slide 02 --var v=2 --pick   # renders/<slug>-thumbnail.png (always PNG, under 2 MB) → deliver/
ffmpeg -i projects/<slug>-thumbs/renders/<slug>-thumbnail.png -q:v 2 projects/<slug>/assets/yt-thumb.jpg   # the social cuts' end card reads a JPG (an internal asset, not the upload)
npm run thumb-check -- --project <slug>-thumbs                         # the final, once more
```
Offer a **Test & compare trio** (YouTube tests up to 3 and picks by watch time share): the pick plus two real alternates.

**Gate 5:** the user picked. **Delete nothing without the user's explicit approval of that deletion** (house rule): list
what would go and ask. The slide code always stays.

---

## Laws

- **KoHo only** for every word (`--var font=koho`, added by `npm run thumb`).
- **The ground is the video's theme**, never the plum radial default.
- **Ask about the face**; some videos are faceless by rule.
- **A question thumbnail never answers itself**: no ≠, no winner colour, no struck-out hook word unless the user asks; OR or
  "/" between equal sides under equal light.
- **Borrow an idea, never a layout**: recompose a competitor's idea in the brand.
- **Few huge words** (2-4), the hook ≥ 120 px, every other word ≥ 44 px, all inside the safe box (probe-enforced).
- **Always a PNG under 2 MB, exported only through `npm run thumb`**, never a hand-made file.
- **Never delete renders without asking.**
