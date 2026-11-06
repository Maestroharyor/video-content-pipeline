/* The xray family (projects/why-fastapi-is-fast, core/styles/xray.css): a scanner opens FastAPI up layer by layer.
   Five templates share one monitor frame and one scan beam:
     xstack  the specimen: five layer slabs, redacted until their section names them, native cores glowing through
     xtrace  one request on a time axis: a thin CPU slice, a long wait, what it waits on
     xloop   one async worker that parks a waiting request and serves the next; a blocking lane underneath, struck
     xscan   one layer opened up: the scan reveals the native code inside each part, then a stamp
     xfan    one typed signature and the rows of work it buys
   The beam: an entrance sweep on the `scan` beat (or the monitor's entrance), then an ambient pass every XR.every
   seconds, all a pure function of ctx.local. A core under the beam flares, so a held scene keeps scanning.

   Shared data: {eyebrow, accent, h1, head?: {text, src?}, badge?: {text, cls}} (badge sits in the monitor header). */
const XR = { hd: 70, every: 5.5, sweep: 1.3 };

function xrIcon(name) { return `<svg viewBox="0 0 24 24"><use href="#i-${name}"/></svg>`; }
function xrMon(p, d, w, h, inner) {
  const hd = d.head || {};
  const img = hd.src ? `<img class="wt" src="${hd.src}" alt="" style="padding:4px;border-radius:8px;background:#F3FBFD;box-sizing:border-box">` : '';
  const right = d.badge ? `<span class="badge ${d.badge.cls || d.accent || 't'}" id="${p}bd" style="position:relative;margin-left:auto;font-size:28px;padding:6px 16px">${d.badge.text}</span>`
    : '<span class="rec"><i></i>Scan</span>';
  return `<div class="xr-mon" id="${p}mon" style="width:${w}px;height:${h}px">
    <div class="xr-hd">${img}<span>${hd.text || 'Scan'}</span>${right}</div>${inner}
    <div class="xr-scan" id="${p}beam"></div></div>`;
}
/* beam position (0..1 of the monitor's height, <0 = off) at slide second `t`, for an entrance sweep starting at s0 */
function xrBeam(t, s0) {
  if (t < s0) return -1;
  const k = t - s0;
  if (k < XR.sweep) return k / XR.sweep;
  const r = (k - XR.sweep) % XR.every;
  return r < XR.sweep ? r / XR.sweep : -1;
}
function xrBeamDraw(p, h, y) {
  st(p + 'beam', { opacity: y < 0 ? 0 : String(cl(Math.min(y, 1 - y) * 8, 0, 1)), transform: 'translateY(' + Math.round(Math.max(0, y) * (h + 140)) + 'px)' });
}
/* how much a band centred at `cy` (px inside the monitor) is lit by the beam at fraction y */
function xrLit(y, h, cy) { if (y < 0) return 0; const by = y * (h + 140) - 4; return Math.exp(-Math.pow((by - cy) / 70, 2)); }
function xrMonIn(B, p, d) {
  const m = B.at('scan', .02, .14, 'enter', { focal: false });
  up(p + 'mon', m.p, 40);
  st(p + 'bd', { opacity: String(eo(B.p('badge', .7, .8, 'pop'))) });
  return m;
}

/* ---------------- xstack ----------------
   data: {layers: [{name, src?, icon?, lang?, core?: {text, tag, cls: ''|'rust', src?}}], known: n (already named),
          focus?: i (1-based: this slide names it on beat L<i>), drop?: true (the slabs fall in on `stack`),
          cores?: [i] (lit on beat n<i>), lit?: [i] (already lit), chips?: [{text, strike?, code?, acc?}]}
   beats: scan · stack · L1..L5 · n1..n5 · k1..kn · x1..xn (the struck chips, in order) · badge */
const XS = { top: 90, h: 76, gap: 10 };
defineTemplate('xstack', {
  check: d => req(d, ['eyebrow', 'h1', 'layers'], 'xstack'),
  beats: d => baseBeats(d).concat(['scan', 'stack', 'badge'], seqN('L', d.layers.length), seqN('n', d.layers.length),
    seqN('k', (d.chips || []).length), seqN('x', (d.chips || []).filter(k => k.strike).length)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, n = d.layers.length, h = XS.top + n * (XS.h + XS.gap) - XS.gap + 22;
    const slabs = d.layers.map((L, j) => {
      const i = j + 1, named = i <= (d.known || 0) || i === d.focus;
      const mark = L.src ? `<img class="wt" src="${L.src}" alt="">` : L.icon ? xrIcon(L.icon) : '';
      const core = L.core ? `<span class="core ${L.core.cls || ''}" id="${p}n${i}">${L.core.src ? `<img src="${L.core.src}" alt="">` : ''}${L.core.text}<b style="margin-left:4px">${L.core.tag}</b></span>` : '';
      return `<div class="xr-slab${i === d.focus ? ' focus' : ''}" id="${p}L${i}" style="top:${XS.top + j * (XS.h + XS.gap)}px;width:${w - 40}px;${ACCENT_VAR[d.accent] ? '--acc:var(' + ACCENT_VAR[d.accent] + ')' : ''}">
        <span class="no">${String(i).padStart(2, '0')}</span>
        <span class="nm"><span class="red" id="${p}red${i}"${named && i !== d.focus ? ' style="opacity:0"' : ''}></span>
          <span class="real" id="${p}real${i}">${mark}${L.name}</span></span>
        ${core}${L.lang ? `<span class="lang">${L.lang}</span>` : ''}</div>`;
    }).join('');
    let x = 0;
    const chips = (d.chips || []).map((k, j) => `<span class="xr-chip${k.code ? ' code' : ''}${k.acc ? ' acc' : ''}" id="${p}k${j + 1}" style="${ACCENT_VAR[d.accent] ? '--acc:var(' + ACCENT_VAR[d.accent] + ')' : ''}">${k.text}${k.strike ? `<i class="x" id="${p}x${++x}"></i>` : ''}</span>`).join('');
    d._h = h;
    return `${heading(p, d)}<div class="content"><div class="rel">${xrMon(p, d, w, h, `<div id="${p}stack">${slabs}</div>`)}
      ${chips ? `<div class="xr-chips" id="${p}chips" style="top:${h + 28}px;width:${w}px">${chips}</div>` : ''}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c), n = d.layers.length, h = d._h;
    headIn(B, p);
    const m = xrMonIn(B, p, d);
    const drop = d.drop ? B.at('stack', .16, .3, 'enter') : null;
    const lit = d.lit || [], cores = d.cores || [];
    const named = d.layers.map((_, j) => B.at('L' + (j + 1), .2, .34, 'enter', { focal: d.focus === j + 1 }));
    const beam = xrBeam(c.local, m.s + .3);
    xrBeamDraw(p, h, beam);
    d.layers.forEach((L, j) => {
      const i = j + 1, id = p + 'L' + i;
      // the slabs are already on the specimen unless this slide drops them in
      const sp = drop ? seg(c.local, drop.s + j * .14, drop.s + j * .14 + BEAT.enter) : m.p;
      up(id, sp, drop ? -24 : 0);
      if (i === d.focus) {
        const r = named[j];
        st(p + 'real' + i, { clipPath: 'inset(0 ' + ((1 - eo(r.p)) * 100).toFixed(1) + '% 0 0)' });
        st(p + 'red' + i, { opacity: String(1 - eo(r.p)) });
      } else {
        st(p + 'real' + i, { clipPath: i <= (d.known || 0) ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)' });
        // the other layers step back once this slide's layer is named
        if (d.focus) dim(id, seg(c.local, named[d.focus - 1].s, named[d.focus - 1].s + BEAT.dim), .45);
      }
      if (L.core) {
        const on = lit.includes(i) ? 1 : cores.includes(i) ? B.p('n' + i, .5, .62, 'pop') : 0;
        const cy = XS.top + j * (XS.h + XS.gap) + XS.h / 2, f = xrLit(beam, h, cy);
        const glow = on * (.35 + .65 * f);
        st(p + 'n' + i, { opacity: String(cl(on * 2, 0, 1)), transform: 'scale(' + (.8 + .2 * bk(on)).toFixed(4) + ')',
          boxShadow: `0 0 ${Math.round(10 + 34 * glow)}px ${Math.round(2 + 8 * glow)}px ${L.core.cls === 'rust' ? 'rgba(255,122,92,' : 'rgba(255,181,71,'}${(.25 + .5 * glow).toFixed(2)})` });
      }
    });
    let x = 0;
    B.group('k', (d.chips || []).length, { a: .5, step: .06, len: .14, kind: 'pop', dim: false }).forEach((r, j) => {
      pp(p + 'k' + (j + 1), r.p, .8);
      if (d.chips[j].strike) { x++; const s = B.p('x' + x, .8, .9, 'draw'); st(p + 'x' + x, { transform: 'scaleX(' + eo(s).toFixed(4) + ')' }); dim(p + 'k' + (j + 1), s, .55); }
    });
    footIn(B, p); holdLife(B, p, d);
  }
});

/* ---------------- xtrace ----------------
   data: {cpu, wait, axis, chips: [{icon, text}] (2x2)}
   beats: scan (alias bar) · cpu · wait · k1..k4 */
const XT = { bar: 156, h: 330, segs: [[0, .07, 'cpu'], [.07, .91, 'wait'], [.91, .97, 'cpu']] };
defineTemplate('xtrace', {
  check: d => req(d, ['eyebrow', 'h1', 'cpu', 'wait', 'chips'], 'xtrace'),
  beats: d => baseBeats(d).concat(['scan', 'bar', 'cpu', 'wait'], seqN('k', d.chips.length)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, bw = w - 48;
    const segs = XT.segs.map((s, i) => `<i class="xr-seg ${s[2]}" id="${p}sg${i + 1}" style="left:${Math.round(s[0] * bw)}px;width:${Math.round((s[1] - s[0]) * bw)}px"></i>`).join('');
    const inner = `<div class="xr-lab cpu" id="${p}lc" style="left:24px;top:${XT.bar - 44}px">${d.cpu}</div>
      <div class="xr-lab wait" id="${p}lw" style="left:${24 + Math.round(.42 * bw)}px;top:${XT.bar - 44}px">${d.wait}</div>
      <div class="xr-bar" id="${p}bar" style="top:${XT.bar}px">${segs}</div>
      <div class="xr-lab" id="${p}ax" style="left:24px;top:${XT.bar + 108}px;color:var(--tx3);opacity:1">${d.axis || ''}</div>`;
    const cw2 = Math.floor((w - 20) / 2);
    const chips = d.chips.map((k, i) => `<div class="xr-wt" id="${p}k${i + 1}" style="left:${(i % 2) * (cw2 + 20)}px;top:${XT.h + 30 + Math.floor(i / 2) * 104}px;width:${cw2}px;box-sizing:border-box">${xrIcon(k.icon)}${k.text}</div>`).join('');
    return `${heading(p, d)}<div class="content"><div class="rel">${xrMon(p, d, w, XT.h, inner)}${chips}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    const m = xrMonIn(B, p, d);
    const bar = B.at('bar', .1, .2, 'enter', { focal: false, after: m, delay: .1 });
    up(p + 'bar', bar.p, 0);
    const cpu = B.at('cpu', .2, .3, 'bar');
    const wait = B.at('wait', .34, .5, 'bar', { len: 1.2 });
    st(p + 'sg1', { transform: 'scaleX(' + eo(cpu.p).toFixed(4) + ')' });
    st(p + 'sg2', { transform: 'scaleX(' + eo(wait.p).toFixed(4) + ')' });
    st(p + 'sg3', { transform: 'scaleX(' + eo(seg(c.local, wait.e, wait.e + .3)).toFixed(4) + ')' });
    fd(p + 'lc', cpu.p); fd(p + 'lw', wait.p);
    xrBeamDraw(p, XT.h, xrBeam(c.local, m.s + .3));
    B.group('k', d.chips.length, { a: .55, step: .08, len: .14, kind: 'pop', dim: false }).forEach((r, i) => sx(p + 'k' + (i + 1), r.p, i % 2 ? 40 : -40));
    footIn(B, p); holdLife(B, p, d, { alias: { wait: 'bar' } });
  }
});

/* ---------------- xloop ----------------
   data: {lane, ghost, worker: {src, alt?}, reqs: [{name, serve, wait, queued}], db, bubble, idle}
   beats: lane · r1 (request 1 is served) · db (it parks on the database) · r2 (the worker takes request 2) ·
          a1 (the worker reacts) · b1 (its bubble) · x1 (the blocking lane is struck) */
const XL = { laneH: 420, ghostY: 470, ghostH: 220 };
defineTemplate('xloop', {
  check: d => req(d, ['eyebrow', 'h1', 'lane', 'ghost', 'worker', 'reqs', 'db'], 'xloop'),
  beats: d => baseBeats(d).concat(['lane', 'r1', 'db', 'r2', 'a1', 'b1', 'x1', 'ghost']),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, R = d.reqs;
    const req1 = `<div class="xr-req srv" id="${p}r1" style="left:200px;top:60px"><b>${R[0].name}</b><span id="${p}r1s">${R[0].serve}</span></div>`;
    const req2 = `<div class="xr-req srv" id="${p}r2" style="left:200px;top:270px"><b>${R[1].name}</b><span>${R[1].serve}</span></div>`;
    const lane = `<div class="xr-lane on" id="${p}lane" style="top:0;width:${w}px;height:${XL.laneH}px"><span class="tg">${d.lane}</span>
      <div class="xr-wk" id="${p}a1" style="left:30px;top:120px"><img id="${p}wimg" src="${d.worker.src}" alt=""><img id="${p}wimg2" src="${d.worker.src2 || d.worker.src}" alt="" style="position:absolute;opacity:0"></div>
      <div class="xr-db" id="${p}db" style="left:${w - 230}px;top:40px">${xrIcon('db')}${d.db}</div>
      ${req1}${req2}${d.bubble ? bubbleHtml({ id: p + 'b1', text: d.bubble, x: 470, y: 290, w: 270, tail: 'l' }) : ''}</div>`;
    const ghost = `<div class="xr-lane ghost" id="${p}ghost" style="top:${XL.ghostY}px;width:${w}px;height:${XL.ghostH}px"><span class="tg">${d.ghost}</span>
      <div class="xr-wk ghost" style="left:30px;top:50px;width:120px;height:120px"><img src="${d.worker.src}" alt="" style="width:104px;height:104px"></div>
      <div class="xr-req wt" style="left:180px;top:64px;opacity:1"><b>${R[0].name}</b><span>${R[0].wait}</span></div>
      <div class="xr-idle" id="${p}idle" style="left:460px;top:84px;opacity:1">${d.idle}</div>
      <div class="xr-req" style="left:${w - 280}px;top:64px;opacity:.55"><b>${R[1].name}</b><span>${R[1].queued}</span></div>
      <i class="xr-strike" id="${p}x1" style="left:20px;top:${XL.ghostH / 2 - 3}px;width:${w - 40}px"></i></div>`;
    return `${heading(p, d)}<div class="content"><div class="rel">${lane}${ghost}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c), R = d.reqs;
    headIn(B, p);
    const lane = B.at('lane', .06, .16, 'enter', { focal: false });
    up(p + 'lane', lane.p, 40);
    st(p + 'a1', { opacity: String(eo(lane.p)) });
    const r1 = B.p('r1', .18, .28, 'enter');
    const db = B.at('db', .32, .42, 'enter');
    // request 1 slides over to the database and waits there
    const mv = eo(seg(c.local, db.s + .1, db.s + .7));
    st(p + 'r1', { opacity: String(eo(r1)), transform: 'translate(' + Math.round(mv * (c.grid.cw - 230 - 200 - 270 - 28)) + 'px,' + Math.round((1 - eo(r1)) * 30) + 'px)' });
    fd(p + 'db', db.p);
    const waiting = mv > .5;
    cls(p + 'r1', 'srv', !waiting); cls(p + 'r1', 'wt', waiting); txt(p + 'r1s', waiting ? R[0].wait : R[0].serve);
    sx(p + 'r2', B.p('r2', .48, .58, 'enter'), -120);
    // the worker answers: a pop and the gesture swaps from pointing to a thumbs-up
    const a = B.at('a1', .6, .68, 'pop', { focal: false });
    const bounce = pulse(a.p);
    st(p + 'a1', { transform: 'scale(' + (1 + .08 * bounce).toFixed(4) + ')' });
    st(p + 'wimg', { opacity: String(1 - eo(a.p)) }); st(p + 'wimg2', { opacity: String(eo(a.p)) });
    const b = B.p('b1', .64, .72, 'pop');
    if (d.bubble) bubbleIn(p + 'b1', b, 0);
    const g = B.at('ghost', .7, .8, 'enter', { focal: false });
    up(p + 'ghost', g.p, 30);
    const x = B.p('x1', .86, .94, 'draw');
    st(p + 'x1', { transform: 'scaleX(' + eo(x).toFixed(4) + ')' });
    dim(p + 'ghost', x, .6);
    footIn(B, p); holdLife(B, p, d, { alias: { r2: 'r2' } });
  }
});

/* ---------------- xscan ----------------
   data: {shell: {name, src?, lang}, parts: [{label, core, lib, tag}] (two), stamp}
   beats: scan · n1 · n2 · stamp */
const XC = { shellY: 96, partY: 110, partH: 210 };
defineTemplate('xscan', {
  check: d => req(d, ['eyebrow', 'h1', 'shell', 'parts'], 'xscan'),
  beats: d => baseBeats(d).concat(['scan', 'stamp', 'badge'], seqN('n', d.parts.length)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, sw = w - 48, pw = Math.floor((sw - 72) / 2);
    const shellH = XC.partY + XC.partH + 150, h = XC.shellY + shellH + 24;
    const parts = d.parts.map((q, i) => `<div class="xr-part" style="left:${24 + i * (pw + 24)}px;top:${XC.partY}px;width:${pw}px">
      <span class="pl">${q.label}</span><div class="in" id="${p}n${i + 1}"><b>${q.core}</b><span>${q.lib}</span><i>${q.tag}</i></div></div>`).join('');
    const shell = `<div class="xr-shell" id="${p}shell" style="top:${XC.shellY}px;height:${shellH}px">
      <div class="tg">${d.shell.src ? `<img src="${d.shell.src}" alt="">` : ''}${d.shell.name}<em>${d.shell.lang}</em></div>${parts}
      ${d.stamp ? `<div class="xr-stamp" id="${p}stamp" style="left:50%;top:${XC.partY + XC.partH + 34}px">${d.stamp}</div>` : ''}</div>`;
    d._h = h;
    return `${heading(p, d)}<div class="content"><div class="rel">${xrMon(p, d, w, h, shell)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c), h = d._h;
    headIn(B, p);
    const m = xrMonIn(B, p, d);
    const beam = xrBeam(c.local, m.s + .2);
    xrBeamDraw(p, h, beam);
    const cy = XC.shellY + XC.partY + XC.partH - 70;
    d.parts.forEach((q, i) => {
      const on = B.p('n' + (i + 1), .4 + i * .14, .52 + i * .14, 'pop');
      const glow = on * (.4 + .6 * xrLit(beam, h, cy));
      st(p + 'n' + (i + 1), { opacity: String(cl(on * 2, 0, 1)), transform: 'scale(' + (.86 + .14 * bk(on)).toFixed(4) + ')',
        boxShadow: `0 0 ${Math.round(14 + 40 * glow)}px rgba(255,181,71,${(.2 + .45 * glow).toFixed(2)}),inset 0 0 22px rgba(255,181,71,.15)` });
    });
    const s = B.p('stamp', .82, .9, 'pop');
    st(p + 'stamp', { opacity: String(cl(s * 2, 0, 1)), transform: 'translateX(-50%) rotate(-5deg) scale(' + (1.5 - .5 * bk(s)).toFixed(4) + ')' });
    footIn(B, p); holdLife(B, p, d);
  }
});

/* ---------------- xfan ----------------
   data: {file, lines: [html] (spans .k .f .t .s .d; the type to light carries .t), rows: [{icon|src, text, tail?, sw?}]}
   beats: code · l1..ln · t1..tn (rows) */
const XF = { lh: 48, rowH: 84, gap: 14 };
defineTemplate('xfan', {
  check: d => req(d, ['eyebrow', 'h1', 'file', 'lines', 'rows'], 'xfan'),
  beats: d => baseBeats(d).concat(['code'], seqN('l', d.lines.length), seqN('t', d.rows.length)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, sigH = 40 + 38 + d.lines.length * XF.lh;
    const sig = `<div class="xr-sig" id="${p}code" style="top:0;width:${w}px;height:${sigH}px"><div class="fn">${d.file}</div>
      ${d.lines.map((l, i) => `<span class="cl" id="${p}l${i + 1}">${l}</span>`).join('')}</div>`;
    const y0 = sigH + 34;
    const rows = d.rows.map((r, i) => `<div class="xr-row" id="${p}t${i + 1}" style="top:${y0 + i * (XF.rowH + XF.gap)}px;left:56px;width:${w - 56}px">
      <span class="ic">${r.src ? `<img src="${r.src}" alt="">` : xrIcon(r.icon)}</span>${r.text}
      ${r.tail ? `<span class="tail${r.sw ? ' sw' : ''}">${r.sw ? `<img src="${r.sw}" alt="">` : ''}${r.tail}</span>` : ''}</div>`).join('');
    const wireH = (d.rows.length - 1) * (XF.rowH + XF.gap) + XF.rowH / 2 + 34;
    return `${heading(p, d)}<div class="content"><div class="rel">${sig}
      <i class="xr-wire" id="${p}wire" style="left:24px;top:${sigH}px;height:${wireH}px"></i>${rows}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c), n = d.rows.length;
    headIn(B, p);
    const cq = B.at('code', .06, .16, 'enter', { focal: false });
    up(p + 'code', cq.p, 30);
    B.group('l', d.lines.length, { a: .14, step: .06, len: .1, kind: 'enter' }).forEach((r, i) => codeLine(p + 'l' + (i + 1), r.p));
    const rows = B.group('t', n, { a: .3, step: .12, len: .1, kind: 'enter', dim: false });
    rows.forEach((r, i) => sx(p + 't' + (i + 1), r.p, -50));
    // the wire grows down to each row as it lands
    const reach = rows.reduce((a, r, i) => r.p > 0 ? Math.max(a, (i + eo(r.p)) / n) : a, 0);
    st(p + 'wire', { transform: 'scaleY(' + reach.toFixed(4) + ')' });
    el(p + 'code').querySelectorAll('.t').forEach(e => e.classList.toggle('hl', rows[0].p > .5));
    footIn(B, p); holdLife(B, p, d);
  }
});
