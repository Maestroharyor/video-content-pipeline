/* swap: rows of "the heavy thing, crossed out → the light thing you do instead" (projects/ai-context-window).
   The script says "Instead of… instead of… instead of…" three times in fourteen seconds. As three `compare`
   slides that was three rebuilds of one layout, and the quotes overflowed the stock 228px panel and collected
   three strike lines each. As one slide it is three rows that land on their own lines and stay, which is what
   "these are the same idea" actually looks like.

   data: {eyebrow, accent, h1, h1size?, foot?, sub?,
     rows: [{ from, to }],            // from = struck; to = what you do instead
     head?: {from, to},               // the two column captions
   }
   beats: p1..pn (the row arrives) · s1..sn (its left half is struck) · label · em · foot · sub

   The strike is MEASURED onto the text (strikeText), not laid over the box. It started life as a single rule at
   top:50% of the row, which worked only by accident: a one-line `from` has its glyphs at the vertical middle, so
   the rule crossed them. The moment a `from` wrapped to two lines — which two of the three do, because the column
   is 470px and "The whole knowledge base in the prompt" needs about 600 — the rule landed in the leading gap
   between the lines and read as an underline of the first one. strikeText emits one path per rendered line, which
   is exactly the case this has, and is what statement/compare/desk already use. */
const SW = { y: 150, h: 126, gap: 26, lw: 470, arrow: 92 };

defineTemplate('swap', {
  check: d => req(d, ['eyebrow', 'h1', 'rows'], 'swap'),
  beats: d => baseBeats(d).concat(seqN('p', d.rows.length), seqN('s', d.rows.length), ['label', 'sub']),
  html: (d, c) => {
    const p = c.p, G = c.grid, rw = d.rows.length;
    const rightX = SW.lw + SW.arrow, rightW = G.cw - rightX;
    const head = d.head ? `<div class="sw-head" style="top:0">
        <span style="left:0;width:${SW.lw}px">${d.head.from}</span>
        <span style="left:${rightX}px;width:${rightW}px">${d.head.to}</span></div>` : '';
    const rows = d.rows.map((r, i) => {
      const y = (d.head ? 52 : 0) + i * (SW.h + SW.gap);
      /* the strike svg is a sibling of the panel, not a child: strikeText measures against the row box and
         writes its own viewBox/left/top, and a child would be clipped by the panel's border-radius */
      return `<div class="sw-row" id="${p}p${i + 1}" style="top:${y}px;height:${SW.h}px">
        <div class="sw-from" style="left:0;width:${SW.lw}px;height:${SW.h}px"><b id="${p}ft${i + 1}">${r.from}</b></div>
        <svg class="strike" id="${p}s${i + 1}" style="left:0;top:0;width:0;height:0" viewBox="0 0 1 1"></svg>
        <div class="sw-arw" style="left:${SW.lw}px;width:${SW.arrow}px;height:${SW.h}px"><svg viewBox="0 0 92 24"><path d="M6 12 H74"/><path d="M66 5 L78 12 L66 19"/></svg></div>
        <div class="sw-to" style="left:${rightX}px;width:${rightW}px;height:${SW.h}px"><b>${r.to}</b></div>
      </div>`;
    }).join('');
    const after = (d.head ? 52 : 0) + rw * (SW.h + SW.gap) + 18;
    return `${heading(p, d)}<div class="content"><div class="rel" style="position:relative;top:${SW.y - c.grid.cy}px">
      ${head}${rows}
      ${d.label ? `<div class="dlab on" id="${p}label" style="left:0;top:${after}px;width:${G.cw}px;text-align:center">${d.label}</div>` : ''}
      ${subHtml(p, d.sub, after + (d.label ? 58 : 0), G.cw)}</div></div>`;
  },
  /* one measurement per row; the webfont is wider than the fallback, so this is redone once fonts report loaded */
  place: (d, c) => {
    const p = c.p;
    d._struck = d.rows.every((_, i) => strikeText(p + 's' + (i + 1), p + 'ft' + (i + 1))) && document.fonts.status === 'loaded';
  },
  setup: (root, d, c) => { TEMPLATES.swap.place(d, c); },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    if (!d._struck) TEMPLATES.swap.place(d, c);
    headIn(B, p);
    const n = d.rows.length;
    const rows = B.group('p', n, { a: .14, step: .16, len: .16, kind: 'enter', dim: true });
    rows.forEach((r, i) => {
      sx(p + 'p' + (i + 1), r.p, -60);
      /* the strokes are drawn left to right across the struck half, after its row has settled */
      const cut = B.at('s' + (i + 1), r.fa + .10, r.fa + .22, 'draw', { after: r, delay: .34, focal: false });
      draw(p + 's' + (i + 1), cl(cut.p, 0, 1));
      dim(p + 'p' + (i + 1), r.dim);
    });
    up(p + 'label', B.p('label', .84, .94), 16);
    up(p + 'sub', B.p('sub', .88, .98));
    footIn(B, p); holdLife(B, p, d, { alias: { label: 'label' } });
  }
});
