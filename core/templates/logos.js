/* logos: a row of logo tiles with captions, optional note badge and sub
   data: {eyebrow, accent, h1, items:[{icon, brand?, label} | {src, label}], size?: 'sm'|''|'lg', note?: {text, cls}, sub?, foot?}
   An item gives either `icon` (a logo() name) or `src` (a full URL, i.e. passet('devin.svg')) for a mark
   simple-icons does not ship — logoStack has always taken `src`, this only passes it on. */
defineTemplate('logos', {
  check: d => req(d, ['eyebrow', 'h1', 'items'], 'logos'),
  beats: d => baseBeats(d).concat(seqN('t', d.items.length), ['note', 'sub']),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, n = d.items.length, colW = Math.floor(w / n), sw = Math.max(180, Math.min(colW - 40, 300));   // stack width grows with the column so long labels fit
    const tiles = d.items.map((it, i) => logoStack({ id: p + 't' + (i + 1), x: colW * i + Math.round((colW - sw) / 2), y: 0, icon: it.icon, src: it.src, brand: it.brand, label: it.label, size: d.size || 'lg', w: sw })).join('');
    return `${heading(p, d)}<div class="content"><div class="rel">${tiles}
      ${d.note ? `<div class="badge ${d.note.cls || 't'} note" id="${p}note" style="left:0;top:300px;width:${w}px">${d.note.text}</div>` : ''}
      ${subHtml(p, d.sub, d.note ? 470 : 300, w)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, n = d.items.length, B = beats(c);
    headIn(B, p);
    B.group('t', n, { a: ENTER.first, step: ENTER.step, len: .14, kind: 'pop', dim: d.dim === true }).forEach((r, i) => { pp(p + 't' + (i + 1), r.p, .78); dim(p + 't' + (i + 1), r.dim); });
    up(p + 'note', B.p('note', .62, .74));
    up(p + 'sub', B.p('sub', .76, .88));
    footIn(B, p); holdLife(B, p, d);
  }
});
