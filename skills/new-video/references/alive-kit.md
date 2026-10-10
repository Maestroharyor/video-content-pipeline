# The alive kit: characters, emoji, sound and motion

A deck of well-timed diagrams is correct; the same deck with a cast of characters, a sticker on the punchline and a
click under every typed command is *watched*. This kit is on by default for explainers (question 9 in SKILL.md). The
reference deck is `projects/cloud-vs-devops` (31 scenes, three characters, 21 stickers, a 206-cue effects track).

## 1. Sources (licence first, always)

Only these, and log every file in the project's `assets/SOURCES.md` (`npm run kit` and `npm run assets` do it for you).

| Kind | Source | Licence | Credit needed | How to get it |
|---|---|---|---|---|
| Characters (default) | DiceBear **Notionists**: hand-drawn people, 6 gestures | CC0 1.0 | No | `npm run kit -- --project <slug> --character dev --seed devtunde [--options "…"] [--gestures …]` |
| Characters (alt, CC0) | DiceBear **Open Peeps**, **Lorelei** | CC0 1.0 | No | same API, `https://api.dicebear.com/9.x/<style>/svg?seed=…`, log the URL by hand |
| Characters (avoid) | DiceBear Personas, Micah, Adventurer · Storyset free tier | CC BY / attribution | Yes | only if the description carries the credit |
| Emoji (default) | Microsoft **Fluent Emoji 3D**, 256px PNG | MIT | No | `npm run kit -- --project <slug> --emoji "rocket, thinking face"` |
| Emoji (flat alt) | Google **Noto Emoji** | Apache 2.0 | No | https://github.com/googlefonts/noto-emoji (log by hand) |
| Emoji (avoid) | Twemoji (CC BY 4.0), OpenMoji (CC BY-SA 4.0) | attribution / share-alike | Yes | only with credit |
| Emoji (never) | Apple / Samsung system emoji | not licensed for video | – | – |
| Logos | AWS Architecture Icons · simple-icons · vendor brand pages (e.g. the Azure icon zip) | vendor terms | No | `project.js → assets` + `npm run assets` (see step-3-build.md) |
| Photos | Openverse + Wikimedia Commons (CC0 / PD / CC BY) | per photo | CC BY: yes | `npm run photos -- --project <slug> --subject "server rack"` |
| Sound | synthesised in `assets/logos/lifetechfacts/build-sting.js` (rise, type, pop, blip, thump, boop, shim, tick) | ours | No | `npm run sfx -- --project <slug>` |
| Sound samples | a file you supply (`sample` cue) | check its licence first | depends | put it in the project's `assets/`, add `{s:'sample', f:'file.wav', t}` to `PROJECT.sfx.extra` |

Fluent names are the folder names on https://github.com/microsoft/fluentui-emoji/tree/main/assets ("Thinking face",
"Party popper", "Grinning face with sweat"); skin-tone emoji come in the Default (yellow) tone. Notionists options:
https://www.dicebear.com/styles/notionists/ (`glasses=variant08&glassesProbability=100`, `bodyIcon=saturn&bodyIconProbability=100`,
`beardProbability=0|100`). Gestures: `point` (explaining), `ok` (done, approved), `hand` (stop, a question), `waveLongArm`
(hello), `handPhone` (on call, a pager), `none`.

## 2. Characters

- **One character per role, the same person every time**: one seed + fixed options per role, all six gestures fetched once
  (`npm run kit` names them `<role>-<gesture>.svg`). Pick the gesture for the moment, not at random.
- Where they live: `cast` + `bubbles` (component `core/components/cast.js`) in `talk`, `app`, `map`, `bench`; `avatar`
  and `team` in `lanes` (header card, a row of small people for team size); `mid.avatar` for a shared band.
- Bubbles say 3-7 words, in the character's voice ("That's *my* job.", "What will it *cost* us?"), never the narration
  repeated. A bubble fades when the same speaker's next one lands.
- Characters give the viewer someone to follow: introduce each on the line that names the role, then keep them.

## 3. Emoji stickers (`data.emoji`, any template)

```js
data: { …, emoji: [{ e: 'rocket', x: 1240, y: 96, size: 120 }, { e: 'thinking_face', x: 1560, y: 750, tilt: 10, hold: 2.8 }] }
// cue sheet Beats: mj1:"next youtube" mj2:"start building"
```
- `x/y` are **stage px** (1920x1080 or 1080x1920), not content px, so a sticker stays put when vcenter moves the content.
  `size` 110-130; `hold` seconds on screen (2.8); `tilt` the entrance rotation. Beats `mj1..mjn`; a slide whose beats the
  timeline ignores (an outro with an audio bed) uses `at: <slide seconds>` instead.
- **Density**: one every 30-40 s (about 15-20 in a 9-minute video), never two on screen at once.
- **The word**: an emotion or a punchline ("confused" 🤯, "all that jazz" 🎷, "fails" 🔥, "roll back" 😅,
  "identical" 🤷), not a noun the slide already draws.
- **Placement**: right of the headline's end (y ≥ 150 so it clears the eyebrow), or in empty space beside the thing it
  reacts to. Never over text, a character's face or the hero element.
- **Time**: the beat must land ≥ 1.5 s before the slide's exit, or the sticker pops out as it pops in. A word at the very
  end of a line goes on the NEXT slide's first beat instead (`mj1:"In simple"-0.2`).

## 4. Motion extras (`core/components/fx.js`)

| Effect | Data | Beat | Use for |
|---|---|---|---|
| Confetti burst | `burst: {x, y}` (stage px) | `burst` | a success: time it to the moment the thing turns green (a pipeline stage settles 0.45 s after its beat: `burst:"deploy it"+0.5`) |
| Screen shake | `shake: true` | `shake` | an impact: a failure stamp, a crash, a bill landing |
| Slow push-in | `PROJECT.drift = {min: 20, amt: .025}` | – | every scene held 20 s or more, so long holds never freeze; `data.drift: false` opts one out |
| Camera | `map`: `cam0`, `cams` | `cam1..` | zoom into the part being named; framing is clamped so nothing is ever cropped |
| Flow pulses | `map`: `flow: [edge numbers]` | – | data moving; edges run the way content travels (S3 → CloudFront → Viewers) |

## 5. Sound effects

`npm run sfx -- --project <slug>` turns the timeline's beats into `assets/sting.json` and builds `assets/sfx.wav` (the
whole video, 7 s to build). Add to `project.js`:
```js
cta: { sfx: 'assets/sfx.wav', sfxAt: 0, gain: 0.7 },              // npm run dual mixes it under the voice, across the splice
sfx: { noRise: ['11', '12'], tick: ['17', '23'], thump: [{ slide: '21', beat: 's5' }], extra: [] },
```
`sfx.type: ['04']` lets those slides' code-line beats (`l<n>`, `p<i>l<j>`, `w<n>l<n>`) click like terminal typing.
`sfx.outroBed: true` lays the brand's outro audio (`BRAND.audio`: the pop bed or `outro-music-tropicorp.wav`) into the
track at the outro's start, so `npm run dual` renders end on it like `assemble` ones do. With music, `outroDelay`
(seconds into the outro) and `outroFadeIn` shape its entrance, and the pop + shimmer bed still plays under it for the
handle pops (`outroFx: false` drops it).
| Sound | Plays on |
|---|---|
| rise (soft whoosh) | 0.3 s before each slide, except the first, the outro and `noRise` (scenes that continue each other) |
| type (key clicks) | terminal commands typing: `c<n>`, `tc<n>`, `w<n>c<n>` |
| pop | reveals: `a b q k t x bd<n>`, `la ra meter fill`, map fills |
| blip | tick-box items `li/ri<n>` on the `tick` slides |
| thump | `stamp`, `divx`, each `thump` entry |
| buzz | `pager` (three low blips) |
| boop | every sticker `mj<n>` |
| shim | `burst` |
| sample | the outro bed / music (`outroBed`) and any `extra` sample cue |

Levels are low on purpose (sound on reveals, not on every sentence). **Re-run `npm run sfx` after every
`npm run timeline`**, or the effects drift off their beats.

## 6. Storyboard and review

- In the cue sheet: characters and stickers go in *Visual / data* ("🎷 sticker bottom-right of the dev row"), their
  beats (`mj*`, `burst`, `shake`, `la`, `a1`, `b1`) in *Beats*, the cast list and sticker count in *Design notes*.
- Review: `npm run beat-frames -- --project <slug>` renders a frame 0.7 s after every `mj`/`burst`/`shake` beat into
  `renders/beats/` + `sheet.png`. Filmstrips sample evenly and miss a 3-second sticker; look at this sheet instead.
