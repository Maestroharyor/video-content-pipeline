/* matrix: one problem, several stacks. Task rows x stack columns; a cell holds the API that stack uses, or a
   dash while the narration has not got there yet. The grid is introduced empty ("four tasks, six stacks") and
   the same grid returns after each task to fill one row, which is what makes the repetition in this script read
   as progress instead of repetition.
   data: {eyebrow, accent, h1, h1size?, cols:[{label, icon?, brand?}], rows:[{label, cls?, cells:[string|null]}],
          labelW?, badge?:{text,cls}, sub?, foot?}
   beats: c1..cn (columns) · r1..rm (task rows) · x<i><j> (row i's cell j) · badge · sub
   A cell with no beat of its own trails its row, so `r2:"same problem"` fills the whole row in reading order. */
defineTemplate('matrix', {
  check: d => req(d, ['eyebrow', 'h1', 'cols', 'rows'], 'matrix'),
  beats: d => baseBeats(d).concat(seqN('c', d.cols.length), seqN('r', d.rows.length), ['badge', 'sub'],
    d.rows.reduce((a, r, i) => a.concat(r.cells.map((_, j) => 'x' + (i + 1) + (j + 1))), [])),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, H = c.grid.ch, nc = d.cols.length, nr = d.rows.length;
    const sub = d.sub ? 96 : 0, badge = d.badge ? 84 : 0;
    // 9:16: the row labels turn on their side (strata.css) so the six stack columns get the 800px column's width
    const lw = d.labelW != null ? d.labelW : c.grid.canvas === 'vertical' ? 64 : (nc > 4 ? 210 : 250);
    const cw = Math.floor((w - lw - 2) / nc);          // -2: the card's own 1px borders
    /* Six columns leave 148px per cell: "SecureStorage" at the 4-column size runs straight into its neighbour
       (nothing clipped it, so the probe passed a poster where two values overlapped). The value type scales with
       the column count and wraps inside the cell instead. */
    // 9:16: a size down for the ~120px cell; snake_case names break after the underscore there
    const fs2 = nc > 5 ? (c.grid.canvas === 'vertical' ? 15 : 17) : nc > 4 ? 18 : 20;
    const hh = 96, rh = Math.floor((H - sub - badge - hh) / nr);
    const head = `<div class="mxh" style="height:${hh}px"><div class="mxl" style="width:${lw}px"></div>`
      + d.cols.map((cc, j) => `<div class="mxc" id="${p}c${j + 1}" style="width:${cw}px">
          ${cc.icon ? `<img src="${logo(cc.icon, cc.brand === undefined ? true : cc.brand)}" alt="" onerror="this.remove()">` : ''}<span>${cc.label}</span></div>`).join('') + '</div>';
    const rows = d.rows.map((r, i) => `<div class="mxr ${r.cls || ''}" id="${p}r${i + 1}" style="height:${rh}px">
        <div class="mxl" style="width:${lw}px"><b>${r.label}</b></div>
        ${r.cells.map((x, j) => `<div class="mxcell${x ? '' : ' empty'}" id="${p}x${i + 1}${j + 1}" style="width:${cw}px">${x ? `<em id="${p}x${i + 1}${j + 1}e" style="font-size:${fs2}px">${c.grid.canvas === 'vertical' ? String(x).replace(/_/g, '_<wbr>') : x}</em>` : ''}</div>`).join('')}</div>`).join('');
    const after = hh + nr * rh + 24;
    return `${heading(p, d)}<div class="content"><div class="rel">
      <div class="mx" id="${p}mx" style="left:0;top:0;width:${w}px;height:${hh + nr * rh}px">${head}${rows}</div>
      ${d.badge ? `<div class="badge ${d.badge.cls || 'n'}" id="${p}bd" style="left:0;top:${after}px;font-size:30px">${d.badge.text}</div>` : ''}
      ${subHtml(p, d.sub, after + badge, w)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, nc = d.cols.length, nr = d.rows.length, B = beats(c);
    headIn(B, p);
    fd(p + 'mx', seg(c.local, .05, .45));                            // the empty grid is the stage, not an event
    B.group('c', nc, { a: .16, step: .05, len: .12, kind: 'pop' }).forEach((r, j) => pp(p + 'c' + (j + 1), r.p, .82));
    const rows = B.group('r', nr, { a: .34, step: .08, len: ENTER.len, kind: 'enter', dim: false });
    rows.forEach((r, i) => {
      sx(p + 'r' + (i + 1), r.p, -70);
      const cells = d.rows[i].cells;
      B.group('x' + (i + 1), cells.length, { a: r.fa + .06, step: .035, len: .10, kind: 'pop' })
        // the cell's own box (and its hairline) is part of the empty grid: only the value inside wipes in
        .forEach((cr, j) => { if (cells[j]) wipe(p + 'x' + (i + 1) + (j + 1) + 'e', cr.p, 'right'); });
    });
    pp(p + 'bd', B.p('badge', .80, .90, 'pop'), .84);
    up(p + 'sub', B.p('sub', .86, .96));
    footIn(B, p); holdLife(B, p, d);
  }
});
