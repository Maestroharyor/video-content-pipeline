/* outro: brand handles + link-in-bio box + audio bed. All data optional (defaults from BRAND / PROJECT.brand).
   data: {eyebrow?, h1?, foot?, handles?, box?, cols? (horizontal: handles per row)} */
defineTemplate('outro', {
  defaults: () => ({ eyebrow: BRAND.outro.eyebrow, h1: BRAND.outro.h1, accent: BRAND.accent, handles: BRAND.handles, box: BRAND.box }),
  beats: d => baseBeats(d).concat(seqN('hr', (d.handles || BRAND.handles).length), ['div', 'box']),
  audio: () => BRAND.audio || null,
  html: (d, c) => {
    const p = c.p, G = c.grid, V = G.canvas === 'vertical';
    // vertical rows sit at a looser 162 pitch; a project can tighten it (grid.outroStep) when four handles and a link
    // box have to end above a caption band
    const x = V ? G.gx : G.cx, y0 = V ? G.cy + 15 : G.cy, step = V ? (G.outroStep || 162) : 132, w = V ? G.cw : G.cw;
    const cols = V ? 1 : (d.cols || 1), colW = Math.floor(w / cols);   // horizontal decks may spread the handles over columns
    const rows = d.handles.map((h, i) => `<div class="hrow" id="${p}hr${i + 1}" style="left:${x + (i % cols) * colW}px;top:${y0 + Math.floor(i / cols) * step}px"><span class="ht">${h.icon ? `<img src="${logo(h.icon, true)}" alt="${h.net}">` : `<span class="ltxt" style="font-size:52px;color:${h.color}">${h.text}</span>`}</span><span class="hx"><b>${h.handle}</b><i>${h.net}</i></span></div>`).join('');
    const divY = y0 + Math.ceil(d.handles.length / cols) * step + (V ? 40 : 36), boxY = divY + 70;   // air between the last handle and the divider
    return `${heading(p, Object.assign({}, d, { footTop: V ? 1480 : undefined }))}${rows}
      <svg class="draw" id="${p}div" style="left:${x}px;top:${divY}px;width:${w}px;height:12px" viewBox="0 0 ${w} 12"><path d="M0 6 H${w}" stroke="#2E3D5C" stroke-width="4"/></svg>
      ${!d.box ? '' : `<div class="bbox" id="${p}box" style="left:${x}px;top:${boxY}px;width:${w}px"><span class="bl"><img src="${logo(d.box.icon || 'braandly', true)}" alt=""></span><span class="bt"><b>${d.box.title}</b><i>${d.box.url}</i></span><span class="shim" id="${p}shim" style="left:-240px"></span></div>`}`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, n = d.handles.length, B = beats(c);
    headIn(B, p);
    const beatsF = [.30, .42, .54, .66];
    d.handles.forEach((_, k) => {
      const a = beatsF[k] || (.30 + k * .12);
      const q = B.p('hr' + (k + 1), a, a + .10, 'pop', k ? { after: B.at('hr' + k, beatsF[k - 1] || (.30 + (k - 1) * .12), (beatsF[k - 1] || (.30 + (k - 1) * .12)) + .10, 'pop', { focal: false }), delay: .12 } : {}), e = bk(q);
      st(p + 'hr' + (k + 1), { opacity: cl(q * 2.4, 0, 1), transform: 'translateX(' + ((1 - eo(q)) * -40) + 'px) scale(' + (.80 + .20 * e) + ')' });
    });
    draw(p + 'div', B.p('div', .70, .80, 'draw'));
    up(p + 'box', B.p('box', .78, .90), 40);
    const sp = seg(t, .86, 1);
    st(p + 'shim', { opacity: sp > 0 && sp < 1 ? 1 : 0, transform: 'translateX(' + (sp * (c.grid.cw + 360)) + 'px)' });
    up(p + 'ft', B.p('foot', .90, 1, 'enter', { focal: false }));
    holdLife(B, p, d);
  }
});
