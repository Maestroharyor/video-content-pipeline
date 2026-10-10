# Step 3: Build the slides

## Project files

```
projects/<slug>/
  project.js      canvas, resolution ('4k' | '1440p' | '2k' | '1080p'), fps, dur, hold, captions {on, y}, bg {drift}, brand overrides, assets to fetch, locale {currency}
  index.html      loads core + project.js + slides (the renderer keeps the core and slides blocks in sync)
  slides/NN-slug.js
  assets/         project-only logos/images (referenced with passet('file.svg'))
  cue-sheet.md    the storyboard (Step 2)
  vo.m4a          the voiceover (git-ignored) · vo.json + transcript.txt (committed) · captions.json · timeline.json
```

## Writing a slide

```js
defineSlide({
  slug: '05-running-means-paying', template: 'console', // dur = motion seconds, defaults to PROJECT.dur (5)
  data: {
    eyebrow: 'The rule', accent: 'r', h1: 'Running<br><em>means paying</em>', foot: 'The meter runs whether or not you send a request.',
    console: { service: 'EC2', crumb: ['EC2', 'Instances'], nav: [...], active: 3, title: 'Instances (1)',
      buttons: ['Instance state ▾'], primary: 'Launch instances',
      cols: [{ l: 'Name', w: 3 }, { l: 'Instance state', w: 3 }], rows: [['ai-demo', { st: ['Running', 'ok'] }]] },
    badges: [{ text: '$0.0416 / hour', cls: 'n' }, { text: '24 / 7', cls: 'a', x: 600 }],
    sub: 'Compute is billed per second while the state says Running.'
  }
});
```

- Template data schemas: `references/templates.md`. Missing required fields throw a readable error at load.
- A custom slide provides `html(data, ctx)` and `frame(u, ctx)` (plus optional `setup(root, data, ctx)`); prefix every id with `ctx.p`.
  `u` is motion progress 0..1; `ctx.local` seconds into the slide, `ctx.T` absolute timeline seconds, `ctx.beats` the resolved
  beats (`{name: {s, e}}`, slide-relative), `ctx.hero` the `!` beat, `ctx.exit` when the exit starts, `ctx.hold` seconds spent
  at the end pose (for `idle()`/`ring()`), `ctx.out` the exit progress (the engine already fades/pushes the root).
- Timing in a custom `frame`: `const B = beats(c)` then `up(id, B.p('panel', .14, .30))` — `B.p(name, a, b, kind)` returns the
  element's progress from its beat (kind `enter` .40s, `pop` .30s, `bar` .60s, `draw` .50s, `tick` ≤ .80s) or from the
  fraction window `a..b` when the row has no beat for it; `B.group('r', n, {a, step, len, kind, dim})` for chains;
  `dim(id, rec.dim)` after the fx; `holdLife(B, p, d)` last (sweep + hero ring). Declare the names with `beats: ['panel', …]`
  on the slide so `npm run timeline --check` can validate the cue sheet.
- Helpers (`core/anim.js`): `seg up pp sx fd draw codeLine code bars fill tick ripple cursor status pulse` +
  `h1In stagger idle sweep ring wipe drawPop dim`; easings `eo eo4 eio bk expo spring`. `clickFlow` and `centerOf` in `core/components/misc.js`.

## Beat names per template (what the cue sheet's Beats column may target)

| Template | Containers / chains | Payloads | Singles |
|---|---|---|---|
| every template | `eb h1` (automatic) | `em` (underline), `foot` | – |
| title | `hero` | `counter` (needs `badge.counter`), `bars` (chart) | `chart badge sub`, chips `k1..kn` |
| statement | `q` | `strike` | `badge sub` |
| compare | `l r` | `strike` | `neq i1..in sub` |
| list | `r1..rn` | `ck1..ckn` (chk), `n1..nn` (node) | `badge sub` |
| cards | `c1..cn` | `c<i>b<j>` bars, `c<i>t` tag | `sub` |
| logos | `t1..tn` | – | `note sub` |
| checklist | `c1..cn` | `ck1..ckn`, `bars` | `chart badge` |
| chart | `chart` | `bars`, `counter` | `bd1..bdn sub` |
| code | `t1..tn`, `code` | `l1..ln` | `ok note` |
| console | `con`, `row1..rown` | `flow` (click flow starts), `flow.ok` (confirm lands) | `bd1..bdn sub` |
| diagram | every `seq[].el` (box/node ids, `e0..`, `cloud`) | `dim` | `badge` |
| outro | `hr1..hrn` | – | `div box` (ignored on audio-bed slides) |
| lanes | `l r`, `li1..n ri1..n`, `mid`, `k1..n` | `la ra` (avatars), `ltm rtm` (teams), `x1..n` (chip flies to its item) | `div divx mix q1..n sub` |
| app | `win`, `k1..n` (features) | `fill` (sketch → real), `code`, `l1..n` | `a1.. b1.. q1..n sub` |
| map | `g<slot>` (placeholder), `vpc pub priv sg`, `e1..e6` | `f<slot>` (fills into the service), `cam1..n` | `bd1..n term tc1.. to1.. meter a1.. b1.. sub` |
| bench | `w1..n` (windows) | `w<n>r` (row), `w<n>c1.. w<n>o1..` (terminal), `w<n>l1..` (code), `x<n>` (strike) | `k1..n a1.. b1.. sub` |
| talk | `a1.. b1..` (cast, bubbles), `q`, `f1..n` | `st`, `s1..n` (steps struck), `r`, `k1..n` (commits) | `badge sub` |
| providers | `t1..n` | `deep grow` | `sub` |
| meter | `m1..n` | `chart bars counter` | `sub` |
| term | `term`, `c1..n` | `o1..n` | `badge sub` |
| pipeline | `run`, `s1..n` (a stage runs .45 s, then settles) | `rb`, `peek`, `stamp`, `term tc1.. to1..`, `pager` | `k1..n badge sub` |
| any slide (fx layer) | – | `mj1..n` (emoji stickers), `burst`, `shake` | – |

The hero (`!`) should be a container (card, quote, row, tile), never a bar or tag inside a clipped card.
- Components: `awsConsole awsMenu awsModal awsFlash awsBilling costChart vpcDiagram logoStack checkRow chip xMark pointer heading`.
- Logos: declare them in `project.js → assets` and run `npm run assets -- --project <slug>`:
  `aws: ['ec2', 'lambda']` → official AWS Architecture Icons by name → `logo('ec2')`;
  `brands: ['docker', 'stripe']` → simple-icons slugs (check https://simpleicons.org) → `logo('docker', true)`;
  `urls: { acme: 'https://…/logo.svg' }` → any other official brand asset → `passet('acme.svg')`.
  Never draw a logo by hand and never take one from an unofficial source; the fetch records provenance in the project's `SOURCES.md`.
- Captions on (vertical default): the content box is 940px tall (455–1395) and the caption band sits at 1450–1600. Do not put
  anything below `GRID.ch`; the probe flags it.

## The alive kit (characters, emoji, sound): see `references/alive-kit.md`

```bash
npm run kit -- --project <slug> --character dev --seed devtunde --options "glasses=variant08&glassesProbability=100"
npm run kit -- --project <slug> --emoji "rocket, thinking face, party popper"
npm run sfx -- --project <slug>          # after every npm run timeline: assets/sfx.wav from the beats
```

## Check loop

```bash
npm run review -- --project <slug>       # probe (must be 0/0) + posters + filmstrips + contact sheet, in one go
npm run preview -- --project <slug>      # optional: play it at real time in a browser (space, ←/→, 1-9)
```

Then **look** (Read tool) at:
- `renders/poster/*.png` — end pose: grid alignment, overflow, logo size, sentence-case badges, console header not clipped;
- `renders/strip/*.png` — motion across the slide's real window (green bar on tiles where a beat is entering): elements arrive
  spread across the line, not bunched in the first tiles; one focal pop per tile; earlier siblings dim when a later one fires;
  the hero tile is obvious; nothing new appears after the last beat; click flows show pointer → menu → modal → status;
- `renders/contact-sheet.png` — the whole deck: accent rhythm, variety, no two identical layouts in a row.

- `renders/beats/sheet.png` (`npm run beat-frames -- --project <slug>`): every emoji sticker, burst and shake 0.7 s after its
  beat: clear of text and faces, not popping out as it pops in, the burst on the moment the thing succeeds.

Fix, re-run `npm run review`, repeat. Do not proceed with a poster or strip you have not looked at.
