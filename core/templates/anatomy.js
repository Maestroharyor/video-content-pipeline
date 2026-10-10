/* anatomy: one web address on a line, parts lit or dimmed one at a time, with a lead line down to a labelled card.
   Used for the whole "the address is more layered than it looks" section, so the same string stays on screen across
   12 slides and only the emphasis moves.
   data: {eyebrow, accent, h1, h1size?, addr: {parts: [{t, id?, cls?}], lit?: [ids], acc?: [ids], off?: [ids],
          card?: {on: id, label, title, sub}, brace?: [idFrom, idTo], braceLabel?, arrow?: 'ltr'|'rtl', chips?: [{text, cls}]}}
   Parts are laid out by the browser (one nowrap line, centred); the highlight box and the lead line measure the real
   part in setup(), so nothing depends on guessed character widths.
   beats: hl (highlight) · card · brace · arrow · k1..kn (chips) */
/* Geometry per canvas: sy the address line, cy the card, chy the chips; the rest is measured off the string, whose
   size sets the offsets below it (lead line start, highlight height, brace, brace label, arrow above).
   horizontal: chips end at 851, above the caption line at 870.
   vertical: the 33-character address at 62px is ~1230px wide, so it drops to 36px (~710px) and the whole figure
   sits in the content band straight under the heading. */
const ANA_GEO = {
  horizontal: { sy: 415, cy: 610, chy: 775, fs: null, head: { ebTop: 104, h1Top: 158 }, lead: 88, hlH: 104, brace: 96, bl: 150, arrow: -70 },
  vertical: { sy: 640, cy: 840, chy: 1130, fs: 36, head: null, lead: 54, hlH: 64, brace: 58, bl: 96, arrow: -60 },
};
const anaGeo = G => ANA_GEO[G.canvas] || ANA_GEO.horizontal;
defineTemplate('anatomy', {
  check: d => req(d, ['eyebrow', 'h1', 'addr'], 'anatomy'),
  beats: d => baseBeats(d).concat(['hl', 'card', 'brace', 'arrow'], seqN('k', (d.addr.chips || []).length)),
  html: (d, c) => {
    const p = c.p, G = c.grid, A = anaGeo(G), a = d.addr;
    const parts = a.parts.map((s, i) => `<span class="pt" id="${p}pt-${s.id || i}">${s.t}</span>`).join('');
    const chips = (a.chips || []).map((k, i) => `<div class="chip ${k.cls || 'v'}" id="${p}k${i + 1}" style="position:absolute;left:0;top:${A.chy}px">${k.text}</div>`).join('');
    const card = a.card ? `<div class="ad-card" id="${p}card" style="left:0;top:${A.cy}px;width:640px">
      <div class="ac-l">${a.card.label}</div><div class="ac-t">${a.card.title}</div>${a.card.sub ? `<div class="ac-s">${a.card.sub}</div>` : ''}</div>` : '';
    return `${heading(p, Object.assign({}, A.head, d))}
      <div class="ad-hl" id="${p}hl" style="left:0;top:0;width:0;height:0;opacity:0"></div>
      <div class="ad-str" id="${p}str" style="left:0;top:${A.sy}px${A.fs ? `;font-size:${A.fs}px` : ''}">${parts}</div>
      <div class="ad-lead" id="${p}lead" style="left:0;top:0;height:0;opacity:0"></div>
      ${card}${chips}
      ${a.brace ? `<svg class="ad-brace" id="${p}brace" style="position:absolute;left:0;top:${A.sy + A.brace}px;width:${G.w}px;height:60px;opacity:0" viewBox="0 0 ${G.w} 60"><path d="M0 0" fill="none" stroke="rgba(167,139,250,.75)" stroke-width="3"/></svg>
        <div class="ad-bl" id="${p}bl" style="position:absolute;left:0;top:${A.sy + A.bl}px;width:${G.w}px;text-align:center;font:700 26px Inter;letter-spacing:.16em;text-transform:uppercase;color:var(--violet);opacity:0">${a.braceLabel || ''}</div>` : ''}
      ${a.arrow ? `<svg id="${p}arrow" style="position:absolute;left:0;top:${A.sy + A.arrow}px;width:${G.w}px;height:46px;opacity:0" viewBox="0 0 ${G.w} 46"><path id="${p}arrowp" d="M0 23" fill="none" stroke="var(--violet)" stroke-width="3" stroke-linecap="round" marker-end="url(#${p}ah)"/><defs><marker id="${p}ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10z" fill="var(--violet)"/></marker></defs></svg>` : ''}`;
  },
  /* Measure the real parts and park the highlight, lead line, card and chips on them.
     Runs in setup() and again on the first frame after the webfont finishes loading: JetBrains Mono is wider than the
     fallback, so a measurement taken before the font swap puts every marker on the wrong part. Pure in the DOM, so
     frames stay deterministic (same reason core/overlay.js re-measures on fontsLoaded). */
  place: (d, c) => {
    const p = c.p, G = c.grid, A = anaGeo(G), a = d.addr;
    const q = id => document.getElementById(id);
    const str = q(p + 'str'); if (!str) return;
    str.style.left = Math.round((G.w - str.offsetWidth) / 2) + 'px';
    const box = id => { const e = q(p + 'pt-' + id); return e ? { x: str.offsetLeft + e.offsetLeft, w: e.offsetWidth } : null; };
    const tgt = a.card && box(a.card.on);
    if (tgt) {
      const card = q(p + 'card');
      card.style.left = Math.max(G.safe.l, Math.min(G.safe.r - 640, Math.round(tgt.x + tgt.w / 2 - 320))) + 'px';
      const lead = q(p + 'lead');
      lead.style.left = Math.round(tgt.x + tgt.w / 2) + 'px';
      lead.style.top = (A.sy + A.lead) + 'px';
      d._leadH = A.cy - (A.sy + A.lead);
    }
    const hl = a.acc && a.acc.length ? box(a.acc[0]) : null;
    if (hl) { const e = q(p + 'hl'); e.style.left = (hl.x - 14) + 'px'; e.style.top = (A.sy - 14) + 'px'; e.style.width = (hl.w + 28) + 'px'; e.style.height = A.hlH + 'px'; }
    const chipEls = (a.chips || []).map((_, i) => q(p + 'k' + (i + 1))).filter(Boolean);
    if (chipEls.length) {
      const gap = 26, total = chipEls.reduce((s2, e) => s2 + e.offsetWidth, 0) + gap * (chipEls.length - 1);
      let x = Math.round((G.w - total) / 2);
      chipEls.forEach(e => { e.style.left = x + 'px'; x += e.offsetWidth + gap; });
    }
    if (a.brace) {
      const f0 = box(a.brace[0]), t0 = box(a.brace[1]);
      const path = q(p + 'brace') && q(p + 'brace').querySelector('path');
      if (f0 && t0 && path) { const x0 = f0.x - 10, x1 = t0.x + t0.w + 10;
        path.setAttribute('d', `M${x0} 6 L${x0} 26 L${(x0 + x1) / 2 - 16} 26 L${(x0 + x1) / 2} 48 L${(x0 + x1) / 2 + 16} 26 L${x1} 26 L${x1} 6`); }
    }
    if (a.arrow) {
      const l = G.safe.l + 180, r = G.safe.r - 180;
      const ap = q(p + 'arrowp'); if (ap) ap.setAttribute('d', a.arrow === 'rtl' ? `M${r} 23 L${l} 23` : `M${l} 23 L${r} 23`);
    }
    d._placed = document.fonts.status === 'loaded';
  },
  setup: (root, d, c) => { TEMPLATES.anatomy.place(d, c); },
  frame: (t, c) => {
    const p = c.p, d = c.data, a = d.addr, B = beats(c);
    if (!d._placed) TEMPLATES.anatomy.place(d, c);
    headIn(B, p);
    // the string is always there from the first frame of the section; only the emphasis moves
    const sIn = B.p('str', .04, .22);
    st(p + 'str', { opacity: String(cl(eo4(sIn), 0, 1)) });
    a.parts.forEach((s, i) => {
      const id = p + 'pt-' + (s.id || i), lit = a.lit && a.lit.indexOf(s.id) >= 0, acc = a.acc && a.acc.indexOf(s.id) >= 0, off = a.off && a.off.indexOf(s.id) >= 0;
      cls(id, 'lit', lit && !acc); cls(id, 'off', !!off); cls(id, 'acc', !!acc && B.p('hl', .24, .40) > .25);
      cls(id, 'ghost', s.id === 'root' && !acc);
    });
    const hp = B.p('hl', .24, .40, 'pop');
    if (a.acc && a.acc.length) pp(p + 'hl', hp, .88);
    if (a.arrow) { fd(p + 'arrow', B.p('arrow', .26, .42)); draw(p + 'arrow', B.p('arrow', .26, .52, 'draw')); }
    if (a.card) {
      const lp = B.p('card', .42, .54, 'draw');
      st(p + 'lead', { opacity: String(cl(lp * 2, 0, 1)), height: Math.round((d._leadH || 120) * eo(lp)) + 'px' });
      up(p + 'card', B.p('card', .46, .62), 26);
    }
    if (a.brace) { const bp = B.p('brace', .44, .62, 'draw'); draw(p + 'brace', bp); fd(p + 'bl', seg(bp, .6, 1)); }
    (a.chips || []).forEach((_, i) => pp(p + 'k' + (i + 1), B.p('k' + (i + 1), .60 + i * .05, .70 + i * .05, 'pop'), .84));
    footIn(B, p); holdLife(B, p, d, { alias: { hl: 'hl', card: 'card' } });
  }
});
