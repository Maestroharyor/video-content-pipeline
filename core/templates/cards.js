/* cards: N side-by-side cards, each with a mono title, optional tag, label/value rows with bars, and a footer line
   data: {eyebrow, accent, h1, cards:[{title, tag?: {text, cls}, rows:[{label, value, v (0..1), cls}], foot?, cls?}], minW? (340), sub?, foot?}

   Every card in a row shares one height, and .mcard is overflow:hidden, so a card that comes out too short does not
   spill — it silently swallows the end of the footer. The height therefore has to be predicted before layout, from
   text that may wrap. CARD_ADV is the average glyph advance as a fraction of the font size, measured off the three
   faces this template uses; cardLines() rounds up with it, so the estimate errs tall. A few spare pixels read as
   padding; a few missing ones cut a line of copy in half. */
const CARD_ADV = { inter: .53, id: .56, jb: .60 };
const cardW = (s, px, f) => String(s == null ? '' : s).length * px * CARD_ADV[f || 'inter'];
const cardLines = (s, px, w, f) => Math.max(1, Math.ceil(cardW(s, px, f) / Math.max(1, w)));
defineTemplate('cards', {
  check: d => req(d, ['eyebrow', 'h1', 'cards'], 'cards'),
  beats: d => baseBeats(d).concat(...d.cards.map((k, i) => ['c' + (i + 1), 'c' + (i + 1) + 't'].concat(k.rows.map((_, j) => 'c' + (i + 1) + 'b' + (j + 1)))), ['sub']),
  html: (d, c) => {
    const p = c.p, G = c.grid, n = d.cards.length, gap = 32, minW = d.minW || 340;
    const cols = Math.max(1, Math.min(n, Math.floor((G.cw + gap) / (minW + gap)))), w = Math.floor((G.cw - gap * (cols - 1)) / cols);   // wraps into rows when the column is narrow
    const rows = Math.max(...d.cards.map(k => k.rows.length));
    // box-sizing is border-box, so the inner box is the card minus 36px padding and a 2px border each side
    const inner = w - 76, LH = 30, TAGH = 28, ts = G.ts || 1;
    const headH = Math.max(...d.cards.map(k =>
      cardW(k.title, 32 * ts, 'id') + (k.tag ? 16 + cardW(k.tag.text, 22 * ts, 'jb') * 1.12 : 0) <= inner ? 44 : 44 + 4 + TAGH));
    const rowH = Math.max(1, ...d.cards.map(k => Math.max(1, ...k.rows.map(r =>
      cardW(r.label, 24 * ts, 'inter') + 12 + cardW(r.value, 22 * ts, 'jb') <= inner ? 1 : 2))));   // a card with no rows must not poison the max
    const footL = d.cards.some(k => k.foot) ? Math.max(...d.cards.map(k => k.foot ? cardLines(k.foot, 24 * ts, inner) : 0)) : 0;
    const h = 72 + headH + rows * (34 + LH * rowH + 30) + (footL ? 38 + LH * footL : 0);
    const total = Math.ceil(n / cols) * (h + gap) - gap;
    const cards = d.cards.map((k, i) => `<div class="mcard ${k.cls || ''}" id="${p}c${i + 1}" style="left:${(i % cols) * (w + gap)}px;top:${Math.floor(i / cols) * (h + gap)}px;width:${w}px;height:${h}px">
      <div class="mh"><b>${k.title}</b>${k.tag ? `<span class="tag ${k.tag.cls || d.accent || 't'}" id="${p}c${i + 1}t">${k.tag.text}</span>` : ''}</div>
      ${k.rows.map((r, j) => `<div class="mr"><div class="ml"><span>${r.label}</span><span class="${r.cls || ''}">${r.value}</span></div><div class="bar"><i class="${r.cls || 'n'}" id="${p}c${i + 1}b${j + 1}" style="width:${Math.round(100 * (r.v == null ? 1 : r.v))}%"></i></div></div>`).join('')}
      ${k.foot ? `<div class="mf">${k.foot}</div>` : ''}</div>`).join('');
    return `${heading(p, d)}<div class="content"><div class="rel">${cards}${subHtml(p, d.sub, total + 40, G.cw)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, n = d.cards.length, B = beats(c);
    headIn(B, p);
    const cards = B.group('c', n, { a: ENTER.first, step: .08, len: .18, kind: 'enter', dim: d.dim !== false });
    d.cards.forEach((k, i) => {
      const ci = p + 'c' + (i + 1), r = cards[i];
      up(ci, r.p, 50);
      k.rows.forEach((_, j) => fill(ci + 'b' + (j + 1), B.p('c' + (i + 1) + 'b' + (j + 1), .42 + i * .06 + j * .08, .62 + i * .06 + j * .08, 'bar', { after: r, delay: .25 + j * .10, focal: false })));
      pp(ci + 't', B.p('c' + (i + 1) + 't', .74 + i * .04, .84 + i * .04, 'pop', { after: r, delay: .55, focal: false }), .7);
      dim(ci, r.dim);
    });
    up(p + 'sub', B.p('sub', .84, .94));
    footIn(B, p); holdLife(B, p, d);
  }
});
