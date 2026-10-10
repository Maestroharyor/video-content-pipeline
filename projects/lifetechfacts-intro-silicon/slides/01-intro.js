/* Intro concept F, "Silicon" (4.0s): circuit traces route in from the frame edges to a chip package, pulses run along them and charge the
   die; the pins retract, the traces pull back, the square package rounds into the mark's disc, and the last two pulses hop off their
   traces onto the ring as the mark's balls; then the shared ending (LF.resolve). Every value is a pure function of ctx.local (seconds).
   Logo drawing: window.LF (assets/logos/lifetechfacts/lf-logo.js). */
(function () {
  const { G, f2, hash } = LF;
  const ROT0 = 200, T0 = 1.78, PINS = 7, SIDES = [[-1, 0], [1, 0], [0, -1], [0, 1]], HERO = { 3: 2, 10: 1 };   // hero traces (left-centre, right-centre) carry the pulses that become ball 2 / ball 1
  /* package + fan-out traces in stage px. Every trace runs edge → pin: straight in, one 45° jog, straight into its pin; some stop short at a via */
  const geo = L => { const s = .74 * L.D, pitch = s / (PINS + 1.4), pin = 24 * L.k, tr = [];
    SIDES.forEach(([dx, dy], si) => { const avail = (dx ? L.cx : dy < 0 ? L.cy : L.H - L.cy) - s / 2 - pin, f = Math.min(1, avail * .78 / (118 + 210) / L.k);
      for (let i = 0; i < PINS; i++) { const o = (i - 3) * pitch, m = Math.abs(i - 3), sg = Math.sign(i - 3), a = (40 + 26 * m) * L.k * f, b = (50 + 50 * m) * L.k * f * (m ? 1 : 0), id = si * PINS + i;
        const via = !(id in HERO) && hash(id + 2) > .68, run = via ? a + b + 70 * L.k * f : avail + 40;
        const P = k => ({ x: L.cx + dx * (s / 2 + pin + k[0]) - dy * k[1], y: L.cy + dy * (s / 2 + pin + k[0]) + dx * k[1] });   // k = [distance out of the pin, sideways shift]
        const pts = [P([run, o + sg * b]), P([a + b, o + sg * b]), P([a, o]), P([0, o])], len = pts.slice(1).map((q, j) => Math.hypot(q.x - pts[j].x, q.y - pts[j].y));
        tr.push({ id, pts, len, total: len.reduce((x, y) => x + y, 0), via, d: 'M' + pts.map(q => f2(q.x) + ' ' + f2(q.y)).join('L'), pinAt: P([-pin, o]), tip: P([0, o]), dx, dy }); } });
    return { s, pin, tr }; };
  const along = (t, q) => { let r = q * t.total; for (let j = 0; j < t.len.length; j++) { if (r <= t.len[j] || j === t.len.length - 1) { const k = t.len[j] ? r / t.len[j] : 0; return { x: lerp(t.pts[j].x, t.pts[j + 1].x, k), y: lerp(t.pts[j].y, t.pts[j + 1].y, k) }; } r -= t.len[j]; } };

  defineSlide({
    slug: '01-intro', dur: 4, audio: 'lf-intro-sting.wav',
    data: { theme: (window.PROJECT.intro || {}).theme, tagline: (window.PROJECT.intro || {}).tagline || LF.TAGLINE, chip: 'LTF-01', rev: 'rev A' },
    html: (d, c) => {
      const p = c.p, t = LF.theme(d), L = LF.intro(c.grid), g = geo(L), light = t.name === 'light', hot = light ? LF.BLUE : t.ink;
      const traces = g.tr.map(r => `<path id="${p}t${r.id}" d="${r.d}" pathLength="1" fill="none" stroke="${t.line}" stroke-width="${f2(3.5 * L.k)}" stroke-linejoin="round" stroke-dasharray="1 1" stroke-dashoffset="1" opacity=".75"/>${r.via ? `<circle id="${p}v${r.id}" cx="${f2(r.pts[0].x)}" cy="${f2(r.pts[0].y)}" r="0" fill="none" stroke="${t.line}" stroke-width="${f2(3.5 * L.k)}"/>` : ''}`).join('');
      const pins = g.tr.map(r => `<line id="${p}pn${r.id}" x1="${f2(r.pinAt.x)}" y1="${f2(r.pinAt.y)}" x2="${f2(r.tip.x)}" y2="${f2(r.tip.y)}" stroke="${t.dim}" stroke-width="${f2(9 * L.k)}" pathLength="1" stroke-dasharray="1 1"/>`).join('');
      const pulses = g.tr.map(r => `<circle id="${p}pu${r.id}" r="${f2(6.5 * L.k)}" fill="${hot}" opacity="0"/>`).join('');
      return `${LF.css}<style>.lff text{font:700 ${f2(21 * L.k)}px JB,monospace;fill:${t.dim};text-anchor:middle}</style>${LF.bg(p, t)}
<svg class="lfi lff" id="${p}svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}"><defs>${LF.defs(p)}</defs>
<g id="${p}trs">${traces}</g>${pulses}
<g id="${p}pk"><g id="${p}pns">${pins}</g>
  <rect id="${p}bd" fill="${light ? '#FFFFFF' : '#0E1526'}" stroke="${t.line}" stroke-width="${f2(3.5 * L.k)}"/><rect id="${p}fl" fill="${LF.BLUE}" opacity="0"/>
  <g id="${p}die"><rect x="${f2(L.cx - g.s * .27)}" y="${f2(L.cy - g.s * .27)}" width="${f2(g.s * .54)}" height="${f2(g.s * .54)}" rx="${f2(8 * L.k)}" fill="none" stroke="${t.line}" stroke-width="${f2(2.5 * L.k)}"/>
    <rect id="${p}glow" x="${f2(L.cx - g.s * .27)}" y="${f2(L.cy - g.s * .27)}" width="${f2(g.s * .54)}" height="${f2(g.s * .54)}" rx="${f2(8 * L.k)}" fill="${LF.BLUE}" opacity="0"/>
    <text x="${f2(L.cx)}" y="${f2(L.cy + 2 * L.k)}" style="fill:${t.ink}">${d.chip}</text><text x="${f2(L.cx)}" y="${f2(L.cy + 30 * L.k)}" style="font-weight:400;font-size:${f2(16 * L.k)}px">${d.rev}</text>
    <circle cx="${f2(L.cx - g.s * .4)}" cy="${f2(L.cy - g.s * .4)}" r="${f2(6 * L.k)}" fill="${t.line}"/></g></g>
${LF.shock(p, L, t)}
${LF.mark(p)}
<circle id="${p}h1" r="0" fill="${hot}"/><circle id="${p}h2" r="0" fill="${hot}"/>
${LF.word(p, t.word)}
</svg>
${LF.tag(p, L, d.tagline, t)}`;
    },
    frame: (u, c) => {
      const p = c.p, T = c.local, d = c.data, t = LF.theme(d), L = LF.intro(c.grid), g = geo(L), S = (a, b) => seg(T, a, b), at = (id, o) => LF.at(p, id, o);
      /* 0.00-0.95  traces route in from the edges (each starts at its own fixed moment), vias ring where a trace stops short */
      const back = eio(S(1.38, T0 - .04));
      g.tr.forEach(r => { const hero = r.id in HERO, a = .02 + .42 * hash(r.id + 11), q = eio(seg(T, a, a + .5));
        at('t' + r.id, { 'stroke-dashoffset': (q < 1 ? 1 - q : back).toFixed(4), opacity: back >= 1 ? 0 : .75 });   // draws edge → pin, later pulls back towards the edge
        if (r.via) at('v' + r.id, { r: f2(8 * L.k * bk(seg(T, a, a + .25)) * (1 - back)) });
        /* 0.45-1.45  one pulse per trace runs into the chip; the two hero pulses leave last */
        const b = hero ? 1.22 : .5 + .6 * hash(r.id + 31), pq = seg(T, b, b + (hero ? .36 : .42)), pt = along(r, eio(pq));
        if (!hero) at('pu' + r.id, { cx: f2(pt.x), cy: f2(pt.y), opacity: pq > 0 && pq < 1 ? 1 : 0 });
        at('pn' + r.id, { 'stroke-dashoffset': eo(S(1.4, 1.58)).toFixed(4), opacity: f2(S(.3, .45)) }); });
      /* 0.10-1.78  the package pops in, its die charges as pulses arrive, then the square rounds into the disc */
      const mq = eio(S(1.45, T0)), side = lerp(g.s, 2 * G.R * L.D / 1000, mq) * (T < .5 ? bk(S(.1, .45)) : 1), box = { x: f2(L.cx - side / 2), y: f2(L.cy - side / 2), width: f2(side), height: f2(side), rx: f2(lerp(16 * L.k, side / 2, mq)) };
      at('bd', Object.assign({ opacity: T >= T0 ? 0 : 1, 'stroke-opacity': f2(1 - mq) }, box)); at('fl', Object.assign({ opacity: T >= T0 ? 0 : f2(eo(S(1.4, 1.7))) }, box));
      at('die', { opacity: f2(S(.25, .5) * (1 - S(1.38, 1.55))) }); at('glow', { opacity: f2(.75 * S(.9, 1.4) * (.8 + .2 * Math.sin(T * 30))) });
      /* 1.22-1.98  hero pulses ride their traces, hop onto the ring and become the balls once the disc is under them */
      const R = LF.resolve(p, L, T, t, { t0: T0, rot0: ROT0, disc: false, balls: false });
      at('dsc', { r: f2(T >= T0 ? G.R * (1 + .045 * Math.sin(Math.PI * S(T0, T0 + .32))) : 0) });
      g.tr.filter(r => r.id in HERO).forEach(r => { const n = HERO[r.id], b = LF.ballAt(L, n, R.rot), pq = S(1.22, 1.58), pt = along(r, eio(pq)), fq = eio(S(1.58, T0 + .1));
        at('h' + n, { cx: f2(lerp(pt.x, b.x, fq)), cy: f2(lerp(pt.y, b.y, fq)), r: f2(pq > 0 ? lerp(6.5 * L.k, b.r, fq) : 0), opacity: T >= T0 + .2 ? 0 : 1 }); });
      LF.orbit(p, { rot: R.rot, b1: T >= T0 + .1 ? 1 : 0, b2: T >= T0 + .1 ? 1 : 0, a1: eo(S(T0 + .15, T0 + .85)), a2: eo(S(T0 + .1, T0 + .8)) });
    }
  });
})();
