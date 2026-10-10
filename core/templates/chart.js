/* chart: dark cost/metric bar chart with optional counter badge and badges
   data: {eyebrow, accent, h1, chart: costChart spec (no id/x/y), counter?: {from, to, fmt, cls}, badges?: [...], sub?, foot?} */
defineTemplate('chart', {
  check: d => req(d, ['eyebrow', 'h1', 'chart'], 'chart'),
  beats: d => baseBeats(d).concat(['chart', 'bars', 'counter'], seqN('bd', (d.badges || []).length), ['sub']),
  html: (d, c) => {
    const p = c.p, G = c.grid, w = G.cw, plotH = d.chart.plotH || (G.canvas === 'vertical' ? 380 : 300);
    const chartH = plotH + 160;
    return `${heading(p, d)}<div class="content"><div class="rel">
      ${costChart(Object.assign({ id: p + 'ch', x: 0, y: 0, w, plotH }, d.chart))}
      ${d.counter ? `<div class="badge ${d.counter.cls || 'a'}" id="${p}cnt" style="left:0;top:${chartH + 20}px;font-size:40px;padding:18px 28px"><span id="${p}amt">${d.counter.fmt(d.counter.from)}</span></div>` : ''}
      ${badges(p, d.badges, chartH + 20)}
      ${subHtml(p, d.sub, chartH + 130, w)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    const ch = B.at('chart', .08, .22);
    up(p + 'ch', ch.p, 40);
    const br = B.at('bars', .20, .66, 'bar', { len: BEAT.bar + (d.chart.bars.length - 1) * BEAT.stagger, after: ch, delay: .2, focal: false });
    bars(p + 'ch', d.chart.bars.length, br.p, 0, 1, .5);
    const cn = B.at('counter', .58, .70, 'tick');
    pp(p + 'cnt', seg(cn.p, 0, .4), .8);
    if (d.counter) tick(p + 'amt', cn.beat ? cn.p : B.p('counter', .60, .90, 'tick', { chain: false }), d.counter.from, d.counter.to, d.counter.fmt);
    badgesIn(B, p, (d.badges || []).length, .66);
    up(p + 'sub', B.p('sub', .82, .94));
    footIn(B, p); holdLife(B, p, d);
  }
});
