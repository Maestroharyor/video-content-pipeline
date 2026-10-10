/* Intro concept D, "Commit" (4.0s): a git graph draws left to right (main line, commits, two branches that fork and merge back), a version
   tag pops on the merge commit; the lines retract into it, the two branch heads fly onto the mark's ring and become its balls, the merge
   commit bursts into the disc, then the shared ending (LF.resolve). Every value is a pure function of ctx.local (seconds).
   Logo drawing: window.LF (assets/logos/lifetechfacts/lf-logo.js). Sound cues: assets/sting.json follows the times below. */
(function () {
  const { f2 } = LF;
  const ROT0 = 200, T0 = 1.7, X = [695, 487, 278], DRAW = 1.1;   // the disc bursts at T0; main-line commits sit this far left of the merge commit (graph units)
  /* graph geometry in stage px: main line into the mark's centre, branch A forks up at commit 1, branch B forks down at commit 2 */
  const geo = L => { const z = L.W < L.H ? .7 : L.k, y = L.cy, dy = 165 * z, x = X.map(v => L.cx - v * z), mx = L.cx;   // z: graph scale (the vertical canvas is narrower)
    const fork = (x0, yb) => { const r = Math.min(82 * z, (mx - x0) / 4.2); return `M${f2(x0)} ${f2(y)}C${f2(x0 + r)} ${f2(y)} ${f2(x0 + r)} ${f2(yb)} ${f2(x0 + 2 * r)} ${f2(yb)}L${f2(mx - 2 * r)} ${f2(yb)}C${f2(mx - r)} ${f2(yb)} ${f2(mx - r)} ${f2(y)} ${f2(mx)} ${f2(y)}`; };
    const head = (x0, f) => { const r = Math.min(82 * z, (mx - x0) / 4.2); return lerp(x0 + 2 * r, mx - 2 * r, f); };
    return { z, y, x, mx, x00: -40, a: { d: fork(x[1], y - dy), x0: x[1], y: y - dy, hx: head(x[1], .62) }, b: { d: fork(x[2], y + dy), x0: x[2], y: y + dy, hx: head(x[2], .5) } }; };

  defineSlide({
    slug: '01-intro', dur: 4, audio: 'lf-intro-sting.wav',
    data: { theme: (window.PROJECT.intro || {}).theme, tagline: (window.PROJECT.intro || {}).tagline || LF.TAGLINE,
      hashes: ['a1f3c9e', '7be02d4', 'c49e1a8'], branches: ['feat/dev', 'feat/ai'], tag: 'v1.0', merge: 'merge → main' },
    html: (d, c) => {
      const p = c.p, t = LF.theme(d), L = LF.intro(c.grid), g = geo(L), z = g.z, dot = t.name === 'light' ? LF.BLUE : t.ink;
      const line = (id, dd, col) => `<path id="${p}${id}" d="${dd}" pathLength="1" fill="none" stroke="${col}" stroke-width="${f2(7 * z)}" stroke-linecap="round" stroke-dasharray="1 1" stroke-dashoffset="1"/>`;
      const commits = g.x.map((x, i) => `<circle id="${p}c${i}" cx="${f2(x)}" cy="${f2(g.y)}" r="0" fill="${t.ink}"/><text id="${p}h${i}" x="${f2(x)}" y="${f2(g.y + (i === 2 ? -38 : 58) * z)}" text-anchor="middle" opacity="0">${d.hashes[i]}</text>`).join('');
      return `${LF.css}<style>.lfd text{font:400 ${f2(26 * z)}px JB,monospace;fill:${t.dim}}.lfd .br{fill:${t.line};font-weight:700}</style>${LF.bg(p, t)}
<svg class="lfi lfd" id="${p}svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}"><defs>${LF.defs(p)}</defs>
<g id="${p}gr">${line('ln', `M${g.x00} ${f2(g.y)}L${f2(g.mx)} ${f2(g.y)}`, t.ink)}${line('la', g.a.d, t.line)}${line('lb', g.b.d, t.line)}
${commits}
<text class="br" id="${p}na" x="${f2(g.a.hx)}" y="${f2(g.a.y - 38 * z)}" text-anchor="middle" opacity="0">${d.branches[0]}</text><text class="br" id="${p}nb" x="${f2(g.b.hx)}" y="${f2(g.b.y + 60 * z)}" text-anchor="middle" opacity="0">${d.branches[1]}</text>
<circle id="${p}mr" cx="${f2(g.mx)}" cy="${f2(g.y)}" r="0" fill="none" stroke="${t.line}" stroke-width="${f2(3 * z)}"/><circle id="${p}mc" cx="${f2(g.mx)}" cy="${f2(g.y)}" r="0" fill="${LF.BLUE}" stroke="${t.ink}" stroke-width="${f2(5 * z)}"/>
<g id="${p}tg2" opacity="0"><rect x="${f2(-66 * z)}" y="${f2(-25 * z)}" width="${f2(132 * z)}" height="${f2(50 * z)}" rx="${f2(25 * z)}" fill="${LF.BLUE}"/><text x="0" y="${f2(9 * z)}" text-anchor="middle" style="fill:#fff;font-weight:700">${d.tag}</text></g>
<text id="${p}mt" x="${f2(g.mx + 56 * z)}" y="${f2(g.y + 9 * z)}" opacity="0" style="fill:${t.ink}">${d.merge}</text></g>
${LF.shock(p, L, t)}
${LF.mark(p)}
<circle id="${p}ha" r="0" fill="${dot}"/><circle id="${p}hb" r="0" fill="${dot}"/>
${LF.word(p, t.word)}
</svg>
${LF.tag(p, L, d.tagline, t)}`;
    },
    frame: (u, c) => {
      const p = c.p, T = c.local, d = c.data, t = LF.theme(d), L = LF.intro(c.grid), g = geo(L), z = g.z, S = (a, b) => seg(T, a, b), at = (id, o) => LF.at(p, id, o);
      /* 0.00-1.10  the head of the main line travels to the mark's centre; commits pop as it passes, branches draw with it */
      const hx = lerp(g.x00, g.mx, eio(S(0, DRAW)) * .35 + S(0, DRAW) * .65), off = eio(S(1.42, T0 + .02)), past = (x, w) => cl((hx - x) / (w || 50), 0, 1);
      const draw = (id, q) => at(id, { 'stroke-dashoffset': (q >= 1 ? -off : 1 - q).toFixed(4), opacity: q <= 0 || off >= 1 ? 0 : 1 });   // draws on from its start, later retracts into its end
      draw('ln', (hx - g.x00) / (g.mx - g.x00)); draw('la', past(g.a.x0, g.mx - g.a.x0)); draw('lb', past(g.b.x0, g.mx - g.b.x0));
      const gone = S(1.38, 1.6);
      g.x.forEach((x, i) => { const q = past(x); at('c' + i, { r: f2(18 * z * bk(q) * (1 - eo(S(1.4 + .04 * i, 1.58 + .04 * i)))) }); at('h' + i, { opacity: f2(q * (1 - gone)) }); });
      at('na', { opacity: f2(past(g.a.hx) * (1 - gone)) }); at('nb', { opacity: f2(past(g.b.hx) * (1 - gone)) });
      /* 1.10-1.45  merge commit lands with a ring, the version tag pops above it */
      const mq = S(DRAW - .02, DRAW + .3), rq = S(DRAW, DRAW + .5);
      at('mc', { r: f2(30 * z * bk(mq) * (1 + 1.2 * eo(S(T0 - .12, T0 + .04)))), opacity: T >= T0 + .04 ? 0 : 1 });
      at('mr', { r: f2(lerp(30, 104, eo(rq)) * z), opacity: f2(rq > 0 ? 1 - rq : 0) });
      const tq = S(DRAW + .1, DRAW + .38); at('tg2', { transform: `translate(${f2(g.mx)} ${f2(g.y - (84 + 12 * bk(tq)) * z)}) scale(${f2(bk(tq))})`, opacity: f2(cl(tq * 3, 0, 1) * (1 - gone)) });
      at('mt', { opacity: f2(S(DRAW + .06, DRAW + .24) * (1 - gone)) });
      /* 1.42-1.90  branch heads leave their lines and fly onto the ring; they ride the balls until the disc is under them */
      const R = LF.resolve(p, L, T, t, { t0: T0, rot0: ROT0, balls: false });
      [['ha', g.a, 2], ['hb', g.b, 1]].forEach(([id, br, n]) => { const b = LF.ballAt(L, n, R.rot), q = past(br.hx), fq = eio(S(1.42, T0 + .1));
        at(id, { cx: f2(lerp(br.hx, b.x, fq)), cy: f2(lerp(br.y, b.y, fq) - (n === 2 ? 60 : -60) * L.k * Math.sin(Math.PI * fq)), r: f2(lerp(18 * z * bk(q), b.r, fq)), opacity: T >= T0 + .2 ? 0 : 1 }); });
      LF.orbit(p, { rot: R.rot, b1: T >= T0 + .1 ? 1 : 0, b2: T >= T0 + .1 ? 1 : 0, a1: eo(S(T0 + .15, T0 + .85)), a2: eo(S(T0 + .1, T0 + .8)) });
    }
  });
})();
