/* bench: a workbench of windows that stays on screen while the narration moves from tool to tool
   (projects/cloud-vs-devops). Each window opens on its word, cascading over the last; the earlier ones step back and
   dim, but stay: "first Cost Explorer, then a terminal, then the Terraform file" reads as one piece of work, not three.
   data: {eyebrow, accent, h1, windows:[
            {kind:'console', console: awsConsole spec, hl?: row number}  |
            {kind:'term', steps, title?, cwd?}  |
            {kind:'code', file, lines:[html]} ],
          strike?: window number (a red cross drawn over it on x<n>), chips?:[{text, cls}], cast?, bubbles?, sub?, foot?}
   beats: w1..wn (window opens) · w<n>r (console row highlight) · w<n>c1.., w<n>o1.. (terminal) · w<n>l1.. (code lines)
          · x<n> (strike) · k1..kn (chips) · a1.., b1.. (cast) · sub */
const BENCH = { dx: 64, dy: 44, maxH: 470 };
function benchLayout(d, G) {
  const n = d.windows.length, castW = (d.cast || []).length && G.canvas !== 'vertical' ? 230 : 0, chipsH = d.chips ? 80 : 0;
  const w = G.cw - castW - (n - 1) * BENCH.dx;
  const hOf = win => win.kind === 'console' ? Math.round(720 * Math.min(w / 960, BENCH.maxH / 720))
    : win.kind === 'term' ? Math.min(BENCH.maxH, TM.bar + 32 + (tmRows(win.steps, '').length + 1) * 34)
      : 56 + 40 + win.lines.length * 34;
  const wOf = win => win.kind === 'console' ? Math.round(960 * Math.min(w / 960, BENCH.maxH / 720)) : w;   // a console window is its scaled mock, not the column
  return { n, castW, chipsH, w, hs: d.windows.map(hOf), ws: d.windows.map(wOf) };
}
defineTemplate('bench', {
  check: d => req(d, ['eyebrow', 'h1', 'windows'], 'bench'),
  beats: d => {
    const out = [];
    d.windows.forEach((win, i) => {
      const w = 'w' + (i + 1); out.push(w);
      if (win.kind === 'console' && win.hl) out.push(w + 'r');
      if (win.kind === 'term') out.push(...tmBeats(win.steps, w));
      if (win.kind === 'code') out.push(...seqN(w + 'l', win.lines.length));
    });
    if (d.strike) out.push('x' + d.strike);
    return baseBeats(d).concat(out, seqN('k', (d.chips || []).length), castBeats(d.cast, d.bubbles), ['sub']);
  },
  html: (d, c) => {
    const p = c.p, G = c.grid, L = benchLayout(d, G);
    const wins = d.windows.map((win, i) => {
      const id = p + 'w' + (i + 1), x = L.castW + i * BENCH.dx, y = i * BENCH.dy, h = L.hs[i];
      let inner = '';
      if (win.kind === 'console') {
        const k = Math.min(L.w / 960, BENCH.maxH / 720);
        inner = `<div style="position:absolute;left:0;top:0;transform:scale(${k});transform-origin:0 0">${awsConsole(Object.assign({ id: id + 'c', x: 0, y: 0 }, win.console))}</div>`;
        return `<div class="bw bw-con" id="${id}" style="left:${x}px;top:${y}px;width:${Math.round(960 * k)}px;height:${h}px">${inner}
          ${win.hl ? `<i class="bw-hl" id="${id}hl"></i>` : ''}<i class="bw-dim" id="${id}d"></i></div>`;
      }
      if (win.kind === 'term') return tmWin({ id, p, pre: 'w' + (i + 1), steps: win.steps, title: win.title, cwd: win.cwd, x, y, w: L.w, accent: d.accent, small: true, cls: 'bw' })
        .replace(/<\/div>\s*$/, `<i class="bw-dim" id="${id}d"></i></div>`);
      return `<div class="code bw" id="${id}" style="position:absolute;left:${x}px;top:${y}px;width:${L.w}px"><div class="bar"><i></i><i></i><i></i><span>${win.file}</span></div>
        <pre style="font-size:21px;line-height:34px;padding:20px 26px">${win.lines.map((l, j) => `<span class="cl" id="${id}l${j + 1}">${l}</span>`).join('')}</pre><i class="bw-dim" id="${id}d"></i></div>`;
    }).join('');
    const sw = d.strike ? L.ws[d.strike - 1] : 0, sh = d.strike ? L.hs[d.strike - 1] : 0;
    const strike = d.strike ? `<svg class="bw-x" id="${p}x${d.strike}" style="z-index:${10 + d.strike - 1};left:${L.castW + (d.strike - 1) * BENCH.dx}px;top:${(d.strike - 1) * BENCH.dy}px;width:${sw}px;height:${sh}px"
      viewBox="0 0 ${sw} ${sh}"><path d="M30 30 L${sw - 30} ${sh - 30}"/><path d="M${sw - 30} 30 L30 ${sh - 30}"/></svg>` : '';
    const bottom = Math.max(...L.hs.map((h, i) => h + i * BENCH.dy));
    const chips = d.chips ? `<div style="position:absolute;top:${bottom + 26}px;left:${L.castW}px;display:flex;gap:16px">${d.chips.map((k, i) => `<span class="chip ${k.cls || d.accent || ''}" id="${p}k${i + 1}">${k.text}</span>`).join('')}</div>` : '';
    // vertical canvas: the cast stands under the windows and the chips (its bubble beside it, data.v)
    const cast = (d.cast || []).map(a => Object.assign({ x: 0, y: G.canvas === 'vertical' ? bottom + (d.chips ? 110 : 30) : Math.max(0, bottom - (a.size || 200) - 30), size: 200 }, a));
    return `${heading(p, d)}<div class="content"><div class="rel">${wins}${strike}${chips}${castBlock(p, cast, d.bubbles)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c), n = d.windows.length;
    headIn(B, p);
    const opens = d.windows.map((_, i) => B.at('w' + (i + 1), .08 + i * (.7 / n), .16 + i * (.7 / n)));
    d.windows.forEach((win, i) => {
      const id = p + 'w' + (i + 1), r = opens[i], e = eo4(r.p);
      // how far later windows have pushed this one back: .94 scale and half brightness per window on top of it
      let back = 0; for (let j = i + 1; j < n; j++) back += eo(cl(opens[j].p, 0, 1));
      fd(id + 'd', .55 * Math.min(1, back));   // a dark veil, not opacity: a see-through window shows the one beneath through its text
      st(id, { opacity: e.toFixed(3), transform: `translateY(${((1 - e) * 36).toFixed(1)}px) scale(${(1 - .04 * back).toFixed(4)})`,
        transformOrigin: '0 0', zIndex: String(10 + i) });
      const w = 'w' + (i + 1);
      if (win.kind === 'console' && win.hl) {
        const hr = B.at(w + 'r', .1 + i * .2, .2 + i * .2, 'pop');
        const row = el(id + 'c-r' + win.hl), hl = el(id + 'hl'), k = Math.min(1, 1);
        if (row && hl) { const box = el(id).getBoundingClientRect(), rb = row.getBoundingClientRect(), sc = el(id).offsetWidth / (box.width || 1);
          st(hl, { left: ((rb.left - box.left) * sc - 6) + 'px', top: ((rb.top - box.top) * sc - 4) + 'px', width: (rb.width * sc + 12) + 'px', height: (rb.height * sc + 8) + 'px',
            opacity: String(eo(hr.p)) }); }
      }
      if (win.kind === 'term') tmPlay(B, c, p, w, win.steps, r, .1 + i * .2, .3 + i * .2);
      if (win.kind === 'code') {
        const nl = win.lines.length, wl = .2 / nl;
        B.group(w + 'l', nl, { a: .12 + i * .2, step: wl * .8, len: wl * 1.5, kind: 'enter', dim: false }).forEach((rr, j) => codeLine(id + 'l' + (j + 1), rr.p));
      }
    });
    if (d.strike) draw(p + 'x' + d.strike, B.p('x' + d.strike, .3, .4, 'draw'));
    B.group('k', (d.chips || []).length, { a: .86, step: .04, len: .08, kind: 'pop', dim: false }).forEach((r, i) => pp(p + 'k' + (i + 1), r.p, .7));
    castPlay(B, c, p, d.cast, d.bubbles);
    footIn(B, p); holdLife(B, p, d);
  }
});
