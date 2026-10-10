/* noc: the monitoring dashboard on the wall of the incident room (projects/resilience-braandly, theme `incident`).
   One frame with a header bar and panels laid out in rows: a `half` panel pairs with the next half, a full one takes
   the row. The same frame tells three states of the story: every panel empty (what there was), panels alive (what
   there should be), or an incident timeline instead of panels (what should have happened, and what did).
   data: {eyebrow, accent, h1, title, range?, state?: 'ok'|'bad'|'none',
          panels?: [{title, kind: 'empty'|'graph'|'logs'|'trace', half?, value?, note?,
                     pts?: [0..1] (graph), limit?: 0..1 (graph threshold), lines?: [html] (logs), spans?: [{l, a, b, cls}] (trace)}],
          chip?: {text, cls},  timeline?: [{beat, t, title, sub?, cls?, ghost?, icon?}], sub?, foot?}
   beats: dash · p1..pn (panel arrives; its content plays from there) · basic (chip) · x (chip struck) ·
          every timeline row's `beat` name · sub */
const NC = { head: 64, gap: 20, ph: 320, pad: 22, tlH: 150 };
function ncLayout(d, W) {
  const half = (W - NC.gap) / 2; let x = 0, y = NC.head + NC.gap; const out = [];
  (d.panels || []).forEach(pn => {
    const w = pn.half ? half : W, h = pn.h || NC.ph;
    if (!pn.half && x > 0) { x = 0; y += NC.ph + NC.gap; }
    out.push({ x, y, w, h });
    if (pn.half && x === 0) x = half + NC.gap; else { x = 0; y += h + NC.gap; }
  });
  if (x > 0) y += NC.ph + NC.gap;
  if (d.timeline) y += d.timeline.length * NC.tlH;
  return { boxes: out, end: y };
}
const NC_ICON = {
  bell: '<svg viewBox="0 0 24 24"><use href="#i-bell"/></svg>', clock: '<svg viewBox="0 0 24 24"><use href="#i-clock"/></svg>',
  warn: '<svg viewBox="0 0 24 24"><use href="#i-warn"/></svg>', browser: '<svg viewBox="0 0 24 24"><use href="#i-browser"/></svg>',
};
function ncBody(p, i, pn, b) {
  const iw = b.w - NC.pad * 2, ih = b.h - 70 - NC.pad;
  if (pn.kind === 'empty') return `<div class="nv">${pn.value || 'No data'}</div><div class="nn">${pn.note || ''}</div>
    <svg class="nx" id="${p}x${i}" viewBox="0 0 24 24"><path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg><div class="nflat"></div>`;
  if (pn.kind === 'graph') {
    const pts = pn.pts, n = pts.length, X = k => (k / (n - 1)) * iw, Y = v => ih - v * ih;
    const dpath = pts.map((v, k) => (k ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
    const pk = pts.indexOf(Math.max(...pts)), ly = Y(pn.limit != null ? pn.limit : .7);
    return `<svg class="ng" viewBox="0 0 ${iw} ${ih}" width="${iw}" height="${ih}">
      ${[.25, .5, .75].map(g => `<line class="gl" x1="0" x2="${iw}" y1="${(ih * g).toFixed(1)}" y2="${(ih * g).toFixed(1)}"/>`).join('')}
      <line class="lim" id="${p}lim${i}" x1="0" x2="${iw}" y1="${ly.toFixed(1)}" y2="${ly.toFixed(1)}"/>
      <g class="gline" id="${p}g${i}"><path d="${dpath}"/></g>
      <circle class="pk" id="${p}pk${i}" cx="${X(pk).toFixed(1)}" cy="${Y(pts[pk]).toFixed(1)}" r="10"/></svg>
      <span class="ntag" id="${p}tg${i}" style="left:${Math.min(iw - 250, Math.max(0, X(pk) - 120)).toFixed(0)}px;top:${Math.max(0, ly - 54).toFixed(0)}px">${pn.value || 'alert fired'}</span>`;
  }
  if (pn.kind === 'logs') return `<div class="nlog">${pn.lines.map((l, k) => `<span id="${p}l${i}_${k}">${l}</span>`).join('')}</div>`;
  if (pn.kind === 'trace') return `<div class="ntr">${pn.spans.map((s, k) => `<div class="sp" style="top:${k * 44}px"><span class="sl">${s.l}</span>
      <span class="sb"><i id="${p}sp${i}_${k}" class="${s.cls || 'b'}" style="left:${(s.a * 100).toFixed(1)}%;width:${((s.b - s.a) * 100).toFixed(1)}%"></i></span></div>`).join('')}</div>`;
  return '';
}
defineTemplate('noc', {
  check: d => req(d, ['eyebrow', 'h1', 'title'], 'noc'),
  beats: d => baseBeats(d).concat(['dash'], seqN('p', (d.panels || []).length), d.chip ? ['basic', 'x'] : [],
    (d.timeline || []).map(r => r.beat), ['sub']),
  html: (d, c) => {
    const p = c.p, W = c.grid.cw, L = ncLayout(d, W);
    const panels = (d.panels || []).map((pn, i) => { const b = L.boxes[i];
      return `<div class="ic-pn ${pn.kind}" id="${p}p${i + 1}" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px">
        <div class="pt"><b>${pn.title}</b></div><div class="pb" style="left:${NC.pad}px;top:70px;width:${b.w - NC.pad * 2}px;height:${b.h - 70 - NC.pad}px">${ncBody(p, i + 1, pn, b)}</div></div>`; }).join('');
    const ty = L.end - (d.timeline ? d.timeline.length * NC.tlH : 0);
    const tl = (d.timeline || []).map((r, i) => `<div class="ic-tl ${r.cls || ''}${r.ghost ? ' ghost' : ''}" id="${p}${r.beat}" style="left:0;top:${ty + i * NC.tlH}px;width:${W}px;height:${NC.tlH - 22}px">
        <span class="tt">${r.t}</span><span class="ti">${NC_ICON[r.icon || 'clock']}</span><span class="tx"><b>${r.title}</b><i>${r.sub || ''}</i></span></div>`).join('');
    const rail = d.timeline ? `<div class="ic-rail" style="left:186px;top:${ty + 20}px;height:${d.timeline.length * NC.tlH - 62}px"></div>` : '';
    const chipY = L.end + 6;
    return `${heading(p, d)}<div class="content"><div class="rel" style="height:${chipY + (d.chip ? 90 : 0)}px">
      <div class="ic-dash ${d.state || ''}" id="${p}dash" style="left:-14px;top:-14px;width:${W + 28}px;height:${L.end + 14 - (d.timeline ? 8 : NC.gap) + 14}px"></div>
      <div class="ic-dh" id="${p}dh" style="left:0;top:0;width:${W}px;height:${NC.head}px"><span class="dot"></span><b>${d.title}</b><i>${d.range || 'Last 15 min'}</i></div>
      ${panels}${rail}${tl}
      ${d.chip ? `<div class="chip ${d.chip.cls || 'n'} ic-chip" id="${p}basic" style="position:absolute;left:0;top:${chipY}px">${d.chip.text}</div>
        <svg class="strike" id="${p}xs" style="left:0;top:0;width:0;height:0" viewBox="0 0 1 1"></svg>` : ''}
      ${subHtml(p, d.sub, chipY + (d.chip ? 110 : 10), W)}</div></div>`;
  },
  place: (d, c) => { if (d.chip) d._struck = strikeText(c.p + 'xs', c.p + 'basic') && document.fonts.status === 'loaded'; },
  setup: (root, d, c) => { TEMPLATES.noc.place(d, c); },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c);
    if (d.chip && !d._struck) TEMPLATES.noc.place(d, c);
    headIn(B, p);
    const dash = B.at('dash', .04, .14);
    fd(p + 'dash', eo(dash.p)); up(p + 'dh', dash.p, 14);
    const recs = B.group('p', (d.panels || []).length, { a: .16, step: .14, len: .12, kind: 'enter', dim: false });
    (d.panels || []).forEach((pn, k) => {
      const i = k + 1, r = recs[k], id = p + 'p' + i;
      up(id, r.p, 26);
      // the panel's content plays from the moment it has landed (a pure function of the clock)
      const after = (lag, len) => B.on ? seg(c.local, r.s + lag, r.s + lag + len) : seg(t, r.fb + lag / 10, r.fb + (lag + len) / 10);
      if (pn.kind === 'empty') pp(p + 'x' + i, after(.35, .3), .3);
      if (pn.kind === 'graph') { draw(p + 'g' + i, after(.2, .9)); fd(p + 'lim' + i, after(.1, .3)); pp(p + 'pk' + i, after(.95, .3), .2); pp(p + 'tg' + i, after(1.1, .3), .7); }
      if (pn.kind === 'logs') pn.lines.forEach((_, j) => up(p + 'l' + i + '_' + j, after(.2 + j * .16, .2), 8));
      if (pn.kind === 'trace') pn.spans.forEach((_, j) => fill(p + 'sp' + i + '_' + j, after(.2 + j * .14, .4)));
    });
    if (d.chip) {
      const bc = B.at('basic', .7, .8, 'pop'); pp(p + 'basic', bc.p, .8);
      // the chip pops in from a scale, and a rect read mid-pop is that much short: measure once it has settled
      if (bc.p >= 1 && !d._settled) { TEMPLATES.noc.place(d, c); d._settled = d._struck; }
      const xs = B.p('x', .82, .9, 'draw'); draw(p + 'xs', xs); dim(p + 'basic', xs, .55);
    }
    // timeline rows: a ghost (what should have happened) lands dashed and grey, the rest solid
    (d.timeline || []).forEach((r, k) => sx(p + r.beat, B.p(r.beat, .2 + k * .2, .32 + k * .2), -50));
    up(p + 'sub', B.p('sub', .9, .98));
    footIn(B, p); holdLife(B, p, d);
  }
});
