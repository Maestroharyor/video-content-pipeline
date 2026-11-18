/* slate: the dark chalk-schematic look (core/styles/slate.css), built for projects/postgres-for-everything revision 2
   (review 1: "I like dark B and look C without the background. But also improve the background"; "I prefer dark mode").
   GitHub-dark charcoal ground (#0d1117), JetBrains Mono for data, Inter Display headlines, white hand-drawn chalk boxes and
   arrows that draw themselves on straight paths, marker labels for the odd annotation, neon accents (cyan, pink, green,
   amber, red, Postgres blue). Big type, one idea per frame, things build in place.

   The scene engine is bistro (core/templates/bistro.js, on cafe.js): items enter on spoken words, move, swap, change state,
   terminals and editors type, packets draw along their paths. This template prepares its own kinds into bistro `html`
   items and hands everything else through unchanged (mirrors core/templates/heap.js), then adds the docked section tracker,
   the ON-camera overlay and the face-window layout.

   data: bistro's {eyebrow, accent, h1, w? (1540), h? (600), items, edges?, sub?, split?, sweep?, headPre?} plus
     over?    the ON-camera overlay (see OVER below); replaces bistro's over rows
     tracker? false hides the docked tracker on this slide. Without a timeline (a lone poster / the probe) the tracker shows
              only when set: true = every section "?", a number n = section n current and 1..n-1 done with their verdicts.

   ---------- kinds (item.k), on top of bistro/cafe's (card chip stamp txt tile logo who bar photo html svg flip packet vsc term chrome)
   box    {html?, w, h, font?: 'marker'|'mono'|'sans' (default sans), cls?: b|t|v|g|a|r|o|w, fill?: false, seed?}
          a hand-drawn chalk box (uneven, rounded stroke) that draws itself on over .55 s from its beat, then its tint and
          text fade in. cls colours stroke + tint (w = plain chalk white, the default). Big actor blocks: font 'marker'.
   arrow  {pts: [[x, y], …] (world coords, straight segments), b, d? (.6 s), cls?, dash?, head? (true), label?, lp? [x, y],
          lcls?, until?, out?: {b}}   a chalk arrow drawn on along its straight path, the hand-drawn head (two strokes)
          landing at the tip; label = a marker annotation at lp (default: above the middle of the first segment). Like
          bistro's packets it never starts before the items at either end have entered (+.45 s). x/y/w/h are set for you.
   page   {title, size?, cols?, rows: [row], states?: [state], rowIn?: [{b, row}], gc?, rh? (72), w}
          the jobs table (dark heap.js page): a mono header bar "title … size", an optional column-header strip, one rh-px
          row per tuple. h is computed: 4 + 50 + (cols ? 40 : 0) + rh x rows.
          row   {cells: [string], st?: 'pend'|'a'|'b'|'done'|'dead'|'fail', lock?: 'A'|'B'|string|false, pill?: string}
                a = Worker A (cyan tint, "A" padlock, cyan pill), b = Worker B (pink), done = green, dead = hatched + struck
                ("dead", waiting for VACUUM), fail = red. lock defaults from st; pill overrides the pill's word.
          state {b, row (0-based), st, lock?, pill?}    applied in order from its beat (.35 s tint, the pill pops)
          rowIn [{b, row}]                              that row is invisible (space kept) until its beat, then rises in
   trk    {n, items: [labels], lit, steps?: [{b, lit}]}  a small numbered tracker (quick-fire five, the three columns):
          slots before lit done (green number, label), lit current (cyan), later "?" (never named before the voice).
   tracker {dir?: 'row'|'col' (row), auto?: true, cur?, done?, steps?: [{b, cur?, done?}], unfold?: beat, names?: 'all'|'seen',
          num?: true, sections?}   the section tracker big (PROJECT.tracker.sections unless given): auto = the deck clock's
          state (as the docked one); otherwise sections < done (1-based count) show their verdicts, cur is lit, the rest "?".
          unfold: the chips rise in one by one (.22 s apart) from that beat (s08's road map). names 'seen' hides the label of
          a section not reached yet (number + "?" only). col = one chip per row, top to bottom.
   iphone {w (h is computed: w x 892/433), screen?: html (an app screen instead of the home screen), ink?: 'light'|'dark'
          (status bar text; dark for a light app screen), apps?: [names] (the home grid, 4 a row), dock?: [names]
          (Phone Safari Messages Music), appIn?: [{b, app}], hl?: [{b, app, until?}], time? '9:41'}
          an iPhone 15 Pro: natural titanium frame with its buttons, Dynamic Island, status bar (9:41, signal, wifi,
          battery), the home screen grid (iOS geometry: 62 px icons, 4 columns, labels), page dots and the dock. App icons
          drawn after Apple's own: Phone Messages Safari Music Camera Maps Calculator Settings FaceTime Calendar Photos Mail
          Notes Reminders Clock Weather "App Store" Health Wallet. appIn: that icon's slot is empty until its beat, then it
          pops in; hl: the icon lifts with a cyan ring. SL.iphoneApp(item, name) = the icon's centre in world coords.
   bubble {html, w, h? (96), to?: [x, y] (world point the tail points at), tail?: {side: 'b'|'t'|'l'|'r', at: 0..1, len?},
          cls?}   a speech bubble: chalk outline, dark fill, one continuous outline with the tail aimed at its speaker.
   scan   {tokens: [string | [text, cls?, to?]] | text, sweep?: beat (default: the entrance + .5 s), d? (1.4 s), cls?}
          a mono string in a chalk box; a bar sweeps it left to right and each token takes its cls (k key, s string,
          x struck red, g green, hit cyan …) and its `to` text as the bar passes its middle.
   counter {from, to?, at?: beat (default: the entrance), d? (1.2 s), steps?: [{b, to, d?}], dec?: 0, comma?, pre?, suf?,
          label?, cls?}   a big odometer: every digit rolls, carries ripple left. steps roll on to each value in turn.

   ---------- OVER: the ON-camera overlay (review 1: "Clean face + tag and can have overlay motion graphics primarily on
   the left and secondarily on the right"). data.over = {tag?, h1?, left?: [oi], right?: [oi], valign?: 'center'|'top'|'bottom'}
     Shown only in the alpha capture inside a face window that is `over` without `split` (PROJECT.reveals; `on: true`
     marks the ON shots): the face stays clean; the slide's deck content is hidden. A small tag sits top-left
     (x 60, y 48, eyebrow-sized pill; default data.eyebrow) from the window's first frame (windows cut: no fade). Left column
     x 60-620, y 120-1000; right column x 1340-1860, same band; the face (~x 700-1220) is never covered. Every item sits on
     its own dark chalk card (semi-opaque), never a gradient over the face. The deck-only master shows the slide itself.
     oi (k defaults to 'row'): every item has b? (entrance beat) | at? (seconds) | default stagger .3 + .35 i; out?: {b};
     cls? (b t v g a r o colour), w?/h? (px; default the column width / auto)
       row   {html, icon? | logo? | src?}   an icon tile (filled role colour, dark icon) + text; <b> takes the colour
       h     {html, sub?}                   a headline card (44 px Inter Display, <em> in the colour)
       card  {html}                         raw markup on a card
       img   {src, h?, cap?}                an image (photo, capture) framed on a card
       chips {items: [{html, logo?, icon?, cls?}]}   a wrapped row of pills
       sub   {b, lead?}                     the channel's subscribe bar (core/components/subscribe.js) clicking from its word
       term  {lines, b, cps?, title?, prompt?, h?}  a small macOS Terminal typing its '$ ' lines from b (records PL_TYPED)
       iphone | bubble | counter | scan | tracker | page | trk   the deck kinds above, sized by w/h
   bistro's own over (rows/term/win/sub) is not used on slate slides.

   ---------- face windows (PROJECT.reveals, read at render time; posters and the probe use data.split / data.over):
     over + no split → ON (above);  split → the slide in the right two thirds on its plate (bistro geometry: scale .8,
     plate edge at x 640), face left third;  none → the full deck. All windows open and close as cuts (in/out 0): the
     overlay never fades in, and a slide whose end lands on a window edge holds its last frame instead of pushing out
     (class xhold, core/registry.js), so no ghost of it dissolves into the face.

   ---------- the docked section tracker (PROJECT.tracker = {from, end, sections: [{label, logo?, from, verdict?, kind?:
     'ok'|'keep'|'warn', at?, b?}]}): on every full-frame slide from the start of tracker.from to the start of tracker.end
     a row of nine chips across the top, centred: the current section lit (cyan border + glow) from its own `from` slide to
     the next section's; later ones "label ?"; one whose verdict is in (from beat b of slide at, or that slide's end) shows
     the verdict under its label, coloured by kind (ok green, keep amber, warn red), and pops as it lands. It lives on the
     stage, not in the slide (it never moves with a slide's exit), and is hidden over the face (ON and SPLIT windows of
     the alpha capture). Footprint: y 14-68 (chips 54 tall), x centred, ≤ 1800 wide with every verdict in. The heading
     moves down for it (GRID.ebY 96, h1Y 136, h1Size 60): the safe content box is x 190-1730, y 230-870 (the top layout's).

   ---------- the ground (BS_GROUND, margins only, ~5%): chalk schematics of the subject drift up the left (x 18-168) and
   right (x 1752-1902) margins: a heap page (line pointers, tuples), a query-plan tree, a B-tree node, a WAL segment, a
   JSONB blob, a vector; a WAL tape creeps left along the bottom band (y 1000-1040); three soft colour pools (cyan, pink,
   Postgres blue) orbit slowly behind everything; a faint dot grid and a vignette. All from absolute time. PROJECT.ground:
   'schematic' (default) | 'quiet' (pools, dots and vignette only).

   ---------- window.SL: item builders for slide authors (world box 1540 x 600); each returns a plain item object and takes a
   trailing o = extra fields merged last (b, fx, cls, on, moves, out, pre, z …):
     SL.src(name)                                  'postgresql' → assets/logos/brands/postgresql.svg; a path passes through;
                                                   'aws:x' → assets/logos/aws/x.svg; 'p:x' → passet('logos/x.svg')
     SL.box(id, x, y, w, h, html, o)               chalk box (o.font 'marker' for the big actor blocks)
     SL.arrow(id, b, pts, o)                       chalk arrow drawn on along pts from beat b (o.label, o.lp, o.d, o.dash)
     SL.page(id, x, y, w, title, rows, o)          rows: [row] or [[cells…], st?, extra?] tuples; o.cols/states/rowIn/rh
     SL.row(cells, st, o)                          one row object
     SL.trk(id, x, y, w, n, items, lit, o)         h 58
     SL.tracker(id, x, y, w, h, o)                 the big section tracker
     SL.iphone(id, x, y, w, o)                     h computed; SL.iphoneApp(item, app) → [x, y] of that icon's centre
     SL.bubble(id, x, y, w, h, html, o)            o.to [x, y] or o.tail
     SL.scan(id, x, y, w, h, tokens, o)
     SL.counter(id, x, y, w, h, o)                 o.from, o.to, o.steps, o.dec, o.pre, o.suf, o.label
     SL.chip(id, x, y, html, o)                    o.logo | o.src | o.icon; cls b/g/a/r/t/v, fill-*, mono
     SL.card(id, x, y, w, h, label, sub, o)        o.logo | o.img | o.icon | o.who; cls b/g/a/r
     SL.logo(id, x, y, name, label, o)             a mark on a white tile, 150 x 150 (cls 'sm'); name = slug or path
     SL.who(id, x, y, src, name, o)                a character (light sticker outline), 170 x 170; src = avatar name or path
     SL.txt(id, x, y, html, o)                     free text (cls mono, big, lbl, hand (marker), r/g/b/a/t/v)
     SL.tag(id, x, y, html, o)                     a mono uppercase label
     SL.note(id, x, y, html, o)                    a marker annotation ("(1) locked → skip"), cls for colour
     SL.img(id, x, y, w, h, src, o)                an image, contained
     SL.vsc(id, x, y, w, h, file, lines, o)        VS Code (title 'jobs-app'); bistro vsc fields in o (files, blocks, hl …)
     SL.term(id, x, y, w, h, lines, o)             macOS Terminal; '$ ' lines type at PROJECT.prompt
     SL.psql(id, x, y, w, h, lines, o)             a Terminal running psql ('$ ' lines type at 'app=# '), title 'psql'
     SL.chrome(id, x, y, w, h, url, html, o)       Chrome with a rebuilt page
     SL.packet(id, b, pts, o)                      bistro's request arrow (packet)
     SL.edge(id, a, z, o)                          a data.edges entry (a/z = item ids or [x, y]); cls b/a/g/r/mute, o.b, o.dash */
(function () {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const IS = !!(window.PROJECT && PROJECT.theme === 'slate');
  const HS = n => { const s = Math.sin(n * 127.1 + 11.3) * 43758.5453; return s - Math.floor(s); };
  const seedOf = s => { let h = 17; String(s).split('').forEach(ch => { h = (h * 31 + ch.charCodeAt(0)) % 100003; }); return h; };
  const f1 = v => (Math.round(v * 10) / 10).toString();
  const B0 = () => { const t = window.TEMPLATES && window.TEMPLATES.bistro; if (!t) throw new Error('slate: core/templates/bistro.js must load first'); return t; };
  const stageEl = () => document.getElementById('stage');
  const isTransparent = () => { const s = stageEl(); return !!(s && s.classList.contains('transparent')); };

  /* the heading moves down for the docked tracker (y 14-68): eyebrow from 96, headline from 136 (top layout only) */
  if (IS && window.GRID && GRID.canvas === 'horizontal' && PROJECT.layout === 'top' && !(PROJECT.grid && PROJECT.grid.ebY != null)) {
    Object.assign(GRID, { ebY: 96, h1Y: 136, h1Size: 60 });
    const s = stageEl(); if (s) { s.style.setProperty('--eb-y', '96px'); s.style.setProperty('--h1-y', '136px'); s.style.setProperty('--h1-size', '60px'); }
  }
  // the marker face is only used by annotations: start loading it now, so the first frame that shows one never falls back
  if (IS && document.fonts && document.fonts.load) document.fonts.load('400 30px Marker').catch(() => {});

  /* ---------- the deck clock (heap.js): another slide's beats from the injected timeline ---------- */
  const TL = () => { const tl = window.TIMELINE; return tl ? (tl.slides || tl) : null; };
  const rec = sid => { const s = TL(); return s ? s.find(x => x.id === sid) || null : null; };
  const absBeat = (sid, b) => { const s = rec(sid); return s && s.beats && s.beats[b] ? (Array.isArray(s.beats[b]) ? s.beats[b][0] : s.beats[b].s != null ? s.beats[b].s : s.beats[b]) : null; };
  const slideStart = sid => { const s = rec(sid); return s ? s.start : null; };
  const absT = c => { const s0 = slideStart(c.id); return s0 != null ? s0 + c.local : c.T; };

  /* ---------- logos ---------- */
  const src = n => /[/.]/.test(n) ? n : /^aws:/.test(n) ? ASSETS + 'logos/aws/' + n.slice(4) + '.svg' : /^p:/.test(n) ? passet('logos/' + n.slice(2) + '.svg') : ASSETS + 'logos/brands/' + n + '.svg';
  const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></svg>';
  const icon = n => `<svg viewBox="0 0 24 24"><use href="#${/^[dic]-/.test(n) ? n : 'i-' + n}"/></svg>`;

  /* ---------- chalk: hand-drawn strokes, deterministic from a seed ---------- */
  // a rounded rectangle traced by hand: each side bows a little, corners wobble, the stroke overshoots its start
  function rough(w, h, r, seed, j) {
    j = j == null ? 1.6 : j;
    const R = k => (HS(seed * .013 + k * 7.31) - .5) * 2 * j;
    r = Math.min(r, w / 2, h / 2);
    const ov = 8 + 6 * HS(seed * .7 + .3);
    return [`M${f1(r - 3)} ${f1(R(1) * .5)}`,
      `Q${f1(w / 2)} ${f1(R(2))} ${f1(w - r)} ${f1(R(3) * .5)}`,
      `Q${f1(w + R(4) * .3)} ${f1(R(5) * .3)} ${f1(w + R(6) * .5)} ${f1(r)}`,
      `Q${f1(w + R(7))} ${f1(h / 2)} ${f1(w + R(8) * .5)} ${f1(h - r)}`,
      `Q${f1(w + R(9) * .3)} ${f1(h + R(10) * .3)} ${f1(w - r)} ${f1(h + R(11) * .5)}`,
      `Q${f1(w / 2)} ${f1(h + R(12))} ${f1(r)} ${f1(h + R(13) * .5)}`,
      `Q${f1(R(14) * .3)} ${f1(h + R(15) * .3)} ${f1(R(16) * .5)} ${f1(h - r)}`,
      `Q${f1(R(17))} ${f1(h / 2)} ${f1(R(18) * .5)} ${f1(r)}`,
      `Q${f1(R(19) * .3)} ${f1(R(20) * .3)} ${f1(r)} ${f1(R(1) * .5)}`,
      `L${f1(r + ov)} ${f1(R(21) * .4)}`].join('');
  }
  const segLen = pts => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
  function trailTo(pts, q) {
    const L = segLen(pts), out = [pts[0]]; let d = q * L;
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (d >= l) { out.push(pts[i]); d -= l; continue; }
      const f = l ? d / l : 0; out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); break;
    }
    return out;
  }
  // the head: two strokes from the tip, slightly unequal like a hand-drawn chevron
  function headD(tip, dir, seed) {
    const a = Math.atan2(dir[1], dir[0]), l1 = 24 + 3 * HS(seed), l2 = 21 + 4 * HS(seed + 1), s1 = .46 + .06 * HS(seed + 2), s2 = .44 + .06 * HS(seed + 3);
    const p1 = [tip[0] - l1 * Math.cos(a - s1), tip[1] - l1 * Math.sin(a - s1)], p2 = [tip[0] - l2 * Math.cos(a + s2), tip[1] - l2 * Math.sin(a + s2)];
    return `M${f1(p1[0])} ${f1(p1[1])}L${f1(tip[0])} ${f1(tip[1])}L${f1(p2[0])} ${f1(p2[1])}`;
  }

  /* =========================== kinds =========================== */
  const K = {};
  const nameOf = it => it.b || it.id;
  // the entrance progress of an item on the cafe schedule (beat, or the fraction fallback cafe itself uses)
  function enterAt(c, B, it, len) {
    const items = c.data.items, i = Math.max(0, items.findIndex(x => x.id === it.id)), n = items.length;
    const fa = it.at != null ? it.at : .12 + .62 * i / Math.max(1, n);
    return B.at(nameOf(it), fa, fa + .14, 'enter', { focal: false, len: len || BEAT.enter });
  }
  const localOf = (B, name, fallback) => { const r = B.at(name, fallback, fallback + .1, 'enter', { focal: false }); return r; };

  /* ---------- box ---------- */
  K.box = {
    html: it => {
      const w = it.w, h = it.h, sd = it.seed || seedOf(it.id), r = Math.min(26, h * .22);
      return `<svg class="ck" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${it.fill === false ? '' : `<path class="fl" d="${rough(w, h, r, sd + 5, 1)}"/>`}` +
        `<path class="s1" pathLength="1" d="${rough(w, h, r, sd, 1.8)}"/><path class="s2" pathLength="1" d="${rough(w, h, r, sd + 9, 2.4)}"/></svg>` +
        `<div class="in f-${it.font || 'sans'}">${it.html || ''}</div>`;
    },
    fx: 'none',
    frame: (c, B, it, e) => {
      const r = it.__pre ? { s: -9, p: 1, beat: true } : enterAt(c, B, it, .55);
      const q = it.__pre ? 1 : r.beat || B.on ? cl((c.local - r.s) / .55, 0, 1) : r.p;
      const d = (1 - eo(q)).toFixed(4);
      e.querySelectorAll('.s1,.s2').forEach((s, i) => { s.style.strokeDashoffset = i ? Math.min(1, +d + .12).toFixed(4) : d; });
      const fl = e.querySelector('.fl'); if (fl) fl.style.opacity = seg(q, .45, 1).toFixed(3);
      const tx = e.querySelector('.in'); if (tx) { const k = eo4(seg(q, .5, 1)); tx.style.opacity = k.toFixed(3); tx.style.transform = `translateY(${f1((1 - k) * 10)}px)`; }
      e.style.visibility = q <= 0 ? 'hidden' : '';
    },
  };

  /* ---------- arrow ---------- */
  K.arrow = {
    html: it => {
      const pts = it.pts, L = segLen(pts), d = 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L');
      const lp = it.lp || [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2 - 34];
      return `<svg class="aw" width="2" height="2"><path class="ct${it.dash ? ' dash' : ''}" d="${d}" style="stroke-dasharray:${it.dash ? '3 13' : L + ' ' + L}"/><path class="chd" pathLength="1" d=""/></svg>` +
        (it.label ? `<span class="al ${it.lcls || ''}" style="left:${f1(lp[0])}px;top:${f1(lp[1])}px">${it.label}</span>` : '');
    },
    fx: 'none',
    frame: (c, B, it, e) => {
      const pts = it.pts, L = segLen(pts), d0 = it.d || .6;
      let start;
      if (it.__pre) start = -9;
      else {
        start = B.at(nameOf(it), .3, .6, 'enter', { focal: false, len: d0 }).s;
        // never before the things it joins: every item whose box holds either end (40 px slack) must have entered (+.45 s)
        const ends = [pts[0], pts[pts.length - 1]];
        c.data.items.forEach(o => {
          if (o === it || o.pre || o.__sl === 'arrow' || o.bsk === 'arw' || o.x == null || !o.w || !o.h) return;
          if (!ends.some(([x, y]) => x >= o.x - 40 && x <= o.x + o.w + 40 && y >= o.y - 40 && y <= o.y + o.h + 40)) return;
          const bt = c.beats && c.beats[o.b || o.id]; if (bt) start = Math.max(start, bt.s + .45);
        });
        start += it.delay || 0;
        if (!(c.beats && c.beats[nameOf(it)]) && !B.on) start = enterAt(c, B, it).s;
      }
      const el0 = c.local - start, q = it.__pre ? 1 : 1 - Math.pow(1 - cl(el0 / d0, 0, 1), 2);
      const tr = e.querySelector('.ct'), hd = e.querySelector('.chd'), al = e.querySelector('.al');
      if (it.dash) { const t = trailTo(pts, q); tr.setAttribute('d', 'M' + t.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L')); }
      else tr.style.strokeDashoffset = f1(L * (1 - q));
      if (hd) {
        if (it.head === false) hd.setAttribute('d', '');
        else {
          const a = pts[pts.length - 2], z = pts[pts.length - 1];
          if (!hd.getAttribute('d')) hd.setAttribute('d', headD(z, [z[0] - a[0], z[1] - a[1]], seedOf(it.id)));
          hd.style.strokeDashoffset = (1 - eo(seg(q, .86, 1))).toFixed(4);
          hd.style.opacity = q > .86 ? '1' : '0';
        }
      }
      if (al) { const k = eo4(seg(el0, d0 * .5, d0 * .5 + .4)); al.style.opacity = (it.__pre ? 1 : k).toFixed(3); al.style.transform = `translateY(${f1((1 - (it.__pre ? 1 : k)) * 10)}px) rotate(-3deg)`; }
      let o = el0 < -.02 && !it.__pre ? 0 : 1;
      if (it.until && c.beats && c.beats[it.until] && c.local >= c.beats[it.until].s) o *= 1 - seg(c.local, c.beats[it.until].s, c.beats[it.until].s + .3);
      if (it.out) { const ob = B.at(it.out.b, .9, .98, 'enter', { focal: false, len: .4 }); o *= 1 - eo(ob.p); }
      e.style.opacity = o.toFixed(3);
    },
  };

  /* ---------- page (the jobs table) ---------- */
  const PILL = { pend: 'pending', a: 'running', b: 'running', done: 'done', dead: 'dead', fail: 'failed' };
  const lockOf = (st, lock) => lock === false ? '' : lock != null ? String(lock) : st === 'a' ? 'A' : st === 'b' ? 'B' : '';
  const usesLock = it => it.rows.concat(it.states || []).some(r => r.lock || r.st === 'a' || r.st === 'b');
  const pageH = it => 4 + 50 + (it.cols ? 40 : 0) + (it.rh || 72) * it.rows.length;
  K.page = {
    html: it => {
      const n = it.rows.reduce((m, r) => Math.max(m, r.cells.length), 0), lk = usesLock(it);
      const gc = it.gc || ['70px'].concat(Array.from({ length: n - 1 }, (_, i) => i === 0 ? '1fr' : 'auto'), lk ? ['96px'] : [], ['140px']).join(' ');
      const ch = it.cols ? `<div class="ch" style="grid-template-columns:${gc}">${it.cols.concat(Array(Math.max(0, n + (lk ? 2 : 1) - it.cols.length)).fill('')).map(h => `<span>${esc(h)}</span>`).join('')}</div>` : '';
      const rows = it.rows.map((r, i) => {
        const st = r.st || 'pend', cells = Array.from({ length: n }, (_, j) => r.cells[j] != null ? r.cells[j] : '');
        return `<div class="rw st-${st}" data-row="${i}" style="grid-template-columns:${gc};height:${it.rh || 72}px"><i class="tn"></i>${cells.map((v, j) => `<span class="${j === 0 ? 'id' : 'c'}">${esc(v)}</span>`).join('')}` +
          `${lk ? '<span class="lk"></span>' : ''}<span class="pl"></span></div>`;
      }).join('');
      return `<div class="sl-page"><div class="hd"><span>${esc(it.title || 'jobs')}</span><span>${esc(it.size || '8 KB page')}</span></div>${ch}${rows}</div>`;
    },
    fx: 'up',
    beats: it => (it.states || []).concat(it.rowIn || []).map(s => s.b),
    frame: (c, B, it, e) => {
      const sts = it.states || [], ins = it.rowIn || [];
      e.querySelectorAll('.rw').forEach(rw => {
        const i = +rw.dataset.row, r = it.rows[i];
        let st = r.st || 'pend', lock = r.lock, pill = r.pill, t0 = null;
        sts.forEach((s, j) => {
          if (s.row !== i) return;
          const at = B.at(s.b, cl(.3 + .5 * j / Math.max(1, sts.length), 0, .95), 1, 'pop', { focal: false });
          if (c.local >= at.s - .02 && (at.beat || at.p > 0)) { st = s.st; lock = s.lock; pill = s.pill; t0 = at.s; }
        });
        const key = st + '|' + lock + '|' + pill;
        if (rw.dataset.k !== key) {
          rw.className = 'rw st-' + st; rw.dataset.k = key;
          const lk = rw.querySelector('.lk'), lt = lockOf(st, lock);
          if (lk) lk.innerHTML = lt ? LOCK + '<span>' + esc(lt) + '</span>' : '';
          rw.querySelector('.pl').textContent = pill || PILL[st] || st;
        }
        const k = t0 == null ? 1 : cl((c.local - t0) / .35, 0, 1);
        rw.querySelector('.tn').style.opacity = k.toFixed(3);
        rw.querySelector('.pl').style.transform = `scale(${(1 + .14 * Math.sin(Math.PI * k)).toFixed(4)})`;
        const inn = ins.find(x => x.row === i);
        if (inn) { const q = B.p(inn.b, .2 + .05 * i, .3 + .05 * i, 'enter', { focal: false }), e4 = eo4(q);
          rw.style.opacity = e4.toFixed(3); rw.style.transform = `translateY(${f1((1 - e4) * 18)}px)`; }
      });
    },
  };

  /* ---------- trk (small numbered tracker) ---------- */
  K.trk = {
    html: it => `<div class="sl-trk-n">${Array.from({ length: it.n }, (_, i) => `<span data-i="${i + 1}"><b>${i + 1}</b><em>${(it.items || [])[i] || ''}</em><i>?</i></span>`).join('')}</div>`,
    fx: 'fd',
    beats: it => (it.steps || []).map(s => s.b),
    frame: (c, B, it, e) => {
      let lit = it.cur;
      (it.steps || []).forEach((s, j) => { const at = B.at(s.b, cl(.3 + .1 * j, 0, .95), 1, 'pop', { focal: false }); if (c.local >= at.s - .02 && (at.beat || at.p > 0)) lit = s.lit; });
      e.querySelectorAll('.sl-trk-n > span').forEach(s => { const i = +s.dataset.i, k = i < lit ? 'done' : i === lit ? 'on' : 'q'; if (s.className !== k) s.className = k; });
    },
  };

  /* ---------- the section tracker: docked (stage) and big (kind) ---------- */
  const SECS = () => (window.PROJECT && PROJECT.tracker && PROJECT.tracker.sections) || [];
  function chipHtml(s, i, o) {
    o = o || {};
    const lg = s.logo ? `<span class="lg"><img src="${src(s.logo)}" alt=""></span>` : '';
    return `<span class="sc k-${s.kind || 'ok'}" data-i="${i}">${o.num ? `<b class="no">${i + 1}</b>` : ''}${lg}<span class="tx"><b class="lb">${esc(s.label)}</b>` +
      `<i class="q">?</i><em class="vd">${esc(s.verdict || '').replace(/ ([✓✗])/g, '\u00a0$1')}</em></span></span>`;
  }
  /* each section's state at deck time T: later (not started), cur (its stretch), past (after it), and its verdict time */
  function secTimes(secs, c) {
    return secs.map((s, i) => {
      const a = slideStart(s.from), z = i + 1 < secs.length ? slideStart(secs[i + 1].from) : null;
      let tv = null;
      if (s.verdict && s.at) {
        if (c && s.at === c.id && c.beats && c.beats[s.b]) tv = absT(c) - c.local + c.beats[s.b].s;
        else { tv = absBeat(s.at, s.b); if (tv == null) { const r = rec(s.at); tv = r ? r.end : null; } }
      }
      return { a, z, tv };
    });
  }
  function paintChips(root, secs, st, T) {
    root.querySelectorAll('.sc').forEach(ch => {
      const i = +ch.dataset.i, s = st[i];
      const k = ['sc', 'k-' + (secs[i].kind || 'ok'), s.cur ? 'on' : s.later ? 'later' : 'past', s.v ? 'v' : '', s.hide ? 'hn' : ''].filter(Boolean).join(' ');
      if (ch.className !== k) ch.className = k;
      // the verdict pops as it lands; a section lighting up glows in
      const kv = s.v && s.tv != null ? cl((T - s.tv) / .55, 0, 1) : 1;
      const ka = s.cur && s.ta != null ? cl((T - s.ta) / .5, 0, 1) : 1;
      ch.style.transform = `scale(${(1 + .08 * Math.sin(Math.PI * kv) + .05 * Math.sin(Math.PI * ka)).toFixed(4)})`;
    });
  }
  function clockState(secs, c, T) {
    const tm = secTimes(secs, c);
    return tm.map((m, i) => {
      const later = m.a == null || T < m.a, cur = !later && (m.z == null || T < m.z);
      const v = !!secs[i].verdict && m.tv != null && T >= m.tv;
      return { later, cur, v, tv: m.tv, ta: m.a };
    });
  }
  function setState(secs, cur, done) {
    return secs.map((s, i) => ({ later: i + 1 > Math.max(cur || 0, done || 0) && i + 1 !== cur, cur: i + 1 === cur, v: !!s.verdict && i + 1 <= (done || 0), tv: null, ta: null }));
  }

  /* docked: one element on the stage, drawn by whichever slate slide is on screen */
  let DOCK = null, DOCK_SID = null;
  function dock() {
    if (DOCK || !IS || !SECS().length) return DOCK;
    const s = stageEl(); if (!s) return null;
    DOCK = document.createElement('div'); DOCK.id = 'sl-dock'; DOCK.className = 'sl-tracker sl-dock';
    DOCK.innerHTML = SECS().map((x, i) => chipHtml(x, i)).join(''); DOCK.style.display = 'none';
    s.appendChild(DOCK);
    return DOCK;
  }
  function dockFrame(c, mode) {
    const D = dock(); if (!D) return;
    const TR = PROJECT.tracker, d = c.data, T = absT(c), timed = !!TL() && slideStart(c.id) != null;
    let on, st;
    if (timed) { const a = slideStart(TR.from), z = TR.end ? slideStart(TR.end) : null; on = a != null && T >= a && (z == null || T < z); }
    else on = d.tracker != null && d.tracker !== false;
    if (d.tracker === false || (isTransparent() && mode !== 'full')) on = false;
    DOCK_SID = c.id;
    D.style.display = on ? '' : 'none';
    if (!on) return;
    const secs = SECS();
    if (timed) st = clockState(secs, c, T);
    else st = typeof d.tracker === 'number' ? setState(secs, d.tracker, d.tracker - 1) : setState(secs, 0, 0);
    paintChips(D, secs, st, T);
  }

  K.tracker = {
    html: it => {
      const secs = it.sections || SECS();
      return `<div class="sl-tracker big d-${it.dir || 'row'}">${secs.map((s, i) => chipHtml(s, i, { num: it.num !== false })).join('')}</div>`;
    },
    fx: 'fd',
    beats: it => (it.steps || []).map(s => s.b).concat(it.unfold ? [it.unfold] : []),
    frame: (c, B, it, e) => {
      const secs = it.sections || SECS(), T = absT(c);
      let st;
      if (it.auto && TL() && slideStart(c.id) != null) st = clockState(secs, c, T);
      else {
        let cur = it.cur || 0, done = it.done || 0;
        (it.steps || []).forEach((s, j) => { const at = B.at(s.b, cl(.3 + .1 * j, 0, .95), 1, 'pop', { focal: false });
          if (c.local >= at.s - .02 && (at.beat || at.p > 0)) { if (s.cur != null) cur = s.cur; if (s.done != null) done = s.done; } });
        st = setState(secs, cur, done);
      }
      if (it.names === 'seen') st.forEach(s => { s.hide = s.later; });
      paintChips(e, secs, st, T);
      if (it.unfold) {
        const u = B.at(it.unfold, .1, .2, 'enter', { focal: false });
        e.querySelectorAll('.sc').forEach((ch, i) => { const q = eo4(seg(c.local, u.s + i * .22, u.s + i * .22 + .4));
          ch.style.opacity = q.toFixed(3); ch.style.translate = it.dir === 'col' ? `${f1((1 - q) * -30)}px 0` : `0 ${f1((1 - q) * 24)}px`; });
      }
    },
  };

  /* ---------- iphone (iPhone 15 Pro, drawn at 433 x 892 and scaled) ---------- */
  const PW = 433, PH = 892, SW = 393, SH = 852, IC = 62;
  const COLX = [32, 121, 210, 299], ROW0 = 76, PITCH = 100, DOCKY = 744;
  let UID = 0;
  const grad = (u, a, b, dir) => `<defs><linearGradient id="${u}" x1="0" y1="0" x2="${dir === 'h' ? 1 : 0}" y2="${dir === 'h' ? 0 : 1}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const tile = (fill) => `<rect width="62" height="62" rx="14" fill="${fill}"/>`;
  const gear = (cx, cy, ro, ri, n) => { let d = ''; for (let i = 0; i < n * 2; i++) { const a = Math.PI * i / n, r = i % 2 ? ri : ro, a0 = a - Math.PI / n * .32, a1 = a + Math.PI / n * .32;
    d += (i ? 'L' : 'M') + f1(cx + r * Math.cos(a0)) + ' ' + f1(cy + r * Math.sin(a0)) + 'L' + f1(cx + r * Math.cos(a1)) + ' ' + f1(cy + r * Math.sin(a1)); } return d + 'Z'; };
  const APPS = {
    Phone: u => grad(u, '#6AF381', '#0DB02B') + tile(`url(#${u})`) +
      '<path fill="#fff" d="M21.8 15.6c1.3-1 3.1-.7 4 .6l3.2 4.7c.8 1.1.6 2.6-.3 3.6l-2.3 2.2c1.6 3.5 4.9 6.9 8.5 8.6l2.2-2.3c1-1 2.5-1.1 3.6-.3l4.7 3.2c1.3.9 1.6 2.7.6 4l-1.9 2.4c-1.3 1.7-3.6 2.4-5.6 1.6C29.6 40.6 22.9 34 19.6 25c-.8-2 0-4.3 1.6-5.6z"/>',
    Messages: u => grad(u, '#6AF381', '#0DB02B') + tile(`url(#${u})`) +
      '<path fill="#fff" d="M31 14.5c-10.8 0-19.5 7-19.5 15.6 0 5 2.9 9.4 7.4 12.2-.5 2.5-1.8 4.7-3.8 6.4 3.7.2 7.2-1.2 9.8-3.5 1.9.4 4 .6 6.1.6 10.8 0 19.5-7 19.5-15.7S41.8 14.5 31 14.5z"/>',
    Safari: u => grad(u, '#FFFFFF', '#E3E3E8') + `<defs><radialGradient id="${u}c" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#21D0FF"/><stop offset="1" stop-color="#1B5FE8"/></radialGradient></defs>` + tile(`url(#${u})`) +
      `<circle cx="31" cy="31" r="24" fill="url(#${u}c)"/>` + Array.from({ length: 36 }, (_, i) => { const a = i * Math.PI / 18, r0 = i % 9 ? 21.5 : 19.5;
        return `<path d="M${f1(31 + r0 * Math.cos(a))} ${f1(31 + r0 * Math.sin(a))}L${f1(31 + 23 * Math.cos(a))} ${f1(31 + 23 * Math.sin(a))}" stroke="#fff" stroke-width="${i % 9 ? .8 : 1.4}" opacity=".9"/>`; }).join('') +
      '<path d="M44 18 33.1 33.1 28.9 28.9Z" fill="#FF3B30"/><path d="M18 44 28.9 28.9 33.1 33.1Z" fill="#fff"/>',
    Music: u => grad(u, '#FC5C7D', '#F9233F') + tile(`url(#${u})`) +
      '<g fill="#fff"><path d="M24.3 19.7 41.6 15.8v5.6L24.3 25.3z"/><rect x="24.3" y="19.8" width="2.9" height="22.5" rx="1.2"/><rect x="38.7" y="16.2" width="2.9" height="22.5" rx="1.2"/>' +
      '<ellipse cx="21.6" cy="42.6" rx="5.6" ry="4.4" transform="rotate(-18 21.6 42.6)"/><ellipse cx="36" cy="39" rx="5.6" ry="4.4" transform="rotate(-18 36 39)"/></g>',
    Camera: u => grad(u, '#E5E5EA', '#A9A9AF') + tile(`url(#${u})`) +
      '<rect x="22" y="16" width="16" height="7" rx="2.5" fill="#2C2C2E"/><rect x="9" y="20" width="44" height="29" rx="7" fill="#2C2C2E"/>' +
      '<circle cx="31" cy="34.5" r="11.5" fill="#0E0E10"/><circle cx="31" cy="34.5" r="8.4" fill="#3A3A3D"/><circle cx="31" cy="34.5" r="5.2" fill="#0A0A0C"/><circle cx="29" cy="32.5" r="1.6" fill="#fff" opacity=".55"/><circle cx="46" cy="25.5" r="2" fill="#F5C542"/>',
    Maps: u => tile('#F4F1E8') + '<path d="M0 40 L22 62 H0Z" fill="#7CC5F4"/><path d="M38 0 H62 V22 Q50 22 38 0Z" fill="#9AD77C"/>' +
      '<path d="M-2 26 L64 18M18 -2 L30 64M44 -2 L48 64" stroke="#fff" stroke-width="4.5"/><path d="M-2 50 L64 6" stroke="#F7C948" stroke-width="6"/>' +
      '<circle cx="31" cy="33" r="9" fill="#fff"/><path d="M31 26.5 36.5 38.5 31 35.8 25.5 38.5Z" fill="#1E7CF2"/>',
    Calculator: u => grad(u, '#3A3A3C', '#1C1C1E') + tile(`url(#${u})`) +
      '<circle cx="20" cy="20" r="9" fill="#5A5A5E"/><circle cx="42" cy="20" r="9" fill="#5A5A5E"/><circle cx="20" cy="42" r="9" fill="#5A5A5E"/><circle cx="42" cy="42" r="9" fill="#FF9F0A"/>' +
      '<g stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M15.5 20h9M20 15.5v9M37.5 20h9M16.8 38.8l6.4 6.4M23.2 38.8l-6.4 6.4M37.5 39.5h9M37.5 44.5h9"/></g>',
    Settings: u => grad(u, '#C9C9CE', '#8C8C92') + tile(`url(#${u})`) +
      `<path d="${gear(31, 31, 25, 21, 36)}" fill="#4A4A4E"/><circle cx="31" cy="31" r="19" fill="#C2C2C7"/><path d="${gear(31, 31, 15.5, 12, 8)}" fill="#3A3A3D"/><circle cx="31" cy="31" r="6.5" fill="#C2C2C7"/><circle cx="31" cy="31" r="3.2" fill="#3A3A3D"/>`,
    FaceTime: u => grad(u, '#6AF381', '#0DB02B') + tile(`url(#${u})`) +
      '<rect x="12" y="21" width="27" height="20" rx="5" fill="#fff"/><path d="M40.5 28.2 50 22.6v16.8l-9.5-5.6z" fill="#fff"/>',
    Calendar: () => tile('#FFFFFF') + '<text x="31" y="17" text-anchor="middle" class="cal-d">TUESDAY</text><text x="31" y="47" text-anchor="middle" class="cal-n">17</text>',
    Photos: () => tile('#FFFFFF') + ['#FFB000', '#FF7A00', '#FF2D55', '#C644FC', '#5856D6', '#1DA1F2', '#34C759', '#A8D52B'].map((cl0, i) =>
      `<ellipse cx="31" cy="20" rx="6.2" ry="11" fill="${cl0}" opacity=".88" transform="rotate(${i * 45} 31 31)"/>`).join(''),
    Mail: u => grad(u, '#21A0FF', '#1767EE') + tile(`url(#${u})`) + '<rect x="13" y="19" width="36" height="25" rx="3.5" fill="#fff"/><path d="M14 21 31 34 48 21" fill="none" stroke="#1E78F0" stroke-width="2.2"/>',
    Notes: () => tile('#FFFFFF') + '<path d="M0 14V14Q0 0 14 0H48Q62 0 62 14Z" fill="#FFD52E"/><g stroke="#C7C7CC" stroke-width="1.4"><path d="M8 27H54M8 36H54M8 45H54M8 54H40"/></g>',
    Reminders: () => tile('#FFFFFF') + '<circle cx="15" cy="18" r="4.5" fill="#1E7CF2"/><circle cx="15" cy="31" r="4.5" fill="#FF3B30"/><circle cx="15" cy="44" r="4.5" fill="#FF9500"/>' +
      '<g stroke="#C7C7CC" stroke-width="2.2" stroke-linecap="round"><path d="M25 18H50M25 31H50M25 44H50"/></g>',
    Clock: () => tile('#0B0B0C') + '<circle cx="31" cy="31" r="25" fill="#fff"/>' + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6;
      return `<path d="M${f1(31 + 20 * Math.cos(a))} ${f1(31 + 20 * Math.sin(a))}L${f1(31 + 23 * Math.cos(a))} ${f1(31 + 23 * Math.sin(a))}" stroke="#111" stroke-width="1.6"/>`; }).join('') +
      '<path d="M31 31 31 15M31 31 41 37" stroke="#111" stroke-width="2.6" stroke-linecap="round"/><path d="M31 31 22 46" stroke="#FF9500" stroke-width="1.2"/><circle cx="31" cy="31" r="2" fill="#FF9500"/>',
    Weather: u => grad(u, '#4DA9FF', '#1B68DD') + tile(`url(#${u})`) + '<circle cx="24" cy="24" r="9" fill="#FFD60A"/><path d="M20 46h22a8 8 0 0 0 0-16 11 11 0 0 0-21 3.5A6.3 6.3 0 0 0 20 46z" fill="#fff"/>',
    'App Store': u => grad(u, '#1EC8FF', '#1A6FF0') + tile(`url(#${u})`) +
      '<g stroke="#fff" stroke-width="4" stroke-linecap="round"><path d="M27 15 40.5 39M35 15 21.5 39M16 39.5H46"/></g>',
    Health: () => tile('#FFFFFF') + '<path d="M31 48 17 34.5A8.6 8.6 0 0 1 31 23a8.6 8.6 0 0 1 14 11.5Z" fill="#FF2D55"/>',
    Wallet: () => tile('#0B0B0C') + '<rect x="11" y="13" width="40" height="11" rx="3" fill="#1E7CF2"/><rect x="11" y="19" width="40" height="11" rx="3" fill="#FFB000"/><rect x="11" y="25" width="40" height="11" rx="3" fill="#34C759"/><rect x="11" y="31" width="40" height="11" rx="3" fill="#FF3B30"/>' +
      '<path d="M9 36h44v13a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4z" fill="#2C2C2E"/>',
  };
  const HOME = ['FaceTime', 'Calendar', 'Photos', 'Camera', 'Mail', 'Notes', 'Reminders', 'Clock', 'Maps', 'Weather', 'App Store', 'Health', 'Wallet', 'Calculator', 'Settings'];
  const DOCK0 = ['Phone', 'Safari', 'Messages', 'Music'];
  // an icon's top-left on the screen (screen coords), from the home grid or the dock
  function appPos(it, name) {
    const apps = it.apps || HOME, dk = it.dock || DOCK0;
    let i = apps.indexOf(name); if (i >= 0) return [COLX[i % 4], ROW0 + Math.floor(i / 4) * PITCH, false];
    i = dk.indexOf(name); if (i >= 0) return [COLX[i] + (4 - dk.length) * 44.5, DOCKY + 16, true];
    return null;
  }
  const appSvg = (name, x, y, label) => { const u = 'ip' + (++UID), f = APPS[name];
    if (!f) throw new Error('slate iphone: no icon drawn for "' + name + '" (have: ' + Object.keys(APPS).join(', ') + ')');
    return `<g class="app" data-app="${esc(name)}" transform="translate(${x} ${y})"><g class="ai">${f(u)}</g>${label ? `<text class="lbl" x="31" y="80" text-anchor="middle">${esc(name)}</text>` : ''}</g>`; };
  function statusSvg(it) {
    const ink = it.ink === 'dark' ? '#000' : '#fff';
    return `<svg class="sbar" viewBox="0 0 ${SW} 54" width="${SW}" height="54"><text x="64" y="35" text-anchor="middle" fill="${ink}" class="tm">${esc(it.time || '9:41')}</text>` +
      `<g fill="${ink}"><rect x="291" y="27.5" width="3.2" height="5" rx=".8"/><rect x="296" y="25" width="3.2" height="7.5" rx=".8"/><rect x="301" y="22.5" width="3.2" height="10" rx=".8"/><rect x="306" y="20" width="3.2" height="12.5" rx=".8"/>` +
      `<path d="M323.5 32.4 320.6 29.4a4.2 4.2 0 0 1 5.8 0zM317.8 26.7l1.7 1.7a5.6 5.6 0 0 1 8 0l1.7-1.7a8 8 0 0 0-11.4 0zM315 23.9l1.6 1.7a9.6 9.6 0 0 1 13.8 0l1.6-1.7a12 12 0 0 0-17 0z"/>` +
      `<rect x="338" y="20.5" width="25" height="12" rx="3.6" fill="none" stroke="${ink}" stroke-opacity=".4" stroke-width="1.1"/><rect x="340" y="22.5" width="21" height="8" rx="2" /><path d="M364.6 24.4v4.2a2.2 2.2 0 0 0 0-4.2z" opacity=".45"/></g></svg>`;
  }
  K.iphone = {
    html: it => {
      const k = it.w / PW, u = 'ipw' + (++UID);
      const btn = `<rect x="-3.5" y="150" width="5" height="34" rx="2" class="bt"/><rect x="-3.5" y="214" width="5" height="62" rx="2" class="bt"/><rect x="-3.5" y="290" width="5" height="62" rx="2" class="bt"/><rect x="${PW - 1.5}" y="238" width="5" height="96" rx="2" class="bt"/>`;
      const frame = `<svg class="frm" width="${PW + 8}" height="${PH}" viewBox="-4 0 ${PW + 8} ${PH}"><defs><linearGradient id="${u}t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9C6BF"/><stop offset=".35" stop-color="#8E8B85"/><stop offset=".65" stop-color="#B3AFA8"/><stop offset="1" stop-color="#77746F"/></linearGradient></defs>` +
        `<g fill="url(#${u}t)">${btn}</g><rect x="0" y="0" width="${PW}" height="${PH}" rx="72" fill="url(#${u}t)"/><rect x="3" y="3" width="${PW - 6}" height="${PH - 6}" rx="69" fill="#0A0A0A"/></svg>`;
      let screen;
      if (it.screen) screen = `<div class="app-scr sl-ill">${it.screen}</div>`;
      else {
        const apps = it.apps || HOME, dk = it.dock || DOCK0;
        screen = `<svg class="home" width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}"><defs><linearGradient id="${u}w" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#2A3A73"/><stop offset=".5" stop-color="#3B2A6B"/><stop offset="1" stop-color="#0E3A4F"/></linearGradient>` +
          `<radialGradient id="${u}g" cx=".7" cy=".35" r=".6"><stop offset="0" stop-color="#7B5BD6" stop-opacity=".55"/><stop offset="1" stop-color="#7B5BD6" stop-opacity="0"/></radialGradient></defs>` +
          `<rect width="${SW}" height="${SH}" fill="url(#${u}w)"/><rect width="${SW}" height="${SH}" fill="url(#${u}g)"/>` +
          apps.map((a, i) => appSvg(a, COLX[i % 4], ROW0 + Math.floor(i / 4) * PITCH, true)).join('') +
          `<g class="dots"><circle cx="${SW / 2 - 8}" cy="724" r="3.4" fill="#fff"/><circle cx="${SW / 2 + 8}" cy="724" r="3.4" fill="#fff" opacity=".4"/></g>` +
          `<rect x="10" y="${DOCKY}" width="${SW - 20}" height="96" rx="34" fill="#fff" fill-opacity=".2"/>` +
          dk.map(a => { const p = appPos(it, a); return appSvg(a, p[0], p[1], false); }).join('') + '</svg>';
      }
      return `<div class="sl-iph" style="width:${PW}px;height:${PH}px;transform:scale(${k.toFixed(5)})">${frame}` +
        `<div class="scr" style="left:20px;top:20px;width:${SW}px;height:${SH}px">${screen}${statusSvg(it)}<i class="isl"></i></div></div>`;
    },
    fx: 'up',
    beats: it => (it.appIn || []).map(a => a.b).concat((it.hl || []).map(h => h.b), (it.hl || []).map(h => h.until).filter(Boolean)),
    frame: (c, B, it, e) => {
      (it.appIn || []).forEach(a => {
        const g = e.querySelector(`.app[data-app="${a.app}"] .ai`); if (!g) return;
        const r = B.at(a.b, .5, .6, 'pop', { focal: false }), q = r.p, s = q <= 0 ? 0 : .6 + .4 * bk(q);
        g.style.opacity = cl(q * 2.4, 0, 1).toFixed(3); g.style.transform = `scale(${s.toFixed(4)})`;
      });
      (it.hl || []).forEach(h => {
        const g = e.querySelector(`.app[data-app="${h.app}"]`); if (!g) return;
        const on = B.p(h.b, .5, .55, 'pop', { focal: false }) > .3 && !(h.until && B.p(h.until, .9, .95, 'pop', { focal: false }) > .3);
        g.classList.toggle('hl', on);
      });
    },
  };
  // an app icon's centre in world coords (for a photo flying into its slot)
  function iphoneApp(it, name) {
    const p = appPos(it, name); if (!p) throw new Error('slate iphone: no app ' + name + ' on this phone');
    const k = it.w / PW; return [it.x + (20 + p[0] + IC / 2) * k, it.y + (20 + p[1] + IC / 2) * k];
  }

  /* ---------- bubble ---------- */
  function bubblePath(w, h, tip, base) {
    const r = Math.min(22, h / 2 - 2), bw = base || 15;
    let side;
    const ox = tip[0] < 0 ? -tip[0] : tip[0] > w ? tip[0] - w : 0, oy = tip[1] < 0 ? -tip[1] : tip[1] > h ? tip[1] - h : 0;
    if (oy >= ox) side = tip[1] > h ? 'b' : 't'; else side = tip[0] > w ? 'r' : 'l';
    const along = side === 't' || side === 'b' ? cl(tip[0], r + bw + 4, w - r - bw - 4) : cl(tip[1], r + bw + 2, h - r - bw - 2);
    const T = (s, a) => side === s ? (s === 't' ? `L${f1(a + bw)} 0L${f1(tip[0])} ${f1(tip[1])}L${f1(a - bw)} 0` : s === 'r' ? `L${w} ${f1(a - bw)}L${f1(tip[0])} ${f1(tip[1])}L${w} ${f1(a + bw)}`
      : s === 'b' ? `L${f1(a - bw)} ${h}L${f1(tip[0])} ${f1(tip[1])}L${f1(a + bw)} ${h}` : `L0 ${f1(a + bw)}L${f1(tip[0])} ${f1(tip[1])}L0 ${f1(a - bw)}`) : '';
    // clockwise from the top-left corner; on the top side the tail is drawn right-to-left order reversed to stay clockwise
    const top = side === 't' ? `L${f1(along - bw)} 0L${f1(tip[0])} ${f1(tip[1])}L${f1(along + bw)} 0` : '';
    return `M${r} 0${top}L${w - r} 0Q${w} 0 ${w} ${r}${T('r', along)}L${w} ${h - r}Q${w} ${h} ${w - r} ${h}` +
      `${side === 'b' ? `L${f1(along + bw)} ${h}L${f1(tip[0])} ${f1(tip[1])}L${f1(along - bw)} ${h}` : ''}L${r} ${h}Q0 ${h} 0 ${h - r}` +
      `${side === 'l' ? `L0 ${f1(along + bw)}L${f1(tip[0])} ${f1(tip[1])}L0 ${f1(along - bw)}` : ''}L0 ${r}Q0 0 ${r} 0Z`;
  }
  K.bubble = {
    html: it => {
      const w = it.w, h = it.h || 96;
      let tip;
      if (it.to) tip = [it.to[0] - it.x, it.to[1] - it.y];
      else { const t = it.tail || { side: 'b', at: .25 }, L = t.len || 30, a = t.at != null ? t.at : .25;
        tip = t.side === 't' ? [w * a, -L] : t.side === 'l' ? [-L, h * a] : t.side === 'r' ? [w + L, h * a] : [w * a - 10, h + L]; }
      /* the tail points AT the speaker but stops short (max it.tailLen, 46 px past the edge): a tail run all the way to a far
         target read as a thin spike */
      { const cx = cl(tip[0], 0, w), cy = cl(tip[1], 0, h), dx = tip[0] - cx, dy = tip[1] - cy, L = Math.hypot(dx, dy), M = it.tailLen || 46;
        if (L > M) tip = [cx + dx / L * M, cy + dy / L * M]; }
      const d = bubblePath(w, h, tip);
      return `<svg class="bb" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path class="fl" d="${d}"/><path class="s1" d="${d}"/></svg><div class="in">${it.html}</div>`;
    },
    fx: 'pop',
    frame: () => {},
  };

  /* ---------- scan ---------- */
  const toks = it => (typeof it.tokens === 'string' || (it.tokens == null && it.text) ? String(it.tokens || it.text).split(/(\s+)/).filter(s => s.length).map(t => /^\s+$/.test(t) ? [t, 'sp'] : [t]) : it.tokens.map(t => typeof t === 'string' ? [t] : t));
  K.scan = {
    html: it => `<div class="sl-scan"><div class="st">${toks(it).map(t => t[1] === 'sp' ? t[0].replace(/ /g, '&nbsp;') : `<span class="tk" data-c="${t[1] || ''}" data-to="${t[2] != null ? esc(t[2]) : ''}" data-fr="${esc(t[0])}">${esc(t[0])}</span>`).join('')}<i class="bar"></i></div></div>`,
    fx: 'up',
    beats: it => it.sweep ? [it.sweep] : [],
    frame: (c, B, it, e) => {
      const st = e.querySelector('.st'), bar = e.querySelector('.bar'); if (!st || !bar) return;
      let s0;
      if (it.sweep) s0 = B.at(it.sweep, .5, .6, 'enter', { focal: false }).s;
      else s0 = enterAt(c, B, it).s + .5;
      const d = it.d || 1.4, q = seg(c.local, s0, s0 + d), W = st.offsetWidth, x = q * W;
      bar.style.transform = `translateX(${f1(x)}px)`;
      bar.style.opacity = (q > 0 && q < 1 ? 1 : q >= 1 ? 1 - seg(c.local, s0 + d, s0 + d + .3) : 0).toFixed(3);
      st.querySelectorAll('.tk').forEach(tk => {
        const hit = q > 0 && x >= tk.offsetLeft + tk.offsetWidth / 2, key = hit ? '1' : '0';
        if (tk.dataset.h === key) return; tk.dataset.h = key;
        if (tk.dataset.c) tk.dataset.c.split(' ').forEach(k => tk.classList.toggle(k, hit));
        tk.classList.toggle('hit', hit);
        if (tk.dataset.to) tk.textContent = hit ? tk.dataset.to : tk.dataset.fr;
      });
    },
  };

  /* ---------- counter (odometer) ---------- */
  const ctrSteps = it => { const s = []; if (it.to != null) s.push({ b: it.at || nameOf(it), to: it.to, d: it.d || 1.2, first: !it.at }); return s.concat((it.steps || []).map(x => Object.assign({ d: 1.2 }, x))); };
  const intDigits = v => Math.max(1, String(Math.floor(Math.abs(v))).length);
  K.counter = {
    html: it => {
      const dec = it.dec || 0, vals = [it.from || 0].concat(ctrSteps(it).map(s => s.to)), n = Math.max(...vals.map(intDigits)), cols = [];
      for (let i = n - 1; i >= 0; i--) {
        cols.push(`<span class="dc" data-p="${i + dec}"><span class="sp"></span></span>`);
        if (it.comma && i > 0 && i % 3 === 0) cols.push(`<span class="cm" data-p="${i + dec}">,</span>`);
      }
      if (dec) { cols.push('<span class="dp">.</span>'); for (let i = dec - 1; i >= 0; i--) cols.push(`<span class="dc" data-p="${i}"><span class="sp"></span></span>`); }
      return `<div class="sl-ctr"><div class="nm">${it.pre ? `<span class="pf">${it.pre}</span>` : ''}<span class="od">${cols.join('')}</span>${it.suf ? `<span class="sf">${it.suf}</span>` : ''}</div>${it.label ? `<b class="lb">${it.label}</b>` : ''}</div>`;
    },
    fx: 'pop',
    beats: it => ctrSteps(it).filter(s => !s.first).map(s => s.b),
    frame: (c, B, it, e) => {
      let v = it.from || 0;
      ctrSteps(it).forEach((s, j) => {
        const st0 = s.first ? enterAt(c, B, it).s + .25 : B.at(s.b, cl(.4 + .1 * j, 0, .9), 1, 'enter', { focal: false }).s;
        v = lerp(v, s.to, eio(seg(c.local, st0, st0 + s.d)));
      });
      const dec = it.dec || 0, V = Math.round(v * Math.pow(10, dec) * 1000) / 1000, shown = intDigits(v);
      e.querySelectorAll('.dc').forEach(dc => {
        const i = +dc.dataset.p, u = Math.pow(10, i), dg = Math.floor(V / u) % 10;
        const frac = i === 0 ? V - Math.floor(V) : Math.max(0, (V % u) - (u - 1));
        dc.firstChild.style.transform = `translateY(${(-(dg + frac)).toFixed(4)}em)`;
        dc.style.display = i - dec >= shown ? 'none' : '';
      });
      e.querySelectorAll('.cm').forEach(cm => { cm.style.display = +cm.dataset.p - dec >= shown ? 'none' : ''; });
    },
  };

  /* =========================== the ON overlay =========================== */
  const OV_KINDS = ['iphone', 'bubble', 'counter', 'scan', 'tracker', 'page', 'trk'];
  function ovNorm(d) {
    const o = d.over === true ? {} : d.over || null; if (!o) return null;
    const norm = (list, side) => (list || []).map((x, i) => { const o = Object.assign({ k: 'row' }, x, { id: x.id || 'ov' + side + (i + 1), side });
      if (o.k === 'page') { o.rows = o.rows.map(r => Array.isArray(r) ? { cells: r[0], st: r[1] || 'pend' } : r); o.h = o.h || pageH(o); }
      return o; });
    return { tag: o.tag != null ? o.tag : d.eyebrow, h1: o.h1, valign: o.valign || 'center', left: norm(o.h1 ? [{ k: 'h', html: o.h1, b: o.h1b, at: o.h1b ? undefined : 0 }].concat(o.left || []) : o.left, 'l'), right: norm(o.right, 'r') };
  }
  function ovInner(p, it) {
    const mark = it.logo ? `<span class="lt"><img src="${src(it.logo)}" alt=""></span>` : it.src ? `<span class="lt"><img src="${it.src}" alt=""></span>` : it.icon ? `<span class="ic">${icon(it.icon)}</span>` : '';
    switch (it.k) {
      case 'row': return `${mark}<span class="tx">${it.html}</span>`;
      case 'h': return `<b class="hh">${it.html}</b>${it.sub ? `<small>${it.sub}</small>` : ''}`;
      case 'card': return it.html;
      case 'img': return `<img class="im" src="${it.src}" alt=""${it.h ? ` style="height:${it.h}px"` : ''}>${it.cap ? `<span class="cp">${it.cap}</span>` : ''}`;
      case 'chips': return it.items.map(ch => `<span class="ch ${ch.cls || ''}">${ch.logo ? `<img src="${src(ch.logo)}" alt="">` : ch.icon ? icon(ch.icon) : ''}<span>${ch.html}</span></span>`).join('');
      case 'sub': return `<div class="sbw">${SUB.html(p + it.id + '-', SUB_OV)}</div>`;
      case 'term': {
        const pr = it.prompt || (window.PROJECT && PROJECT.prompt) || 'mia@MacBook-Pro ~ % ';
        return `<div class="bs-term"><div class="tb"><span class="dots"><i></i><i></i><i></i></span><span class="tt">${esc(it.title || pr.split('@')[0] + ' — -zsh')}</span></div><div class="bd">` +
          it.lines.map((ln, i) => /^\$ /.test(ln) ? `<div class="ln cmd" data-r="${i}"><span class="pr">${esc(pr)}</span><span class="t"></span></div>` : `<div class="ln" data-r="${i}"><span class="t">${esc(ln) || '&nbsp;'}</span></div>`).join('') + '</div></div>';
      }
      default:
        if (K[it.k]) return K[it.k].html(Object.assign({ w: 540, h: 300 }, it, { x: 0, y: 0 }));
        throw new Error('slate over: unknown item kind ' + it.k);
    }
  }
  const SUB_OV = { x: 0, y: 0, k: .4, name: 'LifeTechFacts', handle: '@lifetechfacts' };
  function overHtml(p, o) {
    if (!o) return '';
    const col = (list, side) => `<div class="ovc ${side} v-${o.valign}">${list.map(it => `<div class="ovi k-${it.k} ${it.cls || ''}" id="${p}${it.id}" style="${it.w ? 'width:' + it.w + 'px;' : ''}${it.h ? 'height:' + it.h + 'px;' : ''}">${ovInner(p, it)}</div>`).join('')}</div>`;
    return `<div class="sl-ov" id="${p}slov">${o.tag ? `<div class="tag" id="${p}slovtag"><i></i><span>${o.tag}</span></div>` : ''}${col(o.left, 'l')}${col(o.right, 'r')}</div>`;
  }
  function ovTerm(c, it, e, s0) {
    const pr = e.querySelectorAll('.ln'), cps = it.cps || 28, T0 = absT(c) - c.local, sched = [];
    let t = s0;
    it.lines.forEach((ln, i) => {
      if (/^\$ /.test(ln)) { const L = ln.slice(2).length, d = Math.max(.05, L / cps); sched[i] = { s: t, d, L, cmd: true }; t += d + .25; }
      else { sched[i] = { s: t, d: 0 }; t += .06; }
    });
    pr.forEach((row, i) => {
      const S = sched[i], on = c.local >= S.s; row.style.display = on ? '' : 'none';
      if (!S.cmd || !on) return;
      const k = Math.floor(cl((c.local - S.s) / S.d, 0, 1) * S.L), tx = row.querySelector('.t'), want = it.lines[i].slice(2, 2 + k);
      if (tx.textContent !== want) tx.textContent = want;
      row.classList.toggle('typing', c.local < S.s + S.d);
    });
    (window.PL_TYPED = window.PL_TYPED || {})[c.p + it.id] = sched.filter(x => x && x.cmd && x.L).map(x => [+(T0 + x.s).toFixed(3), +x.d.toFixed(3), x.L]);
  }
  function overFrame(c, B, o) {
    if (!o) return;
    const items = o.left.concat(o.right);
    items.forEach((it, i) => {
      const e = el(c.p + it.id); if (!e) return;
      const bt = it.b && c.beats && c.beats[it.b];
      const s = bt ? bt.s : it.at != null ? it.at : it.b && !B.on ? B.at(it.b, .1 + .1 * i, .2 + .1 * i, 'enter', { focal: false }).s : .3 + .35 * i;
      const q = eo4(seg(c.local, s, s + .5));
      let op = q;
      if (it.out) { const ob = c.beats && c.beats[it.out.b]; if (ob) op *= 1 - seg(c.local, ob.s, ob.s + .3); }
      e.style.opacity = op.toFixed(3); e.style.transform = `translateY(${f1((1 - q) * 24)}px)`;
      if (it.k === 'sub') { const t0 = s - (it.lead || 0); SUB.frame(c.p + it.id + '-', Math.max(0, c.local - t0), SUB_OV); }
      else if (it.k === 'term') ovTerm(c, it, e, s + .35);
      else if (K[it.k] && K[it.k].frame) K[it.k].frame(c, B, Object.assign({ w: 540, h: 300 }, it, { x: 0, y: 0 }), e);
    });
  }
  const ovBeats = o => o ? o.left.concat(o.right).reduce((n, it) => n.concat(it.b ? [it.b] : [], it.out ? [it.out.b] : [], K[it.k] && K[it.k].beats ? K[it.k].beats(it) : []), []) : [];

  /* =========================== the ground =========================== */
  const GSTYLE = (window.PROJECT && PROJECT.ground) || 'schematic';
  const gtext = (x, y, s, cl0) => `<text x="${x}" y="${y}"${cl0 ? ` class="${cl0}"` : ''}>${esc(s)}</text>`;
  const grect = (x, y, w, h, sd, cl0) => `<path${cl0 ? ` class="${cl0}"` : ''} d="${rough(w, h, Math.min(10, h / 3), sd, 1.2)}" transform="translate(${x} ${y})"/>`;
  const GLYPH = [
    // a heap page: header, line pointers, free space, tuples at the end
    n => grect(0, 0, 150, 176, n) + gtext(10, 18, 'page ' + (n % 9) + ' · 8 KB') + '<path d="M6 26H144"/>' +
      [0, 1, 2, 3].map(i => grect(10 + i * 32, 34, 26, 16, n + i)).join('') + '<path class="ds" d="M20 50V136M52 50V118M84 50V100"/>' +
      gtext(46, 82, 'free', 'mu') + [0, 1, 2].map(i => grect(10, 104 + i * 22, 130, 16, n + 7 + i)).join('') + gtext(16, 168, '(0,' + (n % 40 + 1) + ')'),
    // a query plan: a join over two scans
    n => grect(20, 0, 110, 30, n) + gtext(30, 20, n % 2 ? 'Hash Join' : 'Nested Loop') + '<path d="M50 30L28 64M100 30L122 64"/>' +
      grect(0, 64, 74, 30, n + 3) + gtext(6, 84, 'Seq Scan') + grect(78, 64, 74, 30, n + 5) + gtext(82, 84, 'Index') + '<path d="M115 94V122"/>' +
      grect(80, 122, 70, 26, n + 8) + gtext(86, 140, 'idx_jobs', 'mu'),
    // a B-tree node and its children
    n => grect(30, 0, 92, 28, n) + '<path d="M60 0V28M91 0V28"/>' + gtext(38, 19, String(20 + n % 30)) + gtext(68, 19, String(50 + n % 40)) +
      '<path d="M44 28L18 70M76 28V70M108 28L134 70"/>' + [0, 1, 2].map(i => grect(i * 52, 70, 46, 24, n + 2 + i)).join('') + gtext(6, 120, 'btree · jobs_pkey', 'mu'),
    // a WAL segment: records in order
    n => gtext(0, 12, '000000010000000' + (n % 9), 'mu') + ['INSERT jobs', 'UPDATE jobs', 'COMMIT', 'INSERT orders'].map((s, i) =>
      grect(0, 22 + i * 34, 150, 26, n + i) + gtext(8, 40 + i * 34, '0/' + (0x16B3F40 + n * 97 + i * 40).toString(16).toUpperCase().slice(-6) + ' ' + s)).join(''),
    // a JSONB blob
    n => gtext(0, 14, '{') + gtext(14, 38, '"theme": "dark",') + gtext(14, 60, '"alerts": {') + gtext(28, 82, '"email": true') + gtext(14, 104, '},') + gtext(14, 126, '"tags": [' + (n % 7) + ']') + gtext(0, 150, '}'),
    // an embedding
    n => gtext(0, 14, 'embedding', 'mu') + [0, 1, 2, 3, 4].map(i => grect(i * 30, 24, 26, 26, n + i)).join('') +
      gtext(0, 72, '[0.12, -0.83,') + gtext(0, 94, ' 0.41, …]') + '<path d="M10 116H140M10 116L30 104M10 116L30 128"/>' + gtext(0, 150, '<-> nearest', 'mu'),
  ];
  const GCOLS = [{ x: 18, spd: 7, o: 0 }, { x: 1752, spd: 9, o: 3 }], GPITCH = 250, GN = 7;
  function groundHtml() {
    const pools = '<div class="sl-pools"><i class="pl a"></i><i class="pl b"></i><i class="pl c"></i></div>';
    if (GSTYLE === 'quiet') return pools;
    return pools + '<svg class="sl-gs" viewBox="0 0 1920 1080" preserveAspectRatio="none">' +
      GCOLS.map(() => `<g class="gc">${Array.from({ length: GN }, () => '<g class="gl"></g>').join('')}</g>`).join('') +
      `<g class="wal">${Array.from({ length: 16 }, () => '<g class="wr"><path d=""/><text x="10" y="21"></text></g>').join('')}</g></svg>`;
  }
  function groundFrame(g, T) {
    const w = 2 * Math.PI * T;
    // pools orbit slowly on incommensurate periods (no will-change: a full-frame moving layer half-paints in long captures)
    g.querySelectorAll('.sl-pools .pl').forEach((p, i) => {
      const R = [190, 160, 220][i], P = [97, 131, 113][i];
      p.style.transform = `translate(${f1(R * Math.cos(w / P + i * 2.1))}px,${f1(R * .6 * Math.sin(w / P + i * 2.1))}px)`;
    });
    if (GSTYLE === 'quiet') return;
    g.querySelectorAll('svg.sl-gs g.gc').forEach((col, ci) => {
      const cc = GCOLS[ci], off = T * cc.spd, k0 = Math.ceil((off - 1300) / GPITCH);
      [...col.children].forEach((e, i) => {
        const k = k0 + i, y = 1150 + k * GPITCH - off;
        if (e.dataset.k !== String(k)) { const n = ((k + cc.o) % 6 + 6) % 6; e.innerHTML = GLYPH[n](Math.abs(k * 13 + ci * 7) + 3); e.dataset.k = String(k); e.setAttribute('class', 'gl' + (HS(k * 1.7 + ci) > .72 ? ' tint' + (HS(k + ci * 3) > .5 ? ' p' : '') : '')); }
        e.setAttribute('transform', `translate(${cc.x + 6 * Math.sin(w / 53 + k)} ${y.toFixed(1)})`);
        const hi = HS(k * 3.3 + ci) > .82 ? Math.max(0, Math.sin((T / 7 + HS(k)) * 6.28)) : 0;
        e.style.opacity = (.06 + .06 * hi).toFixed(3);
      });
    });
    // the WAL tape along the bottom band, records creeping left
    const rw = 150, gap = 16, pitch = rw + gap, off = T * 13, k0 = Math.floor(off / pitch);
    const OPS = ['INSERT jobs', 'UPDATE jobs', 'DELETE jobs', 'COMMIT', 'INSERT orders', 'UPDATE users'];
    g.querySelectorAll('svg.sl-gs g.wal g.wr').forEach((e, i) => {
      const k = k0 + i, x = k * pitch - off;
      if (e.dataset.k !== String(k)) {
        e.querySelector('path').setAttribute('d', rough(rw, 30, 8, k * 5 + 1, 1.2));
        e.querySelector('text').textContent = (0x3A10 + k * 0x28).toString(16).toUpperCase() + ' ' + OPS[((k % 6) + 6) % 6];
        e.dataset.k = String(k);
      }
      e.setAttribute('transform', `translate(${x.toFixed(1)} 1006)`);
    });
  }
  if (IS) {
    window.BS_GROUND = { theme: 'slate', kind: 'slate', icons: {}, marks: [], routes: [], nodes: [], html: groundHtml, frame: groundFrame };
    if (window.bsInstallGround) window.bsInstallGround();
    // the docked tracker lives on the stage: any frame drawn by a slide that is not a slate slide hides it
    const base = window.bgFrame;
    window.bgFrame = function (T) {
      if (base) base(T);
      if (DOCK) { const on = document.querySelector('#stage > .slide.on'); if (!on || on.id !== DOCK_SID) DOCK.style.display = 'none'; }
    };
  }

  /* =========================== the template =========================== */
  function prep(d) {
    if (d.__sl) return; d.__sl = true;
    d.__ov = ovNorm(d); delete d.over;   // bistro must not draw its own over rows: slate owns the overlay
    d.items = (d.items || []).map(it => {
      const KD = K[it.k]; if (!KD) {
        if (it.k === 'logo' && it.src) return Object.assign({}, it, { k: 'html', fx: it.fx || 'pop', cls: 'cf-logo ' + (it.cls || ''),
          html: `<span class="mk"><img src="${it.src}" alt="${esc(it.label || '')}"></span>${it.label ? `<b>${it.label}</b>` : ''}` });
        if (it.k === 'chip' && it.src) return Object.assign({}, it, { html: `<img src="${it.src}" alt="">${it.html}` });
        return it;
      }
      const o = Object.assign({}, it, { k: 'html', __sl: it.k, __kind: Object.assign({}, it), fx: it.fx || KD.fx, cls: `sl-${it.k}w ${it.cls || ''}`.trim() });
      if (it.k === 'page') o.h = it.h || pageH(it);
      if (it.k === 'iphone') o.h = it.h || Math.round(it.w * PH / PW);
      if (it.k === 'arrow') Object.assign(o, { x: 0, y: 0, w: 2, h: 2, pre: true, __pre: !!it.pre, z: it.z != null ? it.z : 7, cls: o.cls + ' bs-arw' });
      if (it.k === 'box') o.__pre = !!it.pre;
      o.html = KD.html(Object.assign({}, it, { h: o.h }));
      if (it.k === 'trk') { o.cur = it.lit || 1; delete o.lit; }   // bistro reads item.lit as an illustration's lit parts
      return o;
    });
  }
  const kindOf = it => Object.assign({}, it.__kind, { x: it.x, y: it.y, w: it.w, h: it.h, id: it.id, __pre: it.__pre, cur: it.cur });
  /* the face window this frame is in, and the layout it asks for */
  function layoutOf(c) {
    const RV = (window.PROJECT && Array.isArray(PROJECT.reveals)) ? PROJECT.reveals : [];
    const timed = c.T != null && c.T !== c.local;
    const win = timed ? RV.find(r => c.T >= r.at - (r.in || 0) - .001 && c.T < r.to + (r.out || 0)) : null;
    /* the ramp of an ON window (before at, after to) is the full slide pushing over / off the face (onPush) */
    if (win && !win.split && win.over && (c.T < win.at || c.T >= win.to)) return { win, mode: 'full', push: true };
    if (win) return { win, mode: win.split ? 'split' : win.over ? 'on' : 'full' };
    if (timed) return { win: null, mode: 'full' };
    return { win: null, mode: c.data.split ? 'split' : c.data.__ov ? 'on' : 'full' };
  }
  /* the slide starts on a face-window edge (its ramp start included) */
  function edgeStart(c) {
    const RV = (window.PROJECT && PROJECT.reveals) || [], s0 = absT(c) - c.local;
    return RV.some(r => [r.at, r.to, r.at - (r.in || 0), r.to + (r.out || 0)].some(e => Math.abs(e - s0) < .05));
  }
  /* split.wipe on slate (postgres review 3: "the split view animations used in the previous video aren't there anymore"):
     bistro eases --spk/--spx between full frame and its fixed .8 / 320px split, but slate slides set their own split
     geometry in CSS (SPLIT_FILL: --spk 1.06 + a translate; s38-s40: --spk 1). So the wipe reads the slide's own split
     state from the stylesheet and eases from full frame (scale 1, no shift) to exactly that, over the window's in/out. */
  function splitWipe(root, L, c) {
    const w = L.win;
    ['--spk', '--spx', '--spq', 'translate'].forEach(k => root.style.removeProperty(k));
    root.classList.remove('wiping');
    if (L.mode !== 'split' || !w || !w.split || w.split.wipe === false || !isTransparent() || c.T == null) return;
    let k = 1;
    if (w.in && c.T < w.at) k = (c.T - (w.at - w.in)) / w.in;
    else if (w.out && c.T >= w.to) k = 1 - (c.T - w.to) / w.out;
    k = eio(cl(k, 0, 1));
    if (k >= 1) return;
    const cs = getComputedStyle(root), sk = parseFloat(cs.getPropertyValue('--spk')) || .8;
    const sx = cs.getPropertyValue('--spx').trim() ? parseFloat(cs.getPropertyValue('--spx')) : 320;
    const tr = (cs.translate && cs.translate !== 'none' ? cs.translate : sx + 'px').split(/\s+/).map(parseFloat);
    /* a split that meets an ON window slides instead (dual-render moves the face to its third in step): the panel keeps
       its split geometry and comes in from the right edge, or leaves to it */
    const RV = (window.PROJECT && PROJECT.reveals) || [], near = (x, y) => Math.abs(x - y) < .01;
    const onAt = v => RV.some(o => o !== w && o.over && !o.split && (near(o.to + (o.out || 0), v) || near(o.at - (o.in || 0), v)));
    const into = c.T < w.at;
    if ((into && onAt(w.at - w.in)) || (!into && onAt(w.to + w.out))) {
      root.classList.add('wiping');
      root.style.translate = `${((tr[0] || 0) + 1280 * (1 - k)).toFixed(2)}px ${(tr[1] || 0).toFixed(2)}px`;
      return;
    }
    root.classList.add('wiping');   // core/registry.js holds a wiping slide instead of running its exit
    root.style.setProperty('--spk', (1 + (sk - 1) * k).toFixed(4));
    root.style.setProperty('--spx', (sx * k).toFixed(2) + 'px');
    root.style.setProperty('--spq', k.toFixed(4));
    root.style.translate = `${((tr[0] || 0) * k).toFixed(2)}px ${((tr[1] || 0) * k).toFixed(2)}px`;
  }
  /* ON windows push (postgres review 3: "still no transition from overlay to full motion graphics"): no dissolve over the
     face (review 1). Over an ON window's `in` seconds the outgoing slide slides off to the left, uncovering the face; over its
     `out` seconds the next slide slides in from the right over it, on its own plate (.onwipe). The tracker dock rides with
     it. Only the alpha capture moves; master A keeps its cut. dual-render lays this capture on the footage with no fade. */
  function onPush(root, L, c) {
    const D = dock(); if (D) D.style.translate = '';
    root.classList.remove('onwipe');
    if (!L.push || !isTransparent() || L.win.wipe === false) return;
    const w = L.win, into = c.T < w.at;
    let k = into ? (w.at - c.T) / (w.in || 1) : (c.T - w.to) / (w.out || 1);   // 1 = the slide covers the frame
    k = eio(cl(k, 0, 1));
    const x = (into ? -1 : 1) * 1920 * (1 - k);
    root.classList.add('onwipe', 'wiping');
    const sg = el(c.p + 'sg'); if (sg && window.BS_groundFrame) window.BS_groundFrame(sg, c.T);   // the plate carries the deck's moving ground
    root.style.translate = x.toFixed(1) + 'px 0px';
    if (D) D.style.translate = x.toFixed(1) + 'px 0px';
  }
  defineTemplate('slate', {
    check: (d, def) => { prep(d); B0().check(d, def); },
    beats: d => {
      prep(d); const n = B0().beats(d);
      d.items.forEach(it => { if (it.__sl && K[it.__sl].beats) K[it.__sl].beats(it.__kind).forEach(b => b && n.push(b)); if (it.__sl === 'arrow') { if (it.until) n.push(it.until); if (it.out) n.push(it.out.b); } });
      ovBeats(d.__ov).forEach(b => b && n.push(b));
      return Array.from(new Set(n.filter(Boolean)));
    },
    html: (d, c) => { prep(d); return B0().html(d, c) + overHtml(c.p, d.__ov); },
    frame: (t, c) => {
      prep(c.data);
      /* a slide that opens on a face-window edge opens on a cut, so its eyebrow and headline are up from the first frame
         (postgres review 3: "fix all transition glitches": every cut from the face landed on a near-empty dark plate while
         the heading wiped in). Render-time only (c.T set): posters keep the slide's own data.headPre. */
      if (c.data.__hp0 === undefined) c.data.__hp0 = !!c.data.headPre;
      c.data.headPre = c.data.__hp0 || (c.T != null && c.T !== c.local && edgeStart(c));
      B0().frame(t, c);
      /* the heading of every timed slide is up within 0.35 s (review 3, "add all necessary fixes": with the push back between
         slides, the 0.1-0.9 s headline wipe left ~0.3 s of empty plate after each push) */
      if (c.T != null && c.T !== c.local && !c.data.headPre) { up(c.p + 'eb', seg(c.local, 0, .2)); h1In(c.p + 'h1', seg(c.local, 0, .35)); }
      const B = beats(c), d = c.data;
      d.items.forEach(it => { if (!it.__sl) return; const e = el(c.p + it.id); if (e) K[it.__sl].frame(c, B, kindOf(it), e); });
      const L = layoutOf(c), root = el(c.id);
      if (root) {
        root.classList.toggle('split', L.mode === 'split');
        root.classList.toggle('ovs', L.mode === 'on');
        /* a slide that ends on a face-window edge holds its last frame instead of pushing out: the window opens or closes
           with a cut, never with a ghost of this slide dissolving (review 1) */
        const T0 = absT(c) - c.local, end = T0 + c.screen;
        const RV = (window.PROJECT && PROJECT.reveals) || [];
        root.classList.toggle('xhold', RV.some(r => [r.at, r.to, r.at - (r.in || 0), r.to + (r.out || 0)].some(e => Math.abs(e - end) < .05)) || (L.mode !== 'full' && isTransparent()));
        splitWipe(root, L, c);
        onPush(root, L, c);
      }
      if (L.mode === 'on') overFrame(c, B, d.__ov);
      dockFrame(c, L.mode);
    },
  });

  /* =========================== SL: builders =========================== */
  const X = (base, o) => Object.assign(base, o || {});
  const promptUser = () => ((window.PROJECT && PROJECT.prompt) || 'mia@MacBook-Pro ~ % ').split('@')[0];
  const row = (cells, st, o) => X({ cells, st: st || 'pend' }, o);
  window.SL = {
    src, row,
    box: (id, x, y, w, h, html, o) => X({ id, k: 'box', x, y, w, h, html }, o),
    arrow: (id, b, pts, o) => X({ id, k: 'arrow', b, pts }, o),
    page: (id, x, y, w, title, rows, o) => {
      const rs = rows.map(r => Array.isArray(r) ? row(r[0], r[1], r[2]) : r);
      const it = X({ id, k: 'page', title, rows: rs, x, y, w }, o);
      it.h = it.h || pageH(it);
      return it;
    },
    trk: (id, x, y, w, n, items, lit, o) => X({ id, k: 'trk', n, items, lit, x, y, w, h: 58 }, o),
    tracker: (id, x, y, w, h, o) => X({ id, k: 'tracker', x, y, w, h }, o),
    iphone: (id, x, y, w, o) => { const it = X({ id, k: 'iphone', x, y, w }, o); it.h = Math.round(w * PH / PW); return it; },
    iphoneApp,
    bubble: (id, x, y, w, h, html, o) => X({ id, k: 'bubble', x, y, w, h, html }, o),
    scan: (id, x, y, w, h, tokens, o) => X({ id, k: 'scan', x, y, w, h, tokens }, o),
    counter: (id, x, y, w, h, o) => X({ id, k: 'counter', x, y, w, h }, o),
    chip: (id, x, y, html, o) => X({ id, k: 'chip', html, x, y, z: 6 }, o),
    card: (id, x, y, w, h, label, sub, o) => X({ id, k: 'card', label, sub, x, y, w, h }, o),
    logo: (id, x, y, name, label, o) => X(/[/.:]/.test(name) ? { id, k: 'logo', cls: 'sm', src: src(name), label, x, y, w: 150, h: 150 } : { id, k: 'logo', cls: 'sm', logo: name, label, x, y, w: 150, h: 150 }, o),
    who: (id, x, y, s, name, o) => X({ id, k: 'who', src: /[/.]/.test(s) ? s : passet('avatars/' + s + '.svg'), name, x, y, w: 170, h: 170 }, o),
    txt: (id, x, y, html, o) => X({ id, k: 'txt', html, x, y, z: 6 }, o),
    tag: (id, x, y, html, o) => X({ id, k: 'txt', cls: 'lbl', html, x, y, z: 6 }, o),
    note: (id, x, y, html, o) => X({ id, k: 'txt', html, x, y, z: 8, fx: 'pop' }, Object.assign({}, o, { cls: 'hand ' + ((o && o.cls) || '') })),
    img: (id, x, y, w, h, s, o) => X({ id, k: 'html', html: `<img src="${s}" alt="" style="width:100%;height:100%;object-fit:contain;display:block">`, x, y, w, h }, o),
    vsc: (id, x, y, w, h, file, lines, o) => X({ id, k: 'vsc', x, y, w, h, file, lines, title: 'jobs-app' }, o),
    term: (id, x, y, w, h, lines, o) => X({ id, k: 'term', x, y, w, h, lines, title: promptUser() + ' — -zsh — 120×30' }, o),
    psql: (id, x, y, w, h, lines, o) => X({ id, k: 'term', x, y, w, h, lines, prompt: 'app=# ', title: 'psql' }, o),
    chrome: (id, x, y, w, h, url, html, o) => X({ id, k: 'chrome', x, y, w, h, url, html }, o),
    packet: (id, b, pts, o) => X({ id, k: 'packet', x: pts[0][0] - 14, y: pts[0][1] - 14, w: 28, h: 28, walk: { b, pts, d: (o && o.d) || 1.2 } }, o),
    edge: (id, a, z, o) => X({ id, a, z }, o),
  };
})();
