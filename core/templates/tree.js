/* tree: the DNS hierarchy as a tree — one root dot, a TLD row, a domain row — with each tier able to light up
   on its own beat ("the root only tracks the ending, the TLD only tracks its domains...").
   data: {eyebrow, accent, h1, h1size?, tree: {tlds: [string], leaves: [string], hot?: 'root'|'tld'|'leaf'|null,
          tags?: {root, tld, leaf}, badge?: {text, cls}}}
   beats: root · tld1..tldn · leaf1..leafn · tagr · tagt · tagl · badge */
/* Geometry per canvas. horizontal: the leaf row ends at 858, above the caption line; tier tags sit in the left
   margin beside the centred tree and the badge top right. vertical: the tree is as wide as the column, so the tags
   move above their rows and the badge centres under the tree; the rows drop into the content band. */
const TREE_GEO = {
  horizontal: { Y: { root: 360, tld: 570, leaf: 780 }, head: { ebTop: 104, h1Top: 158 }, side: true },
  vertical: { Y: { root: 620, tld: 900, leaf: 1180 }, head: null, side: false },
};
defineTemplate('tree', {
  check: d => req(d, ['eyebrow', 'h1', 'tree'], 'tree'),
  beats: d => baseBeats(d).concat(['root', 'tagr', 'tagt', 'tagl', 'badge'],
    seqN('tld', (d.tree.tlds || []).length), seqN('leaf', (d.tree.leaves || []).length)),
  html: (d, c) => {
    const p = c.p, G = c.grid, T = d.tree, tl = T.tlds || [], lv = T.leaves || [];
    const geo = TREE_GEO[G.canvas] || TREE_GEO.horizontal, Y = geo.Y, RS = 108;
    const rx = G.w / 2;
    const spread = (n, w, y, pre) => Array.from({ length: n }, (_, i) => {
      const total = n * w + (n - 1) * 40, x = (G.w - total) / 2 + i * (w + 40);
      return { x, y, id: p + pre + (i + 1), w };
    });
    const tldPos = spread(tl.length, 250, Y.tld, 'tld'), leafPos = spread(lv.length, 300, Y.leaf, 'leaf');
    const edges = [];
    tldPos.forEach(t => edges.push(`M${rx} ${Y.root + RS / 2} C${rx} ${Y.root + 150} ${t.x + t.w / 2} ${Y.tld - 90} ${t.x + t.w / 2} ${Y.tld}`));
    leafPos.forEach((l, i) => { const t = tldPos[Math.min(i, tldPos.length - 1)] || { x: rx - 125, w: 250 };
      edges.push(`M${t.x + t.w / 2} ${Y.tld + 78} C${t.x + t.w / 2} ${Y.tld + 140} ${l.x + l.w / 2} ${Y.leaf - 90} ${l.x + l.w / 2} ${Y.leaf}`); });
    // a tier tag beside its row (horizontal) or centred above it (vertical)
    const tag = (id, y, text) => geo.side ? `<div class="tr-tag" id="${p}${id}" style="left:${G.safe.l}px;top:${y + 24}px">${text || ''}</div>`
      : `<div class="tr-tag" id="${p}${id}" style="left:0;width:${G.w}px;text-align:center;top:${y - 58}px">${text || ''}</div>`;
    const badge = !T.badge ? '' : geo.side
      ? `<div class="badge ${T.badge.cls || 'g'}" id="${p}bd" style="left:${G.safe.r - 520}px;top:${Y.root - 10}px;font-size:34px">${T.badge.text}</div>`
      : `<div style="position:absolute;left:0;width:${G.w}px;top:${Y.leaf + 150}px;text-align:center"><div class="badge ${T.badge.cls || 'g'}" id="${p}bd" style="position:relative;display:inline-block;left:auto;top:auto;font-size:34px">${T.badge.text}</div></div>`;
    return `${heading(p, Object.assign({}, geo.head, d))}
      <svg id="${p}ed" style="position:absolute;left:0;top:0;width:${G.w}px;height:${G.h}px;opacity:0" viewBox="0 0 ${G.w} ${G.h}">
        ${edges.map((dd, i) => `<path class="tr-edge" id="${p}ed${i + 1}" d="${dd}"/>`).join('')}</svg>
      <div class="tr-node root" id="${p}root" style="left:${rx - RS / 2}px;top:${Y.root}px;width:${RS}px;height:${RS}px">.</div>
      ${tldPos.map((t, i) => `<div class="tr-node" id="${t.id}" style="left:${t.x}px;top:${t.y}px;width:${t.w}px;height:78px">${tl[i]}</div>`).join('')}
      ${leafPos.map((l, i) => `<div class="tr-node" id="${l.id}" style="left:${l.x}px;top:${l.y}px;width:${l.w}px;height:78px">${lv[i]}</div>`).join('')}
      ${T.tags ? tag('tagr', geo.side ? Y.root + 6 : Y.root, T.tags.root) + tag('tagt', Y.tld, T.tags.tld) + tag('tagl', Y.leaf, T.tags.leaf) : ''}
      ${badge}`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, T = d.tree, tl = T.tlds || [], lv = T.leaves || [], B = beats(c);
    headIn(B, p);
    const rp = B.p('root', .10, .26, 'pop');
    pp(p + 'root', rp, .5);
    cls(p + 'root', 'hot', T.hot === 'root' && rp > .5);
    fd(p + 'ed', seg(rp, .5, 1));
    const tlds = B.group('tld', tl.length, { a: .26, step: .05, len: .14, kind: 'enter' });
    tlds.forEach((r, i) => { pp(p + 'tld' + (i + 1), r.p, .8); cls(p + 'tld' + (i + 1), 'hot', T.hot === 'tld' && r.p > .5); });
    const leaves = B.group('leaf', lv.length, { a: .46, step: .05, len: .14, kind: 'enter' });
    leaves.forEach((r, i) => { pp(p + 'leaf' + (i + 1), r.p, .8); cls(p + 'leaf' + (i + 1), 'hot', T.hot === 'leaf' && r.p > .5); });
    // the connecting curves draw once the tier they feed has landed
    const last = Math.max(rp, ...tlds.map(r => r.p), ...leaves.map(r => r.p));
    draw(p + 'ed', cl(last, 0, 1));
    if (T.tags) { up(p + 'tagr', B.p('tagr', .30, .42)); up(p + 'tagt', B.p('tagt', .50, .62)); up(p + 'tagl', B.p('tagl', .66, .78)); }
    if (T.badge) pp(p + 'bd', B.p('badge', .78, .90, 'pop'), .84);
    footIn(B, p); holdLife(B, p, d);
  }
});
