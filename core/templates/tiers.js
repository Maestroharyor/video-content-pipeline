/* tiers: the storage map as shelves. One row per data category (settings / secrets / structured / files) or per
   browser mechanism, each row reading left to right the way the write path does: CATEGORY → mechanism, with
   example chips on the right and an optional tail (a size, a quota).
   This is the spine of the where-app-stores-data deck: the same four rows come back on web, on mobile and on
   desktop, so their colours are fixed by the slide's data (a / r / b / v) and never by the section accent.
   data: {eyebrow, accent, h1, h1size?, rows:[{k, ico?, m?, msm?, cls?, chips?:[string], tail?, q?}],
          badge?:{text,cls}, sub?, foot?, gap?, rowH?}
   `m` is the mechanism, `msm` shrinks it when it is long, `q` marks a quota row (blue tail), `chips` are examples.
   beats: t1..tn (rows) · m1..mn (the mechanism) · t<i>c<j> (that row's chips) · badge · sub */
defineTemplate('tiers', {
  check: d => req(d, ['eyebrow', 'h1', 'rows'], 'tiers'),
  beats: d => baseBeats(d).concat(seqN('t', d.rows.length), seqN('m', d.rows.length), ['badge', 'sub'],
    d.rows.reduce((a, r, i) => a.concat(seqN('t' + (i + 1) + 'c', (r.chips || []).length)), [])),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, H = c.grid.ch, n = d.rows.length;
    const gap = d.gap != null ? d.gap : (n <= 4 ? 20 : 14);
    const sub = d.sub ? 96 : 0, badge = d.badge ? 84 : 0;
    const h = d.rowH != null ? d.rowH : Math.floor((H - sub - badge - gap * (n - 1)) / n);
    const rows = d.rows.map((r, i) => {
      const chips = (r.chips || []).map((x, j) => `<i id="${p}t${i + 1}c${j + 1}">${x}</i>`).join('');
      // a six-row map gives each row less height, so the chip column has to give ground to the mechanism text
      return `<div class="tr ${r.cls || d.accent || 'a'}${r.q ? ' qta' : ''}" id="${p}t${i + 1}" style="left:0;top:${i * (h + gap)}px;width:${w}px;height:${h}px">
        ${r.ico ? `<span class="ti"><svg viewBox="0 0 24 24"><use href="#${r.ico}"/></svg></span>` : ''}<span class="tk">${r.k}</span>${r.m ? `<span class="tarrow"></span><span class="tm${r.msm ? ' sm' : ''}" id="${p}m${i + 1}">${r.m}</span>` : ''}
        ${chips ? `<div class="tc"${c.grid.canvas === 'vertical' ? '' : ` style="max-width:${n >= 5 ? 460 : 560}px"`}>${chips}</div>` : ''}${r.tail ? `<span class="ttail">${r.tail}</span>` : ''}</div>`;
    }).join('');
    const after = n * (h + gap);
    return `${heading(p, d)}<div class="content"><div class="rel">${rows}
      ${d.badge ? `<div class="badge ${d.badge.cls || 'n'}" id="${p}bd" style="left:0;top:${Math.min(after, H - 76)}px;font-size:30px">${d.badge.text}</div>` : ''}
      ${subHtml(p, d.sub, Math.min(after + badge, H - 70), w)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, n = d.rows.length, B = beats(c);
    headIn(B, p);
    const span = Math.min(.52, .13 * n);
    const rows = B.group('t', n, { a: ENTER.first, step: span / n, len: ENTER.len, kind: 'enter', dim: d.dim !== false });
    rows.forEach((r, i) => {
      const id = p + 't' + (i + 1);
      sx(id, r.p, -80);                        // the write path: shelves arrive from the left, they do not rise
      const m = B.at('m' + (i + 1), r.fa + .05, r.fa + .13, 'enter', { after: r, delay: .10, focal: false });
      wipe(p + 'm' + (i + 1), m.p, 'right');
      const chips = d.rows[i].chips || [];
      if (chips.length) B.group('t' + (i + 1) + 'c', chips.length, { a: r.fa + .08, step: .028, len: .09, kind: 'pop' })
        .forEach((cr, j) => pp(p + 't' + (i + 1) + 'c' + (j + 1), cr.p, .8));
      dim(id, r.dim);                          // de-emphasise, never remove, once a later shelf opens
    });
    pp(p + 'bd', B.p('badge', .78, .88, 'pop'), .84);
    up(p + 'sub', B.p('sub', .84, .94));
    footIn(B, p); holdLife(B, p, d);
  }
});
