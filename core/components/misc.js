/* Small shared builders. All return HTML strings. */
/* logo(name)            → assets/logos/aws/<name>.svg
   logo(name, true)      → assets/logos/brands/<name>.svg
   logo(name, 'custom')  → assets/logos/custom/<name>.svg   (any folder under assets/logos) */
const logo = (name, brand) => ASSETS + 'logos/' + (brand === true ? 'brands/' : brand ? brand + '/' : 'aws/') + name + '.svg';
/* project-local asset (projects/<slug>/assets/<file>) */
const passet = name => (window.PASSETS || 'assets/') + name;

/* logo tile + caption, optional number above.
   `src` wins over `icon`, for a mark that lives in the project's own assets rather than the shared logo cache:
   anything fetched through project.js -> assets.urls lands in projects/<slug>/assets and is reached with
   passet(), which logo() cannot express. */
function logoStack(o) {
  const size = o.size || '';
  const src = o.src || (o.brand ? logo(o.icon, true) : logo(o.icon));
  return `<div class="stack" id="${o.id}" style="left:${o.x}px;top:${o.y}px${o.w ? ';width:' + o.w + 'px' : ''}">${o.num ? `<div class="num">${o.num}</div>` : ''}<div class="ltile ${size}${o.brand ? '' : ' sq'}"><img src="${src}" alt="${o.label}"></div><div class="nm">${o.label}</div></div>`;
}
/* eyebrow + headline + footnote in the locked grid. The headline is split at <br> into masked lines (.ln > .li) so
   h1In() can wipe them up one by one; <em> inside it takes the accent colour and an animated underline. */
const ACCENT_VAR = { t: '--teal', v: '--violet', r: '--rose', a: '--amber', g: '--green', b: '--blue', o: '--orange' };
function h1Lines(html) { return String(html).split(/<br\s*\/?>/i).map(l => `<span class="ln"><span class="li">${l}</span></span>`).join(''); }
function heading(p, d) {
  const acc = ACCENT_VAR[d.accent] ? ` style="--acc:var(${ACCENT_VAR[d.accent]})"` : '';
  const ebT = d.ebTop != null ? ` style="top:${d.ebTop}px"` : '';
  const hT = d.h1Top != null ? `top:${d.h1Top}px;` : '';
  const accs = (hT || acc) ? ` style="${hT}${ACCENT_VAR[d.accent] ? '--acc:var(' + ACCENT_VAR[d.accent] + ')' : ''}"` : '';
  return `<div class="eyebrow ${d.accent || ''}" id="${p}eb"${ebT}>${d.eyebrow}</div><div class="h1 ${d.h1size || ''}" id="${p}h1"${accs}>${h1Lines(d.h1)}</div>` +
    (d.foot ? `<div class="foot" id="${p}ft"${d.footTop ? ` style="top:${d.footTop}px"` : ''}>${d.foot}</div>` : '');
}
/* pointer + ripple elements */
function pointer(id) { return `<div class="cur" id="${id}"><svg viewBox="0 0 24 24"><use href="#i-cursor"/></svg></div><div class="rip" id="${id}-rip" style="opacity:0"></div>`; }
/* checklist row */
function checkRow(o) {
  return `<div class="chk" id="${o.id}" style="left:${o.x || 0}px;top:${o.y}px"><span class="bx"><svg viewBox="0 0 24 24" id="${o.id}-ck"><path d="m5 12.5 4.6 4.6L19 6.8"/></svg></span>${o.icon || o.src ? `<img src="${o.src || logo(o.icon, o.brand)}" alt="" onerror="this.remove()">` : ''}${o.src2 ? `<img src="${o.src2}" alt="" onerror="this.remove()">` : ''}<span class="tx">${o.text}<small>${o.sub || ''}</small></span>${o.tail ? `<span class="tail">${o.tail}</span>` : ''}</div>`;
}
/* a chip with an optional brand logo */
function chip(o) {
  const img = o.icon ? `<img src="${logo(o.icon, o.brand)}" alt="" onerror="this.remove()">` : (o.sym ? `<span class="ico"><svg viewBox="0 0 24 24"><use href="#${o.sym}"/></svg></span>` : '');
  return `<div class="chip ${o.cls || ''}" id="${o.id}" style="position:absolute;left:${o.x}px;top:${o.y}px">${img}${o.text}</div>`;
}
/* An arrowhead marker for a drawn path, plus the helper that attaches it at the right moment.

   markerUnits is userSpaceOnUse on purpose. The SVG default is `strokeWidth`, which scales the head with the
   line: the same definition that gives a tidy 14px head on the cabinet's 3px dashed arc renders a 64px spike on
   the RAG dump arrow, which is stroke-width 14. In user space the head is sized in `size` and the stroke weight
   is irrelevant.

   arrowAt() exists because a marker is painted from the first frame: on a path that draws itself over a second,
   the head sits waiting at the destination while the line is still travelling towards it. Attaching it only once
   the stroke has arrived is the idiom core/components/figure.js already uses for its route lines. */
function arrowMarker(id, o) {
  o = o || {};
  const s = o.size || 16, c = o.color || 'var(--acc,var(--blue))';
  return `<marker id="${id}" viewBox="0 0 10 10" refX="${o.refX != null ? o.refX : 7}" refY="5" markerWidth="${s}" markerHeight="${s}" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 1 L9 5 L0 9 Z" fill="${c}" stroke="none"/></marker>`;
}
function arrowAt(svgId, markerId, q) {
  const e = el(svgId); if (!e) return;
  const pth = e.querySelector('path:not(marker path)'); if (!pth) return;
  pth.setAttribute('marker-end', q > .96 ? 'url(#' + markerId + ')' : 'none');
}

/* avatar tile — one figure on a paper disc, with an optional caption.
   `src` is a full URL (passet('avatar-dev.svg')), not a logo() name, because the avatars are project assets
   rather than shared brand marks. The disc is baked into the file by DiceBear's backgroundColor/radius params,
   so this is a plain img; the ring and shadow come from .avt in the theme stylesheet. */
function avatar(o) {
  const s = o.size || 132;
  /* the box is sized by its width only: a caption adds ~37px below the disc, and pinning the height to the disc
     made the caption overflow its own container (the probe caught it as OVERFLOW-Y 199>156) */
  return `<div class="avt ${o.cls || ''}" id="${o.id}" style="left:${o.x}px;top:${o.y}px;width:${s}px">`
    + `<img src="${o.src}" alt="${o.label || ''}" onerror="this.remove()">`
    + (o.label ? `<span class="nm">${o.label}</span>` : '') + `</div>`;
}

/* svg X mark over a tile */
function xMark(id, x, y, s) {
  return `<svg class="x-mark" id="${id}" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px" viewBox="0 0 ${s} ${s}"><path d="M${s * .15} ${s * .15} L${s * .85} ${s * .85}"/><path d="M${s * .85} ${s * .15} L${s * .15} ${s * .85}"/></svg>`;
}

/* centre of an element in content coordinates (relative to the .content box of the current grid) */
function centerOf(root, el) {
  const r = el.getBoundingClientRect(), s = root.getBoundingClientRect();
  return { x: r.left + r.width / 2 - s.left - GRID.cx, y: r.top + r.height / 2 - s.top - GRID.cy };
}

/* Console interaction: pointer glides to a dropdown button, clicks, menu opens, pointer clicks an item,
   a confirmation modal appears, pointer clicks its primary button. All driven by t.
   o: { cur, menu, modal, btn, item, x0, y0, b:{x,y}, i:{x,y}, ok:{x,y} }   Returns the phase reached. */
const FLOW_T = { in: [.20, .24], toBtn: [.22, .32], clickBtn: [.32, .36], menuIn: [.34, .38], toItem: [.38, .46], clickItem: [.46, .50], menuOut: [.50, .53],
  modalIn: [.52, .60], toOk: [.58, .68], clickOk: [.68, .72], modalOut: [.72, .76], curOut: [.76, .82] };
function clickFlow(t, o) {
  const T = Object.assign({}, FLOW_T, o.times || {});
  let x, y;
  if (t < T.toItem[0]) { const m = eio(seg(t, T.toBtn[0], T.toBtn[1])); x = lerp(o.x0, o.b.x, m); y = lerp(o.y0, o.b.y, m); }
  else if (t < T.toOk[0]) { const m = eio(seg(t, T.toItem[0], T.toItem[1])); x = lerp(o.b.x, o.i.x, m); y = lerp(o.b.y, o.i.y, m); }
  else { const m = eio(seg(t, T.toOk[0], T.toOk[1])); x = lerp(o.i.x, o.ok.x, m); y = lerp(o.i.y, o.ok.y, m); }
  const pB = pulse(seg(t, T.clickBtn[0], T.clickBtn[1])), pI = pulse(seg(t, T.clickItem[0], T.clickItem[1])), pO = pulse(seg(t, T.clickOk[0], T.clickOk[1]));
  const press = pB + pI + pO;
  st(o.cur, { opacity: seg(t, T.in[0], T.in[1]) * (1 - seg(t, T.curOut[0], T.curOut[1])), left: (x - 10) + 'px', top: (y - 6) + 'px',
    transform: 'scale(' + (1 - .22 * press) + ')', transformOrigin: '10px 6px' });
  let rip = false;
  [[T.clickBtn, o.b], [T.clickItem, o.i], [T.clickOk, o.ok]].forEach(([tm, p]) => {
    const q = seg(t, tm[0], tm[1] + .05); if (q > 0 && q < 1) { ripple(o.cur + '-rip', q, p.x, p.y, 58); rip = true; }
  });
  if (!rip) st(o.cur + '-rip', { opacity: 0 });
  if (o.btn) st(o.btn, { transform: 'scale(' + (1 - .07 * pB) + ')', filter: 'brightness(' + (1 - .12 * pB) + ')' });
  st(o.menu, { opacity: seg(t, T.menuIn[0], T.menuIn[1]) * (1 - seg(t, T.menuOut[0], T.menuOut[1])), transform: 'translateY(' + ((1 - eo(seg(t, T.menuIn[0], T.menuIn[1]))) * -8) + 'px)' });
  if (o.item) cls(o.item, 'hl', t >= T.toItem[1] - .01);
  if (o.modal) {
    const out = 1 - seg(t, T.modalOut[0], T.modalOut[1]);
    fd(o.modal + '-scrim', seg(t, T.modalIn[0], T.modalIn[1]) * out);
    pp(o.modal, seg(t, T.modalIn[0], T.modalIn[1]), .92);
    st(o.modal, { opacity: cl(seg(t, T.modalIn[0], T.modalIn[1]) * 2.2, 0, 1) * out });
    const okEl = document.getElementById(o.modal + '-ok');
    if (okEl) st(okEl, { transform: 'scale(' + (1 - .07 * pO) + ')', filter: 'brightness(' + (1 - .12 * pO) + ')' });
  }
  return { menuOpen: t >= T.menuIn[0] && t < T.menuOut[1], picked: t >= T.clickItem[1], confirmed: t >= T.clickOk[1], done: t >= T.modalOut[1] };
}
