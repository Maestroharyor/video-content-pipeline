/* meter: growth, counted (projects/cloud-vs-devops). Stat tiles on the left tick up as each is named (videos stored,
   users served, bandwidth); on the right the monthly bill climbs as a bar chart with a counter under it.
   data: {eyebrow, accent, h1, stats:[{label, from, to, fmt, cls}], chart: costChart spec, counter:{from, to, fmt, cls}, sub?, foot?}
   beats: m1..mn · chart · bars · counter · sub */
defineTemplate('meter', {
  check: d => req(d, ['eyebrow', 'h1', 'stats', 'chart'], 'meter'),
  beats: d => baseBeats(d).concat(seqN('m', d.stats.length), ['chart', 'bars', 'counter', 'sub']),
  html: (d, c) => {
    // vertical canvas: the tiles sit in a row and the chart spans the column under them
    const p = c.p, G = c.grid, V = G.canvas === 'vertical', n = d.stats.length;
    const lw = V ? Math.floor((G.cw - (n - 1) * 20) / n) : 440, rx = V ? 0 : lw + 50, rw = G.cw - rx, ry = V ? 190 : 0;
    const tiles = d.stats.map((s, i) => `<div class="mt-tile ${s.cls || ''}" id="${p}m${i + 1}" style="left:${V ? i * (lw + 20) : 0}px;top:${V ? 0 : i * 150}px;width:${lw}px">
      <small>${s.label}</small><b id="${p}mv${i + 1}">${s.fmt(s.from)}</b><span class="mt-up">▲</span></div>`).join('');
    return `${heading(p, d)}<div class="content"><div class="rel">${tiles}
      <div style="position:absolute;left:${rx}px;top:${ry}px;width:${rw}px;height:420px">${costChart(Object.assign({ id: p + 'ch', x: 0, y: 0, w: rw, plotH: 250 }, d.chart))}</div>
      ${d.counter ? `<div class="badge ${d.counter.cls || 'r'}" id="${p}cnt" style="left:${rx}px;top:${ry + 440}px;font-size:40px;padding:18px 28px"><span id="${p}amt">${d.counter.fmt(d.counter.from)}</span></div>` : ''}
      ${subHtml(p, d.sub, ry + 560, G.cw)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    B.group('m', d.stats.length, { a: .08, step: .1, len: .14, kind: 'enter', dim: false }).forEach((r, i) => {
      const s = d.stats[i]; up(p + 'm' + (i + 1), r.p, 24);
      tick(p + 'mv' + (i + 1), B.on ? seg(c.local, r.s + .2, r.s + 1.2) : seg(t, r.fa, r.fb + .1), s.from, s.to, s.fmt);
    });
    const ch = B.at('chart', .4, .5); up(p + 'ch', ch.p, 30);
    const br = B.at('bars', .5, .8, 'bar', { len: BEAT.bar + (d.chart.bars.length - 1) * BEAT.stagger, after: ch, delay: .2, focal: false });
    bars(p + 'ch', d.chart.bars.length, br.p, 0, 1, .5);
    if (d.counter) { const cn = B.at('counter', .7, .82, 'tick'); pp(p + 'cnt', seg(cn.p, 0, .4), .8);
      tick(p + 'amt', B.on ? seg(c.local, cn.s, cn.s + 1.2) : cn.p, d.counter.from, d.counter.to, d.counter.fmt); }
    up(p + 'sub', B.p('sub', .9, .98));
    footIn(B, p); holdLife(B, p, d);
  }
});
