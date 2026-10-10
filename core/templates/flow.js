/* flow: the RAG pipeline as ONE arrangement the narration walks across (projects/ai-context-window).
   Six slides use this and they are not six diagrams — they are six states of the same picture, the way hop.js
   holds one DNS arrangement across eighteen slides. Left to right: the handbook, the chunks it breaks into, the
   vector store they are filed in, and the desk they end up on. A slide names which stage is live; everything
   earlier stays on screen, dimmed, so by slide 45 the viewer is watching a route they have seen built.

   data: {eyebrow, accent, h1, h1size?, foot?, sub?,
     flow: {
       book?: bool, counter?: {from, to},
       dump?: bool,                    // the fat red arrow straight from the book to the desk
       tags?: [{b}],                   // what is wrong with doing that
       strike?: bool,                  // cross the dump arrow out
       chunks?: number,                // the book split into this many tiles (a 5-column grid)
       store?: bool, rows?: number,    // the vector store and how many embedding rows it holds
       hot?: [number],                 // which chunk tiles / store rows are the match
       query?: string,
       desk?: bool, land?: bool,       // land = the three matched pages finish on the desk
       marks?: [{icon, brand?, label}], // real products under the store, for the line that names one
       label?: string,
     }}
   beats: book counter arrow t1..tn strike chunks emb store q match lift land marks label em foot sub

   Coordinates are authored against the 1120x720 content box and every element stays inside it. The chunk grid is
   5 wide because 20 tiles at 5x4 is the largest grid that still leaves the tiles big enough to read at 168px
   wide on a phone, which is where most of this video gets watched. */
const FL = {
  book: { x: 4, y: 268, w: 178, h: 272 },
  /* The grid's right edge is x + 5*tw + 4*gx = 232 + 390 + 52 = 674, and the store used to start at 676: a
     two-pixel gap that read as the two objects touching. 716 gives a 42px channel. The grid's y is set so its
     287px height centres on the store's centre (196 + 360/2 = 376), which is the alignment that was missing. */
  grid: { x: 232, y: 232, cols: 5, tw: 78, th: 62, gx: 13, gy: 13 },
  store: { x: 716, y: 196, w: 300, h: 360 },
  desk: { x: 930, y: 300, w: 176, h: 150 },
};

defineTemplate('flow', {
  check: d => req(d, ['eyebrow', 'h1', 'flow'], 'flow'),
  beats: d => baseBeats(d).concat(['book', 'counter', 'arrow', 'strike', 'chunks', 'emb', 'store', 'q', 'match',
    'lift', 'land', 'marks', 'label', 'sub'], seqN('t', (d.flow.tags || []).length)),
  html: (d, c) => {
    const p = c.p, G = c.grid, k = d.flow;
    const B = FL.book, Gr = FL.grid, S = FL.store, D = FL.desk;
    const hot = k.hot || [];
    const book = k.book ? `<div class="fl-book" id="${p}book" style="left:${B.x}px;top:${B.y}px;width:${B.w}px;height:${B.h}px">
      <div class="sp"></div>${[0, 1, 2, 3, 4, 5].map(i => `<i style="top:${26 + i * 30}px"></i>`).join('')}</div>` : '';
    const chunks = k.chunks ? Array.from({ length: k.chunks }, (_, i) => {
      const cx = Gr.x + (i % Gr.cols) * (Gr.tw + Gr.gx), cy = Gr.y + Math.floor(i / Gr.cols) * (Gr.th + Gr.gy);
      return `<div class="fl-chunk${hot.includes(i + 1) ? ' hot' : ''}" id="${p}ch${i + 1}" style="left:${cx}px;top:${cy}px;width:${Gr.tw}px;height:${Gr.th}px"><span>${String(i + 1).padStart(2, '0')}</span></div>`;
    }).join('') : '';
    const rowsHtml = k.store ? Array.from({ length: k.rows || 7 }, (_, i) =>
      `<div class="fs-row${hot.includes(i + 1) ? ' hot' : ''}" id="${p}er${i + 1}" style="top:${68 + i * 40}px">${[0, 1, 2, 3].map(j => `<u style="width:${28 + ((i * 7 + j * 13) % 5) * 11}px"></u>`).join('')}</div>`).join('') : '';
    const store = k.store ? `<div class="fl-store" id="${p}store" style="left:${S.x}px;top:${S.y}px;width:${S.w}px;height:${S.h}px"><span class="sh">Vector store</span>${rowsHtml}</div>` : '';
    const desk = k.desk ? `<div class="dk-surf" id="${p}desk" style="left:${D.x}px;top:${D.y}px;width:${D.w}px;height:${D.h}px"><div class="dk-plane"></div><div class="dk-front" style="top:${D.h}px"></div></div>` : '';
    /* the pieces that land on the desk at the end: three small pages, drawn where they finish */
    const land = k.land ? [0, 1, 2].map(i => `<div class="fl-chunk" id="${p}ld${i + 1}" style="left:${D.x + 10 + i * 54}px;top:${D.y + 48}px;width:${Gr.tw - 26}px;height:${Gr.th - 14}px"><span>${String(hot[i] || i + 1).padStart(2, '0')}</span></div>`).join('') : '';
    const ax = B.x + B.w, ay = B.y + B.h / 2, bx = D.x, by = D.y + D.h / 2;
    /* The dump arrow is an ARROW: it says "shove the whole book at the model", and without a head it read as a
       decorative swoosh with no direction. Size 46 because this stroke is 14px wide: the default marker units
       scale the head with the stroke, so arrowMarker pins it to user space instead, and it has to be comfortably
       wider than the line or it reads as a nub on the end rather than as a point. refX 4 seats the head far
       enough back that the path's round cap is hidden inside it. Attached in frame() once the stroke arrives. */
    const dump = k.dump ? `<svg class="fl-arrow dump" id="${p}arrow" style="left:0;top:0;width:${G.cw}px;height:${G.ch}px" viewBox="0 0 ${G.cw} ${G.ch}"><defs>${arrowMarker(p + 'dh', { size: 46, color: 'var(--rose)', refX: 4 })}</defs><path d="M${ax} ${ay - 150} Q${(ax + bx) / 2} ${ay - 250} ${bx} ${by - 120}"/></svg>` : '';
    /* One row, clear of the arc. The tags used to step down into the arc's midpoint, which is exactly where
       the strike X is drawn, so "Often impossible" and the X landed on top of each other. */
    const tags = (k.tags || []).map((t, i) =>
      `<div class="fl-tag" id="${p}t${i + 1}" style="left:${212 + i * 300}px;top:36px">${t.b}</div>`).join('');
    /* Real stores under the drawn one, centred on it: "often a vector database" is a line about actual products,
       and three marks say it better than the caption did. They sit in the band between the store's foot (556)
       and the safe line, which is why the slide that uses them drops its `label`. */
    const mi = k.marks || [], mkW = 140, mkTot = mi.length * mkW + Math.max(0, mi.length - 1) * 14;
    const mkX0 = Math.round(S.x + S.w / 2 - mkTot / 2);
    const marks = mi.length ? `<div class="dk-marks" id="${p}marks" style="left:0;top:${S.y + S.h + 22}px;width:${G.cw}px;height:128px">`
      + mi.map((m, i) => logoStack({ id: p + 'mk' + (i + 1), x: mkX0 + i * (mkW + 14), y: 0, icon: m.icon, brand: m.brand, src: m.src, label: m.label || '', size: 'sm', w: mkW })).join('')
      + `</div>` : '';
    return `${heading(p, d)}<div class="content"><div class="rel">
      ${book}${chunks}${store}${desk}${land}${dump}${tags}${marks}
      ${k.counter ? `<div class="dk-num" id="${p}counter" style="left:${B.x - 30}px;top:${B.y + B.h + 30}px;width:${B.w + 60}px;text-align:center;font-size:62px">0</div>` : ''}
      ${k.query ? `<div class="fl-q" id="${p}q" style="left:${S.x - 96}px;top:${S.y - 92}px">${k.query}</div>` : ''}
      ${k.strike ? `<svg class="strike" id="${p}st" style="left:492px;top:150px;width:118px;height:118px" viewBox="0 0 118 118"><path d="M10 10 L108 108"/><path d="M108 10 L10 108"/></svg>` : ''}
      ${k.label ? `<div class="dlab on" id="${p}label" style="left:0;top:${FL.store.y + FL.store.h + 62}px;width:${G.cw}px;text-align:center">${k.label}</div>` : ''}
      ${subHtml(p, d.sub, FL.store.y + FL.store.h + 118, G.cw)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, k = d.flow, B = beats(c);
    headIn(B, p);
    up(p + 'book', B.p('book', .04, .20), 30);
    if (k.counter) { const t = B.at('counter', .22, .38, 'tick'); tick(p + 'counter', t.p, k.counter.from, k.counter.to, v => Math.round(v).toLocaleString('en-US')); fd(p + 'counter', cl(t.p * 4, 0, 1)); }
    const arq = B.p('arrow', .22, .38, 'draw');
    draw(p + 'arrow', arq); arrowAt(p + 'arrow', p + 'dh', arq);
    B.group('t', (k.tags || []).length, { a: .40, step: .08, len: .12, kind: 'pop', dim: false })
      .forEach((r, i) => pp(p + 't' + (i + 1), r.p, .8));
    draw(p + 'st', B.p('strike', .74, .88, 'draw'));
    /* the split: tiles arrive out of the book, left to right, so the book visibly becomes the grid */
    if (k.chunks) {
      const a = B.at('chunks', .30, .62, 'bar');
      for (let i = 0; i < k.chunks; i++) {
        const q = seg(a.p, (i / k.chunks) * .7, (i / k.chunks) * .7 + .3), e = bk(q);
        const dx = (1 - e) * (FL.book.x + FL.book.w - (FL.grid.x + (i % FL.grid.cols) * (FL.grid.tw + FL.grid.gx)));
        st(p + 'ch' + (i + 1), { opacity: cl(q * 2.4, 0, 1).toFixed(3), transform: 'translateX(' + dx.toFixed(1) + 'px) scale(' + (.7 + .3 * e).toFixed(3) + ')' });
      }
    }
    sx(p + 'store', B.p('store', .46, .62), 70);
    /* the embedding rows fill in once the store is there; `emb` is the beat on the word "embeddings" */
    const nr = k.store ? (k.rows || 7) : 0;
    const eg = B.group('er', nr, { a: .56, step: .04, len: .10, kind: 'enter' });
    eg.forEach((r, i) => up(p + 'er' + (i + 1), Math.max(r.p, B.p('emb', .56, .74) > 0 ? seg(B.p('emb', .56, .74), i / Math.max(1, nr) * .6, i / Math.max(1, nr) * .6 + .4) : 0), 10));
    up(p + 'q', B.p('q', .52, .68), -24);
    /* match -> lift -> land: the three hot tiles brighten, rise out of the store and settle on the desk */
    const mt = B.p('match', .60, .74, 'pop');
    (k.hot || []).forEach(h => { const e = el(p + 'ch' + h); if (e) e.classList.toggle('hot', mt > .4); const r = el(p + 'er' + h); if (r) r.classList.toggle('hot', mt > .4); });
    up(p + 'desk', B.p('desk', .40, .56), 24);
    const lf = B.p('lift', .70, .84), ld = B.at('land', .80, .94);
    if (k.land) [0, 1, 2].forEach(i => {
      const e = eo(seg(ld.p, i * .16, i * .16 + .62)), rise = eo(lf);
      st(p + 'ld' + (i + 1), { opacity: cl(Math.min(rise, 1) * (i === 0 ? 1 : 1) * e * 2, 0, 1).toFixed(3),
        transform: 'translate(' + ((1 - e) * -270).toFixed(1) + 'px,' + ((1 - e) * -120).toFixed(1) + 'px)' });
    });
    const mkN = (k.marks || []).length;
    if (mkN) { const a = B.at('marks', .62, .84, 'bar');
      for (let i = 0; i < mkN; i++) pp(p + 'mk' + (i + 1), seg(a.p, (i / mkN) * .58, (i / mkN) * .58 + .42), .72); }
    up(p + 'label', B.p('label', .84, .94), 16);
    up(p + 'sub', B.p('sub', .88, .98));
    footIn(B, p); holdLife(B, p, d, { alias: { book: 'book', chunks: 'ch1', store: 'store', q: 'q', match: 'ch' + ((k.hot || [1])[0]), lift: 'store', land: 'ld1', label: 'label', marks: 'mk1' } });
  }
});
