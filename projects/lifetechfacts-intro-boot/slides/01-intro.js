/* Intro concept A, "Boot" (4.0s): a terminal types the channel's start command, three checks pass, the line is wiped into its caret,
   the caret becomes the mark's orbit ball and races round the ring with its arc trailing behind; the disc bursts out, LT/F wipes in,
   the wordmark rises and the caret comes back to blink after the tagline. Every value is a pure function of ctx.local (seconds).
   Logo drawing: window.LF (assets/logos/lifetechfacts/lf-logo.js). Sound cues: assets/build-sting.sh follows the times below. */
(function () {
  const { G, f2 } = LF;
  const ROT0 = 205, FS = g => g.canvas === 'vertical' ? 37 : 46;   // degrees the orbit starts turned by; terminal font size (the command line must fit the narrow canvas)

  defineSlide({
    slug: '01-intro', dur: 4, audio: 'lf-intro-sting.wav',
    data: { theme: (window.PROJECT.intro || {}).theme, tagline: (window.PROJECT.intro || {}).tagline || LF.TAGLINE,
      prompt: '~/lifetechfacts $ ', command: './start --tech --dev --ai', checks: ['tech', 'dev', 'ai'] },
    html: (d, c) => {
      const p = c.p, t = LF.theme(d), L = LF.layout(c.grid, { tag: 26, D: c.grid.canvas === 'vertical' ? 500 : 420 }), fs = FS(c.grid);
      const checks = d.checks.map((x, i) => `<span id="${p}ck${i + 1}"><b>✓</b> ${x}</span>`).join('');
      return `${LF.css}<style>
.lfb-term{position:absolute;left:0;text-align:center;font:700 ${fs}px/1 JB,monospace;white-space:pre}
.lfb-line{display:inline-block;position:relative}.lfb-line .pr{opacity:.55}.lfb-an{position:relative;display:inline-block;width:0;height:1em;vertical-align:baseline}
.lfb-ck{position:absolute;left:0;text-align:center;font:400 30px/1 JB,monospace;letter-spacing:.02em}.lfb-ck span{display:inline-block;margin:0 28px;opacity:0}.lfb-ck b{color:#34D399;font-weight:700}
.lfb-dot{position:absolute;left:0;top:0;opacity:0}
.lfb-ct{display:inline-block;width:0;position:relative}.lfb-ct b{position:absolute;left:0;bottom:0;width:.5em;height:.73em;opacity:0}</style>
${LF.bg(p, t)}
<div class="lfb-term" id="${p}term" style="top:${f2(L.cy - 52)}px;width:${L.W}px;color:${t.ink}"><span class="lfb-line" id="${p}ln"><span class="pr">${d.prompt}</span><span id="${p}ty"></span><span class="lfb-an" id="${p}an"></span><span id="${p}rs" style="visibility:hidden">${d.command}</span></span></div>
<div class="lfb-ck" id="${p}cks" style="top:${f2(L.cy + 36)}px;width:${L.W}px;color:${t.dim}">${checks}</div>
<svg class="lfi" id="${p}svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}"><defs>${LF.defs(p)}</defs>
${LF.shock(p, L, t)}
${LF.mark(p)}
${LF.word(p, t.word)}
</svg>
<div class="lfb-dot" id="${p}dot" style="background:${t.ink}"></div>
${LF.tag(p, L, d.tagline, t, `<span class="lfb-ct"><b id="${p}ct2" style="background:${t.line}"></b></span>`)}`;
    },
    /* the caret's resting place at the end of the full command line, measured once (layout only; the frames stay a function of time) */
    setup: (root, d, c) => { const ln = document.getElementById(c.p + 'ln'), st = document.getElementById('stage').getBoundingClientRect(), r = ln.getBoundingClientRect(), k = st.width / c.grid.w;
      c.data._line = { x0: (r.left - st.left) / k, x1: (r.right - st.left) / k, y: (r.top - st.top) / k, h: r.height / k }; },
    frame: (u, c) => {
      const p = c.p, T = c.local, d = c.data, t = LF.theme(d), L = LF.layout(c.grid, { tag: 26, D: c.grid.canvas === 'vertical' ? 500 : 420 }), S = (a, b) => seg(T, a, b), at = (id, o) => LF.at(p, id, o);
      const ln = d._line || { x0: L.cx - 480, x1: L.cx + 480, y: L.cy - 40, h: 34 };

      /* 0.00-0.85  the command types itself; the caret sits after the last typed character */
      const n = Math.round(d.command.length * S(.06, .85)), typed = d.command.slice(0, n);
      txt(p + 'ty', typed); txt(p + 'rs', d.command.slice(n));
      const prW = (ln.x1 - ln.x0) * d.prompt.length / (d.prompt.length + d.command.length), chW = (ln.x1 - ln.x0) / (d.prompt.length + d.command.length);
      const cx0 = ln.x0 + prW + chW * n + 3;                                  // caret x while typing (monospace: every character is chW wide)
      /* 0.92-1.25  three checks pop in */
      d.checks.forEach((_, i) => { const q = S(.92 + i * .12, 1.06 + i * .12); st(p + 'ck' + (i + 1), { opacity: f2(cl(q * 2, 0, 1)), transform: `translateY(${f2((1 - eo4(q)) * 10)}px) scale(${f2(.9 + .1 * bk(q))})` }); });
      /* 1.32-1.62  the line is wiped left → right into the caret; the checks drop away */
      const wq = eio(S(1.32, 1.62));
      st(p + 'term', { clipPath: `inset(-10px 0 -10px ${f2(ln.x0 - 8 + (ln.x1 - ln.x0 + 16) * wq)}px)`, opacity: T >= 1.64 ? 0 : 1 });
      st(p + 'cks', { opacity: f2(1 - S(1.3, 1.5)), transform: `translateY(${f2(8 * eo(S(1.3, 1.5)))}px)` });
      /* the caret: a block while typing (blinks once idle), then it rounds into a dot and flies to where the upper-right ball starts its lap */
      const lap = eo4(S(1.95, 2.8)), b2 = LF.ballAt(L, 2, ROT0 * (1 - lap)), fq = eio(S(1.55, 1.95)), rq = eo(S(1.5, 1.72));   // after landing the dot rides the ball for a few frames, until the disc is under it
      const fs = FS(c.grid), w = lerp(.48 * fs, 2 * b2.r, fq), h = lerp(1.09 * fs, 2 * b2.r, Math.max(rq * .45, fq)), x = lerp(cx0 + 8, b2.x, fq), y = lerp(ln.y + ln.h / 2, b2.y, fq) - 70 * Math.sin(Math.PI * fq);
      const blink = T > .9 && T < 1.3 ? (Math.floor((T - .9) / .2) % 2 ? 0 : 1) : 1;
      st(p + 'dot', { width: f2(w) + 'px', height: f2(h) + 'px', borderRadius: f2(rq * 50) + '%', transform: `translate(${f2(x - w / 2)}px,${f2(y - h / 2)}px)`, opacity: T >= 2.06 ? 0 : blink,
        background: fq > 0 && t.name === 'light' ? LF.BLUE : t.ink });

      /* 1.90-2.75  the disc bursts out of the centre as the ball lands; both balls lap the ring anticlockwise, arcs trailing */
      LF.placeMark(p, L, 1);
      at('dsc', { r: f2(G.R * spring(S(1.9, 2.4))) }); LF.bevel(p, S(2.5, 3.0));
      LF.orbit(p, { rot: ROT0 * (1 - lap), b1: bk(S(1.98, 2.25)), b2: T >= 1.95 ? 1 : 0, a1: eo(S(2.05, 2.75)), a2: eo(S(2.0, 2.7)) });
      LF.shockAt(p, L, S(1.92, 2.5), S(2.0, 2.5));
      /* 2.30-3.00  LT/F wipes in, the wordmark rises, a sheen crosses the disc */
      LF.mono(p, expo(S(2.3, 2.75)), expo(S(2.38, 2.83)), eo(S(2.58, 2.95)));
      LF.placeWord(p, L, 1 + .06 * (1 - eo4(S(2.3, 3.05)))); LF.letters(p, T, 2.3, .026, .42);
      LF.sheen(p, S(2.9, 3.5), t.sheen);
      /* 2.75-4.00  tagline opens from its centre; the caret returns and blinks after it (it sits in the tagline's own line: cap height, on the baseline) */
      LF.tagIn(p, S(2.75, 3.2));
      st(p + 'ct2', { opacity: T >= 3.2 && Math.floor((T - 3.2) / .27) % 2 === 0 ? 1 : 0 });
    }
  });
})();
