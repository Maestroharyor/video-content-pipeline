/* providers: the cloud providers as cards, a depth meter under each (projects/cloud-vs-devops). The big three sit
   in a row, the others below; `deep` fills one card's meter and dims the rest ("specialize in one"), `grow` then
   brings the others up part way ("and learn the others as experience grows").
   data: {eyebrow, accent, h1, items:[{icon?, brand?, src?, label, tier: 1 | 2}], focus: item number, sub?, foot?}
   beats: t1..tn · deep · grow · sub */
defineTemplate('providers', {
  check: d => req(d, ['eyebrow', 'h1', 'items'], 'providers'),
  beats: d => baseBeats(d).concat(seqN('t', d.items.length), ['deep', 'grow', 'sub']),
  html: (d, c) => {
    const p = c.p, G = c.grid, t1 = d.items.filter(i => i.tier !== 2), t2 = d.items.filter(i => i.tier === 2);
    const card = (it, i, x, y, w, h, big) => `<div class="pv-card${big ? '' : ' sm'}" id="${p}t${i + 1}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
      <span class="pv-logo"><img src="${it.src || logo(it.icon, it.brand)}" alt=""></span><b>${it.label}</b>
      <span class="pv-m"><i id="${p}m${i + 1}"></i></span></div>`;
    const V = G.canvas === 'vertical', W1 = V ? Math.floor((G.cw - 2 * 30) / 3) : 400, G1 = V ? 30 : 50, x1 = Math.round((G.cw - (t1.length * W1 + (t1.length - 1) * G1)) / 2);
    const W2 = 300, G2 = 50, x2 = Math.round((G.cw - (t2.length * W2 + (t2.length - 1) * G2)) / 2);
    let html = '', k1 = 0, k2 = 0;
    d.items.forEach((it, i) => { html += it.tier === 2 ? card(it, i, x2 + (k2++) * (W2 + G2), 340, W2, 190, false) : card(it, i, x1 + (k1++) * (W1 + G1), 0, W1, 290, true); });
    return `${heading(p, d)}<div class="content"><div class="rel">${html}${subHtml(p, d.sub, t2.length ? 570 : 330, G.cw)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c), n = d.items.length, f = (d.focus || 1) - 1;
    headIn(B, p);
    const rs = B.group('t', n, { a: .1, step: .07, len: .12, kind: 'pop', dim: false });
    const deep = B.p('deep', .6, .72, 'bar'), grow = B.p('grow', .8, .92, 'bar');
    rs.forEach((r, i) => {
      pp(p + 't' + (i + 1), r.p, .75);
      const focus = i === f, fillTo = focus ? eo(deep) : .32 * eo(grow);
      st(p + 'm' + (i + 1), { transform: 'scaleX(' + fillTo.toFixed(3) + ')' });
      if (!focus) dim(p + 't' + (i + 1), deep * (1 - grow), .4);
      cls(p + 't' + (i + 1), 'on', focus && deep > .5);
    });
    up(p + 'sub', B.p('sub', .9, .98));
    footIn(B, p); holdLife(B, p, d);
  }
});
