/* Intro concept C, "Three beats" (4.0s): LIFE / TECH / FACTS hit full-frame on three beats 0.42s apart (theme background, a panel wipe,
   then the brand-blue disc opening like an iris). On the fourth beat the iris contracts into the mark's disc at its lockup spot while
   the one-line wordmark rises; the balls lap the ring with their arcs trailing, LT/F wipes in, the tagline opens.
   The giant words are the wordmark's own outlines. Every value is a pure function of ctx.local (seconds).
   Logo drawing: window.LF (assets/logos/lifetechfacts/lf-logo.js). */
(function () {
  const { G, WM, f2 } = LF;
  const BEAT = .42, ROT0 = 150, WORDS = [[0, 3], [4, 7], [8, 12]];   // letter ranges of LIFE, TECH, FACTS in the wordmark
  const opt = g => ({ tag: 26, D: g.canvas === 'vertical' ? 500 : 420 });

  defineSlide({
    slug: '01-intro', dur: 4, audio: 'lf-intro-sting.wav',
    data: { theme: (window.PROJECT.intro || {}).theme, tagline: (window.PROJECT.intro || {}).tagline || LF.TAGLINE },
    html: (d, c) => {
      const p = c.p, t = LF.theme(d), L = LF.layout(c.grid, opt(c.grid));
      const giant = (n, fill) => `<g id="${p}W${n}" fill="${fill}" opacity="0">${WM.letters.slice(WORDS[n - 1][0], WORDS[n - 1][1] + 1).map(l => `<path d="${l.d}"/>`).join('')}</g>`;
      return `${LF.css}<style>.lfc-bars{position:absolute;left:0;text-align:center}.lfc-bars i{display:inline-block;width:84px;height:5px;margin:0 7px;position:relative;overflow:hidden}
.lfc-bars i:before{content:'';position:absolute;inset:0;background:currentColor;opacity:.25}.lfc-bars i b{position:absolute;inset:0;background:currentColor;transform-origin:0 50%;transform:scaleX(0)}</style>
${LF.bg(p, t)}
<svg class="lfi" id="${p}svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}"><defs>${LF.defs(p)}</defs>
${giant(1, t.word)}
<rect id="${p}pn" x="0" y="0" width="0" height="${L.H}" fill="${t.panel}"/>
${giant(2, t.onPanel)}
${LF.mark(p)}
${giant(3, '#fff')}
${LF.shock(p, L, t)}
${LF.word(p, t.word)}
</svg>
<div class="lfc-bars" id="${p}bars" style="top:${f2(L.H * .84)}px;width:${L.W}px"><i><b id="${p}pb1"></b></i><i><b id="${p}pb2"></b></i><i><b id="${p}pb3"></b></i></div>
${LF.tag(p, L, d.tagline, t)}`;
    },
    frame: (u, c) => {
      const p = c.p, T = c.local, d = c.data, t = LF.theme(d), L = LF.layout(c.grid, opt(c.grid)), S = (a, b) => seg(T, a, b), at = (id, o) => LF.at(p, id, o);
      const mx = L.W / 2, my = L.H / 2, lock = 3 * BEAT;   // 1.26s: the fourth beat

      /* 0.00-1.26  three words, one per beat: each lands big, keeps pushing in a little, and is covered by the next */
      WORDS.forEach(([a, b], k) => { const n = k + 1, t0 = k * BEAT, bx = LF.wordBox(a, b), wide = LF.wordBox(8, 12), sG = .6 * L.W / (wide.x1 - wide.x0) * (L.W < L.H ? 1.25 : 1);   // one cap height for all three: FACTS, the widest, spans 60% of the frame
        const q = expo(seg(T, t0, t0 + .22)), push = 1 + .05 * seg(T, t0, t0 + BEAT + .2), out = n === 3 ? eio(S(lock, lock + .3)) : 0;
        const z = sG * lerp(1.22, 1, q) * push * (1 - .55 * out), on = T >= t0 && T < (n === 3 ? lock + .3 : t0 + BEAT + .2);
        at('W' + n, { transform: `translate(${f2(mx + (1 - q) * (k % 2 ? -70 : 70))} ${f2(my)}) scale(${z.toFixed(5)}) translate(${f2(-(bx.x0 + bx.x1) / 2)} ${-WM.cap / 2})`, opacity: f2(on ? cl(q * 3, 0, 1) * (1 - out) : 0) }); });
      at('pn', { width: f2(L.W * expo(S(BEAT, BEAT + .2))), opacity: T < 2 * BEAT + .25 ? 1 : 0 });
      [1, 2, 3].forEach(n => st(p + 'pb' + n, { transform: `scaleX(${f2(seg(T, (n - 1) * BEAT, n * BEAT))})` }));
      st(p + 'bars', { opacity: f2(1 - S(lock - .05, lock + .15)), color: T < BEAT + .1 ? t.word : T < 2 * BEAT + .12 ? t.onPanel : '#fff' });   // the beat counter takes the colour of the word above it

      /* 0.84-1.74  beat three is the mark's own disc opening as an iris from the centre; on beat four it contracts to the lockup */
      const cover = Math.hypot(L.W, L.H) * 1.06 / L.D, iris = expo(S(2 * BEAT, 2 * BEAT + .22)), land = eio(S(lock, lock + .48));
      const s = T < lock ? cover * iris : lerp(cover, 1, land) * (1 + .05 * Math.sin(Math.PI * S(lock + .48, lock + .78)));
      LF.placeMark(p, L, s, { cx: lerp(mx, L.cx, land), cy: lerp(my, L.cy, land) });
      LF.shockAt(p, L, S(lock + .42, lock + 1.0), S(lock + .44, lock + .95), { from: L.D / 2, to: L.D / 2 + 60 });

      /* 1.60-3.00  wordmark rises as the disc lands; balls lap the ring, LT/F wipes in, tagline, sheen */
      LF.placeWord(p, L, 1 + .06 * (1 - eo4(S(1.55, 2.3)))); LF.letters(p, T, 1.55, .026, .42);
      LF.orbit(p, { rot: ROT0 * (1 - eo4(S(1.78, 2.5))), b1: bk(S(1.76, 2.02)), b2: bk(S(1.82, 2.08)), a1: eo(S(1.88, 2.48)), a2: eo(S(1.84, 2.44)) });
      LF.mono(p, expo(S(2.02, 2.46)), expo(S(2.1, 2.54)), eo(S(2.3, 2.68)));
      LF.bevel(p, S(2.2, 2.7)); LF.tagIn(p, S(2.45, 2.9)); LF.sheen(p, S(2.7, 3.3), t.sheen);
    }
  });
})();
