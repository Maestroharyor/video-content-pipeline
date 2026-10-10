/* title: eyebrow + headline + hero logo/badge (+ optional chart) + sub
   data: {eyebrow, accent, h1, h1size?, sub?, foot?, hero?: {logo, brand?}, badge?: {text, cls, counter?: {from, to, fmt}}, chart?: costChart spec, chips?: [{text, cls}], figure?: {kind, ...}} */
defineTemplate('title', {
  check: d => req(d, ['eyebrow', 'h1'], 'title'),
  beats: d => baseBeats(d).concat(['hero', 'chart', 'bars', 'badge', 'counter'], seqN('k', (d.chips || []).length), ['fig', 'sub']),
  html: (d, c) => {
    const G = c.grid, p = c.p;
    const hero = d.hero ? `<div class="ltile lg${d.hero.brand ? '' : ' sq'} abs" id="${p}hero" style="left:0;top:0"><img src="${d.hero.brand ? logo(d.hero.logo, true) : logo(d.hero.logo)}" alt="" style="background:#fff"></div>` : '';
    const badge = d.badge ? `<div class="badge ${d.badge.cls || 'o'}" id="${p}bd" style="left:${d.hero ? 190 : 0}px;top:34px;font-size:34px"><span id="${p}amt">${d.badge.counter ? d.badge.counter.fmt(d.badge.counter.from) : d.badge.text}</span></div>` : '';
    const chartY = d.hero || d.badge ? 220 : 0;
    const chart = d.chart ? costChart(Object.assign({ id: p + 'ch', x: 0, y: chartY, w: G.cw, plotH: G.canvas === 'vertical' ? 420 : 300 }, d.chart)) : '';
    const chipsY = d.chart ? chartY + (G.canvas === 'vertical' ? 660 : 520) : (d.hero || d.badge ? 220 : 0);
    const chips = d.chips ? `<div class="abs" id="${p}chips" style="left:0;top:${chipsY}px;display:flex;flex-wrap:wrap;gap:16px;width:${G.cw}px">${d.chips.map((k, i) => `<span class="chip ${k.cls || d.accent || ''}" id="${p}k${i + 1}">${k.text}</span>`).join('')}</div>` : '';
    const subY = chipsY + (d.chips ? 110 : 0);
    return `${heading(p, d)}<div class="content"><div class="rel">${hero}${badge}${chart}${chips}${subHtml(p, d.sub, subY, G.cw)}</div></div>${figHtml(p, d.figure)}`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    pp(p + 'hero', B.p('hero', .16, .28, 'pop'), .8);
    if (t >= 1 && c.hold > 0) st(p + 'hero', { transform: 'scale(' + idle(c.hold).toFixed(4) + ')' });   // breathe while held
    const ch = B.at('chart', .18, .32);
    up(p + 'ch', ch.p, 50);
    if (d.chart) { const br = B.at('bars', .30, .74, 'bar', { len: BEAT.bar + (d.chart.bars.length - 1) * BEAT.stagger, after: ch, delay: .2, focal: false }); bars(p + 'ch', d.chart.bars.length, br.p, 0, 1, .5); }
    const b = B.p('badge', .40, .52, 'pop');
    st(p + 'bd', { opacity: eo(b), transform: 'translateY(' + ((1 - eo(b)) * 20) + 'px)' });
    if (d.badge && d.badge.counter) tick(p + 'amt', B.p('counter', .44, .78, 'tick', { focal: false }), d.badge.counter.from, d.badge.counter.to, d.badge.counter.fmt);
    B.group('k', (d.chips || []).length, { a: .50, step: .06, len: .14, kind: 'pop', dim: false }).forEach((r, i) => pp(p + 'k' + (i + 1), r.p, .7));
    figIn(B, p, d.figure, c);
    up(p + 'sub', B.p('sub', .78, .90));
    footIn(B, p); holdLife(B, p, d);
  }
});
