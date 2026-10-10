/* diagram: a vpcDiagram spec (boxes/nodes/edges/cloud) revealed by a step sequence, optional dim beat and badge
   data: {eyebrow, accent, h1, vpc: vpcDiagram spec (no id/x/y), seq?: [{el, fx: 'fd'|'up'|'pp'|'draw', at: [a, b]}],
          dim?: {els: [...], at: [a, b], to: .4}, hot?: el, badge?: {text, cls, y}, foot?}
   el names are the box/node ids or 'e<i>' for edges, 'cloud' for the cloud label. */
defineTemplate('diagram', {
  check: d => req(d, ['eyebrow', 'h1', 'vpc'], 'diagram'),
  beats: d => baseBeats(d).concat((d.vpc.boxes || []).map(b => b.id), d.vpc.cloud ? ['cloud'] : [], (d.vpc.nodes || []).map(n => n.id), (d.vpc.edges || []).map((_, i) => 'e' + i), ['dim', 'badge']),
  html: (d, c) => {
    const p = c.p, G = c.grid, w = G.cw;
    const h = d.vpc.h || Math.min(G.ch - 120, 1000);
    // scale the whole diagram down when the canvas is shorter than the authored height (keeps one set of coordinates per diagram)
    const k = Math.min(1, (G.ch - (d.badge ? 110 : 20)) / h);
    return `${heading(p, d)}<div class="content"><div class="rel">
      <div style="position:absolute;left:0;top:0;transform:scale(${k});transform-origin:top left">${vpcDiagram(Object.assign({ id: p + 'v', x: 0, y: 0, w, h }, d.vpc))}</div>
      ${d.badge ? `<div class="badge ${d.badge.cls || 'v'}" id="${p}bd" style="left:0;top:${d.badge.y != null ? d.badge.y : Math.round(h * k) + 30}px;font:600 30px Inter;padding:16px 26px">${d.badge.text}</div>` : ''}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    const seq = d.seq || defaultSeq(d.vpc);
    seq.forEach(s => {
      const id = p + 'v-' + s.el, q = B.p(s.el, s.at[0], s.at[1], s.fx === 'draw' ? 'draw' : s.fx === 'pp' ? 'pop' : 'enter');
      if (s.fx === 'draw') draw(id, q); else if (s.fx === 'pp') pp(id, q, .8); else if (s.fx === 'up') up(id, q, 20); else fd(id, q);
    });
    if (d.dim) { const f = B.p('dim', d.dim.at[0], d.dim.at[1], 'enter', { focal: false }); d.dim.els.forEach(e => st(p + 'v-' + e, { opacity: 1 - (1 - (d.dim.to == null ? .4 : d.dim.to)) * f })); }
    if (d.hot) st(p + 'v-' + d.hot, { transform: 'scale(' + (1 + .06 * pulse(seg(t, .84, 1))) + ')' });
    up(p + 'bd', B.p('badge', .84, .94));
    footIn(B, p); holdLife(B, p, d, { alias: { badge: 'bd' } });
    function defaultSeq(v) {
      const out = []; let a = .06;
      (v.boxes || []).forEach(b => { out.push({ el: b.id, fx: 'fd', at: [a, a + .10] }); a += .04; });
      if (v.cloud) out.push({ el: 'cloud', fx: 'fd', at: [a, a + .10] });
      (v.nodes || []).forEach(n => { a += .05; out.push({ el: n.id, fx: 'pp', at: [a, a + .10] }); });
      (v.edges || []).forEach((_, i) => { a += .06; out.push({ el: 'e' + i, fx: 'draw', at: [a, a + .10] }); });
      return out;
    }
  }
});
