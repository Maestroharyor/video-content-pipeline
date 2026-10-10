/* The subscribe call to action: a YouTube-style action bar that a cursor tours — Like, Subscribe, the bell, then
   "All" in the notification menu — with the button states flipping as each one is clicked. Two slides draw it: the
   deck's outro (full frame) and the transparent overlay that version B composites onto the speaker's face, so the
   markup and the motion live here once.

   SUB.html(p, o) → markup, SUB.frame(p, T, o) → one frame at T seconds since the bar appeared. Both are pure
   functions of their arguments: no timers, no Date, no randomness (core/registry.js re-renders any frame on demand).
   o: {x, y, k? (scale, 1 = 1400x176), name, handle, cta?, done?, like?, liked?}.

   The four clicks are scored: projects/dns-resolution/assets/sting.json lays the channel's own click and bell
   samples at exactly the times in the table below, and scripts/dual-render.js mixes that wav in at SUB t = 0. */
const SUB = {
  W: 1400, H: 176,
  /* bar-local geometry at k = 1. The menu hangs above the bar (negative top) so it never reaches the bottom of the
     frame in version B, where the bar sits over the speaker's chest just above YouTube's scrubber. */
  L: {
    like: { x: 666, y: 40, w: 200, h: 96 },
    btn: { x: 900, y: 40, w: 330, h: 96 },
    bell: { x: 1264, y: 40, w: 96, h: 96 },
    menu: { x: 1020, y: -198, w: 340, h: 180, pad: 14, row: 76 },
  },
  html: (p, o) => {
    const k = o.k || 1, L = SUB.L, M = L.menu, px = v => (v * k).toFixed(1) + 'px';
    const box = b => `left:${px(b.x)};top:${px(b.y)};width:${px(b.w)};height:${px(b.h)}`;
    const row = (i, ico, label) => `<div class="sb-mrow" id="${p}sbm${i}" style="height:${px(M.row)};padding:0 ${px(22)};gap:${px(18)};font-size:${px(30)}">
      <span class="mi" style="width:${px(38)};height:${px(38)}"><svg viewBox="0 0 24 24"><use href="#${ico}"/></svg></span><span>${label}</span>
      <svg class="mck" id="${p}sbm${i}c" viewBox="0 0 24 24" style="width:${px(34)};height:${px(34)}"><path d="m5 12.5 4.6 4.6L19 6.8"/></svg></div>`;
    return `<div class="sub-cta" id="${p}sb" style="left:${o.x}px;top:${o.y}px;width:${px(SUB.W)};height:${px(SUB.H)};border-radius:${px(40)}">
      <img class="sb-yt" id="${p}sbyt" src="${logo('youtube', true)}" alt="YouTube" style="left:${px(40)};top:${px(53)};width:${px(104)};height:${px(70)}">
      <div class="sb-nm" id="${p}sbnm" style="left:${px(178)};top:${px(44)};font-size:${px(44)}">${o.name}</div>
      <div class="sb-hd" id="${p}sbhd" style="left:${px(178)};top:${px(100)};font-size:${px(28)}">${o.handle}</div>
      <div class="sb-like" id="${p}sblk" style="${box(L.like)};border-radius:${px(48)};gap:${px(16)};font-size:${px(34)}">
        <span class="li" style="width:${px(46)};height:${px(46)}"><svg viewBox="0 0 24 24"><use href="#i-like"/></svg></span>
        <span class="lw" style="width:${px(104)};height:${px(46)}"><span id="${p}sblk1">${o.like || 'Like'}</span><span class="on" id="${p}sblk2">${o.liked || 'Liked'}</span></span></div>
      <div class="sb-btn" id="${p}sbb" style="${box(L.btn)};border-radius:${px(48)};font-size:${px(36)}">
        <span id="${p}sbb1">${o.cta || 'Subscribe'}</span><span class="on" id="${p}sbb2">${o.done || 'Subscribed'}</span></div>
      <div class="sb-bell" id="${p}sbbl" style="${box(L.bell)};border-radius:50%"><span class="bi" id="${p}sbbli" style="width:${px(52)};height:${px(52)}"><svg viewBox="0 0 24 24"><use href="#i-bell"/></svg></span></div>
      <div class="sb-menu" id="${p}sbmn" style="${box(M)};border-radius:${px(24)};padding:${px(M.pad)} 0">${row(1, 'i-bell', 'All')}${row(2, 'i-x', 'None')}</div>
      <div class="sb-rip" id="${p}sbrp"></div>
      ${pointer(p + 'sbc')}</div>`;
  },
  /* The Subscribe click is the anchor: SUB.CLICK is when it happens on this clock, and the caller shifts the whole
     clock so that instant lands on the spoken word "subscribe". Everything else is derived from the voiceover
     around it — "like," is spoken 0.92s before "subscribe", which is exactly LIKE to CLICK. */
  LIKE: 2.06, CLICK: 2.98, BELL: 3.52, NOTIFY: 4.06,
  frame: (p, T, o) => {
    const k = o.k || 1, L = SUB.L, S = (a, b) => seg(T, a, b), K = v => v * k;
    const mid = b => ({ x: K(b.x + b.w / 2), y: K(b.y + b.h / 2) });
    up(p + 'sb', eo(S(0, .40)), 40 * k);
    fd(p + 'sbyt', S(.14, .38)); fd(p + 'sbnm', S(.20, .44)); fd(p + 'sbhd', S(.26, .50));
    /* Each button owns one transform: the entrance pop and the click dip multiply, because two st() calls on the
       same element would simply overwrite each other and the entrance would be lost. */
    const press = t0 => pulse(S(t0 - .04, t0 + .10));
    const enter = (id, a, b, dip) => { const e = cl(S(a, b), 0, 1);
      fd(id, cl(e * 2.2, 0, 1));
      return s2 => st(id, { transform: 'scale(' + ((.8 + .2 * bk(e)) * (1 + dip + (s2 || 0))).toFixed(4) + ')' }); };
    const flip = (t0, id) => { const f = eo(S(t0 + .02, t0 + .32)); cls(id, 'done', f > .5);
      st(id + '1', { opacity: (1 - f).toFixed(3) }); st(id + '2', { opacity: f.toFixed(3) }); };
    enter(p + 'sblk', .30, .56, -.07 * press(SUB.LIKE))();
    enter(p + 'sbb', .36, .62, -.07 * press(SUB.CLICK))();
    const bellScale = enter(p + 'sbbl', .42, .68, -.10 * press(SUB.BELL));
    flip(SUB.LIKE, p + 'sblk'); flip(SUB.CLICK, p + 'sbb');
    /* The menu opens on the bell click and closes once "All" is picked. Scaled from its bottom edge, which is
       where the bell is, so it reads as coming out of the button rather than floating in. */
    // the close waits until the tick has finished drawing, so the chosen row is actually readable
    const mo = eo(S(SUB.BELL + .02, SUB.BELL + .20)), mc = eo(S(SUB.NOTIFY + .26, SUB.NOTIFY + .46));
    const m = cl(mo - mc, 0, 1);
    st(p + 'sbmn', { opacity: m.toFixed(3), transform: 'translateY(' + (K(16) * (1 - m)).toFixed(1) + 'px) scale(' + (.9 + .1 * m).toFixed(3) + ')' });
    const picked = S(SUB.NOTIFY, SUB.NOTIFY + .12);
    cls(p + 'sbm1', 'hl', picked > 0);
    draw(p + 'sbm1c', S(SUB.NOTIFY + .02, SUB.NOTIFY + .22));

    // the bell fills and rings on the chime, 0.08s after the notification is chosen
    const on = S(SUB.NOTIFY + .08, SUB.NOTIFY + .28), rg = S(SUB.NOTIFY + .08, SUB.NOTIFY + .94);
    cls(p + 'sbbl', 'on', on > .5);
    bellScale(.10 * pulse(on));
    st(p + 'sbbli', { transform: 'rotate(' + (rg > 0 && rg < 1 ? 16 * Math.sin(rg * 30) * (1 - rg) : 0).toFixed(2) + 'deg)' });

    /* Cursor: one leg per stop, each easing in and out, so it visibly travels between the four buttons instead of
       teleporting. The waypoint times are the click times; it sets off far enough ahead to arrive on the beat. */
    const M = L.menu, mr1 = { x: K(M.x + M.w / 2), y: K(M.y + M.pad + M.row / 2) };
    const legs = [[1.24, SUB.LIKE, { x: K(330), y: K(300) }, mid(L.like)],
      [SUB.LIKE + .12, SUB.CLICK, mid(L.like), mid(L.btn)],
      [SUB.CLICK + .12, SUB.BELL, mid(L.btn), mid(L.bell)],
      [SUB.BELL + .10, SUB.NOTIFY, mid(L.bell), mr1],
      [SUB.NOTIFY + .24, SUB.NOTIFY + .74, mr1, { x: K(1500), y: K(330) }]];
    const leg = legs.filter(g => T >= g[0]).pop() || legs[0];
    cursor(p + 'sbc', S(1.14, 1.32) - S(SUB.NOTIFY + .58, SUB.NOTIFY + .74), eio(S(leg[0], leg[1])), leg[2].x, leg[2].y, leg[3].x, leg[3].y);

    // one ripple element, one click at a time
    const rips = [[SUB.LIKE, mid(L.like)], [SUB.CLICK, mid(L.btn)], [SUB.BELL, mid(L.bell)], [SUB.NOTIFY, mr1]];
    const hit = rips.filter(r => T >= r[0] && T < r[0] + .40)[0];
    if (hit) ripple(p + 'sbrp', S(hit[0], hit[0] + .40), hit[1].x, hit[1].y, K(150));
    else st(p + 'sbrp', { opacity: 0 });
  },
};
