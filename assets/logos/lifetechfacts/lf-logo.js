/* LifeTech Facts logo kit for custom slides → window.LF. Load it with one <script> before the slides (see projects/lifetechfacts-intro*).
   G = the mark in 1000-unit space, WM = the wordmark outlines at cap height 100: the same numbers as the SVGs in this folder
   (geometry.json; how they were measured is in assets/SOURCES.md). Do not edit the numbers by hand.
   Markup builders take the slide's id prefix p; frame helpers are pure in their arguments, like core/anim.js.
     html:  `<svg …><defs>${LF.defs(p)}</defs> … ${LF.mark(p)} ${LF.word(p, fill)}</svg>`
     frame: LF.placeMark(p, L, s) · LF.orbit(p, {b1, b2, a1, a2, rot}) · LF.mono(p, qL, qT, qF) · LF.bevel(p, q) · LF.sheen(p, q, alpha)
            LF.placeWord(p, L, tracking) · LF.letters(p, T, t0, step, len) · LF.tagIn(p, q)
   Intro slides share LF.css, LF.theme(data) ('dark' shows the deck's own grid background, 'light' paints a flat one; --var theme=light
   overrides data.theme for one render), LF.bg(p, t), LF.tag(p, L, text, t), LF.ballAt(L, n, rot), LF.TAGLINE (the channel line),
   LF.shock(p, L, t) + LF.shockAt(p, L, qRing, qTicks) (shock ring and ticks round the disc) and LF.resolve(p, L, T, t, {t0, rot0}):
   the shared ending (disc bursts at t0, balls lap the ring, LT/F, wordmark, tagline, sheen), so a slide only writes its own opening. */
(function () {
  const G = {"c":499.91,"R":497.97,"rr":361.49,"sw":47.19,"balls":[{"x":782.29,"y":274.24,"r":75.91,"deg":-38.62878029851193},{"x":246.11,"y":755.53,"r":75.97,"deg":134.79451876040957}],"A1":[134.79451876040957,293.2],"A2":[-38.62878029851193,105.7],"arc1":"M245.22 756.44 A361.49 361.49 0 0 1 642.32 167.65","arc2":"M782.31 274.24 A361.49 361.49 0 0 1 402.09 847.91","band1":"M228.59 773.18 A385.09 385.09 0 0 1 656.23 147.98 L628.94 187.63 A337.89 337.89 0 0 0 261.84 739.69 Z","band2":"M800.75 259.51 A385.09 385.09 0 0 1 390.86 869.24 L412.74 826.36 A337.89 337.89 0 0 0 763.87 288.97 Z","mono":{"foot":"M384.36 603.23H480.32V681.44H384.36Z","wing":"M588.35 382.59H753.6C753.6,386.33 742.9,460.76 636.27,460.76H588.35Z","bar":"M588.35 519.29H646.03C646.03,538.45 619.86,568.38 589.35,568.38H588.35Z","L":"M307.11 382.59H310.95C386.09,382.59 385.36,449.43 385.36,500.99V602.66C385.36,680.71 454.95,681.44 454.95,681.44H307.11Z","T":"M382.22,382.59H664.04C588.69,382.59 589.35,462.33 589.35,465.51V592.24C589.35,635.18 578.72,681.44 511.66,681.44H511.2V460.76H444.36C444.36,454.66 439.61,382.59 382.22,382.59Z"}};
  const WM = {"cap":100,"width":645.95,"x0":8.77,"letters":[{"ch":"L","d":"M46.54 100L8.77 100L8.77 0L18.15 0L18.15 92.96L46.54 92.96","x0":8.77,"x1":46.54},{"ch":"I","d":"M67.56 100L58.17 100L58.17 0L67.56 0","x0":58.17,"x1":67.56},{"ch":"F","d":"M96.72 100L87.33 100L87.33 0L123.26 0L123.26 7.04L96.72 7.04L96.72 44.69L118.81 44.69L118.81 51.60L96.72 51.60","x0":87.33,"x1":123.26},{"ch":"E","d":"M173.28 100L136.86 100L136.86 0L173.04 0L173.04 7.28L146.37 7.28L146.37 44.81L168.10 44.81L168.10 51.73L146.37 51.73L146.37 92.96L173.28 92.96","x0":136.86,"x1":173.28},{"ch":"T","d":"M216.37 100L196.37 100L196.37 19.20L184.49 19.20L184.49 0L228.24 0L228.24 19.20L216.37 19.20","x0":184.49,"x1":228.24},{"ch":"E","d":"M276.32 100L235.01 100L235.01 0L275.01 0L275.01 19.32L255.35 19.32L255.35 38.81L274.22 38.81L274.22 57.61L255.35 57.61L255.35 80.51L276.32 80.51","x0":235.01,"x1":276.32},{"ch":"C","d":"M307.41 100.91Q296.55 100.91 289.93 94.15Q283.31 87.39 283.31 75.23L283.31 29.09Q283.31 14.55 289.08 6.82Q294.85-0.91 307.86-0.91Q314.96-0.91 320.50 1.70Q326.04 4.32 329.22 9.52Q332.41 14.72 332.41 22.61L332.41 39.89L312.52 39.89L312.52 25.11Q312.52 20.63 311.38 19.06Q310.25 17.50 307.86 17.50Q305.08 17.50 304.11 19.52Q303.14 21.53 303.14 24.89L303.14 74.94Q303.14 79.09 304.37 80.80Q305.59 82.50 307.86 82.50Q310.42 82.50 311.47 80.40Q312.52 78.30 312.52 74.94L312.52 56.93L332.63 56.93L332.63 75.85Q332.63 89.03 325.99 94.97Q319.34 100.91 307.41 100.91","x0":283.31,"x1":332.63},{"ch":"H","d":"M360.37 100L340.48 100L340.48 0L360.37 0L360.37 35.74L369.80 35.74L369.80 0L389.69 0L389.69 100L369.80 100L369.80 54.66L360.37 54.66","x0":340.48,"x1":389.69},{"ch":"F","d":"M419.86 100L399.75 100L399.75 0L439.75 0L439.75 19.49L419.86 19.49L419.86 35.40L438.73 35.40L438.73 54.66L419.86 54.66","x0":399.75,"x1":439.75},{"ch":"A","d":"M463.11 100L443.68 100L453.34 0L487.26 0L496.74 100L477.82 100L476.40 83.86L464.36 83.86L463.11 100M469.59 17.05L465.78 67.90L474.87 67.90L470.49 17.05","x0":443.68,"x1":496.74},{"ch":"C","d":"M527.38 100.91Q516.52 100.91 509.90 94.15Q503.29 87.39 503.29 75.23L503.29 29.09Q503.29 14.55 509.05 6.82Q514.82-0.91 527.83-0.91Q534.93-0.91 540.47 1.70Q546.01 4.32 549.19 9.52Q552.38 14.72 552.38 22.61L552.38 39.89L532.49 39.89L532.49 25.11Q532.49 20.63 531.35 19.06Q530.22 17.50 527.83 17.50Q525.05 17.50 524.08 19.52Q523.11 21.53 523.11 24.89L523.11 74.94Q523.11 79.09 524.34 80.80Q525.56 82.50 527.83 82.50Q530.39 82.50 531.44 80.40Q532.49 78.30 532.49 74.94L532.49 56.93L552.60 56.93L552.60 75.85Q552.60 89.03 545.96 94.97Q539.31 100.91 527.38 100.91","x0":503.29,"x1":552.6},{"ch":"T","d":"M589.03 100L569.03 100L569.03 19.20L557.16 19.20L557.16 0L600.91 0L600.91 19.20L589.03 19.20","x0":557.16,"x1":600.91},{"ch":"S","d":"M631.42 100.91Q617.73 100.91 611.68 94.09Q605.63 87.27 605.63 72.39L605.63 62.61L625.40 62.61L625.40 75.11Q625.40 78.58 626.45 80.54Q627.50 82.50 630.12 82.50Q632.84 82.50 633.90 80.91Q634.95 79.32 634.95 75.68Q634.95 71.08 634.04 67.98Q633.13 64.89 630.88 62.07Q628.64 59.26 624.66 55.51L615.69 46.99Q605.63 37.50 605.63 25.28Q605.63 12.50 611.57 5.80Q617.50-0.91 628.75-0.91Q642.50-0.91 648.27 6.42Q654.04 13.75 654.04 28.69L633.70 28.69L633.70 21.82Q633.70 19.77 632.53 18.64Q631.37 17.50 629.38 17.50Q626.99 17.50 625.88 18.84Q624.78 20.17 624.78 22.27Q624.78 24.38 625.91 26.82Q627.05 29.26 630.40 32.44L641.94 43.52Q645.40 46.82 648.30 50.48Q651.20 54.15 652.96 59.01Q654.72 63.86 654.72 70.85Q654.72 84.94 649.52 92.93Q644.32 100.91 631.42 100.91","x0":605.63,"x1":654.72}]};
  const rad = d => d * Math.PI / 180, f2 = v => (+v).toFixed(2);
  const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };   // fixed per index: no randomness at render time
  const at = (p, id, o) => { const e = document.getElementById(p + id); if (e) for (const k in o) e.setAttribute(k, o[k]); };
  // the orbit arcs are filled bands with a slanted end; they draw on through a stroked centreline mask that runs a little past that end
  const maskArc = A => { const P = d => f2(G.c + G.rr * Math.cos(rad(d))) + ' ' + f2(G.c + G.rr * Math.sin(rad(d))); return `M${P(A[0])}A${G.rr} ${G.rr} 0 0 1 ${P(A[1] + 1.6)}`; };
  const mask = (p, n, A) => `<mask id="${p}m${n}" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000"><path id="${p}m${n}p" d="${maskArc(A)}" pathLength="1" fill="none" stroke="#fff" stroke-width="${G.sw + 12}" stroke-dasharray="1 1" stroke-dashoffset="1"/></mask>`;

  const TICKS = 24;
  const THEMES = {
    dark: { name: 'dark', bg: null, ink: '#E9EEFB', line: '#7E9BE0', word: '#F2F6FF', dim: '#A9B8D8', panel: '#E9EEFB', onPanel: '#1B1838', sheen: .18 },
    light: { name: 'light', bg: '#F2F2F2', ink: '#1B1838', line: '#3B5998', word: '#3B5998', dim: '#5A6780', panel: '#1B1838', onPanel: '#FFFFFF', sheen: .22 },
  };

  window.LF = {
    G, WM, BLUE: '#3B5998', FACET: '#CDCFE3', THEMES, rad, f2, hash, at, TAGLINE: 'Tech · Dev · AI',
    theme: d => THEMES[(window.VARS && window.VARS.theme) || (d && d.theme) || 'dark'] || THEMES.dark,
    css: `<style>.lfi-bg{position:absolute;inset:0}#stage.transparent .lfi-bg{display:none}.lfi{position:absolute;left:0;top:0;overflow:visible}
.lfi-tag{position:absolute;left:0;text-align:center;font:600 22px/1 ID,Inter,sans-serif;letter-spacing:.34em;text-indent:.34em;white-space:nowrap;text-transform:uppercase;opacity:0}.lfi-tag i{font-style:normal;padding:0 .5em}</style>`,
    bg: (p, t) => t.bg ? `<div class="lfi-bg" id="${p}bg" style="background:${t.bg}"></div>` : '',
    /* tagline under the wordmark: 'A · B · C' (the dots take the accent colour); tail = extra inline markup after the text; L.tagX / L.tagW place it somewhere other than centred on the frame; tagIn wipes it open from its centre */
    tag: (p, L, text, t, tail) => `<div class="lfi-tag" id="${p}tg" style="left:${f2(L.tagX || 0)}px;top:${f2(L.tagY)}px;width:${f2(L.tagW || L.W)}px;font-size:${L.tag || 22}px;color:${t.dim}">${String(text).split('·').map(x => x.trim()).join(`<i style="color:${t.line}">·</i>`)}${tail || ''}</div>`,
    tagIn(p, q) { const e = document.getElementById(p + 'tg'); if (!e) return; const k = 1 - Math.pow(1 - Math.max(0, Math.min(1, q)), 3); e.style.opacity = f2(k); e.style.clipPath = `inset(0 ${f2(50 * (1 - k))}% 0 ${f2(50 * (1 - k))}%)`; e.style.letterSpacing = f2(.34 + .2 * (1 - k)) + 'em'; },
    /* stage position of orbit ball n (1 = lower-left, 2 = upper-right) when the orbit is rotated by rot degrees */
    ballAt(L, n, rot) { const b = G.balls[n === 1 ? 1 : 0], a = rad(rot || 0), x = b.x - G.c, y = b.y - G.c, k = L.D / 1000;
      return { x: L.cx + (x * Math.cos(a) - y * Math.sin(a)) * k, y: L.cy + (x * Math.sin(a) + y * Math.cos(a)) * k, r: b.r * k }; },
    /* x extent of wordmark letters a..b (LIFE = 0..3, TECH = 4..7, FACTS = 8..12) in wordmark units */
    wordBox: (a, b) => ({ x0: WM.letters[a].x0, x1: WM.letters[b].x1 }),
    /* lockup placement on either canvas. o: {D: mark diameter, tag: tagline height in px (0 = none), dy: vertical nudge} */
    layout(grid, o) {
      o = o || {}; const D = o.D || (grid.canvas !== 'vertical' ? 380 : 470), ww = 1.26 * D, ws = ww / WM.width, cap = WM.cap * ws, gap = .175 * D;
      const tag = o.tag || 0, tgap = tag ? .085 * D : 0, top = (grid.h - (D + gap + cap + tgap + tag)) / 2 + (o.dy || 0);
      return { W: grid.w, H: grid.h, D, cx: grid.w / 2, cy: top + D / 2, ws, ww, cap, wx: grid.w / 2 - ww / 2 - WM.x0 * ws, wy: top + D + gap, tagY: top + D + gap + cap + tgap, tag, k: D / 380 };
    },
    /* the lockup the 4s intro concepts share: a larger mark and a 26px tagline */
    intro: grid => LF.layout(grid, { tag: 26, D: grid.canvas === 'vertical' ? 500 : 420 }),
    defs: p => `<radialGradient id="${p}bv" cx="${G.c - 4}" cy="${G.c - 4}" r="${f2(G.R * .966)}" gradientUnits="userSpaceOnUse"><stop offset=".9" stop-color="#1B2A55" stop-opacity="0"/><stop offset=".975" stop-color="#1B2A55" stop-opacity=".26"/><stop offset="1" stop-color="#1B2A55" stop-opacity=".36"/></radialGradient>
  <linearGradient id="${p}sg" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  ${mask(p, 1, G.A1)}${mask(p, 2, G.A2)}
  <clipPath id="${p}cL"><rect id="${p}cLr" x="150" y="690" width="345" height="0"/></clipPath>
  <clipPath id="${p}cT"><rect id="${p}cTr" x="370" y="372" width="400" height="0"/></clipPath>
  <clipPath id="${p}cD"><circle cx="${G.c}" cy="${G.c}" r="${G.R}"/></clipPath>
  <clipPath id="${p}cW"><rect x="${f2(WM.x0 - 6)}" y="-8" width="${f2(WM.width + 12)}" height="${WM.cap + 16}"/></clipPath>`,
    mark: p => `<g id="${p}mk" opacity="0">
  <circle id="${p}dsc" cx="${G.c}" cy="${G.c}" r="${G.R}" fill="#3B5998"/><circle id="${p}bev" cx="${G.c}" cy="${G.c}" r="${f2(G.R * .966)}" fill="url(#${p}bv)" opacity="0"/>
  <g id="${p}orb" fill="#fff"><g mask="url(#${p}m1)"><path d="${G.band1}"/></g><g mask="url(#${p}m2)"><path d="${G.band2}"/></g>
    <circle id="${p}b1" cx="${G.balls[1].x}" cy="${G.balls[1].y}" r="0"/><circle id="${p}b2" cx="${G.balls[0].x}" cy="${G.balls[0].y}" r="0"/></g>
  <g id="${p}fc" fill="#CDCFE3" opacity="0"><path d="${G.mono.foot}"/><path d="${G.mono.wing}"/><path d="${G.mono.bar}"/></g>
  <g clip-path="url(#${p}cL)"><path id="${p}mL" d="${G.mono.L}" fill="#fff"/></g><g clip-path="url(#${p}cT)"><path id="${p}mT" d="${G.mono.T}" fill="#fff"/></g>
  <g clip-path="url(#${p}cD)"><rect id="${p}shn" x="-400" y="-100" width="260" height="1200" fill="url(#${p}sg)" transform="skewX(-18)" opacity="0"/></g>
</g>`,
    word: (p, fill) => `<g id="${p}wd" fill="${fill}"><g clip-path="url(#${p}cW)">${WM.letters.map((l, i) => `<path id="${p}w${i}" d="${l.d}"/>`).join('')}</g></g>`,

    /* the mark at scale s (1 = its lockup size) about the lockup centre, or about o.cx/o.cy; o.D overrides the diameter */
    placeMark(p, L, s, o) { o = o || {}; const k = s * (o.D || L.D) / 1000, cx = o.cx != null ? o.cx : L.cx, cy = o.cy != null ? o.cy : L.cy;
      at(p, 'mk', { transform: `translate(${f2(cx - 500 * k)} ${f2(cy - 500 * k)}) scale(${k.toFixed(5)})`, opacity: s > 0 ? (o.opacity != null ? o.opacity : 1) : 0 }); },
    /* b1/b2: ball scale (lower-left, upper-right), a1/a2: arc draw 0..1 (each arc grows out of its ball, clockwise), rot: degrees about the centre.
       A positive rot easing to 0 turns the orbit anticlockwise, so each ball leads and its arc trails behind it like a comet tail. */
    orbit(p, o) { at(p, 'orb', { transform: `rotate(${f2(o.rot || 0)} ${G.c} ${G.c})` });
      at(p, 'b1', { r: f2(G.balls[1].r * o.b1) }); at(p, 'b2', { r: f2(G.balls[0].r * o.b2) });
      at(p, 'm1p', { 'stroke-dashoffset': (1 - o.a1).toFixed(4) }); at(p, 'm2p', { 'stroke-dashoffset': (1 - o.a2).toFixed(4) }); },
    /* L wipes up from its foot, T wipes down from its bar, the lavender facets fade in from the left */
    mono(p, qL, qT, qF) { at(p, 'cLr', { y: f2(690 - 320 * qL), height: f2(320 * qL) }); at(p, 'mL', { transform: `translate(0 ${f2(36 * (1 - qL))})` });
      at(p, 'cTr', { height: f2(320 * qT) }); at(p, 'mT', { transform: `translate(0 ${f2(-36 * (1 - qT))})` });
      at(p, 'fc', { opacity: f2(qF), transform: `translate(${f2(-16 * (1 - qF))} 0)` }); },
    bevel(p, q) { at(p, 'bev', { opacity: f2(q) }); },
    sheen(p, q, alpha) { const e = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2; at(p, 'shn', { x: f2(-500 + 2000 * e), opacity: f2(q > 0 && q < 1 ? (alpha == null ? .2 : alpha) : 0) }); },
    /* wordmark at its lockup spot; tr > 1 spreads it horizontally about its centre (a tracking settle) */
    placeWord(p, L, tr, o) { tr = tr || 1; o = o || {}; const mid = WM.x0 + WM.width / 2;
      at(p, 'wd', { transform: `translate(${f2(L.wx - (tr - 1) * mid * L.ws)} ${f2(L.wy)}) scale(${(L.ws * tr).toFixed(5)} ${L.ws.toFixed(5)})`, opacity: o.opacity != null ? f2(o.opacity) : 1 }); },
    /* letters rise out of the wordmark's mask: letter i starts at t0 + i*step seconds and takes len seconds */
    letters(p, T, t0, step, len) { WM.letters.forEach((_, i) => { const a = t0 + i * (step == null ? .034 : step), q0 = Math.max(0, Math.min(1, (T - a) / (len || .48))), q = q0 >= 1 ? 1 : 1 - Math.pow(2, -10 * q0);
      at(p, 'w' + i, { transform: `translate(0 ${f2((1 - q) * 120)})` }); }); },

    /* shock ring + ticks round the mark (markup goes inside the slide's <svg>, under LF.mark). shockAt: qRing/qTicks 0..1; o.from/o.to: ring radius in px */
    shock: (p, L, t) => `<g transform="translate(${f2(L.cx)} ${f2(L.cy)})"><circle id="${p}sh" fill="none" stroke="${t.line}" stroke-width="2" opacity="0"/><g id="${p}bst" stroke="${t.ink}" stroke-width="2.5" stroke-linecap="round">${Array.from({ length: TICKS }, (_, i) => `<line id="${p}bu${i}" y1="0" y2="0" transform="rotate(${f2(i * 360 / TICKS + 5)})"/>`).join('')}</g></g>`,
    shockAt(p, L, qr, qt, o) { o = o || {}; const from = o.from == null ? 30 : o.from, to = o.to == null ? L.D / 2 + 46 : o.to, e = q => 1 - Math.pow(1 - q, 3);
      at(p, 'sh', { r: f2(from + (to - from) * e(qr)), opacity: f2(qr > 0 ? (1 - qr) * .9 : 0) });
      for (let i = 0; i < TICKS; i++) { const r0 = L.D / 2 + 12 + 34 * e(qt); at(p, 'bu' + i, { x1: f2(r0), x2: f2(r0 + 2 + 16 * (1 - qt) * (i % 2 ? .6 : 1)), opacity: f2(qt > 0 && qt < 1 ? 1 - qt : 0) }); } },
    /* the shared ending, in seconds from o.t0 (the moment the disc bursts): disc 0-.5, lap .05-.9 from o.rot0 degrees, LT/F .4-1.05, letters from .4,
       tagline .85-1.3, sheen 1.0-1.6. o.disc/o.balls/o.shock/o.mono = false leave that part to the slide (it then calls LF.orbit / LF.shockAt itself).
       Returns {rot, lap} so the slide can follow a ball with LF.ballAt(L, n, rot). Uses the core/anim.js easings. */
    resolve(p, L, T, t, o) { o = o || {}; const t0 = o.t0 || 0, S = (a, b) => seg(T, t0 + a, t0 + b), lap = eo4(S(.05, .9)), rot = (o.rot0 == null ? 200 : o.rot0) * (1 - lap);
      LF.placeMark(p, L, 1);
      if (o.disc !== false) at(p, 'dsc', { r: f2(G.R * spring(S(0, .5))) });
      if (o.balls !== false) LF.orbit(p, { rot, b1: bk(S(.08, .35)), b2: bk(S(.04, .31)), a1: eo(S(.15, .85)), a2: eo(S(.1, .8)) });
      if (o.shock !== false) LF.shockAt(p, L, S(.02, .6), S(.1, .6));
      if (o.mono !== false) LF.mono(p, expo(S(.4, .85)), expo(S(.48, .93)), eo(S(.68, 1.05)));
      LF.bevel(p, S(.6, 1.1));
      LF.placeWord(p, L, 1 + .06 * (1 - eo4(S(.4, 1.15)))); LF.letters(p, T, t0 + .4, .026, .42);
      LF.tagIn(p, S(.85, 1.3)); LF.sheen(p, S(1.0, 1.6), t.sheen);
      return { rot, lap }; },
  };
})();
