/* list: staggered rows. style 'rowbar' (compact), 'node' (icon + title + sub, numbered) or 'chk' (checkbox rows that get ticked)
   data: {eyebrow, accent, h1, style?, items:[{icon?, brand?, src? (rowbar/node: any image url, e.g. passet()), text, sub?, num?, tail?, cls?, redacted?}], badge?: {text, cls}, sub?, foot?}

   `items[].redacted` is the teaser placeholder ("? ? ? ?"): the row lands showing it and swaps to its real
   `text` on its own `rv<i>` beat, gaining the accent as it does. references/design-rules.md already prescribes
   this ("never give the list away in its intro slide") but the template could not express it, so a deck had to
   spend one slide per reveal and rebuild the whole list between them. With rv beats the list is built once and
   the narration walks it. Rows without `redacted` behave exactly as before. */
defineTemplate('list', {
  check: d => req(d, ['eyebrow', 'h1', 'items'], 'list'),
  beats: d => baseBeats(d).concat(seqN('r', d.items.length), d.items.some(i => i.redacted) ? seqN('rv', d.items.length) : [],
    d.style === 'chk' ? seqN('ck', d.items.length) : d.style === 'node' ? seqN('n', d.items.length) : [], ['badge', 'sub']),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, style = d.style || 'rowbar', vert = c.grid.canvas === 'vertical';
    let step = style === 'node' ? (vert ? 250 : 220) : style === 'chk' ? 128 : 120;
    let nodeH = vert ? 210 : 190;
    /* Four `node` rows are 880px tall, and the horizontal content box is 686px once captions take their band:
       the fourth row landed below the 870 safe line (the probe caught it). Shrink the pitch to fit instead of
       overflowing; 140px is the floor because a node's contents are 136px tall. */
    const need = d.items.length * step + (d.badge ? 84 : 0) + (d.sub ? 96 : 0);
    if (need > c.grid.ch) {
      const f = c.grid.ch / need;
      step = Math.floor(step * f);
      if (style === 'node') nodeH = Math.max(140, Math.floor(nodeH * f));
    }
    const rows = d.items.map((it, i) => {
      const id = p + 'r' + (i + 1), y = i * step;
      if (style === 'chk') return checkRow({ id, y, icon: it.icon, brand: it.brand, src: it.src, src2: it.src2, text: it.text, sub: it.sub, tail: it.tail });
      if (style === 'node') return `<div class="node col" id="${id}" style="left:0;top:${y}px;width:${w}px;height:${nodeH}px;flex-direction:row;justify-content:flex-start;gap:34px;padding:0 40px">
        ${it.num ? `<span class="badge ${d.accent || 't'}" id="${p}n${i + 1}" style="position:static;font-size:30px;padding:10px 20px">${it.num}</span>` : ''}
        ${it.src || it.icon ? `<div class="ltile lg${it.brand || it.raw || it.src ? '' : ' sq'}"><img src="${it.src || (it.brand ? logo(it.icon, true) : logo(it.icon))}" alt=""></div>` : ''}
        <span class="nt" style="text-align:left"><b id="${id}-tx" style="font-size:44px;font-family:ID;font-weight:800">${it.redacted || it.text}</b><i style="font-size:28px">${it.sub || ''}</i></span></div>`;
      return `<div class="rowbar big ${it.cls || ''}" id="${id}" style="left:0;top:${y}px;width:${w}px">${it.src || it.icon ? `<img src="${it.src || (it.brand ? logo(it.icon, true) : logo(it.icon))}" alt="">` : ''}<span id="${id}-tx">${it.redacted || it.text}</span>${it.tail ? `<span class="tail">${it.tail}</span>` : ''}</div>`;
    }).join('');
    const after = d.items.length * step + 20;
    return `${heading(p, d)}<div class="content"><div class="rel">${rows}
      ${d.badge ? `<div class="badge ${d.badge.cls || 'n'}" id="${p}bd" style="left:0;top:${after}px;font-size:34px">${d.badge.text}</div>` : ''}
      ${subHtml(p, d.sub, after + (d.badge ? 100 : 0), w)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, n = d.items.length, style = d.style || 'rowbar', B = beats(c);
    headIn(B, p);
    const a = ENTER.first, span = Math.min(.5, .12 * n);
    const rows = B.group('r', n, { a, step: span / n, len: ENTER.len, kind: 'enter', dim: d.dim !== false });
    d.items.forEach((_, i) => {
      const id = p + 'r' + (i + 1), r = rows[i];
      sx(id, r.p, -70);
      if (style === 'node') pp(p + 'n' + (i + 1), B.p('n' + (i + 1), r.fa + .12, r.fa + .24, 'pop', { after: r, delay: .12, focal: false }), .6);
      if (style === 'chk') { const ck = B.p('ck' + (i + 1), .52 + i * (.32 / n), .60 + i * (.32 / n), 'draw', { after: r, delay: .30, focal: false }); draw(id + '-ck', ck); cls(id, 'done', ck > .2); }
      dim(id, r.dim);
    });
    /* rv<i>: the row's real name replaces its placeholder on the spoken word. Rows already revealed stay
       revealed and dim; the ones still to come keep their placeholder, which is what holds the viewer. */
    if (d.items.some(it => it.redacted)) {
      let last = -1;
      d.items.forEach((it, i) => { if (it.redacted && B.M && B.M['rv' + (i + 1)] && c.local >= B.M['rv' + (i + 1)].s) last = i; });
      d.items.forEach((it, i) => {
        if (!it.redacted) return;
        const id = p + 'r' + (i + 1), bt = B.at('rv' + (i + 1), .30 + i * .14, .40 + i * .14, 'pop');
        const on = bt.p > .35;
        txt(id + '-tx', on ? it.text : it.redacted);
        cls(id, it.cls || (d.accent || 't'), on);
        if (on && i === last) pp(id + '-tx', bt.p, .9);          // only the newest reveal pops
        else st(id + '-tx', { transform: 'none' });
        if (on && i !== last) dim(id, 1, .62);                   // the ones already covered step back
      });
    }
    pp(p + 'bd', B.p('badge', .74, .86, 'pop'), .84);
    up(p + 'sub', B.p('sub', .82, .94));
    footIn(B, p); holdLife(B, p, d);
  }
});
