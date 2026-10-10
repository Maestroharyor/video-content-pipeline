/* Intro concept E, "Loaded" (4.0s): a browser window draws itself, a skeleton page shimmers while a two-arc spinner turns in the middle and
   the load bar fills. The spinner is the mark's own orbit: when the page is loaded the window falls away, the disc bursts out under the
   spinner, its arcs grow to full length, the balls pop on their leading ends, then the shared ending (LF.resolve).
   Every value is a pure function of ctx.local (seconds). Logo drawing: window.LF (assets/logos/lifetechfacts/lf-logo.js). */
(function () {
  const { G, f2 } = LF;
  const ROT0 = 200, T0 = 1.75, SPIN = 420, ARC = .3;   // disc bursts at T0; spinner speed in degrees per second; spinner arc length as a fraction of the full arc
  /* window + skeleton blocks in stage px, centred on the mark (the spinner sits where the orbit will be) */
  const geo = L => { const v = L.W < L.H, w = v ? 940 : 1240, ch = v ? 1020 : 610, bar = 62, x = L.cx - w / 2, y = L.cy - ch / 2 - bar * .5, B = [];
    const add = (bx, by, bw, bh, r) => B.push({ x: x + bx, y: y + bar + by, w: bw, h: bh, r: r == null ? 9 : r });
    if (!v) { add(36, 40, 56, 56, 28); add(106, 50, 100, 14); add(106, 74, 64, 12); [0, 1, 2, 3, 4].forEach(i => add(36, 140 + i * 46, 170 - (i % 3) * 28, 16));          // sidebar: avatar, name, nav
      [0, 1, 2].forEach(i => { add(w - 246, 40 + i * 182, 210, 110, 12); add(w - 246, 162 + i * 182, 150 - i * 20, 14); }); }                                                // right rail: cards
    else { [0, 1, 2].forEach(i => add(40 + i * 292, 40, 270, 130, 12)); [0, 1, 2].forEach(i => add(40 + i * 292, ch - 170, 270, 130, 12)); }
    [0, 1].forEach(i => add(w / 2 - (i ? 110 : 170), ch / 2 + .3615 * L.D + 58 + i * 30, i ? 220 : 340, 14));                                                                   // two lines under the spinner
    return { x, y, w, h: ch + bar, bar, B }; };

  defineSlide({
    slug: '01-intro', dur: 4, audio: 'lf-intro-sting.wav',
    data: { theme: (window.PROJECT.intro || {}).theme, tagline: (window.PROJECT.intro || {}).tagline || LF.TAGLINE, url: 'lifetechfacts', status: 'loading…', done: 'ready ✓' },
    html: (d, c) => {
      const p = c.p, t = LF.theme(d), L = LF.intro(c.grid), g = geo(L);
      const blocks = g.B.map((b, i) => `<rect id="${p}k${i}" x="${f2(b.x)}" y="${f2(b.y)}" width="${f2(b.w)}" height="${f2(b.h)}" rx="${b.r}" fill="${t.line}" opacity="0"/>`).join('');
      return `${LF.css}<style>.lfe text{font:400 22px JB,monospace;fill:${t.dim}}</style>${LF.bg(p, t)}
<svg class="lfi lfe" id="${p}svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}"><defs>${LF.defs(p)}</defs>
<g id="${p}win">
  <rect id="${p}fr" x="${f2(g.x)}" y="${f2(g.y)}" width="${g.w}" height="${g.h}" rx="20" pathLength="1" fill="none" stroke="${t.line}" stroke-width="3" stroke-dasharray="1 1" stroke-dashoffset="1"/>
  <g id="${p}chr" opacity="0"><line x1="${f2(g.x)}" x2="${f2(g.x + g.w)}" y1="${f2(g.y + g.bar)}" y2="${f2(g.y + g.bar)}" stroke="${t.line}" stroke-width="2" opacity=".5"/>
    ${[0, 1, 2].map(i => `<circle cx="${f2(g.x + 34 + i * 26)}" cy="${f2(g.y + g.bar / 2)}" r="7.5" fill="${t.line}" opacity="${.9 - i * .25}"/>`).join('')}
    <rect x="${f2(g.x + g.w * .24)}" y="${f2(g.y + 13)}" width="${f2(g.w * .52)}" height="36" rx="18" fill="${t.line}" opacity=".16"/>
    <text x="${f2(g.x + g.w * .24 + 24)}" y="${f2(g.y + 38)}">${d.url}</text><text id="${p}stt" x="${f2(g.x + g.w * .76 - 24)}" y="${f2(g.y + 38)}" text-anchor="end" style="fill:${t.line}">${d.status}</text></g>
  <rect id="${p}pg" x="${f2(g.x + 2)}" y="${f2(g.y + g.bar)}" width="0" height="5" fill="${t.name === 'light' ? LF.BLUE : t.ink}"/>
  ${blocks}
</g>
${LF.shock(p, L, t)}
${LF.mark(p)}
${LF.word(p, t.word)}
</svg>
${LF.tag(p, L, d.tagline, t)}`;
    },
    frame: (u, c) => {
      const p = c.p, T = c.local, d = c.data, t = LF.theme(d), L = LF.intro(c.grid), g = geo(L), S = (a, b) => seg(T, a, b), at = (id, o) => LF.at(p, id, o);
      /* 0.00-0.70  the window draws on, its chrome fades in, skeleton blocks pop in one after the other and shimmer */
      const out = S(1.45, T0 + .05);
      at('fr', { 'stroke-dashoffset': (1 - eio(S(0, .45))).toFixed(4) }); at('chr', { opacity: f2(S(.2, .45)) });
      at('win', { opacity: f2(1 - eo(out)), transform: `translate(${f2(L.cx)} ${f2(L.cy)}) scale(${(1 + .05 * eio(out)).toFixed(4)}) translate(${f2(-L.cx)} ${f2(-L.cy)})` });
      g.B.forEach((b, i) => { const q = seg(T, .18 + .035 * i, .42 + .035 * i); at('k' + i, { opacity: f2(eo(q) * (.2 + .1 * Math.sin(T * 7 - b.x * .012 - b.y * .004))) }); });
      /* 0.30-1.50  the load bar fills (it stalls a little at 70%, like the real thing) */
      const pq = S(.3, 1.5), load = pq < .55 ? .7 * eo(pq / .55) : .7 + .3 * eio((pq - .55) / .45); at('pg', { width: f2((g.w - 4) * load) }); txt(p + 'stt', pq >= 1 ? d.done : d.status);
      /* 0.35-1.75  the spinner: the mark's two arcs at 30% length turning anticlockwise; at T0 the turn kicks into the lap and eases out */
      LF.resolve(p, L, T, t, { t0: T0, balls: false });
      const rot = T < T0 ? ROT0 + SPIN * (T0 - T) : ROT0 * (1 - eo4(S(T0, T0 + .85))), arc = T < T0 ? ARC * eo(S(.35, .65)) : lerp(ARC, 1, eo(S(T0 + .08, T0 + .8)));
      LF.orbit(p, { rot, b1: bk(S(T0 + .06, T0 + .32)), b2: bk(S(T0 + .02, T0 + .28)), a1: arc, a2: arc });
      at('orb', { fill: t.name === 'light' && spring(S(T0, T0 + .5)) * G.R < G.rr + G.sw / 2 ? LF.BLUE : '#fff' });   // on the light background the spinner is blue until the disc is under it
    }
  });
})();
