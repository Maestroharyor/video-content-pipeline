/* Intro concept H, "Blueprint" (4.0s): the mark is drawn as a technical drawing: centre lines, the disc and ring circles, radial ticks at the
   arc ends with their measured angles, a diameter dimension, then the outlines of the orbit bands, balls and LT/F stroke on. The fills come
   in calmly (no burst), the construction lines fade, and the shared ending (LF.resolve) brings wordmark, tagline and sheen.
   The numbers on screen are the mark's real geometry (LF.G). Every value is a pure function of ctx.local (seconds).
   Logo drawing: window.LF (assets/logos/lifetechfacts/lf-logo.js). */
(function () {
  const { G, f2, rad } = LF;
  const ROT0 = 60, T0 = 1.5, ANG = [G.A1[0], G.A1[1], G.A2[0], G.A2[1]];   // fills start at T0; the orbit only turns a little here; radial ticks at the four arc ends
  const OUT = [['o1', G.band1, .6], ['o2', G.band2, .66], ['oL', G.mono.L, .8], ['oT', G.mono.T, .88], ['of', G.mono.foot, .96], ['ow', G.mono.wing, 1.0], ['ob', G.mono.bar, 1.04]];   // outline id, path, draw start

  defineSlide({
    slug: '01-intro', dur: 4, audio: 'lf-intro-sting.wav',
    data: { theme: (window.PROJECT.intro || {}).theme, tagline: (window.PROJECT.intro || {}).tagline || LF.TAGLINE, title: 'LTF mark · rev A', scale: 'scale 1:1 · units 1/1000' },
    html: (d, c) => {
      const p = c.p, t = LF.theme(d), L = LF.intro(c.grid), k = L.D / 1000, hair = f2(2 / k), R = G.R * k, col = t.line;
      const stroke = `fill="none" stroke="${col}" stroke-width="${hair}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"`;
      const ticks = ANG.map((a, i) => { const ca = Math.cos(rad(a)), sa = Math.sin(rad(a)), lx = L.cx + (R + 74) * ca, ly = L.cy + (R + 74) * sa;
        return `<line id="${p}rt${i}" x1="${f2(L.cx)}" y1="${f2(L.cy)}" x2="${f2(L.cx)}" y2="${f2(L.cy)}" stroke="${col}" stroke-width="1.5" stroke-dasharray="10 7" opacity=".7"/><text id="${p}ra${i}" x="${f2(lx)}" y="${f2(ly + 7)}" text-anchor="middle" opacity="0">${(((a % 360) + 360) % 360).toFixed(1)}°</text>`; }).join('');
      const dx = L.cx + R + 150;   // diameter dimension, to the right of the mark
      const tb = L.W < L.H ? { anchor: 'middle', x: L.cx, y: [L.cy - R - 190, L.cy - R - 160, L.cy - R - 130] } : { anchor: 'end', x: L.cx - R - 150, y: [L.cy + R - 22, L.cy + R + 6, L.cy - R + 16] };   // title block: left of the mark, or above it on the narrow canvas
      return `${LF.css}<style>.lfh text{font:400 22px JB,monospace;fill:${t.dim};letter-spacing:.04em}</style>${LF.bg(p, t)}
<svg class="lfi lfh" id="${p}svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}"><defs>${LF.defs(p)}</defs>
<g id="${p}con">
  <line id="${p}cxh" y1="${f2(L.cy)}" y2="${f2(L.cy)}" stroke="${col}" stroke-width="1.5" opacity=".55"/><line id="${p}cxv" x1="${f2(L.cx)}" x2="${f2(L.cx)}" stroke="${col}" stroke-width="1.5" opacity=".55"/>
  ${ticks}
  <g id="${p}dim" opacity="0"><line x1="${f2(dx)}" x2="${f2(dx)}" y1="${f2(L.cy - R)}" y2="${f2(L.cy + R)}" stroke="${col}" stroke-width="1.5"/>
    ${[-1, 1].map(s => `<line x1="${f2(L.cx + R * .2)}" x2="${f2(dx + 14)}" y1="${f2(L.cy + s * R)}" y2="${f2(L.cy + s * R)}" stroke="${col}" stroke-width="1.5" opacity=".6"/><path d="M${f2(dx - 7)} ${f2(L.cy + s * (R - 14))}L${f2(dx)} ${f2(L.cy + s * R)}L${f2(dx + 7)} ${f2(L.cy + s * (R - 14))}" fill="none" stroke="${col}" stroke-width="1.5"/>`).join('')}
    <text x="${f2(dx + 18)}" y="${f2(L.cy + 7)}">Ø ${(2 * G.R).toFixed(1)}</text></g>
  <g id="${p}ttl" opacity="0" text-anchor="${tb.anchor}"><text x="${f2(tb.x)}" y="${f2(tb.y[0])}" style="fill:${t.ink};font-weight:700">${d.title}</text><text x="${f2(tb.x)}" y="${f2(tb.y[1])}">${d.scale}</text>
    <text x="${f2(tb.x)}" y="${f2(tb.y[2])}">R ${G.rr.toFixed(1)} ring · R ${G.R.toFixed(1)} disc</text></g>
</g>
<g id="${p}ol" transform="translate(${f2(L.cx - 500 * k)} ${f2(L.cy - 500 * k)}) scale(${k.toFixed(5)})">
  <circle id="${p}oc" cx="${G.c}" cy="${G.c}" r="${G.R}" transform="rotate(-90 ${G.c} ${G.c})" ${stroke}/>
  <circle id="${p}or" cx="${G.c}" cy="${G.c}" r="${G.rr}" fill="none" stroke="${col}" stroke-width="${f2(1.5 / k)}" stroke-dasharray="${f2(10 / k)} ${f2(7 / k)}" opacity="0"/>
  ${OUT.map(o => `<path id="${p}${o[0]}" d="${o[1]}" ${stroke}/>`).join('')}
  ${G.balls.map((b, i) => `<circle id="${p}ob${i}" cx="${b.x}" cy="${b.y}" r="${b.r}" ${stroke}/>`).join('')}
</g>
${LF.mark(p)}
${LF.word(p, t.word)}
</svg>
${LF.tag(p, L, d.tagline, t)}`;
    },
    frame: (u, c) => {
      const p = c.p, T = c.local, d = c.data, t = LF.theme(d), L = LF.intro(c.grid), k = L.D / 1000, R = G.R * k, S = (a, b) => seg(T, a, b), at = (id, o) => LF.at(p, id, o);
      /* 0.00-1.40  construction: centre lines grow out of the centre, circles, radial ticks + angles, dimension, then every outline strokes on */
      const cq = eo4(S(0, .5)), reach = Math.max(L.W, L.H);
      at('cxh', { x1: f2(L.cx - reach * cq), x2: f2(L.cx + reach * cq) }); at('cxv', { y1: f2(L.cy - reach * cq), y2: f2(L.cy + reach * cq) });
      at('oc', { 'stroke-dashoffset': (1 - eio(S(.1, .75))).toFixed(4) }); at('or', { opacity: f2(.7 * S(.35, .7)), transform: `rotate(${f2(-20 * T)} ${G.c} ${G.c})` });
      ANG.forEach((a, i) => { const q = eo(seg(T, .45 + .07 * i, .85 + .07 * i)); at('rt' + i, { x2: f2(L.cx + (R + 46) * q * Math.cos(rad(a))), y2: f2(L.cy + (R + 46) * q * Math.sin(rad(a))) }); at('ra' + i, { opacity: f2(seg(T, .75 + .07 * i, .95 + .07 * i)) }); });
      OUT.forEach(o => at(o[0], { 'stroke-dashoffset': (1 - eio(seg(T, o[2], o[2] + .5))).toFixed(4) }));
      G.balls.forEach((b, i) => at('ob' + i, { 'stroke-dashoffset': (1 - eio(seg(T, .72 + .08 * i, 1.12 + .08 * i))).toFixed(4) }));
      at('dim', { opacity: f2(S(.85, 1.1)) }); at('ttl', { opacity: f2(S(.95, 1.25)) });
      /* 1.50-2.60  fills come in under the drawing; outlines, then the construction lines, fade away */
      at('ol', { opacity: f2(1 - eo(S(T0 + .25, T0 + .95))) }); at('con', { opacity: f2(1 - eio(S(T0 + .55, T0 + 1.25))) });
      LF.resolve(p, L, T, t, { t0: T0, disc: false, balls: false, shock: false });
      at('dsc', { r: G.R, opacity: f2(eio(S(T0, T0 + .5))) });
      LF.orbit(p, { rot: ROT0 * (1 - eo4(S(T0 + .1, T0 + .95))), b1: eo(S(T0 + .14, T0 + .45)), b2: eo(S(T0 + .1, T0 + .41)), a1: eo(S(T0 + .2, T0 + .9)), a2: eo(S(T0 + .16, T0 + .86)) });
    }
  });
})();
