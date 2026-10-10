/* talk: the characters carry the line (projects/cloud-vs-devops). Characters stand on the left and talk in bubbles;
   the right side holds what they are talking about: a statement card, a before/after pair (manual steps struck one
   by one, then the automated replacement), or a flow of stages with commits piling up at the first one.
   data: {eyebrow, accent, h1, cast:[{src, name, cls, size?}], bubbles:[{who, text, x, y, w, tail, cls}],
          panel?: {label, quote, cls, strike?}, steps?: {left:{lb, items:[string]}, right:{lb, text}},
          flow?: [{n, s?, cls?}], commits?: [string], icons?: [{icon, brand?, label}] (a logo row under the panel),
          badge?: {text, cls}, sub?, foot?}
   Bubble x/y are in content coordinates (the template does not guess where a character's mouth is).
   beats: a1.., b1.. · q (panel), st (panel strike) · s1..sn (a manual step struck), r (the replacement)
          · f1..fn (flow stages) · k1..kn (commits) · i1..in (logo row) · badge · sub */
const TALK = { castW: 250, gap: 50 };
defineTemplate('talk', {
  check: d => req(d, ['eyebrow', 'h1', 'cast'], 'talk'),
  beats: d => baseBeats(d).concat(castBeats(d.cast, d.bubbles), d.panel ? ['q', 'st'] : [],
    d.steps ? seqN('s', d.steps.left.items.length).concat(['r']) : [], seqN('f', (d.flow || []).length), seqN('k', (d.commits || []).length), seqN('i', (d.icons || []).length), ['badge', 'sub']),
  html: (d, c) => {
    // vertical canvas: the cast stands at the top (its bubbles beside it, data.v), the rest runs full width under it
    const p = c.p, G = c.grid, V = G.canvas === 'vertical', n = d.cast.length, castW = n * TALK.castW;
    const x0 = V ? 0 : castW + TALK.gap, w = G.cw - x0, oy = V ? 400 : 0;
    const cast = d.cast.map((a, i) => Object.assign({ x: i * TALK.castW, y: V ? 130 : 200, size: 220 }, a));
    let right = '', h = 0;
    if (d.panel) {
      right += `<div class="cmp ${d.panel.cls || ''}" id="${p}q" style="left:${x0}px;top:${oy}px;width:${w}px"><span class="lb">${d.panel.label || ''}</span><span class="qt" id="${p}qt">${d.panel.quote}</span></div>`;
      if (d.panel.strike) right += `<svg class="strike" id="${p}st" style="left:0;top:0;width:0;height:0" viewBox="0 0 1 1"></svg>`;
      h = oy + 220;
    }
    if (d.steps) {
      const L = d.steps.left, R = d.steps.right, cw = Math.round((w - 40) / 2);
      right += `<div class="tk-card" id="${p}sl" style="left:${x0}px;top:${oy}px;width:${cw}px"><b>${L.lb}</b>${L.items.map((it, i) =>
        `<div class="tk-step" id="${p}s${i + 1}"><code>${tmEsc(it)}</code><i class="tk-x" id="${p}s${i + 1}x"></i></div>`).join('')}</div>
        <div class="tk-card ok" id="${p}r" style="left:${x0 + cw + 40}px;top:${oy}px;width:${cw}px"><b>${R.lb}</b><div class="tk-big"><code>${tmEsc(R.text)}</code></div></div>`;
      h = oy + 90 + L.items.length * 74;
    }
    if (d.flow) {
      const nf = d.flow.length, fw = Math.floor((w - (nf - 1) * 50) / nf), fy = oy + (d.commits ? 190 : 0);
      right += d.flow.map((f, i) => `<div class="tk-stage ${f.cls || ''}" id="${p}f${i + 1}" style="left:${x0 + i * (fw + 50)}px;top:${fy}px;width:${fw}px"><b>${f.n}</b>${f.s ? `<i>${f.s}</i>` : ''}</div>
        ${i ? `<i class="tk-arrow" id="${p}fa${i + 1}" style="left:${x0 + i * (fw + 50) - 42}px;top:${fy + 44}px"></i>` : ''}`).join('');
      right += (d.commits || []).map((k, i) => `<span class="tk-commit" id="${p}k${i + 1}" style="left:${x0 + (i % 2) * 18}px;top:${fy - 46 - i * 34}px">${k}</span>`).join('');
      h = fy + 120;
    }
    if (d.icons) {
      // the logo row spans the panel's width under whatever the panel holds, one even column per logo
      const iy = h + 50, col = Math.floor(w / d.icons.length);
      right += d.icons.map((ic, i) => logoStack({ id: p + 'i' + (i + 1), x: x0 + col * i + Math.round((col - 140) / 2), y: iy, icon: ic.icon, brand: ic.brand, label: ic.label, size: 'sm', w: 140 })).join('');
      h = iy + 170;
    }
    right += d.badge ? `<div class="badge ${d.badge.cls || d.accent || 'n'}" id="${p}bd" style="left:${x0}px;top:${h + 30}px;font-size:30px">${d.badge.text}</div>` : '';
    return `${heading(p, d)}<div class="content"><div class="rel">${castBlock(p, cast, d.bubbles)}${right}
      ${subHtml(p, d.sub, Math.max(h + (d.badge ? 120 : 30), 470), G.cw)}</div></div>`;
  },
  place: (d, c) => { if (d.panel && d.panel.strike) d._struck = strikeText(c.p + 'st', c.p + 'qt') && document.fonts.status === 'loaded'; },
  setup: (root, d, c) => { TEMPLATES.talk.place(d, c); },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c);
    if (d.panel && d.panel.strike && !d._struck) TEMPLATES.talk.place(d, c);
    headIn(B, p);
    castPlay(B, c, p, d.cast, d.bubbles);
    if (d.panel) { sx(p + 'q', B.p('q', .2, .34), 60); draw(p + 'st', B.p('st', .5, .62, 'draw')); }
    if (d.steps) {
      up(p + 'sl', B.on ? seg(c.local, .3, .7) : seg(t, .1, .2), 20);   // the "before" card is the scene's premise: it is there as the line starts
      B.group('s', d.steps.left.items.length, { a: .3, step: .08, len: .1, kind: 'draw', dim: false }).forEach((r, i) => {
        st(p + 's' + (i + 1) + 'x', { transform: 'scaleX(' + eo(r.p).toFixed(3) + ')' }); cls(p + 's' + (i + 1), 'off', r.p > .6); });
      pp(p + 'r', B.p('r', .7, .82, 'pop'), .7);
    }
    // the arrow into a stage arrives with that stage, so no arrow points at an empty slot
    B.group('f', (d.flow || []).length, { a: .2, step: .1, len: .1, kind: 'pop', dim: false }).forEach((r, i) => { pp(p + 'f' + (i + 1), r.p, .7); if (i) fd(p + 'fa' + (i + 1), r.p); });
    B.group('k', (d.commits || []).length, { a: .1, step: .05, len: .08, kind: 'pop', dim: false }).forEach((r, i) => {
      const e = bk(cl(r.p, 0, 1)); st(p + 'k' + (i + 1), { opacity: cl(r.p * 2, 0, 1), transform: `translateY(${((1 - e) * -60).toFixed(1)}px)` }); });
    B.group('i', (d.icons || []).length, { a: .75, step: .03, len: .08, kind: 'pop', dim: false }).forEach((r, i) => pp(p + 'i' + (i + 1), r.p, .7));
    pp(p + 'bd', B.p('badge', .86, .96, 'pop'), .84);
    up(p + 'sub', B.p('sub', .9, .98));
    footIn(B, p); holdLife(B, p, d, { alias: { badge: 'bd' } });
  }
});
