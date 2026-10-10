/* Intro concept G, "Bits" (4.0s): a memory test sweeps a grid of cells across the frame while an address counter runs; then the mark shows up
   as a bitmap that doubles its resolution three times (6, 12, 24, 48 cells across) and snaps from pixels to the crisp vector mark; wordmark,
   tagline and sheen come from the shared ending (LF.resolve). The bitmaps are sampled from the mark's own geometry when the slide's markup
   is built (canvas Path2D hit tests: no randomness, no layout). Every value is a pure function of ctx.local (seconds).
   Logo drawing: window.LF (assets/logos/lifetechfacts/lf-logo.js). */
(function () {
  const { G, f2, hash } = LF;
  const LEVELS = [{ n: 6, t: .95 }, { n: 12, t: 1.2 }, { n: 24, t: 1.45 }, { n: 48, t: 1.68 }], SNAP = 1.92, CELL = 60;   // bitmap levels (cells across, start time); SNAP: pixels → vector; CELL: memory grid pitch
  /* what the mark shows at a point of its 1000-unit square: 0 nothing, 1 disc blue, 2 white (orbit, balls, LT), 3 lavender facets */
  let hit = null;
  const classify = (x, y) => { if (!hit) { const cx = document.createElement('canvas').getContext('2d'), P = s => new Path2D(s);
      const white = [G.band1, G.band2, G.mono.L, G.mono.T].map(P), facet = [G.mono.foot, G.mono.wing, G.mono.bar].map(P);
      hit = (px, py) => Math.hypot(px - G.c, py - G.c) > G.R ? 0 : white.some(w => cx.isPointInPath(w, px, py)) || G.balls.some(b => Math.hypot(px - b.x, py - b.y) < b.r) ? 2 : facet.some(w => cx.isPointInPath(w, px, py)) ? 3 : 1; }
    return hit(x, y); };
  const bitmap = n => { const out = [], s = 1000 / n; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = [0, 0, 0, 0];
      for (let b = 0; b < 4; b++) for (let a = 0; a < 4; a++) k[classify((i + (a + .5) / 4) * s, (j + (b + .5) / 4) * s)]++;
      if (k[0] > 9) continue; out.push({ i, j, v: k[2] >= 5 ? 2 : k[3] >= 5 ? 3 : 1 }); } return out; };
  const maps = {}, level = n => maps[n] || (maps[n] = bitmap(n));
  const grid = L => { const cols = Math.ceil(L.W / CELL), rows = Math.ceil(L.H / CELL); return { cols, rows, n: cols * rows }; };
  const hex = v => ('0000' + Math.round(v).toString(16).toUpperCase()).slice(-4);

  defineSlide({
    slug: '01-intro', dur: 4, audio: 'lf-intro-sting.wav',
    data: { theme: (window.PROJECT.intro || {}).theme, tagline: (window.PROJECT.intro || {}).tagline || LF.TAGLINE, mem: 'mem check', ok: 'ok', res: 'res', vector: 'vector' },
    html: (d, c) => {
      const p = c.p, t = LF.theme(d), L = LF.intro(c.grid), m = grid(L), FILL = { 1: LF.BLUE, 2: '#fff', 3: LF.FACET };
      let cells = ''; for (let i = 0; i < m.n; i++) cells += `<rect id="${p}q${i}" x="${(i % m.cols) * CELL + 3}" y="${Math.floor(i / m.cols) * CELL + 3}" width="${CELL - 6}" height="${CELL - 6}" rx="4" opacity="0"/>`;
      const lv = LEVELS.map((v, k) => { const s = L.D / v.n, gap = k < 2 ? 3 : k < 3 ? 2 : 1;
        return `<g id="${p}L${k}" opacity="0">${level(v.n).map((q, i) => `<rect ${k < 3 ? `id="${p}L${k}c${i}" opacity="0" ` : ''}x="${f2(L.cx - L.D / 2 + q.i * s + gap / 2)}" y="${f2(L.cy - L.D / 2 + q.j * s + gap / 2)}" width="${f2(s - gap)}" height="${f2(s - gap)}" fill="${FILL[q.v]}"/>`).join('')}</g>`; }).join('');
      return `${LF.css}<style>.lfg-ro{position:absolute;font:400 30px/1 JB,monospace;letter-spacing:.06em;text-transform:uppercase;white-space:pre}.lfg-ro b{font-weight:700}</style>${LF.bg(p, t)}
<svg class="lfi" id="${p}svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}"><defs>${LF.defs(p)}</defs>
<g id="${p}mem" fill="${t.line}">${cells}</g>
${lv}
${LF.shock(p, L, t)}
${LF.mark(p)}
${LF.word(p, t.word)}
</svg>
<div class="lfg-ro" id="${p}ro" style="left:${f2(L.W * .06)}px;top:${f2(L.H * .9)}px;color:${t.dim}"><span id="${p}ro1"></span>  <b id="${p}ro2" style="color:${t.name === 'light' ? LF.BLUE : t.ink}"></b></div>
${LF.tag(p, L, d.tagline, t)}`;
    },
    frame: (u, c) => {
      const p = c.p, T = c.local, d = c.data, t = LF.theme(d), L = LF.intro(c.grid), m = grid(L), S = (a, b) => seg(T, a, b), at = (id, o) => LF.at(p, id, o);
      /* 0.00-1.15  memory test: a sweep crosses the frame, cells flare behind it and decay, a few stay lit until the bitmap arrives */
      const sx = lerp(-120, L.W + 320, S(0, .85)), rest = 1 - S(.85, 1.15);
      for (let i = 0; i < m.n; i++) { const dx = sx - ((i % m.cols) + .5) * CELL, glow = dx < 0 ? 0 : Math.exp(-dx / 240) * (.2 + .8 * hash(i)) * .6 * (1 - S(.85, 1.25)), keep = dx > 0 && hash(i + 9) > .86 ? .2 * rest : 0;
        at('q' + i, { opacity: f2(Math.max(glow, keep)) }); }
      /* 0.95-1.92  the mark as a bitmap: each level's cells switch on over 0.1s (fixed order), the level before it goes once they are all on */
      LEVELS.forEach((v, k) => { const next = k < LEVELS.length - 1 ? LEVELS[k + 1].t + .1 : SNAP; at('L' + k, { opacity: T >= v.t && T < next ? 1 : 0 });
        if (k < 3 && T >= v.t - .05 && T < next + .05) level(v.n).forEach((q, i) => at('L' + k + 'c' + i, { opacity: T >= v.t + .1 * hash(i + 7 * k) ? 1 : 0 })); });
      const lvl = LEVELS.filter(v => T >= v.t).length;
      txt(p + 'ro1', lvl ? d.res : d.mem + ' 0x' + hex(0xFFFF * S(0, .85)));
      txt(p + 'ro2', T >= SNAP ? d.vector : lvl ? LEVELS[lvl - 1].n + '×' + LEVELS[lvl - 1].n : S(0, .85) >= 1 ? d.ok : '');
      st(p + 'ro', { opacity: f2(S(.02, .15) * (1 - S(SNAP + .35, SNAP + .7))) });
      /* 1.92  snap: the vector mark replaces the finest bitmap with a small pulse and the shock ring; the shared ending does the rest */
      LF.resolve(p, L, T, t, { t0: SNAP - .37, disc: false, balls: false, mono: false, shock: false });
      LF.placeMark(p, L, 1 + .05 * Math.sin(Math.PI * S(SNAP, SNAP + .3)), { opacity: T >= SNAP ? 1 : 0 });
      at('dsc', { r: G.R }); LF.orbit(p, { rot: 0, b1: 1, b2: 1, a1: 1, a2: 1 }); LF.mono(p, 1, 1, 1);
      LF.shockAt(p, L, S(SNAP, SNAP + .55), S(SNAP + .04, SNAP + .5), { from: L.D / 2 });
    }
  });
})();
