/* Slide fx: layers any slide can carry on top of its template, applied by the registry after the template's frame
   (window.SLIDE_FX: {html(data, ctx), beats(data), frame(ctx, root)}). All pure functions of ctx, like templates.
   data.emoji: [{e, x, y, size?, hold?, tilt?, at?}]  reaction stickers in STAGE px (not content px: a sticker sits next to a
     character or the heading, and must not move when vcenter re-centres the content). e = file in the project's
     assets/emoji/ without .png. Beats mj1..mjn: pop in with overshoot, bob, pop out after `hold` s (default 2.8) or
     before the exit. `at` = slide-local seconds, for a slide whose beats are ignored (an outro with
     an audio bed). data.burst: {x, y}  confetti burst in stage px on beat `burst`. data.shake: true  a short
     screen shake on beat `shake`. PROJECT.drift = {min, amt}: a slow push-in on slides whose screen time is at least
     `min` seconds (data.drift: false opts out), so long holds never look frozen. */
const FX = { pop: .45, out: .3, hold: 2.8, burstLen: 1.2, burstN: 24, shakeLen: .5 };
const FX_COLORS = ['#4CC2FF', '#FF7A45', '#3DDC97', '#FFD166', '#A78BFA', '#FB7185'];
window.SLIDE_FX = [
  { // emoji stickers
    beats: d => (d.emoji || []).map((_, i) => 'mj' + (i + 1)),
    html: (d, c) => (d.emoji || []).map((m, i) => `<div class="fx-emoji" id="${c.p}mj${i + 1}" style="left:${m.x}px;top:${m.y}px;width:${m.size || 120}px;height:${m.size || 120}px">
      <img src="${passet('emoji/' + m.e + '.png')}" alt=""></div>`).join(''),
    frame: c => (c.data.emoji || []).forEach((m, i) => {
      const id = c.p + 'mj' + (i + 1), bt = c.beats && c.beats['mj' + (i + 1)];
      if (!bt && m.at == null) return st(id, { opacity: 0 });
      const s = bt ? bt.s - .05 : m.at, t = c.local - s, end = Math.min(s + (m.hold || FX.hold), c.exit - FX.out - .05);
      const pin = cl(t / FX.pop, 0, 1), pout = cl((c.local - end) / FX.out, 0, 1);
      const sc = t < 0 ? 0 : bk(pin) * (1 - eo(pout)), tilt = m.tilt || -8;
      const bob = Math.sin(Math.max(0, t) * 2.6) * 7, rock = Math.sin(Math.max(0, t) * 1.9) * 4;
      st(id, { opacity: t < 0 || pout >= 1 ? 0 : cl(pin * 3, 0, 1).toFixed(3),
        transform: `translateY(${(bob - 30 * (1 - pin)).toFixed(2)}px) rotate(${(tilt * (1 - pin) + rock).toFixed(2)}deg) scale(${sc.toFixed(4)})` });
    }),
  },
  { // confetti burst
    beats: d => d.burst ? ['burst'] : [],
    html: (d, c) => d.burst ? `<div class="fx-burst" style="left:${d.burst.x}px;top:${d.burst.y}px">${Array.from({ length: FX.burstN }, (_, i) =>
      `<i id="${c.p}bu${i}" style="background:${FX_COLORS[i % FX_COLORS.length]};${i % 3 ? '' : 'border-radius:50%;'}"></i>`).join('')}<b id="${c.p}bur"></b></div>` : '',
    frame: c => {
      if (!c.data.burst) return;
      const bt = c.beats && c.beats.burst, t = bt ? c.local - bt.s : -1, p = cl(t / FX.burstLen, 0, 1), live = t >= 0 && p < 1;
      for (let i = 0; i < FX.burstN; i++) {
        const a = i * 2.39996 + .3, dist = 110 + (i * 53 % 90), q = eo(p);   // golden-angle spread, fixed per index
        const x = Math.cos(a) * dist * q, y = Math.sin(a) * dist * q + 90 * p * p;
        st(c.p + 'bu' + i, { opacity: live ? (1 - p * p).toFixed(3) : 0,
          transform: `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(i * 47 + 540 * p).toFixed(0)}deg) scale(${(1 - .5 * p).toFixed(3)})` });
      }
      const r = cl(t / .5, 0, 1);
      st(c.p + 'bur', { opacity: t >= 0 && r < 1 ? (.8 * (1 - r)).toFixed(3) : 0, transform: `scale(${(.2 + 1.6 * eo(r)).toFixed(3)})` });
    },
  },
  { // shake + drift: both move the content block, so they compose into one transform
    beats: d => d.shake ? ['shake'] : [],
    html: () => '',
    frame: (c, root) => {
      const P = window.PROJECT || {}, D = P.drift, box = root.querySelector('.content');
      if (!box) return;
      let tf = '';
      const bt = c.data.shake && c.beats && c.beats.shake, t = bt ? c.local - bt.s : -1;
      if (t >= 0 && t < FX.shakeLen) { const k = Math.pow(1 - t / FX.shakeLen, 2);
        tf += `translate(${(Math.sin(t * 70) * 14 * k).toFixed(2)}px,${(Math.cos(t * 53) * 6 * k).toFixed(2)}px) `; }
      if (D && c.data.drift !== false && c.screen >= (D.min || 20)) {
        const z = 1 + (D.amt || .02) * eio(cl(c.local / c.screen, 0, 1));
        tf += `scale(${z.toFixed(5)})`;
      }
      box.style.transform = tf;
    },
  },
];
