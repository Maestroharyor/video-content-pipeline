/* Intro concept B, "Orbit" (4.0s): a small service graph (nodes, links, four topic glyphs) drifts in, gravity swirls every node onto
   the mark's ring where they merge into its two balls; the disc bursts out, the balls lap the ring with their arcs trailing, LT/F wipes
   in, the wordmark rises, and a faint satellite ring keeps turning behind the mark during the hold.
   Every value is a pure function of ctx.local (seconds). Logo drawing: window.LF (assets/logos/lifetechfacts/lf-logo.js). */
(function () {
  const { G, f2, hash } = LF;
  const N = 14, ROT0 = 190, GLYPH = { 1: 'chip', 4: 'code', 8: 'cloud', 11: 'shield' };
  // 24-unit line icons, drawn for this slide (generic shapes, no brand marks)
  const ICON = {
    code: '<path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.4 5.5l-2.8 13"/>',
    chip: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
    cloud: '<path d="M7.5 18h9.2a3.8 3.8 0 0 0 .5-7.57A5.6 5.6 0 0 0 6.4 11.2 3.4 3.4 0 0 0 7.5 18z"/>',
    shield: '<path d="M12 3.2l6.6 2.6v5c0 4.4-2.8 7.9-6.6 9.6-3.8-1.7-6.6-5.2-6.6-9.6v-5z"/><path d="M9 12l2.2 2.2 3.9-4.2"/>',
  };
  /* node i: where it starts (an ellipse round the mark, clear of its centre), its size, and which ball it ends up in */
  const node = (i, L) => { const a = (i / N + hash(i) * .05) * 2 * Math.PI, f = .5 + .5 * hash(i + 20), v = L.W < L.H, x = (v ? 470 : 700 * L.k) * f * Math.cos(a), y = (v ? 640 : 350 * L.k) * f * Math.sin(a);   // a wide ellipse, or a tall one on the vertical canvas
    return { x, y, r0: Math.hypot(x, y), a0: Math.atan2(y, x), size: GLYPH[i] ? 46 : 7 + 8 * hash(i + 3), ball: i % 2 ? 1 : 2 }; };
  const links = L => { const P = Array.from({ length: N }, (_, i) => node(i, L)), seen = {}, out = [];
    P.forEach((a, i) => P.map((b, j) => [j, Math.hypot(a.x - b.x, a.y - b.y)]).filter(e => e[0] !== i).sort((m, n) => m[1] - n[1]).slice(0, 3).forEach(([j]) => { const k = Math.min(i, j) + '-' + Math.max(i, j); if (!seen[k]) { seen[k] = 1; out.push([Math.min(i, j), Math.max(i, j)]); } }));
    return out; };

  defineSlide({
    slug: '01-intro', dur: 4, audio: 'lf-intro-sting.wav',
    data: { theme: (window.PROJECT.intro || {}).theme, tagline: (window.PROJECT.intro || {}).tagline || LF.TAGLINE },
    html: (d, c) => {
      const p = c.p, t = LF.theme(d), L = LF.layout(c.grid, { tag: 26, D: c.grid.canvas === 'vertical' ? 500 : 420 }), bgc = t.bg || '#0A0E18';
      const edges = links(L).map((_, j) => `<line id="${p}e${j}"/>`).join(''), pulses = links(L).map((_, j) => `<circle id="${p}pl${j}" r="4" fill="${t.ink}" opacity="0"/>`).join('');
      const nodes = Array.from({ length: N }, (_, i) => { const n = node(i, L);
        return GLYPH[i] ? `<g id="${p}n${i}"><circle r="${n.size}" fill="${bgc}" stroke="${t.line}" stroke-width="3"/><g id="${p}g${i}" transform="translate(-30 -30) scale(2.5)" fill="none" stroke="${t.ink}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICON[GLYPH[i]]}</g></g>`
          : `<circle id="${p}n${i}" r="${f2(n.size)}" fill="${i % 3 ? t.line : t.ink}"/>`; }).join('');
      return `${LF.css}${LF.bg(p, t)}
<svg class="lfi" id="${p}svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}"><defs>${LF.defs(p)}</defs>
<g transform="translate(${f2(L.cx)} ${f2(L.cy)})">
  <g id="${p}sat" opacity="0" transform="rotate(-18)"><ellipse rx="${f2(L.D * .98)}" ry="${f2(L.D * .27)}" fill="none" stroke="${t.line}" stroke-width="2.5" stroke-dasharray="2 12" stroke-linecap="round"/><circle id="${p}s1" r="8" fill="${t.ink}"/><circle id="${p}s2" r="5.5" fill="${t.line}"/></g>
  <g id="${p}eds" stroke="${t.line}" stroke-width="2.5" opacity=".75">${edges}</g>${pulses}
  <g id="${p}nds">${nodes}</g>
</g>
${LF.shock(p, L, t)}
${LF.mark(p)}
${LF.word(p, t.word)}
</svg>
${LF.tag(p, L, d.tagline, t)}`;
    },
    frame: (u, c) => {
      const p = c.p, T = c.local, d = c.data, t = LF.theme(d), L = LF.layout(c.grid, { tag: 26, D: c.grid.canvas === 'vertical' ? 500 : 420 }), S = (a, b) => seg(T, a, b), at = (id, o) => LF.at(p, id, o);
      const ringR = G.rr * L.D / 1000, lap = eo4(S(1.7, 2.55)), rot = ROT0 * (1 - lap);

      /* 0.00-1.70  nodes pop in and drift; from 0.85 gravity swirls each one anticlockwise onto the ring, into its ball's starting spot */
      const pos = i => { const n = node(i, L), b = LF.ballAt(L, n.ball, ROT0), th = Math.atan2(b.y - L.cy, b.x - L.cx), q = eio(seg(T, .85 + .02 * i, 1.58 + .008 * i));
        const turn = ((n.a0 - th) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) + (i % 3 ? 2 * Math.PI : 0), a = n.a0 - turn * q, r = lerp(n.r0, ringR, q), w = 1 - q;
        return { x: r * Math.cos(a) + 12 * w * Math.sin(T * 1.3 + i * 1.7), y: r * Math.sin(a) + 9 * w * Math.cos(T * 1.1 + i * 2.3), q, n }; };
      const P = Array.from({ length: N }, (_, i) => pos(i));
      P.forEach((o, i) => { const inq = seg(T, .04 * i, .04 * i + .3), s = bk(inq) * lerp(1, GLYPH[i] ? .3 : .75, o.q), gone = seg(T, 1.6, 1.78);
        at('n' + i, { transform: `translate(${f2(o.x)} ${f2(o.y)}) scale(${f2(s)})`, opacity: f2(cl(inq * 2.5, 0, 1) * (1 - gone)) });
        if (GLYPH[i]) at('g' + i, { opacity: f2(1 - S(.85, 1.1)) }); });
      links(L).forEach(([a, b], j) => { const q = eo(seg(T, .22 + .03 * j, .55 + .03 * j));
        at('e' + j, { x1: f2(P[a].x), y1: f2(P[a].y), x2: f2(lerp(P[a].x, P[b].x, q)), y2: f2(lerp(P[a].y, P[b].y, q)), opacity: f2((q > 0 ? 1 : 0) * (1 - S(.85, 1.12))) });
        const ph = (T * 1.5 + hash(j + 5)) % 1, on = q >= 1 && j % 2 === 0 ? Math.sin(Math.PI * ph) * (1 - S(.8, 1.0)) : 0;   // a packet travelling along every other link
        at('pl' + j, { cx: f2(lerp(P[a].x, P[b].x, ph)), cy: f2(lerp(P[a].y, P[b].y, ph)), opacity: f2(on) }); });

      /* 1.60-2.55  the disc bursts out, the merged nodes become the balls, the balls lap the ring with their arcs trailing */
      LF.placeMark(p, L, 1);
      at('dsc', { r: f2(G.R * spring(S(1.6, 2.1))) }); LF.bevel(p, S(2.3, 2.8));
      LF.orbit(p, { rot, b1: bk(S(1.62, 1.9)), b2: bk(S(1.66, 1.94)), a1: eo(S(1.8, 2.5)), a2: eo(S(1.76, 2.46)) });
      LF.shockAt(p, L, S(1.64, 2.25), S(1.72, 2.25));
      /* 2.10-3.05  LT/F, wordmark, tagline, sheen */
      LF.mono(p, expo(S(2.1, 2.55)), expo(S(2.18, 2.63)), eo(S(2.4, 2.8)));
      LF.placeWord(p, L, 1 + .06 * (1 - eo4(S(2.15, 2.9)))); LF.letters(p, T, 2.15, .026, .42);
      LF.tagIn(p, S(2.6, 3.05)); LF.sheen(p, S(2.75, 3.35), t.sheen);
      /* 2.30-4.00  a dotted satellite ring behind the mark, two small bodies travelling along it */
      const sa = T * .9, rx = L.D * .98, ry = L.D * .27;
      at('sat', { opacity: f2(.85 * eo(S(2.3, 3.0))) });
      at('s1', { cx: f2(rx * Math.cos(sa)), cy: f2(ry * Math.sin(sa)) }); at('s2', { cx: f2(rx * Math.cos(sa + 2.6)), cy: f2(ry * Math.sin(sa + 2.6)) });
    }
  });
})();
