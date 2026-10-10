/* rail: the write path as a chain — App → API → store — with drawn connectors, an optional data token that
   rides the chain, and an optional fan of destinations hanging under the last stage (one server, three local
   databases). This is the deck's signature figure: the script draws every one of these relationships as a
   vertical arrow list, and the deck reads them left to right so the motion always travels the way the data does.
   Coordinates are computed from the stage count, so nothing here measures the DOM.
   data: {eyebrow, accent, h1, h1size?, stages:[{n, s?, ico?, icon?, brand?, cls?, chips?:[string]}], fan?:[{n, s?, ico?, icon?, brand?, cls?}],
          token?:{label}, loop?:string, badge?:{text,cls}, sub?, foot?}
   `ico` is an inline icon id (i-db, i-file …), `icon` a logo slug (`brand:false` for an AWS icon).
   beats: n1..nk (stages) · e1..e(k-1) (the connector INTO stage i+1) · c1..cn (stage chips, numbered across the
          whole rail: three languages feeding one platform API) · fc1..fcn (fan chips) · f1..fm (fan boxes) ·
          g1..gm (fan connectors) · tok (when the token appears; it then rides the e* beats, one leg per
          connector, so the ride is timed by the narration rather than by a fraction) · eL · badge · sub */
const RL = { gap: 54, h: 176, fanH: 150, fanGap: 30, tokH: 50, padX: 22, icoH: 44, rowGap: 8, padY: 14 };
/* How tall a rail cell has to be to hold its own text, and what size that text can be.
   The card used to be a hard 176px with `overflow:hidden`, so a five-stage rail (176px wide, a 128px text
   column) sliced the icon off the top of the card and the last line off the subtitle. Nothing here measures
   the DOM — the same character-budget estimate quota.js uses for its key column, with the probe's `deep`
   check on `.rl-stage` as the backstop if an estimate is ever wrong.
   Inter Display 800 averages ~.54em per glyph; JetBrains Mono is a fixed .60em. */
const ID_EM = .54, JB_EM = .60;
/* greedy word wrap: how many lines `txt` needs at `cpl` characters per line */
const rlLines = (txt, cpl) => {
  let n = 1, len = 0;
  String(txt).replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).forEach(word => {
    if (len && len + 1 + word.length > cpl) { n++; len = word.length; } else { len = len ? len + 1 + word.length : word.length; }
  });
  return n;
};
const rlLongest = txt => String(txt).replace(/<[^>]*>/g, '').split(/\s+/).reduce((a, x) => Math.max(a, x.length), 0);
/* type size + row height for a set of cells sharing a column width */
function rlFit(cw, items, floorH) {
  const iw = cw - RL.padX * 2 - 4;
  const big = f => items.reduce((a, s) => Math.max(a, rlLongest(f(s) || '')), 1);
  // the type scales with the column first (full-size 30px in a 128px column wraps every label to three
  // lines), then shrinks further if a single unbreakable word still would not fit
  const nSize = Math.max(18, Math.min(30, Math.round(iw / 5.4), Math.floor(iw / (big(s => s.n) * ID_EM))));
  const sSize = Math.max(13, Math.min(20, Math.round(nSize * .68), Math.floor(iw / (big(s => s.s) * JB_EM))));
  const nLh = Math.round(nSize * 1.1), sLh = Math.round(sSize * 1.2);
  const body = s => RL.icoH + RL.rowGap + rlLines(s.n, Math.max(1, Math.floor(iw / (nSize * ID_EM)))) * nLh
    + (s.s ? RL.rowGap + rlLines(s.s, Math.max(1, Math.floor(iw / (sSize * JB_EM)))) * sLh : 0)
    + ((s.chips || []).length ? 38 : 0);
  return { nSize, sSize, h: Math.max(floorH, Math.max(...items.map(body)) + RL.padY * 2) };
}
/* 9:16: the chain turns to run top to bottom, which is how the script reads it ("a vertical arrow list").
   A five-stage row in the 800px column left each card 140px wide and its text unreadable at phone size, so the
   stages stack as full-width cards (icon, name over subtitle, chips on the right) with a down arrow between each,
   the token rides down a lane on the right, a fan hangs as a row under the last card, and the loop climbs back
   up that same right lane. Beat names do not change, so one timeline serves both canvases. */
const RLV = { rowH: 104, gapV: 46, lane: 130, nSize: 32, sSize: 20, fanGapV: 80 };
function rlVGeom(d, w) {
  const k = d.stages.length, fan = d.fan || [], m = fan.length;
  const cardW = d.token || d.loop ? w - RLV.lane : w;
  const ys = d.stages.map((_, i) => i * (RLV.rowH + RLV.gapV));
  const lastB = ys[k - 1] + RLV.rowH;
  const fw = m ? Math.floor((w - RL.fanGap * (m - 1)) / m) : 0;
  const ffit = m ? rlFit(fw, fan, RL.fanH) : null;
  const fanY = lastB + RLV.fanGapV;
  const end = m ? fanY + ffit.h : lastB;
  return { k, m, cardW, ys, fw, ffit, fanY, end, cy: i => ys[i] + RLV.rowH / 2 };
}
defineTemplate('rail', {
  check: d => {
    req(d, ['eyebrow', 'h1', 'stages'], 'rail');
    if (d.stages.length < 2 || d.stages.length > 6) throw new Error('template "rail": 2 to 6 stages');
  },
  beats: d => baseBeats(d).concat(seqN('n', d.stages.length), seqN('e', Math.max(0, d.stages.length - 1)),
    seqN('c', d.stages.reduce((a, s) => a + (s.chips || []).length, 0)),
    seqN('fc', (d.fan || []).reduce((a, s) => a + (s.chips || []).length, 0)),
    seqN('f', (d.fan || []).length), seqN('g', (d.fan || []).length), ['tok', 'eL', 'badge', 'sub']),
  html: (d, c) => {
    if (c.grid.canvas === 'vertical') return TEMPLATES.rail.vhtml(d, c);
    const p = c.p, w = c.grid.cw, H = c.grid.ch, k = d.stages.length, fan = d.fan || [], m = fan.length;
    const sw = Math.floor((w - RL.gap * (k - 1)) / k);
    const fit = rlFit(sw, d.stages, RL.h), stageH = fit.h;
    const fw = m ? Math.floor((w - RL.fanGap * (m - 1)) / m) : 0;
    const ffit = m ? rlFit(fw, fan, RL.fanH) : fit, fanH = m ? ffit.h : RL.fanH;
    // the token gets a band of its own above the row. It used to be pulled up into the row (top - 34), where
    // z-index 5 painted it over the first card it parked on and hid that card's icon.
    const tokH = d.token ? RL.tokH : 0;
    const blockH = tokH + stageH + (m ? 96 + fanH : 0) + (d.loop ? 92 : 0);
    // top-anchored, like quota and stackcode: the chain sits under the eyebrow and grows downward
    const top = Math.max(0, Math.min(40, Math.round((H - blockH - (d.badge ? 96 : 0)) / 3)));
    const rowY = top + tokH;   // origin of the stage row; the connectors, fan and loop all measure from it
    const cx = i => i * (sw + RL.gap) + sw / 2;
    // stage chips number across the whole rail; fan chips have their own sequence, because sharing one counter
    // gave fan chips ids past the animated range and they rendered permanently on
    let ci = 0, fci = 0;
    const cell = (o, id, x, y, cw, ch, cp, ty) => `<div class="rl-stage ${o.cls || d.accent || 'a'}" id="${id}" style="left:${x}px;top:${y}px;width:${cw}px;height:${ch}px;--ns:${ty.nSize}px;--ss:${ty.sSize}px">
      ${o.ico ? `<span class="ri"><svg viewBox="0 0 24 24"><use href="#${o.ico}"/></svg></span>` : ''}
      ${o.icon ? `<img src="${logo(o.icon, o.brand === undefined ? true : o.brand)}" alt="" onerror="this.remove()">` : ''}
      <b>${o.n}</b>${o.s ? `<i>${o.s}</i>` : ''}
      ${(o.chips || []).length ? `<span class="rc">${o.chips.map(x2 => `<i id="${p}${cp === 'fc' ? 'fc' + (++fci) : 'c' + (++ci)}">${x2}</i>`).join('')}</span>` : ''}</div>`;
    const stages = d.stages.map((s, i) => cell(s, p + 'n' + (i + 1), i * (sw + RL.gap), rowY, sw, stageH, 'c', fit)).join('');
    // one svg per connector so each can draw on its own beat
    const edges = d.stages.slice(1).map((_, i) => {
      const x0 = (i + 1) * (sw + RL.gap) - RL.gap, y = rowY + stageH / 2;
      return `<svg class="rl-edge" id="${p}e${i + 1}" style="left:${x0}px;top:${y - 22}px;width:${RL.gap}px;height:44px" viewBox="0 0 ${RL.gap} 44">
        <defs><marker id="${p}e${i + 1}m" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.4" markerHeight="4.4" orient="auto"><path d="M0 1L9 5L0 9Z"/></marker></defs>
        <path d="M4 22 H${RL.gap - 12}" marker-end="url(#${p}e${i + 1}m)"/></svg>`;
    }).join('');
    const fanY = rowY + stageH + 96;
    const fans = fan.map((f, i) => cell(f, p + 'f' + (i + 1), i * (fw + RL.fanGap), fanY, fw, fanH, 'fc', ffit)).join('');
    // the fan hangs off the centre of the last stage: one elbow per destination
    const legs = fan.map((_, i) => {
      const x0 = cx(k - 1), x1 = i * (fw + RL.fanGap) + fw / 2, y0 = rowY + stageH, y1 = fanY;
      const mid = y0 + (y1 - y0) / 2, W = Math.abs(x1 - x0) + 40, L = Math.min(x0, x1) - 20;
      return `<svg class="rl-edge" id="${p}g${i + 1}" style="left:${L}px;top:${y0}px;width:${W}px;height:${y1 - y0}px" viewBox="0 0 ${W} ${y1 - y0}">
        <defs><marker id="${p}g${i + 1}m" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.4" markerHeight="4.4" orient="auto"><path d="M0 1L9 5L0 9Z"/></marker></defs>
        <path d="M${x0 - L} 0 V${mid - y0} H${x1 - L} V${y1 - y0 - 12}" marker-end="url(#${p}g${i + 1}m)"/></svg>`;
    }).join('');
    const loopY = rowY + stageH + (m ? 96 + fanH : 0) + 46;
    const loop = d.loop ? `<svg class="rl-edge back" id="${p}eL" style="left:0;top:${rowY + stageH}px;width:${w}px;height:${loopY - rowY - stageH + 30}px" viewBox="0 0 ${w} ${loopY - rowY - stageH + 30}">
        <defs><marker id="${p}eLm" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.4" markerHeight="4.4" orient="auto"><path d="M0 1L9 5L0 9Z"/></marker></defs>
        <path d="M${cx(k - 1)} 8 V${loopY - rowY - stageH} H${cx(0)} V20" marker-end="url(#${p}eLm)"/></svg>
        <div class="rl-loop" id="${p}eLl" style="left:0;top:${loopY - 34}px;width:${w}px">${d.loop}</div>` : '';
    const tok = d.token ? `<div class="rl-tok" id="${p}tok" style="left:${cx(0)}px;top:${top}px">${d.token.label}</div>` : '';
    const after = top + blockH + 30;
    return `${heading(p, d)}<div class="content"><div class="rel">${edges}${legs}${loop}${stages}${fans}${tok}
      ${d.badge ? `<div class="badge ${d.badge.cls || 'n'}" id="${p}bd" style="left:0;top:${Math.min(after, H - 76)}px;font-size:28px">${d.badge.text}</div>` : ''}
      ${subHtml(p, d.sub, Math.min(after + (d.badge ? 80 : 0), H - 70), w)}</div></div>`;
  },
  vhtml: (d, c) => {
    const p = c.p, w = c.grid.cw, fan = d.fan || [], g = rlVGeom(d, w), arrow = (id, x, y, len) =>
      `<svg class="rl-edge" id="${id}" style="left:${x - 22}px;top:${y}px;width:44px;height:${len}px" viewBox="0 0 44 ${len}">
        <defs><marker id="${id}m" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.4" markerHeight="4.4" orient="auto"><path d="M0 1L9 5L0 9Z"/></marker></defs>
        <path d="M22 4 V${len - 12}" marker-end="url(#${id}m)"/></svg>`;
    let ci = 0, fci = 0;
    const chipsHtml = (o, cp) => (o.chips || []).length ? `<span class="rc">${o.chips.map(x => `<i id="${p}${cp === 'fc' ? 'fc' + (++fci) : 'c' + (++ci)}">${x}</i>`).join('')}</span>` : '';
    const icon = o => `${o.ico ? `<span class="ri"><svg viewBox="0 0 24 24"><use href="#${o.ico}"/></svg></span>` : ''}${o.icon ? `<img src="${logo(o.icon, o.brand === undefined ? true : o.brand)}" alt="" onerror="this.remove()">` : ''}`;
    const stages = d.stages.map((s, i) => `<div class="rl-stage row ${s.cls || d.accent || 'a'}" id="${p}n${i + 1}" style="left:0;top:${g.ys[i]}px;width:${g.cardW}px;height:${RLV.rowH}px;--ns:${RLV.nSize}px;--ss:${RLV.sSize}px">
      ${icon(s)}<b>${s.n}</b>${s.s ? `<i>${s.s}</i>` : ''}${chipsHtml(s, 'c')}</div>`).join('');
    const ax = 52;   // the arrows drop from under the icon column
    const edges = d.stages.slice(1).map((_, i) => arrow(p + 'e' + (i + 1), ax, g.ys[i] + RLV.rowH, RLV.gapV)).join('');
    const fans = fan.map((f, i) => `<div class="rl-stage ${f.cls || d.accent || 'a'}" id="${p}f${i + 1}" style="left:${i * (g.fw + RL.fanGap)}px;top:${g.fanY}px;width:${g.fw}px;height:${g.ffit.h}px;--ns:${g.ffit.nSize}px;--ss:${g.ffit.sSize}px">
      ${icon(f)}<b>${f.n}</b>${f.s ? `<i>${f.s}</i>` : ''}${chipsHtml(f, 'fc')}</div>`).join('');
    const y0 = g.ys[g.k - 1] + RLV.rowH;
    const legs = fan.map((_, i) => {
      const x0 = ax, x1 = i * (g.fw + RL.fanGap) + g.fw / 2, y1 = g.fanY, mid = y0 + (y1 - y0) / 2, W = Math.abs(x1 - x0) + 40, L = Math.min(x0, x1) - 20;
      return `<svg class="rl-edge" id="${p}g${i + 1}" style="left:${L}px;top:${y0}px;width:${W}px;height:${y1 - y0}px" viewBox="0 0 ${W} ${y1 - y0}">
        <defs><marker id="${p}g${i + 1}m" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.4" markerHeight="4.4" orient="auto"><path d="M0 1L9 5L0 9Z"/></marker></defs>
        <path d="M${x0 - L} 0 V${mid - y0} H${x1 - L} V${y1 - y0 - 12}" marker-end="url(#${p}g${i + 1}m)"/></svg>`;
    }).join('');
    // the loop climbs the right lane from the last card back to the first
    const lx = g.cardW + RLV.lane / 2, top0 = g.cy(0), bot = g.cy(g.k - 1);
    const loop = d.loop ? `<svg class="rl-edge back" id="${p}eL" style="left:${g.cardW}px;top:${top0 - 10}px;width:${RLV.lane}px;height:${bot - top0 + 20}px" viewBox="0 0 ${RLV.lane} ${bot - top0 + 20}">
        <defs><marker id="${p}eLm" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.4" markerHeight="4.4" orient="auto"><path d="M0 1L9 5L0 9Z"/></marker></defs>
        <path d="M8 ${bot - top0 + 10} H${lx - g.cardW} V10 H20" marker-end="url(#${p}eLm)"/></svg>
        <div class="rl-loop" id="${p}eLl" style="left:0;top:${g.end + 24}px;width:${w}px">${d.loop}</div>` : '';
    const tok = d.token ? `<div class="rl-tok" id="${p}tok" style="left:${lx}px;top:${top0}px">${d.token.label}</div>` : '';
    const after = g.end + (d.loop ? 80 : 36);
    return `${heading(p, d)}<div class="content"><div class="rel">${edges}${legs}${loop}${stages}${fans}${tok}
      ${d.badge ? `<div class="badge ${d.badge.cls || 'n'}" id="${p}bd" style="left:0;top:${after}px;font-size:28px">${d.badge.text}</div>` : ''}
      ${subHtml(p, d.sub, after + (d.badge ? 80 : 0), w)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, k = d.stages.length, fan = d.fan || [], B = beats(c), w = c.grid.cw;
    headIn(B, p);
    const sw = Math.floor((w - RL.gap * (k - 1)) / k), cx = i => i * (sw + RL.gap) + sw / 2;
    const nch = d.stages.reduce((a, s) => a + (s.chips || []).length, 0);
    const ns = B.group('n', k, { a: .12, step: .07, len: ENTER.len, kind: 'enter', dim: d.dim === true });
    B.group('c', nch, { a: .24, step: .05, len: .10, kind: 'pop' }).forEach((r, i) => pp(p + 'c' + (i + 1), r.p, .8));
    ns.forEach((r, i) => { sx(p + 'n' + (i + 1), r.p, -70); dim(p + 'n' + (i + 1), r.dim); });
    // one record per connector, kept so the token and the arrows can never disagree
    const es = [];
    for (let i = 1; i < k; i++) {
      const prev = ns[i - 1];
      es.push(B.at('e' + i, prev.fb, prev.fb + .10, 'draw', { after: prev, delay: .22, focal: false }));
      draw(p + 'e' + i, es[i - 1].p);
    }
    B.group('fc', fan.reduce((a, s) => a + (s.chips || []).length, 0), { a: .58, step: .05, len: .10, kind: 'pop' })
      .forEach((r, i) => pp(p + 'fc' + (i + 1), r.p, .8));
    const fs = B.group('f', fan.length, { a: .52, step: .07, len: ENTER.len, kind: 'enter', dim: false });
    fs.forEach((r, i) => {
      draw(p + 'g' + (i + 1), B.p('g' + (i + 1), r.fa - .04, r.fa + .06, 'draw', { after: ns[k - 1], delay: .18 + i * .10, focal: false }));
      sx(p + 'f' + (i + 1), r.p, -50);
    });
    if (d.loop) { const lp = B.at('eL', .74, .88, 'draw'); draw(p + 'eL', lp.p); fd(p + 'eLl', seg(lp.p, .6, 1)); }
    // The token travels the chain leg by leg, riding each connector as it draws. It used to be one lerp across
    // the whole rail on a single `tok` beat, so on a 3- or 5-stage rail the eye only ever caught the last leg
    // and the data never appeared to leave the first stage.
    if (d.token) {
      const tk = B.at('tok', .16, .30, 'enter', { after: ns[0], delay: .10, len: .5, focal: false });
      if (c.grid.canvas === 'vertical') {   // down the right lane, centred on the card it has reached
        const g = rlVGeom(d, w);
        let y = g.cy(0);
        for (let i = 0; i < es.length; i++) y = lerp(y, g.cy(i + 1), eio(cl(es[i].p, 0, 1)));
        st(p + 'tok', { opacity: String(cl(tk.p * 4, 0, 1)), top: y.toFixed(1) + 'px', transform: 'translate(-50%,-50%)' });
      } else {
        let x = cx(0);
        for (let i = 0; i < es.length; i++) x = lerp(x, cx(i + 1), eio(cl(es[i].p, 0, 1)));
        st(p + 'tok', { opacity: String(cl(tk.p * 4, 0, 1)), left: x.toFixed(1) + 'px', transform: 'translateX(-50%)' });
      }
    }
    up(p + 'bd', B.p('badge', .82, .92));
    up(p + 'sub', B.p('sub', .88, .98));
    footIn(B, p); holdLife(B, p, d, { alias: { badge: 'bd' } });
  }
});
