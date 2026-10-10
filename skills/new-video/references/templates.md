# Template catalogue (`core/templates/`)

Every template takes the common heading fields `eyebrow`, `accent` (t v g r a b o), `h1` (use `<br>` for the line break and
`<em>` around the key phrase for the accent + underline), `h1size` ('' | sm | xs), `foot`, and sizes itself to the canvas.
Ids are auto-prefixed. `dur` (motion seconds) is the fallback schedule; with a timeline every element enters on its beat
(cue-sheet `Beats` column → `ctx.beats`), the motion window grows to cover the last beat and the slide holds its end pose until
its line ends. `frame(u, ctx)` gets `ctx = {id, p, data, grid, slug, t, T, local, dur, motion, screen, hold, out, beats, hero, exit}`.
Beat names per template are listed in step-3-build.md; a slide may also set `data.beats` (`{r1: 'two jobs', sub: 6.4}`).
See `projects/template-gallery/slides/` for one working example of each of the original set, and `projects/cloud-vs-devops/slides/`
for lanes, app, map, bench, talk, providers, meter, term and pipeline. Each template file opens with its full data schema and beat
names in a header comment: read it before writing a slide.

**Layered on every template** (core/components/fx.js, see alive-kit.md): `emoji:[{e,x,y,size,hold,tilt,at}]` (beats `mj1..`),
`burst:{x,y}` (beat `burst`), `shake:true` (beat `shake`), and the project-wide slow push-in `PROJECT.drift`. Characters come
from `core/components/cast.js` (`cast:[{src,name,cls,size,x,y}]`, `bubbles:[{who,text,x,y,w,tail}]`, beats `a1.. b1..`).
A top-centre heading with full-width content: copy the `layout` line and the trailing `layout === 'top'` block of
`projects/cloud-vs-devops/project.js` (grid overrides + the `layout-top` class in lanes.css; the lanes family links `lanes.css`).

| Template | Use for | Required data | Optional data |
|---|---|---|---|
| `title` | opening slide, hero + stat | `eyebrow h1` | `sub hero:{logo,brand} badge:{text,cls,counter:{from,to,fmt}} chart` (costChart spec) `chips:[{text,cls}]` |
| `statement` | one big claim / rule / misconception | `eyebrow h1 quote` | `label cls strike badge:{text,cls} sub` |
| `compare` | A vs B, "≠" | `eyebrow h1 left:{lb,qt,cls} right:{lb,qt,cls}` | `sep strike:'left'|'right' icons:[{icon,brand,label}] sub` |
| `list` | items with icons; numbered nodes; check rows | `eyebrow h1 items:[{text}]` | `style:'rowbar'|'node'|'chk' items[].icon/brand/sub/num/tail/cls badge sub` |
| `logos` | tech stack row | `eyebrow h1 items:[{icon,brand,label}]` | `size note:{text,cls} sub` |
| `code` | script / config with line reveal | `eyebrow h1 file lines:[html]` | `tiles:[{icon,label}] ok note` (spans: `.k .s .n .c .f .p`) |
| `console` | AWS console screen, optional click flow | `eyebrow h1 console` (awsConsole spec) | `rowsIn select:[rowIdx] menu modal flow:{x0,y0,times} states:[[text,type]…] stateRow badges sub extra` |
| `chart` | bars + counter | `eyebrow h1 chart:{title,unit,bars:[{l,v,c}],max,fmt}` | `counter:{from,to,fmt,cls} badges sub` |
| `checklist` | closing checklist, optional chart | `eyebrow h1 items:[{icon,text,sub,tail}]` | `chart badge:{text,cls}` |
| `diagram` | boxes/nodes/edges (VPC-style) | `eyebrow h1 vpc:{boxes,nodes,edges,cloud,h}` | `seq:[{el,fx,at}] dim:{els,at,to} hot badge` |
| `cards` | side-by-side cards with label/value rows and bars (comparisons, named lists) | `eyebrow h1 cards:[{title,rows:[{label,value,v,cls}]}]` | `cards[].tag:{text,cls} cards[].foot minW sub foot` (wraps to two columns in narrow grids) |
| `outro` | follow / handles / link-in-bio | – | `eyebrow h1 foot handles box` (defaults from `core/brand.js` / `PROJECT.brand`) |
| `lanes` | two roles side by side, a shared band, items flying between them | `eyebrow h1 left:{role,cls} right:{…}` | `items tools avatar team pre dim mid:{label,chips,avatar} link divider asks mix` |
| `app` | a web app in a browser: wireframe → real UI, features pop or light with their code | `eyebrow h1 features:[{label,icon}]` | `mode:'build'|'wire' sketch code:{file,lines} cast bubbles questions` |
| `map` | one architecture canvas the story keeps returning to: slots fill into services, edges pulse, a camera zooms | `eyebrow h1 slots` | `boxes edges flow badges cam0 cams term meter cast bubbles` |
| `bench` | a workbench of windows (console, terminal, editor) opening in turn, earlier ones stepping back | `eyebrow h1 windows:[{kind,…}]` | `strike chips cast bubbles` |
| `talk` | characters carry the line in speech bubbles beside a card, a before/after, or a flow | `eyebrow h1 cast` | `bubbles panel steps flow commits badge` |
| `providers` | provider cards with depth meters (specialise in one, learn the rest) | `eyebrow h1 items focus` | – |
| `meter` | growth counted: stat tiles tick, a bill climbs | `eyebrow h1 stats chart counter` | – |
| `term` | a terminal session: commands type, output prints | `eyebrow h1 steps:[{cmd,out}]` | `title cwd badge` |
| `pipeline` | one CI run: stages queued → running → passed/failed, log, rollback | `eyebrow h1 run stages` | `log rollback badge peek stamp term pager chips` |
| custom | anything else | `html(d,ctx) frame(t,ctx)` | `setup(root,d,ctx)` |

### awsConsole spec
`{ service, crumb:[…], nav:['Item', {grp:'Group'}], active, title, info, buttons:['Actions ▾', '!Disabled'], primary, primaryBlue,
cols:[{l,w}], rows:[[cell…]], body (html instead of the table), extra }` — cell: string | `{st:['Running','ok'|'prog'|'stop'|'neg'|'pend']}`
| `{mono}` | `{link}` | `{html}`. Menus: `['Item', {hl:'Target'}, {dis:'Disabled'}, '-']`. Modal: `{title, body, warn, field, ok, blue}`.

### costChart spec
`{ title, unit, bars:[{l, v, c:'o'|'r'|'a'|'b'|'g'|'t'|'v'|'d', label}], max, headroom, plotH, fmt }`.

### vpcDiagram spec
`{ h, boxes:[{id,cls:'vpcb'|'pub'|'priv',x,y,w,h,label}], nodes:[{id,x,y,icon,brand,dark,hot,label}], edges:[{from,to,via,color,width,dash}], cloud:{x,y,label} }`.
Coordinates are authored at 960 wide; the template scales the whole diagram down when the canvas is shorter.

### Timing vocabulary inside custom `frame(t)`
`up(id, seg(t,a,b), dy)` fade+rise · `pp(id,p,from)` pop · `sx(id,p,dx)` slide · `draw(svgId,p)` stroke · `code(prefix,n,t,a,b)` lines ·
`bars(prefix,n,t,a,b)` chart · `fill(id,p)` horizontal bar · `tick(id,p,from,to,fmt)` counter · `status(id,text,type)` console pill ·
`clickFlow(t, flow)` pointer → button → menu item → modal → confirm · beat-driven: `const B = beats(c)`, `B.p(name, a, b, kind)`,
`B.group(prefix, n, {a, step, len, kind, dim})`, `dim(id, f)`, `holdLife(B, p, d)` (sweep + hero ring), `sweep ring wipe drawPop`.
