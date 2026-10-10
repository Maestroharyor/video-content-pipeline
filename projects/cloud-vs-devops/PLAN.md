# cloud-vs-devops: v2 plan (scene rebuild)

Status 2026-09-29: v1 (79 one-sentence slides, left-column headings) rendered as a preview and reviewed. User feedback:
cutting mid-explanation feels choppy, not enough imagery, wants characters, "02 · IaC"-style eyebrows confusing, the
"Same list" tag unreadable, heading placement unbalanced on sparse slides. Decisions (AskUserQuestion, 2026-09-29):

- Layout: **top centre** heading (chapter label + one-line headline), content uses the full width below.
- Scope: **scene rebuild**, ~28 persistent scenes instead of 79 slides; sentences add/highlight/zoom inside a scene.
- Characters: **DiceBear Notionists** (CC0, no attribution required), downloaded as SVG from
  `https://api.dicebear.com/9.x/notionists/svg?seed=…&…` with fixed options per character; shown on light sticker cards.
- Sound: **subtle SFX** (whoosh on scene changes, key clicks under typing, pop on reveals, buzz on the failed deploy),
  synthesised to one wav from the timeline beats and mixed under the voiceover.

Already fixed in v1 code: card tag colours (lanes.css), job-post card dim, tool-row lane height, vcenter (registry).
Eyebrows lose their numbers/abbreviations: a chapter label in words ("Cloud engineer · Infrastructure as code").

## Research notes (subagent, 2026-09-29)
- Cut per idea, not per sentence: a scene lasts 15-40 s; something small changes every 3-7 s (reveal, highlight,
  camera nudge); a pattern interrupt about once a minute; hold a finished diagram 2-3 s. (Creator heuristics, not
  peer-reviewed; Mayer signaling/coherence/spatial-contiguity principles back highlight-don't-cut and labels-on-objects.)
  Guo, Kim, Rubin 2014 https://dl.acm.org/doi/10.1145/2556325.2566239 · Brame 2016 https://www.lifescied.org/doi/10.1187/cbe.16-03-0125
- Devices, by impact/effort: persistent build-up scenes; flowing connectors (pulses along edges); spotlight (dim the
  rest to ~25-50%); camera pan/zoom over one large canvas; characters that react; shared-element moves between scenes;
  kinetic type for key terms only; chapter label; a gag about once a minute; sound on reveals, not on every sentence.
- Avatars: DiceBear Notionists / Open Peeps / Lorelei are CC0; Personas/Micah/Adventurer are CC BY (credit required);
  Storyset needs attribution on free tier (avoid). https://www.dicebear.com/licenses/

## Build steps
1. Storyboard v2 (scene table) → user approval. Approved 2026-09-29.
2. Engine: new templates `app` (vidshare browser mock), `map` (architecture canvas + camera + overlays), `desk`-style
   `windows` workbench (stacked console/terminal/editor windows), `talk` (avatar + speech bubble + side card),
   `providers`, `meter`; extend `lanes` (avatars in headers, item moves, divider strike, ticks) and `pipeline`
   (file peek, pager alert); chapter label + top-centre heading in lanes.css; SFX builder from timeline beats.
3. Avatars: fetch 3 characters × 2-3 gestures, record in assets/SOURCES.md.
4. Slides, timeline --check, review (probe 0/0, every poster + strip), preview via `npm run dual --preview`. Done; preview v2 rendered, awaiting the user's review. ← current gate
5. User watches preview → master → srt → social copy (YouTube, Instagram/TikTok, WhatsApp/Telegram).

## Preview v2 feedback (2026-09-29)
- Map cropped when zoomed: the map's clip box is gone; `mapFit` (core/templates/map.js) clamps every camera framing so
  visible nodes/boxes stay inside the safe area below the heading. s10 terminal moved to y 300. Probe 0/0.
- Voice "breaking" (~15-20s, ~33-35s, throughout): baked into the source mp3, a hard noise gate leaves digital silence
  (below -80 dB) inside words, 377 such gaps. Not introduced by the mix. Candidate fix: pink room tone at about -62 dBFS
  under the VO (A/B clips in renders/audio-ab/). Three repairs built by audio-fix/repair.py (A room tone, B gap fill, C room tone + light reverb); four previews rendered (original, A, B, C) in renders/final/. Waiting on the user to pick one; the master uses the pick as --source.

## v3: cleaned audio + intro move + emoji (2026-09-29)
- New VO: `Cleaned Cloud Engineer vs DevOps Engineer_01.mp3` (543.59s, -21.5 LUFS). Old VO, vo.json, transcript,
  cue sheet and timeline backed up in vo-v1/. Only script change: "Well, let's get into it." at 25.74s.
- Slide windows remapped by word alignment, snapped into real pauses; intro splice moved to 27.55s (pause after
  "let's get into it", before "Now, this is where"). Anchors fixed: s02 l/r, s16 w3o2, s17 li3. timeline 0 errors.
- Re-applied token fixes: port→code, bot→bug, build→bill. sfx.wav rebuilt.
- Approved and built (AskUserQuestion): Fluent Emoji 3D stickers (MIT, assets/emoji, SOURCES.md), 19 moments on beats
  mj1..n (outro uses `at` seconds: its audio bed makes the timeline ignore beats); confetti burst on s20 "deploy it";
  shake on s21 stamp; slow push-in (PROJECT.drift {min 20, amt .025}) on scenes held 20s+; boop SFX per sticker,
  shimmer on the burst. Engine: core/components/fx.js (window.SLIDE_FX), hooked in core/registry.js (html, beat names,
  frame after the template). Probe 0/0, npm test 87/87. Preview v3 rendering → renders/final/cloud-vs-devops-preview.mp4.

## Preview v3 feedback + skill update (2026-09-30)
- Map: edges now run the way content travels (MAP_EDGES reversed: S3 → CloudFront → Viewers, EC2 → LB → CloudFront), so
  lines draw and pulses flow that way; box labels z-index over edges; s12 Security badge moved above EC2. Preview chunks
  80-220s re-rendered. User called the video "perfect"; master not started yet (waiting for "go").
- Skill: references/alive-kit.md (sources + licences, characters, stickers, motion extras, SFX), question 9 + `--alive`,
  law "Make it alive", "One idea per scene"; templates.md + step-3 beat table cover the v2 templates and the fx layer;
  step-2/4 and pitfalls updated. New scripts: npm run kit (fetch-kit.js), npm run sfx (scripts/sfx.js, replaces the
  project sfx.js; cues identical, 206), npm run beat-frames. build-sting.js sums cues in Node (7 s instead of hanging).
