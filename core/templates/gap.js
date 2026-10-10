/* gap: the architecture diagram everyone draws, and the box nobody draws (projects/resilience-braandly, theme
   `incident`). A vertical chain of services on the left builds top to bottom on `arch`; on `gap` an empty dashed box
   appears beside it, dashed leads run to it from the services it should watch, and a ring pulses around it.
   data: {eyebrow, accent, h1, nodes:[{label, sub?, icon}], gap:{label, sub?, from:[node indexes]}, note?, sub?, foot?}
   icon = a symbol from core/icons.js without the i- prefix (globe, browser, server, pkg, db, …).
   beats: arch · gap · note · sub */
const GP = { nodeW: 430, nodeH: 104, gapY: 46, boxW: 330, boxH: 230 };
defineTemplate('gap', {
  check: d => req(d, ['eyebrow', 'h1', 'nodes', 'gap'], 'gap'),
  beats: d => baseBeats(d).concat(['arch', 'gap', 'note', 'sub']),
  html: (d, c) => {
    const p = c.p, W = c.grid.cw, n = d.nodes.length, step = GP.nodeH + GP.gapY;
    const nodes = d.nodes.map((nd, i) => `<div class="ic-node" id="${p}n${i + 1}" style="left:0;top:${i * step}px;width:${GP.nodeW}px;height:${GP.nodeH}px">
        <span class="ni"><svg viewBox="0 0 24 24"><use href="#i-${nd.icon || 'server'}"/></svg></span><span class="nx"><b>${nd.label}</b><i>${nd.sub || ''}</i></span></div>
        ${i < n - 1 ? `<svg class="draw ic-arw" id="${p}e${i + 1}" style="left:${GP.nodeW / 2 - 12}px;top:${i * step + GP.nodeH}px;width:24px;height:${GP.gapY}px" viewBox="0 0 24 ${GP.gapY}"><path d="M12 4 V${GP.gapY - 8}"/><path d="M5 ${GP.gapY - 15} L12 ${GP.gapY - 7} L19 ${GP.gapY - 15}"/></svg>` : ''}`).join('');
    const bx = W - GP.boxW, from = d.gap.from || [2, 3];
    const midY = (Math.min(...from) + Math.max(...from)) / 2 * step + GP.nodeH / 2, by = midY - GP.boxH / 2;
    const leads = from.map((k, j) => { const y = k * step + GP.nodeH / 2, x0 = GP.nodeW + 8, x1 = bx - 10, ty = by + GP.boxH * (j + 1) / (from.length + 1);
      return `<path d="M${x0} ${y} C${(x0 + x1) / 2} ${y}, ${(x0 + x1) / 2} ${ty}, ${x1} ${ty}"/>`; }).join('');
    const H = n * step - GP.gapY;
    return `${heading(p, d)}<div class="content"><div class="rel" style="height:${H + (d.note ? 0 : 0)}px">
      ${nodes}
      <svg class="draw ic-leads" id="${p}ld" style="left:0;top:0;width:${W}px;height:${H}px" viewBox="0 0 ${W} ${H}">${leads}</svg>
      <div class="ic-gap" id="${p}gap" style="left:${bx}px;top:${by}px;width:${GP.boxW}px;height:${GP.boxH}px"><span class="gq">?</span><b>${d.gap.label}</b><i>${d.gap.sub || ''}</i></div>
      ${d.note ? `<div class="ic-note" id="${p}note" style="left:${bx}px;top:${by + GP.boxH + 30}px;width:${GP.boxW}px">${d.note}</div>` : ''}
      ${subHtml(p, d.sub, H + 30, W)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c), n = d.nodes.length;
    headIn(B, p);
    // the known diagram builds top to bottom from one beat: node, arrow, node …
    const ar = B.at('arch', .06, .3, 'enter', { len: .3 + n * .14 });
    d.nodes.forEach((_, i) => { up(p + 'n' + (i + 1), seg(ar.p, i / (n + 1), (i + 1.4) / (n + 1)), 20); if (i < n - 1) draw(p + 'e' + (i + 1), seg(ar.p, (i + .9) / (n + 1), (i + 1.6) / (n + 1))); });
    // the missing box: it pops in empty, then the dashed leads reach it
    const gp = B.at('gap', .5, .62, 'pop');
    pp(p + 'gap', gp.p, .7);
    draw(p + 'ld', B.on ? seg(c.local, gp.s + .2, gp.s + .8) : seg(t, gp.fb, gp.fb + .12));
    up(p + 'note', B.p('note', .72, .84), 16);
    up(p + 'sub', B.p('sub', .9, .98));
    footIn(B, p); holdLife(B, p, d);
  }
});
