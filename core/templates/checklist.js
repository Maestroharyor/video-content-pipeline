/* checklist: rows that get ticked one by one, optional chart below and a closing badge
   data: {eyebrow, accent, h1, items:[{icon, brand?, text, sub?, tail?}], chart?: costChart spec, badge?: {text, cls}, foot?} */
defineTemplate('checklist', {
  check: d => req(d, ['eyebrow', 'h1', 'items'], 'checklist'),
  beats: d => baseBeats(d).concat(seqN('c', d.items.length), seqN('ck', d.items.length), ['chart', 'bars', 'badge']),
  html: (d, c) => {
    const p = c.p, G = c.grid, w = G.cw, H = G.ch, n = d.items.length;
    const plotH = G.canvas === 'vertical' ? 230 : 160, tail = G.canvas === 'vertical' ? 170 : 110;
    // The row pitch was a hard 128px from the top with no bound, so four rows plus a chart put the badge 36px
    // below the safe line, under the player's own caption box. Shrink the pitch to what the box can hold
    // (a .chk row is 104px tall, so 112 is the floor) and clamp the chart and badge as a backstop.
    const extras = 40 + (d.chart ? plotH + tail : 0) + (d.badge ? 84 : 0);
    const pitch = Math.max(112, Math.min(128, Math.floor((H - extras) / n)));
    const rows = d.items.map((it, i) => checkRow(Object.assign({ id: p + 'c' + (i + 1), y: i * pitch }, it))).join('');
    const chartY = n * pitch + 40;
    const badgeY = Math.min(d.chart ? chartY + plotH + tail : chartY, H - 80);
    return `${heading(p, d)}<div class="content"><div class="rel">${rows}
      ${d.chart ? costChart(Object.assign({ id: p + 'ch', x: 0, y: chartY, w, plotH }, d.chart)) : ''}
      ${d.badge ? `<div class="badge ${d.badge.cls || 'g'}" id="${p}bd" style="left:0;top:${badgeY}px;font-size:36px;padding:18px 28px">${d.badge.text}</div>` : ''}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, n = d.items.length, B = beats(c);
    headIn(B, p);
    const rows = B.group('c', n, { a: .08, step: .36 / n, len: .14, kind: 'enter', dim: d.dim === true });
    d.items.forEach((_, i) => {
      const id = p + 'c' + (i + 1), r = rows[i];
      sx(id, r.p, -60);
      const ck = B.p('ck' + (i + 1), .22 + i * (.40 / n), .30 + i * (.40 / n), 'draw', { after: r, delay: .30, focal: false });
      draw(id + '-ck', ck); cls(id, 'done', ck > .2); dim(id, r.dim);
    });
    const ch = B.at('chart', .62, .72);
    up(p + 'ch', ch.p, 40);
    if (d.chart) { const br = B.at('bars', .68, .90, 'bar', { len: BEAT.bar + (d.chart.bars.length - 1) * BEAT.stagger, after: ch, delay: .2, focal: false }); bars(p + 'ch', d.chart.bars.length, br.p, 0, 1, .5); }
    pp(p + 'bd', B.p('badge', .86, .96, 'pop'), .8);
    footIn(B, p); holdLife(B, p, d);
  }
});
