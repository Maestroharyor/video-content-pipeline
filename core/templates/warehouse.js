/* The warehouse family (projects/mongoose-vs-prisma, core/styles/warehouse.css): MongoDB is the warehouse, Mongoose the
   floor manager who knows every aisle, Prisma a standardised inventory system.
     whover   one shipping label card: marks and lines (the deck's version of a face-window line)
     whfloor  the floor: a sign over the door, pallet racking with document crates, the manager, shipping-label tags;
              optional handheld scanner (a mini editor that types and opens an autocomplete list)
     whcode   VS Code (redline.js rlVsc, Dark Modern) with one or more editor groups that type on their beats, hazard
              labels pinned to the end of a block's last row, an optional terminal strip and hover tooltip
     whshot   a vendor screenshot on a clipboard, highlight boxes, and positioned extras (tags, stamp, crates, terminal, note)
     whdock   a three-bay loading dock: the active bay rolls up, its manifest ticks, a stamp; earlier bays stay open, dimmed
   Shared data: {eyebrow, accent, h1, star?: {text}}; star is the asterisk correction note, beat `star`.
   Cast and bubbles (core/components/cast.js) work on every wh template: cast, bubbles, beats a1.. b1..
   Element ids are the beat names (prefixed), so a hero beat's ring lands on the element it names. */
const WH_CHECK = '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.6 4.6L19 6.8"/></svg>';
const whAcc = d => ACCENT_VAR[d.accent] ? `--acc:var(${ACCENT_VAR[d.accent]})` : '';
const whBeats = d => baseBeats(d).concat(['star'], castBeats(d.cast, d.bubbles));
const whImg = o => o.src ? `<img src="${o.src}" alt="">` : o.icon ? `<svg class="ic" viewBox="0 0 24 24"><use href="#i-${o.icon}"/></svg>` : '';
function whStar(p, d, y, w) {
  return d.star ? `<div class="wh-star" id="${p}star" style="left:${d.star.x || 0}px;top:${d.star.y != null ? d.star.y : y}px;width:${d.star.w || w}px">${d.star.text}</div>` : '';
}
function whStarIn(B, p, d) { if (d.star) up(p + 'star', B.p('star', .8, .9, 'enter', { focal: false }), 20); }
/* a shipping label: {text, src?|icon?, cls?, acc?} at x, y */
function whTag(p, id, t, x, y, w) {
  return `<div class="wh-tag wh-ink${t.cls ? ' ' + t.cls : ''}" id="${p}${id}" style="left:${x}px;top:${y}px${w ? `;width:${w}px` : ''}${t.acc ? `;--acc:var(${ACCENT_VAR[t.acc]})` : ''}">${whImg(t)}${t.text}<i class="bc"></i></div>`;
}
/* a stamp that thumps down: big, then settles with an overshoot */
function whStampIn(id, s, rot) {
  st(id, { opacity: String(cl(s * 3, 0, 1)), transform: 'rotate(' + (rot != null ? rot : -8) + 'deg) scale(' + (1.7 - .7 * bk(s)).toFixed(4) + ')' });
}
/* typing that is not an editor row (the scanner, a terminal): record it for typed.json like rlTypeGroup does */
function whTyped(c, key, s, d, chars) {
  const T0 = (c.T != null ? c.T : c.local) - c.local;
  (window.RL_TYPED = window.RL_TYPED || {})[key] = [[+(T0 + s).toFixed(3), +d.toFixed(3), chars]];
}

/* ---------------- whover ----------------
   data: {marks?: [{src, text}], lines?: [{src?, html}], note?}   a big shipping label
   beats: card · k1..kn (marks) · l1..ln (lines) · star */
defineTemplate('whover', {
  check: d => req(d, ['eyebrow', 'h1'], 'whover'),
  beats: d => whBeats(d).concat(['card'], seqN('k', (d.marks || []).length), seqN('l', (d.lines || []).length)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, nm = (d.marks || []).length, nl = (d.lines || []).length;
    const mw = nm ? Math.floor((w - 80 - (nm - 1) * 24) / nm) : 0;
    const marks = (d.marks || []).map((m, i) => `<div id="${p}k${i + 1}" style="position:absolute;left:${40 + i * (mw + 24)}px;top:110px;width:${mw}px;height:320px;
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;border:3px solid var(--bd);border-radius:12px;background:#fff;opacity:0">
      <img src="${m.src}" alt="" style="width:150px;height:150px"><b style="font:900 42px ID;color:var(--tx);letter-spacing:-.02em">${m.text}</b></div>`).join('');
    const ly = nm ? 460 : 120;
    const lines = (d.lines || []).map((l, i) => `<div id="${p}l${i + 1}" style="position:absolute;left:40px;top:${ly + i * 150}px;width:${w - 80}px;height:130px;
      display:flex;align-items:center;gap:22px;border-bottom:2px dotted var(--bd);opacity:0">${l.src ? `<img src="${l.src}" alt="" style="width:84px;height:84px">` : ''}
      <span style="font:900 52px ID;color:var(--tx);letter-spacing:-.025em;white-space:nowrap">${l.html}</span></div>`).join('');
    const h = ly + nl * 150 + (nl ? 30 : (nm ? -10 : 120)) + (d.note ? 80 : 0);
    const note = d.note ? `<div style="position:absolute;left:40px;top:${h - 96}px;font:700 30px JB;color:var(--tx3);letter-spacing:.06em">${d.note}</div>` : '';
    return `${heading(p, d)}<div class="content"><div class="rel" style="${whAcc(d)}">
      <div class="wh-mf wh-ink" id="${p}card" style="left:0;top:0;width:${w}px;height:${h}px">
        <div class="hd">Ship to<b>${d.shipTo || 'Your codebase'}</b><i class="wh-bar"></i></div></div>
      ${marks}${lines}${note}${castBlock(p, d.cast, d.bubbles)}${whStar(p, d, h + 30, w)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    const cd = B.at('card', .04, .14, 'enter', { focal: false });
    up(p + 'card', cd.p, 40);
    B.group('k', (d.marks || []).length, { a: .2, step: .12, len: .12, kind: 'pop', dim: false }).forEach((r, i) => pp(p + 'k' + (i + 1), r.p, .6));
    B.group('l', (d.lines || []).length, { a: .3, step: .2, len: .15, kind: 'enter', dim: false }).forEach((r, i) => sx(p + 'l' + (i + 1), r.p, -40));
    castPlay(B, c, p, d.cast, d.bubbles);
    whStarIn(B, p, d);
    footIn(B, p); holdLife(B, p, d, { alias: { em: 'card' } });
  }
});

/* ---------------- whfloor ----------------
   data: {sign: {src, text, sub}, crates: [label] (eight, two levels of four), tags: [{text, src?|icon?, x?, y?}],
          stocked? (the scene continues from the previous slide: no entrance), dimCast? (the manager steps back),
          scan?: {src, title, typed, items: [{name, hit?}], sel}}
   beats: wh (the racking) · sign · k1..kn · term (the scanner) · ac (its autocomplete) · star · a1.. b1.. */
const WF = { rackY: 124, rackH: 330, lv: 2, floorY: 474 };
defineTemplate('whfloor', {
  check: d => req(d, ['eyebrow', 'h1', 'sign', 'crates'], 'whfloor'),
  beats: d => whBeats(d).concat(['wh', 'sign', 'term', 'ac'], seqN('k', (d.tags || []).length)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, bayW = (w - 60) / 2;
    const sign = `<div class="wh-sign wh-ink" id="${p}sign" style="left:${Math.round(w / 2 - 290)}px;top:0;width:580px;justify-content:center">
      <img src="${d.sign.src}" alt="">${d.sign.text}<small>${d.sign.sub || ''}</small></div>`;
    // two bays of racking, two beam levels, four crates per level
    const lvH = WF.rackH / WF.lv, ups = [0, bayW + 20, w - 20].map(x => `<i class="up" style="left:${x}px"></i>`).join('');
    const beams = [0, 1].map(l => `<i class="bm" style="left:0;right:0;top:${(l + 1) * lvH - 20}px"></i>`).join('');
    const cw = Math.floor((bayW - 50) / 2);
    const crates = d.crates.map((t, i) => {
      const l = Math.floor(i / 4), k = i % 4, bay = Math.floor(k / 2), x = 20 + bay * (bayW + 20) + 12 + (k % 2) * (cw + 14);
      return `<div class="wh-crate" id="${p}cr${i + 1}" style="left:${x}px;top:${l * lvH + 22}px;width:${cw}px;height:${lvH - 46}px"><code>${t}</code><i class="wh-bar"></i></div>`;
    }).join('');
    const rack = `<div class="wh-rack" id="${p}wh" style="left:0;top:${WF.rackY}px;width:${w}px;height:${WF.rackH}px;opacity:0">${ups}${beams}${crates}${d.scan ? `<i class="wh-laser" id="${p}lz"></i>` : ''}</div>
      <div id="${p}tape" style="position:absolute;left:-20px;width:${w + 40}px;top:${WF.floorY}px;height:16px;opacity:0;border-radius:3px;
        background:repeating-linear-gradient(-45deg,var(--hz) 0 18px,#1C1D20 18px 36px)"></div>`;
    const tags = (d.tags || []).map((t, i) => whTag(p, 'k' + (i + 1), t, t.x != null ? t.x : 250, t.y != null ? t.y : WF.floorY + 170 + i * 102)).join('');
    let scan = '';
    if (d.scan) {
      const s = d.scan, sw = 460, sx0 = w - sw - 12;
      const items = s.items.map((it, i) => `<div class="it${i === (s.sel || 0) ? ' on' : ''}"><i>◇</i><b>${it.hit ? `<u>${it.name.slice(0, it.hit)}</u>${it.name.slice(it.hit)}` : it.name}</b><span>${it.kind || ''}</span></div>`).join('');
      scan = `<div class="wh-scan" id="${p}term" style="left:${sx0}px;top:${WF.rackY + 4}px;width:${sw}px;height:${s.h || 560}px">
        <div class="hd"><img src="${s.src}" alt="">${s.title}<i class="led"></i></div>
        <div class="scr"><div class="ln" id="${p}tl"></div><div class="wh-ac" id="${p}ac">${items}</div></div><i class="grip"></i></div>`;
    }
    return `${heading(p, d)}<div class="content"><div class="rel" style="${whAcc(d)}">${sign}${rack}${castBlock(p, d.cast, d.bubbles)}${scan}${tags}
      ${whStar(p, d, WF.floorY + 400, w)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    if (d.stocked) { ['wh', 'sign', 'tape'].forEach(x => st(p + x, { opacity: '1', transform: 'none' })); }
    else {
      const wh = B.at('wh', .04, .14, 'enter', { focal: false, len: .6 });
      up(p + 'wh', wh.p, 40); fd(p + 'tape', seg(c.local, wh.s + .2, wh.s + .5));
      // crates slide onto the beams one after another, the way a forklift stocks a bay
      d.crates.forEach((_, i) => sx(p + 'cr' + (i + 1), seg(c.local, wh.s + .15 + i * .07, wh.s + .5 + i * .07), i % 4 < 2 ? -50 : 50));
      const sg = B.p('sign', .1, .2, 'pop');
      pp(p + 'sign', sg, .7);
      // the sign's tubes flicker on as it lands
      st(p + 'sign', { filter: 'none', boxShadow: sg > .6 && sg < .8 ? '0 12px 0 rgba(28,29,32,.88),0 0 0 6px rgba(242,194,48,.5)' : '' });
    }
    B.group('k', (d.tags || []).length, { a: .5, step: .15, len: .12, kind: 'enter', dim: false }).forEach((r, i) => sx(p + 'k' + (i + 1), r.p, 60));
    if (d.scan) {
      const s = d.scan, tm = B.at('term', .1, .2, 'enter', { len: .55 }), e = eo4(tm.p);
      st(p + 'term', { opacity: String(cl(tm.p * 2.5, 0, 1)), transform: 'translateY(' + Math.round((1 - e) * 120) + 'px) rotate(' + ((1 - e) * 6).toFixed(2) + 'deg)' });
      // the scanner's screen types its prompt, then the completion list opens on its beat
      const ts = tm.e + .1, td = Math.max(.5, s.typed.length / 14), n = Math.floor(cl((c.local - ts) / td, 0, 1) * s.typed.length);
      const ac = B.at('ac', .5, .6, 'pop');
      const shown = s.typed.slice(0, n).replace(/(\w+)(?=\.)/g, '<span class="v">$1</span>');
      const blink = c.local > ts + td && Math.floor((c.local - ts - td) / .53) % 2 === 1;
      const ln = el(p + 'tl'), html = shown + `<span class="car" style="visibility:${blink ? 'hidden' : 'visible'}"></span>`;
      if (ln && ln.innerHTML !== html) ln.innerHTML = html;
      whTyped(c, p + 'scan', ts, td, s.typed.length);
      const a = eo4(ac.p);
      st(p + 'ac', { opacity: String(cl(ac.p * 3, 0, 1)), transform: 'scaleY(' + (.6 + .4 * a).toFixed(4) + ')' });
      // the scanner's beam sweeps the racks, down and back every 1.6 s, until the slide leaves: inventory being read
      const lz0 = tm.e + .2, k = c.local - lz0;
      if (k > 0) {
        const ph = (k % 1.6) / 1.6, y = (ph < .5 ? ph * 2 : 2 - ph * 2) * (WF.rackH - 12);
        st(p + 'lz', { opacity: String(.9 * cl(k / .25, 0, 1)), transform: 'translateY(' + y.toFixed(1) + 'px)' });
        // the crate under the beam lights up as it is read
        d.crates.forEach((_, i) => { const lv = Math.floor(i / 4), cy = lv * (WF.rackH / WF.lv) + WF.rackH / WF.lv / 2;
          cls(p + 'cr' + (i + 1), 'hit', Math.abs(cy - y) < 50); });
      } else st(p + 'lz', { opacity: '0' });
    }
    // the manager steps back when the inventory system arrives
    if (d.dimCast) (d.cast || []).forEach((_, i) => st(p + 'a' + (i + 1), { opacity: '.35' }));
    else castPlay(B, c, p, d.cast, d.bubbles);
    whStarIn(B, p, d);
    footIn(B, p); holdLife(B, p, d, { alias: { term: 'term' } });
  }
});

/* ---------------- whcode ----------------
   data: {title, groups: [{gid, ed (rlVsc editor spec), starts: [{b: beat, d?: seconds}]}] (one typing start per block),
          labels: [{gid, row (0-based), text, beat}] (a hazard label pinned after the row's last character),
          term?: {beat, cmd, out}, hov?: {beat, gid, row, col, html}}
   beats: code (the window) · the labels' beats · each group's start beats · term · hov · star */
const WC = { title: 50, tabs: 56, crumb: 36, padT: 12, lh: 28 * 1.42, cw: 28 * .6, ab: 64, gut: 58 };
defineTemplate('whcode', {
  check: d => req(d, ['eyebrow', 'h1', 'groups'], 'whcode'),
  beats: d => whBeats(d).concat(['code', d.term ? d.term.beat || 'term' : 'term', 'hov'], (d.labels || []).map(l => l.beat),
    ...d.groups.map(g => (g.starts || []).map(s => s.b))),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw;
    const ed = rlVsc(p, 'code', d.groups.map(g => ({ gid: g.gid, ed: g.ed })), c, { title: d.title });
    const x0 = 16 - c.grid.cx, codeX = x0 + WC.ab + WC.gut;
    const rowY = (gid, row) => { const gi = d.groups.findIndex(g => g.gid === gid); return ed.groups[gi].y + WC.tabs + WC.crumb + WC.padT + row * WC.lh; };
    const rowTxt = (gid, row) => { const g = d.groups.find(x => x.gid === gid), src = window.CODE[g.ed.src]; return src[(g.ed.from || 1) - 1 + row] || ''; };
    const labels = (d.labels || []).map(l => `<div class="wh-lbl" id="${p}${l.beat}" style="left:${Math.round(codeX + (rowTxt(l.gid, l.row).length + 1.5) * WC.cw)}px;top:${Math.round(rowY(l.gid, l.row) + (WC.lh - 46) / 2)}px">${l.text}</div>`).join('');
    let extra = '';
    if (d.hov) {
      const h = d.hov;
      extra += `<div class="wh-hov" id="${p}hov" style="left:${Math.round(codeX + h.col * WC.cw)}px;top:${Math.round(rowY(h.gid, h.row) + WC.lh + 4)}px">${h.html}</div>`;
    }
    let th = 0;
    if (d.term) {
      th = 152;
      extra += `<div class="wh-term" id="${p}term" style="left:${x0 + 30}px;top:${ed.h - 80}px;width:${c.grid.w - 92}px;height:${th}px">
        <div class="tb"><b>Terminal</b><span>Problems</span><span>Output</span></div><span class="row" id="${p}tc"></span><span class="row ok" id="${p}to">${d.term.out}</span></div>`;
    }
    d._h = ed.h + (th ? th - 80 : 0);
    return `${heading(p, d)}<div class="content"><div class="rel" style="${whAcc(d)}">${ed.html}${labels}${extra}${castBlock(p, d.cast, d.bubbles)}${whStar(p, d, d._h + 30, w)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c), M = B.M || {};
    headIn(B, p);
    const e = B.at('code', .04, .12, 'enter', { focal: false });
    up(p + 'code', e.p, 40);
    d.groups.forEach(g => {
      const starts = (g.starts || []).map(s => M[s.b] ? M[s.b].s + (s.d || 0) : null);
      if (!starts.length || starts[0] == null) starts[0] = e.s + .3;
      rlTypeGroup(c, p, g.gid, g.ed, starts);
    });
    (d.labels || []).forEach((l, i) => {
      const r = B.at(l.beat, .3 + i * .15, .4 + i * .15, 'pop');
      sx(p + l.beat, r.p, 40);
      // the block it names glows while its label lands
      const g = d.groups.find(x => x.gid === l.gid), blk = (g.ed.blocks || []).find(b => l.row >= b[0] && l.row <= b[1]);
      if (blk) for (let k = blk[0]; k <= blk[1]; k++) {
        const row = el(p + l.gid + 'r' + (k + 1)); if (!row) continue;
        const on = seg(c.local, r.s, r.s + .3) * (1 - seg(c.local, r.s + 1.6, r.s + 2.2));
        row.style.background = on > 0 ? `rgba(242,194,48,${(.16 * on).toFixed(3)})` : '';
      }
    });
    if (d.term) {
      const t = B.at(d.term.beat || 'term', .7, .8, 'enter');
      up(p + 'term', t.p, 30);
      const ts = t.e, td = Math.max(.5, d.term.cmd.length / 16), n = Math.floor(cl((c.local - ts) / td, 0, 1) * d.term.cmd.length);
      const done = c.local >= ts + td + .35;
      const html = `<span class="pr">❯</span> ${d.term.cmd.slice(0, n)}${done ? '' : '<span class="car"></span>'}`;
      const tc = el(p + 'tc'); if (tc && tc.innerHTML !== html) tc.innerHTML = html;
      fd(p + 'to', seg(c.local, ts + td + .35, ts + td + .55));
      whTyped(c, p + 'term', ts, td, d.term.cmd.length);
    }
    if (d.hov) pp(p + 'hov', B.p('hov', .85, .95, 'pop'), .9);
    castPlay(B, c, p, d.cast, d.bubbles);
    whStarIn(B, p, d);
    footIn(B, p); holdLife(B, p, d);
  }
});

/* ---------------- whshot ----------------
   data: {src, ratio (h/w of the whole image), w (board width), x?, crop?: {y0, y1}, cap, rot?,
          hls: [{x, y, w, h}] (fractions of the WHOLE image; beat hl<i>),
          items: [{kind: 'tag'|'stamp'|'crates'|'term'|'star', beat, x, y, …}]  positioned in content px
            tag {text, src?|icon?, cls?, acc?} · stamp {text, rot?, size?} · crates {items: [{src, text}], w?} · term {cmd, w}
   beats: shot · hl1..hln · every item's beat · star */
defineTemplate('whshot', {
  check: d => req(d, ['eyebrow', 'h1', 'src', 'ratio'], 'whshot'),
  beats: d => whBeats(d).concat(['shot'], seqN('hl', (d.hls || []).length), (d.items || []).map(it => it.beat)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, bw = d.w || w, bx = d.x != null ? d.x : Math.round((w - bw) / 2);
    const cr = Object.assign({ y0: 0, y1: 1 }, d.crop || {}), iw = bw - 36, ih = iw * d.ratio, ph = Math.round(ih * (cr.y1 - cr.y0));
    const hls = (d.hls || []).map((r, i) => `<div class="wh-hl" id="${p}hl${i + 1}" style="left:${18 + Math.round(r.x * iw)}px;top:${56 + Math.round((r.y - cr.y0) * ih)}px;width:${Math.round(r.w * iw)}px;height:${Math.round(r.h * ih)}px"></div>`).join('');
    const shot = `<div class="wh-clip wh-ink" id="${p}shot" style="left:${bx}px;top:0;width:${bw}px;height:${56 + ph + 64}px">
      <i class="clamp"></i><div class="ph" style="height:${ph}px"><img src="${d.src}" alt="" style="width:${Math.round(iw)}px;margin-top:${-Math.round(cr.y0 * ih)}px"></div>${hls}<div class="cap">${d.cap || ''}</div></div>`;
    d._h = 56 + ph + 64;
    const items = (d.items || []).map(it => {
      if (it.kind === 'tag') return whTag(p, it.beat, it, it.x, it.y, it.w);
      if (it.kind === 'stamp') return `<div class="wh-stamp" id="${p}${it.beat}" style="left:${it.x}px;top:${it.y}px;font-size:${it.size || 58}px${it.acc ? `;--acc:var(${ACCENT_VAR[it.acc]})` : ''}">${it.text}</div>`;
      if (it.kind === 'crates') return `<div class="wh-crates" id="${p}${it.beat}" style="position:absolute;left:${it.x}px;top:${it.y}px;flex-direction:${it.col ? 'column' : 'row'}">
        ${it.label ? `<div class="wh-clbl" id="${p}${it.beat}lb">${it.label}</div>` : ''}${it.items.map((k, i) => `<div class="wh-crate" id="${p}${it.beat}c${i + 1}" style="${it.w ? `width:${it.w}px` : ''}"><img src="${k.src}" alt=""><span>${k.text}</span></div>`).join('')}</div>`;
      if (it.kind === 'term') return `<div class="wh-term" id="${p}${it.beat}" style="left:${it.x}px;top:${it.y}px;width:${it.w || w}px">
        <div class="tb"><b>Terminal</b></div><span class="row" id="${p}${it.beat}tc"></span></div>`;
      return '';
    }).join('');
    return `${heading(p, d)}<div class="content"><div class="rel" style="${whAcc(d)}">${shot}${items}${castBlock(p, d.cast, d.bubbles)}${whStar(p, d, d._h + 30, w)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    // the board swings in on its clamp and settles at its tilt
    const s = B.p('shot', .06, .2, 'enter', { len: .55 }), e = eo4(s), rot = d.rot != null ? d.rot : -1.2;
    st(p + 'shot', { opacity: String(cl(s * 2.5, 0, 1)), transform: 'translateY(' + Math.round((1 - e) * -60) + 'px) rotate(' + (rot + (1 - e) * 6).toFixed(2) + 'deg)' });
    B.group('hl', (d.hls || []).length, { a: .4, step: .15, len: .1, kind: 'pop', dim: true }).forEach((r, i) => {
      pp(p + 'hl' + (i + 1), r.p, 1.15);
      dim(p + 'hl' + (i + 1), r.dim, .35);
    });
    (d.items || []).forEach((it, i) => {
      const r = B.at(it.beat, .5 + i * .1, .6 + i * .1, it.kind === 'stamp' ? 'pop' : 'enter');
      if (it.kind === 'tag') sx(p + it.beat, r.p, 50);
      else if (it.kind === 'stamp') whStampIn(p + it.beat, r.p, it.rot);
      else if (it.kind === 'crates') {
        st(p + it.beat, { opacity: '1' });
        if (it.label) fd(p + it.beat + 'lb', seg(c.local, r.s - .2, r.s + .1));
        // crates drop onto the floor one after the other
        it.items.forEach((_, k) => { const q = seg(c.local, r.s + k * .12, r.s + .45 + k * .12), qe = bk(q);
          st(p + it.beat + 'c' + (k + 1), { opacity: String(cl(q * 3, 0, 1)), transform: 'translateY(' + Math.round((1 - qe) * -90) + 'px)' }); });
      } else if (it.kind === 'term') {
        up(p + it.beat, r.p, 30);
        const ts = r.e, td = Math.max(.5, it.cmd.length / 16), n = Math.floor(cl((c.local - ts) / td, 0, 1) * it.cmd.length);
        const blink = c.local > ts + td && Math.floor((c.local - ts - td) / .53) % 2 === 1;
        const html = `<span class="pr">❯</span> ${it.cmd.slice(0, n)}<span class="car" style="visibility:${blink ? 'hidden' : 'visible'}"></span>`;
        const tc = el(p + it.beat + 'tc'); if (tc && tc.innerHTML !== html) tc.innerHTML = html;
        whTyped(c, p + it.beat, ts, td, it.cmd.length);
      }
    });
    castPlay(B, c, p, d.cast, d.bubbles);
    whStarIn(B, p, d);
    footIn(B, p); holdLife(B, p, d, { alias: { em: 'shot' } });
  }
});

/* ---------------- whdock ----------------
   data: {bays: [{no, label, src}] (three), active (1-based), done: [bay numbers already opened], stocked? (no entrance),
          title, crates?: [{src|srcs, text, beat, wide?}], rows: [{text, src?|srcs?|icon?, beat}], stamp: {text, beat}}
   The active bay's door rolls up on `bay`; the manifest under the doors lists that bay's rows, each ticking on its beat.
   beats: bay · every crate's and row's beat · stamp · star · a1.. b1.. */
const WD = { bh: 210, gap: 20, mfY: 236 };
defineTemplate('whdock', {
  check: d => req(d, ['eyebrow', 'h1', 'bays', 'active', 'rows'], 'whdock'),
  beats: d => whBeats(d).concat(['bay', 'stamp'], (d.crates || []).map(k => k.beat), d.rows.map(r => r.beat)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, bw = Math.floor((w - 24 - 2 * WD.gap) / 3);
    const bays = d.bays.map((b, i) => `<div class="wh-bay" id="${p}bay${i + 1}" style="left:${12 + i * (bw + WD.gap)}px;top:0;width:${bw}px;height:${WD.bh}px;${b.acc ? `--acc:var(${ACCENT_VAR[b.acc]})` : ''}">
      <i class="in"></i><i class="dr" id="${p}dr${i + 1}"></i><span class="no">BAY ${b.no || i + 1}</span><span class="ok" id="${p}ok${i + 1}">PICKED</span>
      <span class="lb">${b.src ? `<img src="${b.src}" alt="">` : ''}${b.label}</span></div>`).join('');
    const crates = (d.crates || []).length ? `<div class="wh-crates">${d.crates.map(k => `<div class="wh-crate${k.wide ? ' wide' : ''}${k.big ? ' big' : ''}" id="${p}${k.beat}">
      ${(k.srcs || [k.src]).map(s => `<img src="${s}" alt="">`).join('')}<span>${k.text}</span></div>`).join('')}</div>` : '';
    const rows = d.rows.map(r => `<div class="wh-row" id="${p}${r.beat}"><span class="bx">${WH_CHECK.replace('<svg', `<svg id="${p}${r.beat}ck"`)}</span>
      ${r.src || r.srcs || r.icon ? `<span class="lg">${(r.srcs || (r.src ? [r.src] : [])).map(s => `<img src="${s}" alt="">`).join('')}${r.icon ? `<svg viewBox="0 0 24 24"><use href="#i-${r.icon}"/></svg>` : ''}</span>` : ''}<span class="tx">${r.text}</span></div>`).join('');
    const mh = 80 + ((d.crates || []).length ? ((d.crates || []).some(k => k.big) ? 290 : 146) : 0) + d.rows.length * 76 + 30;
    d._h = WD.mfY + mh;
    const stamp = d.stamp ? `<div class="wh-stamp" id="${p}stamp" style="right:24px;top:${WD.mfY + mh - 130}px">${d.stamp.text}</div>` : '';
    return `${heading(p, d)}<div class="content"><div class="rel" style="${whAcc(d)}">${bays}
      <div class="wh-mf wh-ink" id="${p}mf" style="left:0;top:${WD.mfY}px;width:${w}px;height:${mh}px">
        <div class="hd">Manifest<b>${d.title || ''}</b><i class="wh-bar"></i></div>${crates}${rows}</div>
      ${stamp}${castBlock(p, d.cast, d.bubbles)}${whStar(p, d, d._h + 30, w)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    const done = d.done || [];
    if (d.stocked) d.bays.forEach((_, i) => st(p + 'bay' + (i + 1), { opacity: '1' }));
    else d.bays.forEach((_, i) => up(p + 'bay' + (i + 1), seg(c.local, .1 + i * .1, .5 + i * .1), 40));
    const bay = B.at('bay', .1, .2, 'enter', { len: .7 });
    d.bays.forEach((_, i) => {
      const n = i + 1, open = n === d.active ? eio(bay.p) : done.includes(n) ? 1 : 0;
      // the roller door rolls up into the header; a picked bay stays open, dimmed, with its tag
      st(p + 'dr' + n, { transform: 'translateY(' + (-open * (WD.bh - 70)).toFixed(1) + 'px)' });
      st(p + 'ok' + n, { opacity: done.includes(n) ? '1' : '0' });
      if (done.includes(n)) st(p + 'bay' + n, { opacity: '.55' });
    });
    up(p + 'mf', seg(c.local, bay.s + .1, bay.s + .5), 30);
    const rec = (d.crates || []).map((k, i) => B.at(k.beat, .3 + i * .08, .4 + i * .08, 'pop'));
    rec.forEach((r, i) => { const q = bk(r.p); st(p + d.crates[i].beat, { opacity: String(cl(r.p * 3, 0, 1)), transform: 'translateY(' + Math.round((1 - q) * -80) + 'px)' }); });
    d.rows.forEach((r, i) => {
      const t = B.at(r.beat, .4 + i * .1, .5 + i * .1, 'enter');
      up(p + r.beat, t.p, 14);
      st(p + r.beat + 'ck', { strokeDashoffset: String(30 * (1 - eo(seg(c.local, t.s + .15, t.s + .5)))) });
    });
    if (d.stamp) whStampIn(p + 'stamp', B.p('stamp', .85, .95, 'pop'), -7);
    castPlay(B, c, p, d.cast, d.bubbles);
    whStarIn(B, p, d);
    footIn(B, p); holdLife(B, p, d);
  }
});
