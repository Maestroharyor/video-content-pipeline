/* LifeTech Facts logo intro: HUD rings → tilted bar square → circle → the mark fills, its orbit draws on, the wordmark rises.
   One SVG, every attribute a pure function of ctx.local (seconds), so the choreography below reads in seconds.
   Theme: PROJECT.intro.theme 'light' (the original look) | 'dark' (matches the slide decks). Works on both canvases.
   The mark, wordmark and their draw-on helpers come from the shared logo kit (window.LF, assets/logos/lifetechfacts/lf-logo.js). */
(function () {
  const { G, WM, f2, rad, hash } = LF;   // assets/logos/lifetechfacts/lf-logo.js
  const THEMES = {
    light: { bg: '#F2F2F2', ink: '#1B1838', line: '#3B5998', word: '#3B5998', sheen: .22 },
    dark: { bg: '#0A0E18', ink: '#E9EEFB', line: '#7E9BE0', word: '#F2F6FF', sheen: .18 },
  };
  const TICKS = 24, BARS = 9, BURST = 28, PARTS = 18, SQ = 150;
  const geo = g => LF.layout(g);

  defineSlide({
    slug: '01-intro', dur: 5.6, audio: 'lf-intro-sting.wav',
    data: { theme: (window.VARS && window.VARS.theme) || (window.PROJECT.intro && window.PROJECT.intro.theme) || 'light' },   // --var theme=dark for one render
    html: (d, c) => {
      const p = c.p, t = THEMES[d.theme] || THEMES.light, L = geo(c.grid);
      const ticks = Array.from({ length: TICKS }, (_, i) => `<line id="${p}tk${i}" x1="112" x2="${i % 2 ? 126 : 134}" y1="0" y2="0" transform="rotate(${i * 360 / TICKS})"/>`).join('');
      const bars = Array.from({ length: BARS }, (_, i) => `<rect id="${p}br${i}" y="${-SQ / 2}" height="0"/>`).join('');
      const burst = Array.from({ length: BURST }, (_, i) => `<line id="${p}bu${i}" y1="0" y2="0" transform="rotate(${f2(i * 360 / BURST + 4)})"/>`).join('');
      const parts = Array.from({ length: PARTS }, (_, i) => { const k = i % 3, s = 5 + hash(i) * 9, col = i % 2 ? t.ink : t.line;
        return k === 0 ? `<rect id="${p}pt${i}" x="${-s / 2}" y="${-s / 2}" width="${f2(s)}" height="${f2(s)}" fill="${col}"/>` : k === 1 ? `<circle id="${p}pt${i}" r="${f2(s / 2)}" fill="${col}"/>` : `<circle id="${p}pt${i}" r="${f2(s / 1.6)}" fill="none" stroke="${col}" stroke-width="1.6"/>`; }).join('');
      return `<style>.lfi-bg{position:absolute;inset:0}#stage.transparent .lfi-bg{display:none}.lfi{position:absolute;left:0;top:0;overflow:visible}.lfi *{vector-effect:none}</style>
<div class="lfi-bg" id="${p}bg" style="background:${t.bg}"></div>
<svg class="lfi" id="${p}svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}">
<defs>
  ${LF.defs(p)}
</defs>
<g transform="translate(${L.cx} ${L.cy}) scale(${f2(L.k)})">
  <g id="${p}hud" fill="none" stroke="${t.line}" stroke-linecap="round">
    <circle id="${p}a1" r="190" stroke-width="3" pathLength="1" stroke-dasharray="0 1"/><circle id="${p}a2" r="190" stroke-width="3" pathLength="1" stroke-dasharray="0 1"/>
    <circle id="${p}a3" r="203" stroke-width="1.5" pathLength="1" stroke-dasharray="0 1"/><circle id="${p}a4" r="203" stroke-width="1.5" pathLength="1" stroke-dasharray="0 1"/>
    <circle id="${p}dot" r="58" stroke-width="3" stroke-dasharray="1 9"/>
    <g id="${p}tks" stroke="${t.ink}" stroke-width="3.5">${ticks}</g>
    <g id="${p}crs" stroke-width="1.5" transform="rotate(-78)"><line id="${p}cr0"/><line id="${p}cr1" transform="rotate(90)"/><line id="${p}cr2" transform="rotate(180)"/><line id="${p}cr3" transform="rotate(270)"/></g>
    <rect id="${p}sqo" x="-30" y="-30" width="60" height="60" stroke="${t.ink}" stroke-width="4" stroke-linecap="butt"/>
  </g>
  <g id="${p}sq" fill="${t.ink}">${bars}<rect id="${p}sqr" x="${-SQ / 2}" y="${-SQ / 2}" width="${SQ}" height="${SQ}"/></g>
  <g id="${p}rg" fill="none" stroke="${t.ink}">
    <circle id="${p}ro"/><circle id="${p}rc" r="56" stroke-width="18" pathLength="1" stroke-dasharray="0 1"/>
    <line id="${p}hl1" stroke-width="2"/><line id="${p}hl2" stroke-width="2"/><circle id="${p}sh" stroke="${t.line}" stroke-width="2"/>
  </g>
  <g id="${p}bst" stroke="${t.ink}" stroke-width="2.5" stroke-linecap="round">${burst}</g>
  <g id="${p}pts">${parts}</g>
</g>
${LF.mark(p)}
${LF.word(p, t.word)}
</svg>`;
    },
    frame: (u, c) => {
      const p = c.p, T = c.local, L = geo(c.grid), t = THEMES[c.data.theme] || THEMES.light, S = (a, b) => seg(T, a, b);
      const at = (id, o) => { const e = document.getElementById(p + id); if (e) for (const k in o) e.setAttribute(k, o[k]); };

      /* 0.0-1.6  HUD: two arc pairs sweep round, dotted core, tick ring, crosshair, small square */
      const aLen = .34 * eo(S(0, .9)) * (1 - eo(S(1.15, 1.55))), aRot = -90 + 260 * eo4(S(0, 1.5));
      const aOn = aLen > .004 ? 1 : 0;   // a zero-length dash still paints its round caps
      at('a1', { 'stroke-dasharray': aLen.toFixed(4) + ' 1', transform: `rotate(${f2(aRot)})`, opacity: aOn }); at('a2', { 'stroke-dasharray': aLen.toFixed(4) + ' 1', transform: `rotate(${f2(aRot + 180)})`, opacity: aOn });
      const bLen = .2 * eo(S(.1, 1)) * (1 - eo(S(1.1, 1.5))), bRot = 40 - 220 * eo4(S(.1, 1.5));
      const bOn = bLen > .004 ? 1 : 0;
      at('a3', { 'stroke-dasharray': bLen.toFixed(4) + ' 1', transform: `rotate(${f2(bRot)})`, opacity: bOn }); at('a4', { 'stroke-dasharray': bLen.toFixed(4) + ' 1', transform: `rotate(${f2(bRot + 180)})`, opacity: bOn });
      at('dot', { opacity: f2(eo(S(.25, .6)) * (1 - S(.95, 1.25))), transform: `scale(${f2(lerp(.5, 1, eo(S(.25, .8))))}) rotate(${f2(60 * S(.25, 1.25))})` });
      const tkOut = eo(S(1.2, 1.55));
      at('tks', { transform: `rotate(${f2(46 * (1 - eo(S(.3, 1.25))))}) scale(${f2(lerp(.55, 1, expo(S(.3, .95))) * (1 - .3 * tkOut))})`, opacity: f2(1 - tkOut) });
      for (let i = 0; i < TICKS; i++) at('tk' + i, { opacity: f2(seg(T, .3 + i * .014, .42 + i * .014)) });
      const cq = S(.45, 1.25), cr = 150 + 70 * eo(cq), cl2 = 130 * Math.sin(Math.PI * cq);
      for (let i = 0; i < 4; i++) at('cr' + i, { x1: f2(cr), x2: f2(cr + cl2), y1: 0, y2: 0, opacity: f2(Math.sin(Math.PI * cq)) });
      const sqq = S(.7, 1.15);
      at('sqo', { opacity: f2(cl(sqq * 3, 0, 1) * (1 - S(1.3, 1.5))), transform: `rotate(${f2(lerp(70, -10, eo4(sqq)))}) scale(${f2(bk(sqq) * lerp(1, 2.5, eio(S(1.2, 1.5))))})` });

      /* 1.2-2.3  the square: staggered bars rise inside a tilted frame, thicken into a solid block, the tilt springs flat, corners round off */
      const solid = T >= 1.78, thick = eio(S(1.4, 1.78)), bw = lerp(2.5, SQ / BARS + .7, thick), tilt = -10 * (1 - spring(S(1.72, 2.2)));
      const round = eio(S(1.95, 2.3)), toRing = T >= 2.3;
      at('sq', { transform: `rotate(${f2(tilt)}) scale(${f2(1 + .07 * Math.sin(Math.PI * S(1.95, 2.3)))})`, opacity: toRing || T < 1.2 ? 0 : 1 });
      for (let i = 0; i < BARS; i++) { const h = SQ * expo(seg(T, 1.2 + i * .028, 1.52 + i * .028)), x = -SQ / 2 + (i + .5) * SQ / BARS;
        at('br' + i, { x: f2(x - bw / 2), width: f2(bw), height: f2(h), y: f2(i % 2 ? SQ / 2 - h : -SQ / 2), opacity: solid ? 0 : 1 }); }
      at('sqr', { opacity: solid ? 1 : 0, rx: f2(round * SQ / 2) });

      /* 2.3-3.1  the disc hollows into a ring, a C arc spins inside it, a horizon line flicks out, a shock ring leads the fill */
      const R0 = lerp(SQ / 2, 92, eo(S(2.3, 2.7))), w = lerp(R0, 4, eio(S(2.3, 2.62))), rgOut = 1 - S(2.88, 3.05);
      at('ro', { r: f2(R0 - w / 2), 'stroke-width': f2(w), opacity: toRing ? f2(rgOut) : 0 });
      at('rc', { 'stroke-dasharray': f2(.72 * eo(S(2.42, 2.78))) + ' 1', transform: `rotate(${f2(-90 + 560 * eio(S(2.4, 3.05)))})`, opacity: f2(S(2.42, 2.5) * rgOut) });
      const hq = S(2.45, 2.95), hx = 112 + 34 * eo(hq), hl = 84 * Math.sin(Math.PI * hq);
      at('hl1', { x1: f2(hx), x2: f2(hx + hl), y1: 0, y2: 0, opacity: f2(Math.sin(Math.PI * hq)) }); at('hl2', { x1: f2(-hx), x2: f2(-hx - hl), y1: 0, y2: 0, opacity: f2(Math.sin(Math.PI * hq)) });
      const shq = S(2.85, 3.4); at('sh', { r: f2(lerp(92, 190 + 34, eo(shq))), opacity: f2(shq > 0 ? (1 - shq) * .9 : 0) });
      const buq = S(3.0, 3.55); for (let i = 0; i < BURST; i++) { const r0 = 190 + 12 + 34 * eo(buq); at('bu' + i, { x1: f2(r0), x2: f2(r0 + 2 + 16 * (1 - buq) * (i % 2 ? .6 : 1)), opacity: f2(buq > 0 && buq < 1 ? 1 - buq : 0) }); }

      /* 2.7-4.0  the mark: disc springs out of the centre dot, balls pop, the orbit draws on while it rotates home, LT/F wipes in */
      LF.placeMark(p, L, spring(S(2.7, 3.35)) * idle(Math.max(0, T - 4.4), .01, 3.2));
      LF.bevel(p, S(3.4, 3.9));
      LF.orbit(p, { rot: -150 * (1 - eo4(S(3.0, 3.85))), b1: bk(S(3.0, 3.32)), b2: bk(S(3.08, 3.4)), a1: eo(S(3.1, 3.72)), a2: eo(S(3.16, 3.78)) });
      LF.mono(p, expo(S(3.25, 3.72)), expo(S(3.33, 3.8)), eo(S(3.55, 3.95)));
      LF.sheen(p, S(3.8, 4.5), t.sheen);

      /* 3.7-4.6  wordmark rises letter by letter out of a mask while its tracking settles; particles drift off the disc's flanks */
      LF.placeWord(p, L, 1 + .06 * (1 - eo4(S(3.7, 4.55)))); LF.letters(p, T, 3.7);
      for (let i = 0; i < PARTS; i++) { const side = i % 2 ? 0 : 180, a = rad(side + (hash(i + 40) - .5) * 86), d0 = seg(T, 3.72 + hash(i + 9) * .25, 4.45 + hash(i + 9) * .3), r = 190 + 16 + (60 + hash(i + 77) * 170) * eo(d0);
        at('pt' + i, { transform: `translate(${f2(r * Math.cos(a))} ${f2(r * Math.sin(a))}) rotate(${f2(180 * d0 * (i % 2 ? 1 : -1))})`, opacity: f2(d0 > 0 && d0 < 1 ? Math.pow(Math.sin(Math.PI * d0), .7) : 0) }); }
    }
  });
})();
