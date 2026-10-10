/* compare: two panels with a separator glyph, optional strike on one side, optional icon row
   data: {eyebrow, accent, h1, left:{lb, qt, cls, avatar?}, right:{lb, qt, cls, avatar?}, sep?: '≠'|'vs'|'→', strike?: 'left'|'right', icons?: [{icon, brand?, label}], sub?, foot?}
   `avatar` puts a figure above a panel (a full image url, not a logo() name). Optional and off by default; the
   same src on both sides is the point where it is used — one person, two sessions.
   The strike is measured onto the text it crosses out (strikeText), not laid over the panel box. */
defineTemplate('compare', {
  check: d => req(d, ['eyebrow', 'h1', 'left', 'right'], 'compare'),
  beats: d => baseBeats(d).concat(['l', 'neq', 'r', 'strike'], seqN('i', (d.icons || []).length), ['sub']),
  html: (d, c) => {
    const p = c.p, G = c.grid, side = G.canvas === 'horizontal';
    const pw = side ? Math.floor((G.cw - 140) / 2) : G.cw, ph = 228;   // 200 left ~1px of headroom under a two-line quote, which spilled both ways (the panel is centred flex, overflow visible)
    const rx = side ? pw + 140 : 0, ry = side ? 0 : 340;
    const SEP = 96, sepX = Math.round(side ? pw + 70 - SEP / 2 : pw / 2 - SEP / 2), sepY = Math.round(side ? ph / 2 - SEP / 2 : (ph + ry) / 2 - SEP / 2);   // centred in the gap
    const strike = d.strike ? `<svg class="strike" id="${p}st" style="left:0;top:0;width:0;height:0" viewBox="0 0 1 1"></svg>` : '';
    /* An optional figure under each panel, centred on it, riding the panel's own beat so there is nothing new to
       author. Below and not above: the content box starts at y 150 on this canvas, so an avatar hung above the
       panels lands at absolute y 16, well past the 56px safe line. */
    const AV = 108, hasAv = !!(d.left.avatar || d.right.avatar), avY = ph + 34;
    const av = (sd, id, x) => sd.avatar
      ? avatar({ id: p + id, x: Math.round(x + pw / 2 - AV / 2), y: avY, size: AV, src: sd.avatar })
      : '';
    const iconsY = side ? ph + 80 : 600;
    const icons = (d.icons || []).map((ic, i) => logoStack({ id: p + 'i' + (i + 1), x: Math.round((G.cw / (d.icons.length)) * i + 40), y: iconsY, icon: ic.icon, brand: ic.brand, label: ic.label, size: 'sm', w: 160 })).join('');
    return `${heading(p, d)}<div class="content"><div class="rel">
      ${av(d.left, 'lav', 0)}${av(d.right, 'rav', rx)}
      <div class="cmp ${d.left.cls || ''}" id="${p}l" style="left:0;top:0;width:${pw}px;height:${ph}px"><span class="lb">${d.left.lb}</span><span class="qt" id="${p}lqt">${d.left.qt}</span></div>
      <div class="badge o" id="${p}neq" style="left:${sepX}px;top:${sepY}px;width:${SEP}px;height:${SEP}px;justify-content:center;padding:0;font:800 56px ID;line-height:1">${d.sep || '≠'}</div>
      <div class="cmp ${d.right.cls || 'r'}" id="${p}r" style="left:${rx}px;top:${ry}px;width:${pw}px;height:${ph}px"><span class="lb">${d.right.lb}</span><span class="qt" id="${p}rqt">${d.right.qt}</span></div>
      ${strike}${icons}${subHtml(p, d.sub, (d.icons ? iconsY + 220 : hasAv ? avY + AV + 34 : (side ? ph + 60 : 600)), G.cw)}</div></div>`;
  },
  // the strike is measured onto the real text; the webfont is wider than the fallback, so it is redone once loaded
  place: (d, c) => { if (d.strike) d._struck = strikeText(c.p + 'st', c.p + (d.strike === 'right' ? 'r' : 'l') + 'qt') && document.fonts.status === 'loaded'; },
  setup: (root, d, c) => { TEMPLATES.compare.place(d, c); },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c);
    if (d.strike && !d._struck) TEMPLATES.compare.place(d, c);
    headIn(B, p);
    const lp = B.p('l', .14, .30), rp = B.p('r', .40, .56);
    if (d.left.avatar) pp(p + 'lav', lp, .74);
    if (d.right.avatar) pp(p + 'rav', rp, .74);
    sx(p + 'l', lp, -70);
    pp(p + 'neq', B.p('neq', .34, .46, 'pop'), .5);
    sx(p + 'r', rp, 70);
    draw(p + 'st', B.p('strike', .58, .70, 'draw'));
    B.group('i', (d.icons || []).length, { a: .66, step: .05, len: .12, kind: 'pop' }).forEach((r, i) => pp(p + 'i' + (i + 1), r.p, .7));
    up(p + 'sub', B.p('sub', .84, .94));
    footIn(B, p); holdLife(B, p, d);
  }
});
