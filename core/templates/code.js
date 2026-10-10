/* code: optional tile row + code block with line reveal + ok rowbar + note badge
   data: {eyebrow, accent, h1, file, lines:[html], tiles?:[{icon, brand?, label}], ok?, note?, foot?} */
defineTemplate('code', {
  check: d => req(d, ['eyebrow', 'h1', 'file', 'lines'], 'code'),
  beats: d => baseBeats(d).concat(seqN('t', (d.tiles || []).length), ['code'], seqN('l', d.lines.length), ['ok', 'note']),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, tiles = d.tiles || [], n = tiles.length, vert = c.grid.canvas === 'vertical';
    const colW = n ? Math.floor(w / n) : 0;
    const tileHtml = tiles.map((tl, i) => logoStack({ id: p + 't' + (i + 1), x: colW * i + Math.round((colW - 180) / 2), y: 0, icon: tl.icon, brand: tl.brand !== false, label: tl.label, w: 180 })).join('');
    const codeY = n ? (vert ? 230 : 190) : 0;        // the horizontal column is 786px, not 1200: the tails are tighter
    const lineH = 47, codeH = 62 + 58 + d.lines.length * lineH;
    return `${heading(p, d)}<div class="content"><div class="rel">${tileHtml}
      <div class="code" id="${p}code" style="position:absolute;left:0;top:${codeY}px;width:${w}px"><div class="bar"><i></i><i></i><i></i><span>${d.file}</span></div>
      <pre>${d.lines.map((l, i) => `<span class="cl" id="${p}l${i + 1}">${l}</span>`).join('')}</pre></div>
      ${d.ok ? `<div class="rowbar g big" id="${p}ok" style="left:0;top:${codeY + codeH + 34}px;width:${w}px"><span class="ico" style="display:grid;place-items:center;width:40px;height:40px"><svg viewBox="0 0 24 24" style="width:36px;height:36px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"><use href="#i-check"/></svg></span>${d.ok}</div>` : ''}
      ${d.note ? `<div class="badge t note" id="${p}note" style="left:0;top:${codeY + codeH + (d.ok ? (vert ? 166 : 130) : 34)}px;width:${w}px">${d.note}</div>` : ''}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, n = (d.tiles || []).length, nl = d.lines.length, B = beats(c);
    headIn(B, p);
    B.group('t', n, { a: .08, step: .04, len: .12, kind: 'pop' }).forEach((r, i) => pp(p + 't' + (i + 1), r.p, .78));
    const cq = B.p('code', .26, .36);
    st(p + 'code', { opacity: eo(cq), transform: 'translateY(' + ((1 - eo(cq)) * 28) + 'px)' });
    const w = .42 / nl;   // fraction mode reproduces code(prefix, n, t, .32, .74) exactly
    B.group('l', nl, { a: .32, step: w * .82, len: w * 1.5, kind: 'enter' }).forEach((r, i) => codeLine(p + 'l' + (i + 1), r.p));
    sx(p + 'ok', B.p('ok', .76, .86), -46);
    up(p + 'note', B.p('note', .84, .94));
    footIn(B, p); holdLife(B, p, d);
  }
});
