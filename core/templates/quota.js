/* quota: how much actually fits. One shelf per mechanism — NAME, a gauge, and the number — plus an optional
   fixed ceiling marker (the 4 KB cookie, the 5 MB Web Storage line), a big counter, a QuotaExceededError pill
   and the factors the real limit depends on.
   The whole point of this section of the script is that some limits are a small fixed number and others are a
   share of one browser-wide quota, so a quota row draws its gauge in blue and past the ceiling; a fixed row
   stops at it.
   data: {eyebrow, accent, h1, h1size?, labelW?, rows:[{k, cls?, v, value, q?}], ceiling?:{at, label},
          counter?:{from,to,fmt,cls}, chips?:[string], err?, note?, strike?:number, sub?, foot?}
   `v` is the gauge fill 0..1, `at` the ceiling's position on the same scale, `strike` the 1-based row to cross out.
   beats: g1..gn (shelves; the gauge fills 0.18s behind its shelf) · ceil · cnt · k1..kn (factor chips) · err ·
          strike · note · sub */
const QT = { h: 104, gap: 18, labelW: 270, padR: 258, padX: 26, gapX: 22 };
defineTemplate('quota', {
  check: d => req(d, ['eyebrow', 'h1', 'rows'], 'quota'),
  beats: d => baseBeats(d).concat(seqN('g', d.rows.length), seqN('k', (d.chips || []).length),
    ['ceil', 'cnt', 'err', 'strike', 'note', 'sub']),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, H = c.grid.ch, n = d.rows.length;
    // The key column is a fixed width and nowrap, so a long name ("One universal quota") used to run under the
    // gauge track, which paints over it. Widen the column per slide with `labelW`, and shrink the type when the
    // name still will not fit: ~16 uppercase JB characters fit the default 270px.
    const lw = d.labelW != null ? d.labelW : QT.labelW;
    const trackL = QT.padX + lw + QT.gapX;
    const fits = Math.max(1, Math.floor(lw / 16.9));
    const keySize = k => (k.length > fits ? Math.max(17, Math.floor(24 * fits / k.length)) : 24);
    const tw = w - trackL - QT.padR;                          // the gauge track, in content-column pixels
    // Top-anchored: a one-row gauge belongs under the eyebrow, not floating mid-frame with dead space above it
    const extras = (d.err ? 72 : 0) + (d.counter ? 122 : 0) + ((d.chips || []).length ? 76 : 0) + (d.note ? 86 : 0);
    // six shelves plus a note overflow a fixed 104px row, so the row height gives way before the box does
    const rh = Math.min(QT.h, Math.max(78, Math.floor((H - extras) / n) - QT.gap));
    const padT = Math.max(0, Math.min(40, Math.round((H - (n * (rh + QT.gap) + extras)) / 3)));
    const rows = d.rows.map((r, i) => `<div class="qs ${r.cls || d.accent || 'a'}" id="${p}g${i + 1}" style="left:0;top:${padT + i * (rh + QT.gap)}px;width:${w}px;height:${rh}px">
        <span class="qk" style="width:${lw}px;font-size:${keySize(r.k)}px">${r.k}</span><span class="qt2"><span class="qf" id="${p}gf${i + 1}"></span></span>
        <span class="qv${r.q ? ' q' : ''}" id="${p}gv${i + 1}">${r.value}</span></div>`).join('');
    const bottom = padT + n * (rh + QT.gap);
    const ceil = d.ceiling ? `<div class="q-ceil" id="${p}ceil" style="left:${Math.round(trackL + d.ceiling.at * tw)}px;top:${padT + rh / 2 - 34}px;height:${bottom - QT.gap - rh / 2 + 34 - padT}px"><b${d.ceiling.at > .8 ? ' style="left:auto;right:14px;text-align:right"' : ''}>${d.ceiling.label}</b></div>` : '';
    const err = d.err ? `<div class="q-err" id="${p}err" style="left:${trackL}px;top:${bottom + 12}px">${d.err}</div>` : '';
    const cnt = d.counter ? `<div class="q-cnt ${d.counter.cls || ''}" id="${p}cnt" style="left:0;top:${bottom + (d.err ? 84 : 16)}px">${d.counter.from}</div>` : '';
    const chips = (d.chips || []).length ? `<div class="q-chips" id="${p}chips" style="left:0;top:${bottom + (d.err ? 84 : 16) + (d.counter ? 122 : 0)}px;width:${w}px">`
      + d.chips.map((x, i) => `<i id="${p}k${i + 1}">${x}</i>`).join('') + '</div>' : '';
    const noteY = Math.min(bottom + (d.err ? 84 : 16) + (d.counter ? 122 : 0) + ((d.chips || []).length ? 76 : 0), H - 74);
    const note = d.note ? `<div class="q-note" id="${p}note" style="left:0;top:${noteY}px;width:${w}px">${d.note}</div>` : '';
    // The strike runs through the struck row's mid-line, inset to the row's own padding. It used to span the
    // full column on a curve steep enough to leave the row's ink at both ends.
    const strike = d.strike ? (() => { const y = padT + (d.strike - 1) * (rh + QT.gap) + rh / 2;
      return `<svg class="strike" id="${p}st" style="left:0;top:${y - 30}px;width:${w}px;height:60px" viewBox="0 0 ${w} 60"><path d="M${QT.padX} 33 Q${w / 2} 27 ${w - QT.padX} 31"/></svg>`; })() : '';
    return `${heading(p, d)}<div class="content"><div class="rel">${rows}${ceil}${strike}${err}${cnt}${chips}${note}
      ${subHtml(p, d.sub, Math.min(noteY + (d.note ? 86 : 0), H - 70), w)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, n = d.rows.length, B = beats(c);
    headIn(B, p);
    const rows = B.group('g', n, { a: ENTER.first, step: .08, len: ENTER.len, kind: 'enter', dim: d.dim !== false });
    rows.forEach((r, i) => {
      sx(p + 'g' + (i + 1), r.p, -80);
      const f = B.at('gf' + (i + 1), r.fa + .08, r.fa + .30, 'bar', { after: r, delay: .18, focal: false });
      fill(p + 'gf' + (i + 1), f.p);
      fd(p + 'gv' + (i + 1), seg(f.p, .55, 1));
      dim(p + 'g' + (i + 1), r.dim);
    });
    const ce = B.at('ceil', .50, .62, 'draw', { focal: false });
    st(p + 'ceil', { opacity: String(cl(ce.p * 2, 0, 1)), transform: 'scaleY(' + eo(ce.p).toFixed(3) + ')', transformOrigin: 'top center' });
    // The strike is chained to the row it crosses: with no beat of its own it used to fall 0.9s after whatever
    // spoke last, which drew the line on an empty shelf before the row had arrived.
    if (d.strike) draw(p + 'st', B.p('strike', .62, .74, 'draw', { after: rows[d.strike - 1], delay: .45 }));
    if (d.counter) tick(p + 'cnt', B.p('cnt', .56, .70, 'tick'), d.counter.from, d.counter.to, d.counter.fmt || (v => Math.round(v)));
    pp(p + 'err', B.p('err', .70, .80, 'pop'), .84);
    B.group('k', (d.chips || []).length, { a: .66, step: .05, len: .10, kind: 'pop' }).forEach((r, i) => pp(p + 'k' + (i + 1), r.p, .82));
    up(p + 'note', B.p('note', .80, .90));
    up(p + 'sub', B.p('sub', .86, .96));
    footIn(B, p); holdLife(B, p, d);
  }
});
