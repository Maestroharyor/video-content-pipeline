/* crash: a live product demo breaking on a screen share (projects/resilience-braandly, theme `incident`).
   A red "You're presenting" bar over a browser holding the product's dashboard, a participant tile (the customer
   watching), an API status row and a heart-monitor trace. On `down` the UI freezes under a 503 banner, `api` turns
   the status row red, and `flat` flatlines the trace. With `net` a devtools Network panel slides over the lower half
   of the browser and its failed requests stack (r1..rn); `q` drops a big question mark over it.
   data: {eyebrow, accent, h1, url, brand:{logo, name}, user, cards:[{label, value, bars?:[0..1]}],
          live?, status:{name, ok, fail}, cast?:[…], bubbles?:[…], net?:[{m, path, code, ms}], pre?: 'crashed', sub?, foot?}
   pre 'crashed' = the slide continues a crash: frozen, banner down, API red and the trace flat from the first frame.
   beats: win · k1..kn · live · down · api · flat · net · r1..rn · q · a1.. b1.. · sub
   The monitor trace is a pure function of ctx.local: a write head sweeps left to right and each point shows the
   heartbeat sampled at the moment the head last passed it, so the line keeps scrolling through holds and the
   flatline spreads from the head instead of snapping. The ECG helpers are shared with noc / recover. */
const CR = { bar: 56, win: 600, chrome: 50, side: 168, gap: 26, stat: 72, ecg: 170, speed: 320, period: .86 };
/* one heartbeat, t in seconds → amplitude -0.35..1 (P wave, QRS spike, T wave) */
function ecgAt(t) {
  const ph = (((t % CR.period) + CR.period) % CR.period) / CR.period, b = (c, w, a) => a * Math.exp(-Math.pow((ph - c) / w, 2));
  return b(.16, .035, .12) - b(.30, .012, .16) + b(.335, .014, 1) - b(.37, .014, .34) + b(.58, .06, .22);
}
/* the trace as an svg path: w x h box, write head at sec * speed (wrapping), points written after `flatAt` are flat */
function ecgPath(sec, w, h, flatAt, o) {
  o = o || {}; const speed = o.speed || CR.speed, amp = h * .40, mid = h * .62, step = 4;
  const head = (sec * speed) % w, lap = Math.floor(sec * speed / w);
  let d = '', pen = false;
  for (let x = 0; x <= w; x += step) {
    if (x > head && x - head < 26) { pen = false; continue; }                              // the gap in front of the head
    const written = x <= head ? (lap * w + x) / speed : ((lap - 1) * w + x) / speed;      // when the head last passed x
    const y = written < 0 ? mid : (flatAt != null && written >= flatAt && !(o.revive != null && written >= o.revive) ? mid : mid - ecgAt(written) * amp);
    d += (pen ? ' L' : ' M') + x + ' ' + y.toFixed(1); pen = true;
  }
  return { d: d.trim(), head };
}
function ecgHtml(id, w, h, label) {
  return `<div class="ic-ecg" id="${id}" style="width:${w}px;height:${h}px"><span class="ic-ecg-lb">${label || 'api heartbeat'}</span>
    <span class="ic-ecg-bpm" id="${id}bpm"></span><svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path id="${id}p"/><circle id="${id}hd" r="7"/></svg></div>`;
}
/* draw the trace: on = the panel has entered; flatAt = local seconds the heart stops (null = never) */
function ecgFrame(id, c, w, h, flatAt, revive) {
  const sec = Math.max(0, c.local || 0), dead = flatAt != null && sec >= flatAt && !(revive != null && sec >= revive);
  const tr = ecgPath(sec, w, h, flatAt, { revive });
  const pa = el(id + 'p'); if (pa) pa.setAttribute('d', tr.d);
  const hd = el(id + 'hd'); if (hd) { hd.setAttribute('cx', tr.head.toFixed(1)); hd.setAttribute('cy', (h * .62 - (dead ? 0 : ecgAt(sec) * h * .40)).toFixed(1)); }
  cls(id, 'dead', dead);
  txt(id + 'bpm', dead ? 'NO SIGNAL' : '70 bpm');
}
defineTemplate('crash', {
  check: d => req(d, ['eyebrow', 'h1', 'url', 'cards', 'status'], 'crash'),
  beats: d => baseBeats(d).concat(['win'], seqN('k', d.cards.length), ['live', 'down', 'api', 'flat'],
    d.net ? ['net'].concat(seqN('r', d.net.length), ['q']) : [], castBeats(d.cast, d.bubbles), ['sub']),
  html: (d, c) => {
    const p = c.p, G = c.grid, W = G.cw, mainW = W - CR.side - 4, cw = Math.floor((mainW - 40 - 2 * 18) / 3);
    const cards = d.cards.map((k, i) => `<div class="ic-card" id="${p}k${i + 1}" style="left:${20 + i * (cw + 18)}px;top:104px;width:${cw}px">
      <span class="kl">${k.label}</span><b>${k.value}</b><span class="kb">${(k.bars || [.4, .7, .5, .9, .6]).map(v => `<i style="height:${Math.round(v * 100)}%"></i>`).join('')}</span></div>`).join('');
    const sk = [0, 1, 2, 3].map(i => `<i style="top:${292 + i * 34}px;width:${[78, 92, 64, 84][i]}%"></i>`).join('');
    const appH = CR.win - CR.chrome, statY = CR.bar + CR.win + CR.gap, ecgY = statY + CR.stat + CR.gap;
    const net = d.net ? `<div class="ic-net" id="${p}net" style="left:0;top:${CR.bar + 236}px;width:${W}px;height:${CR.win - 236}px">
        <div class="nh"><b>Network</b><span>Fetch/XHR</span><em id="${p}nerr">${d.net.length} failed</em></div>
        ${d.net.map((r, i) => `<div class="nr" id="${p}r${i + 1}" style="top:${56 + i * 62}px"><span class="nm">${r.m}</span><span class="np">${r.path}</span><span class="nc">${r.code}</span><span class="nt">${r.ms}</span></div>`).join('')}</div>
      <div class="ic-q" id="${p}q" style="left:${W / 2 - 80}px;top:${CR.bar + 120}px">?</div>` : '';
    return `${heading(p, d)}<div class="content"><div class="rel" style="height:${ecgY + CR.ecg}px">
      <div class="ic-win" id="${p}win" style="left:0;top:0;width:${W}px;height:${CR.bar + CR.win}px">
        <div class="ic-share" style="height:${CR.bar}px"><span class="rec"></span>You're presenting<em id="${p}live">LIVE · 1 watching</em></div>
        <div class="ic-chrome" style="height:${CR.chrome}px"><i></i><i></i><i></i><span class="url">${d.url}</span></div>
        <div class="ic-app" style="height:${appH}px">
          <div class="ic-side" style="width:${CR.side}px"><span class="bl"><img src="${logo(d.brand.logo, true)}" alt=""></span><b>${d.brand.name}</b>
            ${[0, 1, 2, 3, 4].map(i => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
          <div class="ic-main" style="left:${CR.side}px;width:${mainW}px">
            <div class="hi">${d.user}</div><div class="hs">Here's how your brands are doing.</div>
            ${cards}<div class="ic-skel">${sk}</div>
            <div class="ic-frz" id="${p}frz"></div>
            <div class="ic-503" id="${p}down"><b>503</b><span>Service unavailable<i>The API is not responding</i></span></div>
          </div>
        </div>
        ${net}
      </div>
      <div class="ic-stat" id="${p}stat" style="left:0;top:${statY}px;width:${W}px;height:${CR.stat}px"><span class="dot" id="${p}sdot"></span><b>${d.status.name}</b>
        <span class="sv" id="${p}api">${d.status.ok}</span></div>
      <div class="abs" id="${p}ecgw" style="left:0;top:${ecgY}px">${ecgHtml(p + 'ecg', W, CR.ecg)}</div>
      ${castBlock(p, d.cast, d.bubbles)}
      ${subHtml(p, d.sub, ecgY + CR.ecg + 30, W)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c), pre = d.pre === 'crashed', W = c.grid.cw;
    headIn(B, p);
    const win = B.at('win', .04, .16);
    if (pre) fd(p + 'win', 1); else up(p + 'win', win.p, 30);
    B.group('k', d.cards.length, { a: .16, step: .06, len: .1, kind: 'pop' }).forEach((r, i) => pp(p + 'k' + (i + 1), pre ? 1 : r.p, .86));
    pp(p + 'live', pre ? 1 : B.p('live', .3, .4, 'pop'), .7);
    // the crash: the UI freezes under a dark wash and the banner drops in
    const dn = pre ? { p: 1, s: -9 } : B.at('down', .5, .62, 'pop');
    fd(p + 'frz', eo(cl(dn.p * 1.6, 0, 1)) * .72);
    const e = bk(cl(dn.p, 0, 1));
    st(p + 'down', { opacity: cl(dn.p * 2.4, 0, 1), transform: `translateY(${((1 - e) * -60).toFixed(1)}px) scale(${(.9 + .1 * e).toFixed(3)})` });
    cls(p + 'win', 'dead', dn.p > .3);
    const ap = pre ? { p: 1 } : B.at('api', .6, .7, 'pop');
    up(p + 'stat', pre ? 1 : seg(win.p, .5, 1), 18);
    const red = ap.p > .4; cls(p + 'stat', 'bad', red); txt(p + 'api', red ? d.status.fail : d.status.ok);
    if (ap.p > 0 && ap.p < 1) st(p + 'api', { transform: 'scale(' + (1 + .12 * pulse(ap.p)) + ')' });
    // the trace enters with the window and keeps beating until `flat`
    up(p + 'ecgw', pre ? 1 : seg(win.p, .6, 1), 18);
    const fl = pre ? -99 : B.at('flat', .55, .66, 'enter', { focal: false }).s;
    ecgFrame(p + 'ecg', c, W, CR.ecg, B.on || pre ? fl : null);
    if (d.net) {
      const nt = B.at('net', .2, .32);
      st(p + 'net', { opacity: eo(nt.p), transform: `translateY(${((1 - eo4(nt.p)) * 120).toFixed(1)}px)` });
      B.group('r', d.net.length, { a: .32, step: .08, len: .1, kind: 'enter' }).forEach((r, i) => sx(p + 'r' + (i + 1), r.p, -40));
      const q = B.p('q', .7, .8, 'pop'), qe = spring(cl(q, 0, 1));
      st(p + 'q', { opacity: cl(q * 2.4, 0, 1), transform: `scale(${(.4 + .6 * qe).toFixed(3)}) rotate(${((1 - qe) * -14).toFixed(1)}deg)` });
    }
    castPlay(B, c, p, d.cast, d.bubbles);
    up(p + 'sub', B.p('sub', .88, .98));
    footIn(B, p); holdLife(B, p, d, { alias: { down: 'down' } });
  }
});
