/* lanes: two swimlanes, one per role, and an optional shared band under both (projects/cloud-vs-devops).
   The script compares two jobs that are easy to blur, so the deck keeps them in fixed places: cloud always on the
   left, DevOps always on the right, and anything they share drops into the band that spans both lanes.
   data: {eyebrow, accent, h1, left:{role, cls?, who?, items?:[string|{text, icon?, brand?, src?, tail?}], tools?:[string], pre?, dim?},
          right:{…same}, mid?:{label, text?, cls?:'t'|'v'|'g', chips?:[string|{text, icon?, brand?, src?}]},
          link?:{from:'ri2', to:'li1'}, sub?, foot?}
   `cls` is the lane colour ('b' cloud, 'o' DevOps, 'n' neutral). `pre: true` shows the lane from the first frame
   (the slide continues the previous one, so the lane should not re-enter) and still brings its items in on their
   beats; `pre: 'all'` shows the items too. `was` is the role text shown until the lane's beat, then swapped for
   `role` ("???" → "Cloud engineer" on the words that name it). `dim` holds the lane at 45% so the
   other lane reads as the subject. `link` draws an arrow from one item to an item in the other lane on the `from`
   item's beat.
   v2 additions: `avatar: {src, name}` on a lane (a character card in its header, beat la / ra) and on mid (the band's
   character); `team: [src…]` on a lane (a row of small characters, beat ltm / rtm); `mix` (the lanes wobble into
   each other and back); `asks: [html]` (question pills under the lanes, beats q1..qn); a mid chip with `to: 'ri1'`
   flies into that item on beat x<n>, and the item appears as it lands; `divider: true` (a line between the lanes,
   beat div, struck through on divx); an item with `chk: true` gets a tick box that fills on its beat.
   beats: l r · la ra · ltm rtm · li1..n · ri1..n · mid · k1..n · x1..xn · mix · div divx · q1..qn · sub */
const LN = { gap: 40, head: 156, itemH: 72, pitch: 86, midGap: 26, chipH: 52, chipGap: 12, chipRow: 64 };
const lnItem = it => (typeof it === 'string' ? { text: it } : it);
/* JetBrains Mono is a fixed .60em; the chip is 23px type plus 16px padding a side and the logo */
const lnChipW = ch => Math.round(String(ch.text).length * 23 * .6 + 34 + (ch.icon || ch.src ? 40 : 0));
/* chips flow left to right and wrap inside the band; positions are computed, never measured */
function lnChips(chips, w) {
  const out = []; let x = 0, row = 0;
  chips.forEach(ch => {
    const cw = lnChipW(ch);
    if (x && x + cw > w) { row++; x = 0; }
    out.push({ ch, x, row, w: cw }); x += cw + LN.chipGap;
  });
  return { out, rows: out.length ? row + 1 : 0 };
}
function lnLayout(d, G) {
  /* vertical canvas: the lanes stack (cloud on top, DevOps under it) at the full column width */
  const V = G.canvas === 'vertical', laneW = V ? G.cw : Math.round((G.cw - LN.gap) / 2);
  const nMax = Math.max((d.left && d.left.items || []).length, (d.right && d.right.items || []).length);
  /* tool chips wrap inside the lane: 19px JetBrains Mono (.60em) plus 20px padding and an 8px gap per chip */
  const toolRows = o => { if (!o || !o.tools) return 0; let x = 0, r = 1; const w = laneW - 56;
    o.tools.forEach(t => { const cw = t.length * 19 * .6 + 30; if (x && x + cw > w) { r++; x = 0; } x += cw; }); return r; };
  const tr = Math.max(toolRows(d.left), toolRows(d.right)), tools = tr > 0;
  const mid = d.mid ? Object.assign({ cls: 't' }, d.mid) : null;
  const chips = mid && mid.chips ? lnChips(mid.chips.map(lnItem), G.cw - 52) : { out: [], rows: 0 };
  const midH = mid ? 22 + 28 + (mid.text ? 50 : 0) + (chips.rows ? 18 + chips.rows * LN.chipRow - LN.chipGap : 0) + 22 : 0;
  const team = !!((d.left && d.left.team) || (d.right && d.right.team));
  const natural = LN.head + nMax * LN.pitch + (tools ? 14 + tr * 44 : 0) + (team ? 100 : 0) + 20;
  // a header-only lane (the roles as places, before anything is in them) stays a header, not an empty box
  const floor = nMax || team ? (V ? 0 : mid ? 300 : 420) : 180;
  const laneH = V ? Math.max(floor, natural) : Math.max(floor, Math.min(natural, G.ch - (mid ? midH + LN.midGap : 0)));
  const lanesH = V ? 2 * laneH + LN.gap : laneH;
  const org = side => V ? { x: 0, y: side === 'l' ? 0 : laneH + LN.gap } : { x: side === 'l' ? 0 : laneW + LN.gap, y: 0 };
  return { V, laneW, laneH, lanesH, org, tools, mid, chips, midH, midY: lanesH + LN.midGap };
}
defineTemplate('lanes', {
  check: d => { req(d, ['eyebrow', 'h1'], 'lanes'); if (!d.left && !d.right) throw new Error('template "lanes": data.left or data.right is required'); },
  beats: d => {
    const chips = (d.mid && d.mid.chips || []).map(lnItem), sides = [['l', d.left], ['r', d.right]];
    return baseBeats(d).concat(['l', 'r'], sides.filter(([, o]) => o && o.avatar).map(([k]) => k + 'a'), sides.filter(([, o]) => o && o.team).map(([k]) => k + 'tm'),
      seqN('li', (d.left && d.left.items || []).length), seqN('ri', (d.right && d.right.items || []).length),
      ['mid'], seqN('k', chips.length), chips.map((ch, i) => ch.to ? 'x' + (i + 1) : null).filter(Boolean),
      d.mix ? ['mix'] : [], d.divider ? ['div', 'divx'] : [], seqN('q', (d.asks || []).length), ['sub']);
  },
  html: (d, c) => {
    const p = c.p, G = c.grid, L = lnLayout(d, G);
    const lane = (side, o) => {
      if (!o) return '';
      const { x, y } = L.org(side), items = (o.items || []).map(lnItem);
      const rows = items.map((it, i) => {
        const img = it.chk ? `<span class="ln-ck"><svg id="${p}${side}i${i + 1}ck" viewBox="0 0 24 24"><path d="m5 12.5 4.6 4.6L19 6.8"/></svg></span>`
          : it.src || it.icon ? `<img src="${it.src || logo(it.icon, it.brand)}" alt="">` : `<span class="ix">${String(i + 1).padStart(2, '0')}</span>`;
        return `<div class="ln-item" id="${p}${side}i${i + 1}" style="left:24px;top:${LN.head + i * LN.pitch}px;width:${L.laneW - 48}px">${img}${it.text}${it.tail ? `<small>${it.tail}</small>` : ''}</div>`;
      }).join('');
      const tools = o.tools ? `<div class="ln-tools" id="${p}${side}tl" style="top:${LN.head + items.length * LN.pitch + 6}px">${o.tools.map(t => `<i>${t}</i>`).join('')}</div>` : '';
      return `<div class="ln-lane ${o.cls || (side === 'l' ? 'b' : 'o')}" id="${p}${side}" style="left:${x}px;top:${y}px;width:${L.laneW}px;height:${L.laneH}px">
        <div class="lh"><i>${o.who || '<b>$</b> whoami'}</i><strong id="${p}${side}nm">${o.was || o.role}</strong></div><div class="lr"></div>${rows}${tools}
        ${o.team ? `<div class="ln-team" id="${p}${side}tm" style="top:${LN.head + 6}px">${o.team.map(src => `<span class="cst-card sm"><img src="${src}" alt=""></span>`).join('')}</div>` : ''}</div>
        ${o.avatar ? castHtml({ id: p + side + 'a', src: o.avatar.src, name: o.avatar.name, cls: o.cls || (side === 'l' ? 'b' : 'o'), size: 118, x: x + L.laneW - 138, y: y - 34 }) : ''}`;
    };
    let mid = '';
    if (L.mid) {
      const cy = L.midY + 22 + 28 + (L.mid.text ? 50 : 0) + 18;
      mid = `<div class="ln-mid ${L.mid.cls}" id="${p}mid" style="left:0;top:${L.midY}px;width:${G.cw}px;height:${L.midH}px">
        ${L.mid.avatar ? `<span class="cst-card sm ln-mav"><img src="${L.mid.avatar.src}" alt=""></span>` : ''}
        <div class="ml">${L.mid.label}</div>${L.mid.text ? `<div class="mt">${L.mid.text}</div>` : ''}</div>` +
        L.chips.out.map((k, i) => {
          // a chip bound for a lane item carries both positions; frame() interpolates between them
          const to = k.ch.to ? { x: L.org(k.ch.to[0]).x + 24, y: L.org(k.ch.to[0]).y + LN.head + (+k.ch.to.slice(2) - 1) * LN.pitch + 10 } : null;
          return `<div class="ln-chip ${L.mid.cls}" id="${p}k${i + 1}" style="left:${26 + k.x + (L.mid.avatar ? 110 : 0)}px;top:${cy + k.row * LN.chipRow}px"${to ? ` data-tx="${to.x}" data-ty="${to.y}"` : ''}>${k.ch.src || k.ch.icon ? `<img src="${k.ch.src || logo(k.ch.icon, k.ch.brand)}" alt="">` : ''}${k.ch.text}</div>`;
        }).join('');
    }
    let link = '';
    if (d.link) {
      /* item centres in content coordinates: the arrow leaves the `from` item's inner edge and lands on the `to` item's */
      const pos = key => { const side = key[0], i = +key.slice(2) - 1, o = L.org(side);
        return { side, xIn: L.V || side === 'l' ? o.x + L.laneW - 24 : o.x + 24, y: o.y + LN.head + i * LN.pitch + LN.itemH / 2 }; };
      const a = pos(d.link.from), b = pos(d.link.to), W = G.cw + (L.V ? 70 : 0);
      // stacked lanes: the arrow leaves one item's right edge, bows out past the lanes and comes back into the other's
      const mx = L.V ? L.laneW + 60 : (a.xIn + b.xIn) / 2;
      const dir = L.V ? -1 : b.xIn > a.xIn ? 1 : -1, hx = b.xIn - dir * 4;
      link = `<svg class="ln-link" id="${p}lk" style="left:0;top:0;width:${W}px;height:${L.lanesH}px" viewBox="0 0 ${W} ${L.lanesH}">
        <path d="M${a.xIn} ${a.y} C${mx} ${a.y} ${mx} ${b.y} ${hx - dir * 14} ${b.y}"/>
        <polygon class="hd" id="${p}lkh" points="${hx},${b.y} ${hx - dir * 18},${b.y - 11} ${hx - dir * 18},${b.y + 11}" style="opacity:0"/></svg>`;
    }
    const bottom = L.mid ? L.midY + L.midH : L.lanesH, dx = L.laneW + LN.gap / 2, dy = L.laneH + LN.gap / 2;
    const divider = d.divider && L.V ? `<svg class="ln-div" id="${p}div" style="left:-20px;top:${dy - 10}px;width:${L.laneW + 40}px;height:20px" viewBox="0 0 ${L.laneW + 40} 20"><path d="M0 10 L${L.laneW + 40} 10"/></svg>
      <svg class="ln-divx" id="${p}divx" style="left:${L.laneW / 2 - 60}px;top:${dy - 60}px;width:120px;height:120px" viewBox="0 0 120 120"><path d="M20 20 L100 100"/><path d="M100 20 L20 100"/></svg>` : d.divider ? `<svg class="ln-div" id="${p}div" style="left:${dx - 10}px;top:-20px;width:20px;height:${L.laneH + 40}px" viewBox="0 0 20 ${L.laneH + 40}"><path d="M10 0 L10 ${L.laneH + 40}"/></svg>
      <svg class="ln-divx" id="${p}divx" style="left:${dx - 60}px;top:${L.laneH / 2 - 60}px;width:120px;height:120px" viewBox="0 0 120 120"><path d="M20 20 L100 100"/><path d="M100 20 L20 100"/></svg>` : '';
    const asks = (d.asks || []).map((q, i) => bubbleHtml({ id: p + 'q' + (i + 1), text: q, x: i * Math.round(G.cw / (d.asks.length)) + 20, y: bottom + 34, tail: 'u' })).join('');
    return `${heading(p, d)}<div class="content"><div class="rel">${lane('l', d.left)}${lane('r', d.right)}${mid}${link}${divider}${asks}
      ${subHtml(p, d.sub, bottom + (d.asks ? 150 : 30), G.cw)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c), recs = {};
    headIn(B, p);
    [['l', d.left, .10, -56], ['r', d.right, .20, 56]].forEach(([side, o, a, dx]) => {
      if (!o) return;
      const lr = B.at(side, a, a + .16);
      const lq = o.pre ? (B.on ? seg(c.local, 0, .3) : seg(t, 0, .06)) : lr.p;
      sx(p + side, lq, dx);
      if (o.was) {
        const flip = o.pre ? lr.p : seg(lr.p, .6, 1);
        txt(p + side + 'nm', flip > .5 ? o.role : o.was);
        pp(p + side + 'nm', flip > .5 ? seg(flip, .5, 1) : 1, .7);
      }
      const n = (o.items || []).length;
      B.group(side + 'i', n, { a: a + .20, step: .07, len: .12, kind: 'enter' }).forEach((r, i) => {
        recs[side + 'i' + (i + 1)] = r;
        up(p + side + 'i' + (i + 1), o.pre === 'all' ? 1 : r.p, 18);
      });
      if (o.tools) {
        const last = recs[side + 'i' + n];
        fd(p + side + 'tl', o.pre === 'all' ? 1 : last ? (B.on ? seg(c.local, last.e, last.e + .3) : seg(t, last.fb, last.fb + .06)) : lq);
      }
      if (o.dim) dim(p + side, 1, .45);
      (o.items || []).map(lnItem).forEach((it, i) => { if (it.chk) draw(p + side + 'i' + (i + 1) + 'ck', seg(recs[side + 'i' + (i + 1)].p, .5, 1)); });
      if (o.avatar) { const ar = B.at(side + 'a', a + .1, a + .2, 'pop', { focal: false }); castIn(p + side + 'a', ar.p, B.on ? c.local - ar.e : 0); }
      if (o.team) pp(p + side + 'tm', B.p(side + 'tm', .6, .7, 'pop'), .7);
    });
    // mix: the lanes lean into each other and settle back over 1.4s
    if (d.mix) {
      const m = B.at('mix', .5, .7, 'enter', { len: 1.4 }), k = Math.sin(cl(m.p, 0, 1) * Math.PI);
      const ax = c.grid.canvas === 'vertical' ? 'Y' : 'X';   // stacked lanes lean up and down into each other
      ['l', 'r'].forEach(side => { const e = el(p + side); if (!e) return; const sgn = side === 'l' ? 1 : -1;
        e.style.transform += ` translate${ax}(${(sgn * 70 * k).toFixed(1)}px) rotate(${(sgn * 2.2 * Math.sin(m.p * Math.PI * 3) * k).toFixed(2)}deg)`; });
    }
    if (d.mid) {
      up(p + 'mid', B.p('mid', .56, .68), 24);
      const chips = (d.mid.chips || []).map(lnItem);
      B.group('k', chips.length, { a: .66, step: .05, len: .10, kind: 'pop', dim: false }).forEach((r, i) => {
        const id = p + 'k' + (i + 1); pp(id, r.p, .8);
        if (!chips[i].to) return;
        // the flight: from the band to the lane item, then the chip hands over to the item it became
        const e = el(id), fr = B.at('x' + (i + 1), .8, .9, 'enter', { len: .7 }), q = eio(cl(fr.p, 0, 1));
        if (e) { const tx = +e.dataset.tx - e.offsetLeft, ty = +e.dataset.ty - e.offsetTop;
          st(id, { transform: `translate(${(tx * q).toFixed(1)}px,${(ty * q).toFixed(1)}px) scale(${(r.p >= 1 ? 1 : .8 + .2 * bk(r.p)).toFixed(3)})`, opacity: String(cl(r.p * 2.2, 0, 1) * (1 - seg(fr.p, .85, 1))) }); }
        const tgt = p + chips[i].to;
        st(tgt, { opacity: String(seg(fr.p, .8, 1)), transform: 'none' });
      });
    }
    if (d.link) {
      const r = recs[d.link.from];
      const q = r ? (B.on ? seg(c.local, r.s + .2, r.s + .75) : seg(t, r.fb, r.fb + .1)) : 0;
      draw(p + 'lk', q); st(p + 'lkh', { opacity: q > .9 ? 1 : 0 });
    }
    if (d.divider) { draw(p + 'div', B.p('div', .3, .4, 'draw')); draw(p + 'divx', B.p('divx', .5, .6, 'draw')); }
    B.group('q', (d.asks || []).length, { a: .8, step: .06, len: .1, kind: 'pop', dim: false }).forEach((r, i) => bubbleIn(p + 'q' + (i + 1), r.p, 0));
    up(p + 'sub', B.p('sub', .86, .96));
    footIn(B, p); holdLife(B, p, d);
  }
});
