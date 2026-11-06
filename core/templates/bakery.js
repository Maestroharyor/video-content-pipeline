/* The bakery family (projects/bun-and-elysia, core/styles/bakery.css): Bun is the bakery, Elysia the frosting.
     bkticket  an order slip: a header with the maker's mark, line items that tick, a rubber stamp; or `pair`, the bun
               with its frosting dropped on top (two marks stacked)
     bkcode    a chalkboard recipe card (code typing in) with tiles under it
     bkrace    loaves rising out of the oven: horizontal bars for a benchmark, its source line, chips under it
     bkshot    a vendor screenshot pinned like a recipe photo, optional code strip above, highlight boxes, a badge
     bksplit   two code panes stacked: the first struck, the second ticked
     bkshelf   pastry boxes on two shelves; `mix` shrinks them into a row and fills one big box with their strengths
     bkover    one paper card (the deck's version of a face-window line)
   Shared data: {eyebrow, accent, h1, star?: {text}} — star is the asterisk correction note, beat `star`.
   Cast and bubbles (core/components/cast.js) work on every bk template: cast, bubbles, beats a1.. b1.. */
const BK_CHECK = '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.6 4.6L19 6.8"/></svg>';
const bkAcc = d => ACCENT_VAR[d.accent] ? `--acc:var(${ACCENT_VAR[d.accent]})` : '';
const bkBeats = d => baseBeats(d).concat(['star'], castBeats(d.cast, d.bubbles));
function bkStar(p, d, y, w) {
  return d.star ? `<div class="bk-star" id="${p}star" style="left:0;top:${y}px;width:${w}px">${d.star.text}</div>` : '';
}
function bkStarIn(B, p, d, a) { if (d.star) up(p + 'star', B.p('star', a || .8, (a || .8) + .1, 'enter'), 20); }
/* a code card: {file, mark?, lines: [html]} → {html, h}; lines are .cl spans with ids <p>l<i> */
function bkCodeCard(p, cd, y, w, id) {
  const fs = cd.sm ? 28 : 31, h = 68 + 22 + 26 + Math.round(cd.lines.length * fs * 1.62);
  const lines = cd.lines.map((l, i) => `<span class="cl" id="${p}${id === 'code' ? '' : id}l${i + 1}">${l || ' '}</span>`).join('');
  return { h, html: `<div class="bk-code bk-ink${cd.sm ? ' sm' : ''}" id="${p}${id}" style="top:${y}px;width:${w}px;height:${h}px">
    <div class="fn">${cd.mark ? `<img id="${p}${id}mk" src="${cd.mark}" alt="">` : ''}${cd.file}<span class="dots"><i></i><i></i><i></i></span></div>
    <pre>${lines}</pre></div>` };
}
function bkCast(p, d) { return castBlock(p, d.cast, d.bubbles); }

/* ---------------- bkticket ----------------
   data: {no, title, mark, li? (row height, 96), pair.big? (the label as a big heading under the marks), items: [{text, src?|icon?, tag?, hot?}], stamp?, pair?: {base: {src}, top: {src}, label}}
   beats: tk · hero (the header mark) · k1..kn · stamp · l (the bun) · r (the frosting) · star · a1.. b1.. */
const BT = { hd: 120, li: 96 };
defineTemplate('bkticket', {
  check: d => req(d, ['eyebrow', 'h1'], 'bkticket'),
  beats: d => bkBeats(d).concat(['tk', 'hero', 'stamp', 'l', 'r'], seqN('k', (d.items || []).length)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw;
    if (d.pair) {
      const cx = Math.round(w / 2);
      return `${heading(p, d)}<div class="content"><div class="rel" style="${bkAcc(d)}">
        <div class="bk-plate top bk-ink" id="${p}r" style="position:absolute;left:${cx - 115}px;top:0"><img src="${d.pair.top.src}" alt=""></div>
        <div class="bk-plate bk-ink" id="${p}l" style="position:absolute;left:${cx - 140}px;top:190px"><img src="${d.pair.base.src}" alt=""></div>
        <div class="${d.pair.big ? 'bk-pairh' : 'bk-note'}" id="${p}lb" style="left:0;width:${w}px;text-align:center;top:${d.pair.big ? 510 : 500}px">${d.pair.label || ''}</div>
        ${bkCast(p, d)}${bkStar(p, d, 580, w)}</div></div>`;
    }
    const n = d.items.length, li = d.li || BT.li, h = 44 + BT.hd + n * li + 40;
    const items = d.items.map((it, i) => `<div class="bk-li" id="${p}k${i + 1}" style="height:${li}px">
      <span class="bx">${BK_CHECK.replace('<svg', `<svg id="${p}ck${i + 1}"`)}</span>
      ${it.src ? `<span class="lg"><img src="${it.src}" alt=""></span>` : it.icon ? `<span class="lg ic"><svg viewBox="0 0 24 24"><use href="#i-${it.icon}"/></svg></span>` : ''}<span class="tx">${it.text}</span>
      ${it.tag ? `<span class="tg${it.hot ? ' hot' : ''}">${it.tag}</span>` : ''}</div>`).join('');
    d._h = h;
    return `${heading(p, d)}<div class="content"><div class="rel" style="${bkAcc(d)}">
      <div class="bk-tk bk-ink" id="${p}tk" style="width:${w}px;height:${h}px">
        <div class="hd"><span class="no">${d.no || ''}</span><span class="ttl">${d.title || ''}</span>
          ${d.mark ? `<span class="mk" id="${p}hero"><img src="${d.mark}" alt=""></span>` : ''}</div>${items}</div>
      ${d.stamp ? `<div class="bk-stamp" id="${p}stamp" style="right:30px;top:${h - 150}px">${d.stamp}</div>` : ''}
      ${bkCast(p, d)}${bkStar(p, d, h + 34, w)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    if (d.pair) {
      const l = B.p('l', .1, .3, 'pop');
      pp(p + 'l', l, .7);
      const r = B.p('r', .4, .6, 'pop', { len: .5 });
      // the frosting drops onto the bun and settles with a squash
      st(p + 'r', { opacity: String(cl(r * 3, 0, 1)), transform: 'translateY(' + Math.round((1 - eo4(r)) * -160) + 'px) scale(' + (1 + .06 * pulse(seg(r, .7, 1))).toFixed(4) + ',' + (1 - .06 * pulse(seg(r, .7, 1))).toFixed(4) + ')' });
      up(p + 'lb', seg(c.local, B.at('r', .4, .6, 'pop').e, B.at('r', .4, .6, 'pop').e + .4), 16);
    } else {
      const tk = B.at('tk', .04, .14, 'enter', { focal: false });
      up(p + 'tk', tk.p, 50);
      pp(p + 'hero', B.p('hero', .1, .2, 'pop', { focal: false, after: tk, delay: .15 }), .6);
      B.group('k', d.items.length, { a: .2, step: .1, len: .12, kind: 'enter' }).forEach((r, i) => {
        up(p + 'k' + (i + 1), r.p, 18);
        st(p + 'ck' + (i + 1), { strokeDashoffset: String(30 * (1 - eo(seg(c.local, r.s + .15, r.s + .5)))) });
      });
      if (d.stamp) {
        const s = B.p('stamp', .85, .95, 'pop');
        st(p + 'stamp', { opacity: String(cl(s * 3, 0, 1)), transform: 'rotate(-9deg) scale(' + (1.7 - .7 * bk(s)).toFixed(4) + ')' });
      }
    }
    castPlay(B, c, p, d.cast, d.bubbles);
    bkStarIn(B, p, d);
    footIn(B, p); holdLife(B, p, d);
  }
});

/* ---------------- bkcode ----------------
   data: {file, mark?, lines: [html] (spans .k .f .s .t .c .n .p, hover tags .bk-hov), tiles: [{text, src?}]}
   beats: code · mark (the header logo) · l1..ln · t1..tn · star */
defineTemplate('bkcode', {
  check: d => req(d, ['eyebrow', 'h1', 'file', 'lines'], 'bkcode'),
  beats: d => bkBeats(d).concat(['code', 'mark'], seqN('l', d.lines.length), seqN('t', (d.tiles || []).length)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, cd = bkCodeCard(p, d, 0, w, 'code');
    const y0 = cd.h + 40, tiles = (d.tiles || []).map((t, i) => `<div class="bk-tile bk-ink" id="${p}t${i + 1}" style="left:0;top:${y0 + i * 116}px;width:${w}px">
      ${t.src ? `<img src="${t.src}" alt="">` : ''}${t.text}</div>`).join('');
    const yEnd = y0 + (d.tiles || []).length * 116;
    return `${heading(p, d)}<div class="content"><div class="rel" style="${bkAcc(d)}">${cd.html}${tiles}${bkCast(p, d)}${bkStar(p, d, yEnd + 10, w)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    const cq = B.at('code', .06, .16, 'enter', { focal: false });
    up(p + 'code', cq.p, 30);
    pp(p + 'codemk', B.p('mark', .2, .3, 'pop'), .5);
    B.group('l', d.lines.length, { a: .14, step: .05, len: .1, kind: 'enter' }).forEach((r, i) => {
      codeLine(p + 'l' + (i + 1), r.p);
      const hv = el(p + 'l' + (i + 1)) && el(p + 'l' + (i + 1)).querySelector('.bk-hov');
      if (hv) { const q = seg(c.local, r.e + .2, r.e + .5); hv.style.opacity = String(eo(q)); }
    });
    B.group('t', (d.tiles || []).length, { a: .5, step: .1, len: .12, kind: 'enter', dim: false }).forEach((r, i) => sx(p + 't' + (i + 1), r.p, -60));
    castPlay(B, c, p, d.cast, d.bubbles);
    bkStarIn(B, p, d);
    footIn(B, p); holdLife(B, p, d, { alias: { mark: 'codemk' } });
  }
});

/* ---------------- bkrace ----------------
   data: {rows: [{name, src, sub, v, me?, go?}], max, src (the source line), chips: [{text, src?, sub?}]}
   beats: chart · b1..bn (loaves) · go (the Go rows light) · k1..kn · star */
const BR = { row: 108, name: 260 };
function bkFmt(v) { return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
defineTemplate('bkrace', {
  check: d => req(d, ['eyebrow', 'h1', 'rows', 'max'], 'bkrace'),
  beats: d => bkBeats(d).concat(['chart', 'go'], seqN('b', d.rows.length), seqN('k', (d.chips || []).length)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, tw = w - 64 - BR.name, n = d.rows.length;
    const h = 30 + n * BR.row + 104;
    const rows = d.rows.map((r, i) => {
      const lw = Math.max(44, Math.round(r.v / d.max * tw)), inside = lw > 360;
      return `<div class="bk-row" id="${p}row${i + 1}" style="top:${30 + i * BR.row}px">
        <span class="nm">${r.src ? `<img src="${r.src}" alt="">` : ''}<span>${r.name}<br><small>${r.sub || ''}</small></span></span>
        <span class="tr"><i class="bk-loaf${r.me ? ' me' : ''}" id="${p}b${i + 1}" style="width:${lw}px"></i>
          <span class="val${inside ? ' in' : ''}" id="${p}v${i + 1}" style="${inside ? `left:${lw - 250}px;width:228px;justify-content:flex-end` : `left:${lw + 14}px`}">${bkFmt(r.v)}</span></span></div>`;
    }).join('');
    const goRows = d.rows.map((r, i) => r.go ? i : -1).filter(i => i >= 0);
    const go = goRows.length ? `<i id="${p}go" style="position:absolute;left:18px;right:18px;top:${30 + goRows[0] * BR.row - 8}px;height:${goRows.length * BR.row}px;border-radius:16px;border:4px dashed var(--amber);opacity:0"></i>` : '';
    const chips = (d.chips || []).map((k, i) => `<div class="bk-chip bk-ink" id="${p}k${i + 1}" style="left:${i * 300}px;top:${h + 30}px">${k.src ? `<img src="${k.src}" alt="">` : ''}${k.text}${k.sub ? `<small>${k.sub}</small>` : ''}</div>`).join('');
    const yStar = h + 30 + ((d.chips || []).length ? 96 : 0);
    return `${heading(p, d)}<div class="content"><div class="rel" style="${bkAcc(d)}">
      <div class="bk-race bk-ink" id="${p}chart" style="width:${w}px;height:${h}px">${go}${rows}<div class="bk-src" style="top:${h - 92}px">${d.src || ''}</div></div>
      ${chips}${bkCast(p, d)}${bkStar(p, d, yStar, w)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    const ch = B.at('chart', .04, .14, 'enter', { focal: false });
    up(p + 'chart', ch.p, 40);
    d.rows.forEach((_, i) => fd(p + 'row' + (i + 1), seg(c.local, ch.s + .1 + i * .06, ch.s + .4 + i * .06)));
    B.group('b', d.rows.length, { a: .2, step: .1, len: .15, kind: 'bar' }).forEach((r, i) => {
      st(p + 'b' + (i + 1), { transform: 'scaleX(' + eo(r.p).toFixed(4) + ')' });
      fd(p + 'v' + (i + 1), seg(c.local, r.s, r.s + .2));
      txt(p + 'v' + (i + 1), bkFmt(d.rows[i].v * eo(r.p)));   // the number counts up as the loaf rises
    });
    st(p + 'go', { opacity: String(eo(B.p('go', .6, .7, 'enter', { focal: false }))) });
    B.group('k', (d.chips || []).length, { a: .7, step: .08, len: .1, kind: 'pop', dim: false }).forEach((r, i) => pp(p + 'k' + (i + 1), r.p, .7));
    castPlay(B, c, p, d.cast, d.bubbles);
    bkStarIn(B, p, d);
    footIn(B, p); holdLife(B, p, d, { alias: { b1: 'b1' } });
  }
});

/* ---------------- bkshot ----------------
   data: {src, ratio (h/w of the whole image), w (frame width), bleed? (frame spans the stage, 20px from each edge),
          crop?: {x0, x1, y0, y1} (fractions of the image to show), rot?, cap, code?: {file, mark?, lines, sm?},
          hls: [{x, y, w, h, label?, lp?: 'top'}] (fractions of the WHOLE image), chips: [{text, src?, x?, y?}], badge?: {text, cls}, stamp? (text, on beat `badge`), stampY? (fraction of the photo's height)}
   beats: code · l1..ln · shot · hl1..hln · k1..kn · badge · star */
defineTemplate('bkshot', {
  check: d => req(d, ['eyebrow', 'h1', 'src', 'ratio'], 'bkshot'),
  beats: d => bkBeats(d).concat(['code', 'shot', 'badge'], d.code ? seqN('l', d.code.lines.length) : [], seqN('hl', (d.hls || []).length), seqN('k', (d.chips || []).length)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, G = c.grid;
    const sw = d.bleed ? G.w - 40 : Math.min(d.w || w, w), sx0 = d.bleed ? 20 - G.cx : Math.round((w - sw) / 2);
    const cr = Object.assign({ x0: 0, x1: 1, y0: 0, y1: 1 }, d.crop || {});
    const cd = d.code ? bkCodeCard(p, d.code, 0, w, 'code') : { h: 0, html: '' };
    const y0 = cd.h ? cd.h + 40 : 0, pw = sw - 36;
    const iw = pw / (cr.x1 - cr.x0), ih = iw * d.ratio, ph = Math.round(ih * (cr.y1 - cr.y0)), sh = 18 + ph + 64;
    // highlight boxes are authored on the whole image and moved into the crop
    const hls = (d.hls || []).map((r, i) => `<div class="bk-hl${r.lp === 'top' ? ' lt' : ''}" id="${p}hl${i + 1}" style="left:${18 + Math.round((r.x - cr.x0) * iw)}px;top:${18 + Math.round((r.y - cr.y0) * ih)}px;width:${Math.round(r.w * iw)}px;height:${Math.round(r.h * ih)}px">${r.label ? `<i>${r.label}</i>` : ''}</div>`).join('');
    const shot = `<div class="bk-shot bk-ink${d.bleed ? ' bleed' : ''}" id="${p}shot" style="left:${sx0}px;top:${y0}px;width:${sw}px;height:${sh}px">
      <i class="bk-tape" style="left:40px;transform:rotate(-6deg)"></i><i class="bk-tape" style="right:40px;transform:rotate(5deg)"></i>
      <div class="ph" style="height:${ph}px"><img src="${d.src}" alt="" style="width:${Math.round(iw)}px;max-width:none;margin:${-Math.round(cr.y0 * ih)}px 0 0 ${-Math.round(cr.x0 * iw)}px"></div>${hls}<div class="cap">${d.cap || ''}</div></div>`;
    const yb = y0 + sh + 34, bx = d.bleed ? 0 : sx0;
    // stamp: the badge's words pressed onto the photo itself, so a tall full-bleed photo leaves the caption band clear
    const stamp = d.stamp ? `<div class="bk-stamp" id="${p}stamp" style="right:40px;top:${y0 + 18 + Math.round((d.stampY != null ? d.stampY : .8) * ph)}px;font-size:${d.stampSize || 44}px;line-height:1.05;text-align:center">${d.stamp}</div>` : '';
    const badge = d.badge ? `<div class="badge ${d.badge.cls || d.accent || 'v'}" id="${p}bd" style="left:${bx}px;top:${yb}px">${d.badge.text}</div>` : '';
    const chips = (d.chips || []).map((k, i) => `<div class="bk-chip bk-ink" id="${p}k${i + 1}" style="left:${k.x != null ? k.x : bx + (d.badge ? 420 : 0) + i * 300}px;top:${k.y != null ? k.y : yb - 4}px">${k.src ? `<img src="${k.src}" alt="">` : ''}${k.text}</div>`).join('');
    const yStar = yb + ((d.badge || (d.chips || []).some(k => k.y == null)) ? 100 : 0);
    return `${heading(p, d)}<div class="content"><div class="rel" style="${bkAcc(d)}">${cd.html}${shot}${stamp}${badge}${chips}${bkCast(p, d)}${bkStar(p, d, yStar, w)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    if (d.code) {
      const cq = B.at('code', .06, .16, 'enter', { focal: false });
      up(p + 'code', cq.p, 30);
      B.group('l', d.code.lines.length, { a: .12, step: .05, len: .1, kind: 'enter' }).forEach((r, i) => codeLine(p + 'l' + (i + 1), r.p));
    }
    // the photo is pinned: it drops a little, straightens to its tilt and lands
    const s = B.p('shot', d.code ? .3 : .06, d.code ? .45 : .2, 'enter', { len: .55 }), e = eo4(s), rot = d.rot != null ? d.rot : -1.5;
    st(p + 'shot', { opacity: String(cl(s * 2.5, 0, 1)), transform: 'translateY(' + Math.round((1 - e) * -50) + 'px) rotate(' + (rot + (1 - e) * 5).toFixed(2) + 'deg) scale(' + (1.05 - .05 * e).toFixed(4) + ')' });
    B.group('hl', (d.hls || []).length, { a: .45, step: .12, len: .1, kind: 'pop', dim: true }).forEach((r, i) => {
      pp(p + 'hl' + (i + 1), r.p, 1.15);
      dim(p + 'hl' + (i + 1), r.dim, .25);
    });
    B.group('k', (d.chips || []).length, { a: .7, step: .08, len: .1, kind: 'pop', dim: false }).forEach((r, i) => pp(p + 'k' + (i + 1), r.p, .7));
    pp(p + 'bd', B.p('badge', .78, .88, 'pop'), .7);
    if (d.stamp) {
      const sp = B.p('badge', .78, .88, 'pop');
      st(p + 'stamp', { opacity: String(cl(sp * 3, 0, 1)), transform: 'rotate(' + (d.stampRot != null ? d.stampRot : -8) + 'deg) scale(' + (1.7 - .7 * bk(sp)).toFixed(4) + ')' });
    }
    castPlay(B, c, p, d.cast, d.bubbles);
    bkStarIn(B, p, d);
    footIn(B, p); holdLife(B, p, d, { alias: { badge: d.stamp ? 'stamp' : 'bd' } });
  }
});

/* ---------------- bksplit ----------------
   data: {top: {label, src, file, lines}, bottom: {…}} — top is struck (x1), bottom ticked (ok); hover tags .bk-hov.bad / .good
   beats: l (top pane) · x1 · r (bottom pane) · ok · star · a1.. b1.. */
defineTemplate('bksplit', {
  check: d => req(d, ['eyebrow', 'h1', 'top', 'bottom'], 'bksplit'),
  beats: d => bkBeats(d).concat(['l', 'r', 'x1', 'ok']),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw;
    const A = bkCodeCard(p, d.top, 64, w, 'pa'), yb = 64 + A.h + 44, Bc = bkCodeCard(p, d.bottom, yb + 64, w, 'pb');
    const lb = (o, id, y) => `<div class="bk-pane-lb" id="${p}${id}" style="left:0;top:${y}px">${o.src ? `<img src="${o.src}" alt="">` : ''}${o.label}</div>`;
    return `${heading(p, d)}<div class="content"><div class="rel" style="${bkAcc(d)}">
      ${lb(d.top, 'la', 0)}${A.html}<i class="bk-x" id="${p}x1" style="left:-12px;top:${64 + Math.round(A.h / 2) + 20}px;width:${w + 24}px;transform:rotate(-3deg) scaleX(0)"></i>
      ${lb(d.bottom, 'lb', yb)}${Bc.html}<div class="bk-ok" id="${p}ok" style="left:${w - 76}px;top:${yb + 34}px">${BK_CHECK}</div>
      ${bkCast(p, d)}${bkStar(p, d, yb + 64 + Bc.h + 30, w)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    const l = B.at('l', .06, .16, 'enter', { focal: false });
    up(p + 'la', l.p, 20); up(p + 'pa', l.p, 30);
    d.top.lines.forEach((_, i) => codeLine(p + 'pal' + (i + 1), seg(c.local, l.s + .2 + i * .1, l.s + .5 + i * .1)));
    const x = B.at('x1', .3, .4, 'draw');
    st(p + 'x1', { transform: 'rotate(-3deg) scaleX(' + eo(x.p).toFixed(4) + ')' });
    el(p + 'pa').querySelectorAll('.bk-hov').forEach(h => { h.style.opacity = String(eo(seg(c.local, x.s - .3, x.s))); });
    dim(p + 'pa', x.p, .55); dim(p + 'la', x.p, .55);
    const r = B.at('r', .5, .6, 'enter', { focal: false });
    up(p + 'lb', r.p, 20); up(p + 'pb', r.p, 30);
    d.bottom.lines.forEach((_, i) => codeLine(p + 'pbl' + (i + 1), seg(c.local, r.s + .2 + i * .1, r.s + .5 + i * .1)));
    const ok = B.at('ok', .8, .9, 'pop');
    pp(p + 'ok', ok.p, .4);
    el(p + 'pb').querySelectorAll('.bk-hov').forEach(h => { h.style.opacity = String(eo(seg(c.local, ok.s, ok.s + .3))); });
    castPlay(B, c, p, d.cast, d.bubbles);
    bkStarIn(B, p, d);
    footIn(B, p); holdLife(B, p, d);
  }
});

/* ---------------- bkshelf ----------------
   data: {boxes: [{name, src, label, rib}] (four), mix?: {src, name, note, items: [{text, box?: n | [n]}]}}
   With mix the shelf opens already stocked (the scene continues from the previous slide) and on `mix` the boxes shrink
   into a row at the top while one big box rises under them, its lines printed faintly; each line ticks on k<i>.
   beats: shelf · c1..cn · mix · k1..kn · star */
const BS = { gap: 30, bh: 250, row: 330 };
defineTemplate('bkshelf', {
  check: d => req(d, ['eyebrow', 'h1', 'boxes'], 'bkshelf'),
  beats: d => bkBeats(d).concat(['shelf', 'mix'], seqN('c', d.boxes.length), d.mix ? seqN('k', d.mix.items.length) : []),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, bw = Math.floor((w - BS.gap) / 2);
    const boxes = d.boxes.map((b, i) => `<div class="bk-box bk-ink" id="${p}c${i + 1}" style="left:${(i % 2) * (bw + BS.gap)}px;top:${Math.floor(i / 2) * BS.row}px;width:${bw}px;height:${BS.bh}px;--rib:var(${ACCENT_VAR[b.rib] || '--amber'})">
      <img src="${b.src}" alt=""><b>${b.name}</b><span>${b.label}</span></div>`).join('');
    const shelves = [0, 1].map(r => `<i class="bk-shelf" id="${p}sh${r + 1}" style="top:${r * BS.row + BS.bh - 6}px;width:${w + 60}px"></i>`).join('');
    let mix = '';
    if (d.mix) {
      const items = d.mix.items.map((it, i) => `<div class="bk-li" id="${p}k${i + 1}" style="height:80px"><span class="bx">${BK_CHECK.replace('<svg', `<svg id="${p}ck${i + 1}"`)}</span><span class="tx">${it.text}</span></div>`).join('');
      mix = `<div class="bk-big bk-ink" id="${p}mix" style="left:0;top:130px;width:${w}px;height:480px">
        <div class="hd"><img src="${d.mix.src}" alt=""><b>${d.mix.name}</b><i>${d.mix.note || ''}</i></div>${items}</div>`;
    }
    return `${heading(p, d)}<div class="content"><div class="rel" style="${bkAcc(d)}">${shelves}${boxes}${mix}${bkCast(p, d)}${bkStar(p, d, 2 * BS.row - 40, w)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c), w = c.grid.cw, bw = Math.floor((w - BS.gap) / 2);
    headIn(B, p);
    if (!d.mix) {
      const sh = B.at('shelf', .04, .14, 'enter', { focal: false });
      [1, 2].forEach(r => up(p + 'sh' + r, seg(c.local, sh.s + (r - 1) * .12, sh.e + (r - 1) * .12), 20));
      B.group('c', d.boxes.length, { a: .2, step: .12, len: .12, kind: 'enter', dim: false }).forEach((r, i) => {
        const e = eo4(r.p);
        st(p + 'c' + (i + 1), { opacity: String(cl(r.p * 2.5, 0, 1)), transform: 'translateX(' + Math.round((1 - e) * (i % 2 ? 120 : -120)) + 'px) rotate(' + ((1 - e) * (i % 2 ? 6 : -6)).toFixed(2) + 'deg)' });
      });
    } else {
      const m = B.at('mix', .1, .2, 'enter', { len: .7 }), k = eo4(m.p), sc = .42, cw4 = w / 4;
      [1, 2].forEach(r => st(p + 'sh' + r, { opacity: String(1 - k) }));
      const ks = B.group('k', d.mix.items.length, { a: .35, step: .12, len: .1, kind: 'enter' });
      // the four boxes step up into a row of ingredients above the one box that takes them all
      d.boxes.forEach((_, i) => {
        const x0 = (i % 2) * (bw + BS.gap), y0 = Math.floor(i / 2) * BS.row;
        const x1 = i * cw4 + (cw4 - bw * sc) / 2, y1 = -6, s = 1 + (sc - 1) * k;
        cls(p + 'c' + (i + 1), 'mini', k > .5);   // too small to read once shrunk: the mark alone names the box
        st(p + 'c' + (i + 1), { opacity: '1', transform: `translate(${Math.round((x1 - x0) * k)}px,${Math.round((y1 - y0) * k)}px) scale(${s.toFixed(4)})`, transformOrigin: '0 0' });
      });
      st(p + 'mix', { opacity: String(cl(m.p * 2, 0, 1)), transform: 'translateY(' + Math.round((1 - k) * 120) + 'px)' });
      ks.forEach((r, i) => {
        // the order is printed when the box lands and each line ticks as it is named
        st(p + 'k' + (i + 1), { opacity: String(Math.max(.32 * eo(seg(c.local, m.e - .2, m.e + .2)), eo4(r.p))), transform: 'translateY(' + ((1 - eo4(r.p)) * 8).toFixed(1) + 'px)' });
        st(p + 'ck' + (i + 1), { strokeDashoffset: String(30 * (1 - eo(seg(c.local, r.s + .15, r.s + .5)))) });
      });
    }
    castPlay(B, c, p, d.cast, d.bubbles);
    bkStarIn(B, p, d);
    footIn(B, p); holdLife(B, p, d);
  }
});

/* ---------------- bkover ----------------
   data: {mark?, note?, lines: [{text, src?}]}  one paper card: the mark, a handwritten note, a few lines
   beats: card · k1..kn · star */
defineTemplate('bkover', {
  check: d => req(d, ['eyebrow', 'h1'], 'bkover'),
  beats: d => bkBeats(d).concat(['card'], seqN('k', (d.lines || []).length)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, n = (d.lines || []).length, h = 60 + (d.mark ? 220 : 0) + (d.note ? 90 : 0) + n * 104 + 40;
    let y = 60;
    const mark = d.mark ? `<img src="${d.mark}" alt="" style="position:absolute;left:${w / 2 - 90}px;top:${y}px;width:180px;height:180px">` : '';
    if (d.mark) y += 220;
    const note = d.note ? `<div class="bk-note" style="left:20px;width:${w - 40}px;text-align:center;top:${y}px;white-space:normal">${d.note}</div>` : '';
    if (d.note) y += 90;
    const lines = (d.lines || []).map((l, i) => `<div class="bk-chip bk-ink" id="${p}k${i + 1}" style="left:40px;top:${y + i * 104}px;height:80px;font-size:36px">${l.src ? `<img src="${l.src}" alt="">` : l.icon ? `<svg viewBox="0 0 24 24" style="width:40px;height:40px;fill:none;stroke:var(--acc);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round"><use href="#i-${l.icon}"/></svg>` : ''}${l.text}</div>`).join('');
    return `${heading(p, d)}<div class="content"><div class="rel" style="${bkAcc(d)}">
      <div class="bk-big bk-ink" id="${p}card" style="left:0;top:0;width:${w}px;height:${h}px;padding:0">${mark}${note}${lines}</div>
      ${bkCast(p, d)}${bkStar(p, d, h + 30, w)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    up(p + 'card', B.p('card', .06, .18, 'enter'), 40);
    B.group('k', (d.lines || []).length, { a: .3, step: .12, len: .12, kind: 'pop', dim: false }).forEach((r, i) => pp(p + 'k' + (i + 1), r.p, .7));
    castPlay(B, c, p, d.cast, d.bubbles);
    bkStarIn(B, p, d);
    footIn(B, p); holdLife(B, p, d);
  }
});
