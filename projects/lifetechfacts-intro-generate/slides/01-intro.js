/* Intro concept J, "Generate" (4.0s): a prompt pill sits mid-frame, a pointer clicks it, the pill collapses to a dot and bursts into a swarm of
   tokens and particles that swirls anticlockwise, then condenses onto the mark's ring and into its disc. The mark arrives in three hard
   "denoise" steps (blurred, less blurred, sharp) with the shock ring, then the shared ending (LF.resolve). The fastest of the ten.
   Every value is a pure function of ctx.local (seconds); particle paths come from LF.hash (fixed per index).
   Logo drawing: window.LF (assets/logos/lifetechfacts/lf-logo.js). */
(function () {
  const { G, f2, hash } = LF;
  const ROT0 = 220, T0 = 1.7, N = 64, Z = 1.25, CLICK = .55, BURST = .85, BLUR = [[0, 18], [.12, 7], [.24, 0]];   // disc bursts at T0; Z: pill size; denoise steps: [seconds after T0, blur px]
  const POINTER = 'M0 0L0 27L7.2 20.6L12.4 32L17 30L11.8 18.8L21 18.8Z', SPARK = 'M0 -13C1.6 -4.4 4.4 -1.6 13 0C4.4 1.6 1.6 4.4 0 13C-1.6 4.4 -4.4 1.6 -13 0C-4.4 -1.6 -1.6 -4.4 0 -13Z';

  defineSlide({
    slug: '01-intro', dur: 4, audio: 'lf-intro-sting.wav',
    data: { theme: (window.PROJECT.intro || {}).theme, tagline: (window.PROJECT.intro || {}).tagline || LF.TAGLINE, prompt: 'Generate intro', key: '↵' },
    html: (d, c) => {
      const p = c.p, t = LF.theme(d), L = LF.intro(c.grid), light = t.name === 'light', k = L.k;
      const parts = Array.from({ length: N }, (_, i) => { const col = i % 4 === 0 ? (light ? LF.BLUE : '#fff') : i % 2 ? t.line : t.ink, r = (4 + 5 * hash(i + 50)) * k;
        return i % 3 === 0 ? `<rect id="${p}pt${i}" x="${f2(-(12 + 10 * hash(i + 60)) * k)}" y="${f2(-5 * k)}" width="${f2((24 + 20 * hash(i + 60)) * k)}" height="${f2(10 * k)}" rx="${f2(5 * k)}" fill="${col}" opacity="0"/>` : `<circle id="${p}pt${i}" r="${f2(r)}" fill="${col}" opacity="0"/>`; }).join('');
      return `${LF.css}<style>.lfj text{font:600 ${f2(36 * k)}px ID,Inter,sans-serif;fill:${t.ink}}</style>${LF.bg(p, t)}
<svg class="lfi lfj" id="${p}svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}"><defs>${LF.defs(p)}</defs>
<circle id="${p}rp" cx="${f2(L.cx)}" cy="${f2(L.cy)}" r="0" fill="none" stroke="${t.line}" stroke-width="3" opacity="0"/>
<g id="${p}pill"><rect id="${p}pb" y="${f2(-50 * k)}" height="${f2(100 * k)}" fill="${light ? '#FFFFFF' : '#0E1526'}" stroke="${t.line}" stroke-width="${f2(3 * k)}"/>
  <g id="${p}pin"><path d="${SPARK}" transform="translate(${f2(-236 * k)} 0) scale(${f2(1.5 * k)})" fill="${t.line}"/><text x="${f2(-196 * k)}" y="${f2(13 * k)}">${d.prompt}</text>
    <rect id="${p}kb" x="${f2(186 * k)}" y="${f2(-30 * k)}" width="${f2(76 * k)}" height="${f2(60 * k)}" rx="${f2(30 * k)}" fill="${LF.BLUE}"/><text x="${f2(224 * k)}" y="${f2(12 * k)}" text-anchor="middle" style="fill:#fff">${d.key}</text></g></g>
<g id="${p}pts">${parts}</g>
${LF.shock(p, L, t)}
${LF.mark(p)}
<path id="${p}ptr" d="${POINTER}" fill="${t.ink}" stroke="${light ? '#fff' : '#0A0E18'}" stroke-width="2" stroke-linejoin="round" opacity="0"/>
${LF.word(p, t.word)}
</svg>
${LF.tag(p, L, d.tagline, t)}`;
    },
    frame: (u, c) => {
      const p = c.p, T = c.local, d = c.data, t = LF.theme(d), L = LF.intro(c.grid), k = L.k, S = (a, b) => seg(T, a, b), at = (id, o) => LF.at(p, id, o);
      /* 0.00-0.85  pill pops in, the pointer arrives and clicks its button (0.55), the pill closes to a dot */
      const inq = bk(S(0, .32)), press = 1 - .05 * Math.sin(Math.PI * S(CLICK, CLICK + .16)), shut = eio(S(CLICK + .1, BURST - .04)), w = lerp(560 * k, 100 * k, shut), dot = 1 - .72 * eio(S(BURST - .14, BURST));
      at('pill', { transform: `translate(${f2(L.cx)} ${f2(L.cy)}) scale(${(Z * inq * press * dot).toFixed(4)})`, opacity: T >= BURST ? 0 : f2(cl(S(0, .32) * 3, 0, 1)) });
      at('pb', { x: f2(-w / 2), width: f2(w), rx: f2(50 * k) }); at('pin', { opacity: f2(1 - S(CLICK + .08, CLICK + .2)) });
      const pq = eo4(S(.12, CLICK - .03)), bx = L.cx + 224 * k * Z, by = L.cy + 6 * k * Z;
      at('ptr', { transform: `translate(${f2(lerp(bx + 300 * k, bx, pq))} ${f2(lerp(by + 210 * k, by, pq))}) scale(${f2(1.5 * k * (1 - .12 * Math.sin(Math.PI * S(CLICK - .03, CLICK + .13))))})`, opacity: f2(S(.1, .22) * (1 - S(CLICK + .14, CLICK + .3))) });
      const rq = S(CLICK, CLICK + .34); at('rp', { cx: f2(bx), cy: f2(L.cy), r: f2(lerp(30, 150, eo(rq)) * k), opacity: f2(rq > 0 ? .8 * (1 - rq) : 0) });
      /* 0.85-1.80  the swarm: flung out, swirling anticlockwise, then pulled onto the ring (three in five) or into the disc */
      const ringR = G.rr * L.D / 1000, turn = 2 * Math.PI * (.25 * eo(S(BURST, 1.3)) + .55 * eio(S(1.1, T0 + .05)));
      for (let i = 0; i < N; i++) { const far = (150 + 330 * hash(i + 1)) * k, out = eo4(seg(T, BURST, 1.3 + .1 * hash(i + 4))), pull = eio(seg(T, 1.22 + .16 * hash(i + 2), T0 + .04 * hash(i + 2)));
        const home = i % 5 < 3 ? ringR : ringR * .85 * hash(i + 5), r = lerp(far * out, home, pull), a = hash(i) * 2 * Math.PI - turn * (.6 + .8 * hash(i + 3)), sz = lerp(1, .55, pull);
        at('pt' + i, { transform: `translate(${f2(L.cx + r * Math.cos(a))} ${f2(L.cy + r * Math.sin(a))}) rotate(${f2(a * 180 / Math.PI - 90)}) scale(${f2(sz)})`, opacity: f2(T < BURST ? 0 : 1 - seg(T, T0 - .02, T0 + .14)) }); }
      /* 1.70  the mark arrives in three hard denoise steps, then the shared ending */
      LF.resolve(p, L, T, t, { t0: T0, rot0: ROT0 });
      const step = BLUR.filter(b => T >= T0 + b[0]).pop(); st(p + 'mk', { filter: step && step[1] ? `blur(${step[1]}px)` : 'none' });
    }
  });
})();
