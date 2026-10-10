/* wire: a protocol canvas (projects/mcp-server-tutorial). Nodes are message frames with a mono header strip; edges
   draw between them and carry travelling packets; ghost cards ("Rebuild the app") get struck through; badges attach
   to nodes; chips pop in a row. Every scene of the deck that explains how things connect is one of these, so the
   viewer keeps watching the same picture grow: app, then AI, then the MCP plug between them.
   Coordinates are content coordinates (the horizontal content box, 1100 wide); nodes are placed by their top-left.
   data: {eyebrow, accent, h1, h1size?,
     nodes: {<id>: {x, y, w?, h?, tag, label, sub?, icon?, brand?, src?, gi?, cls?, at?: 'pre'}}
            icon+brand → logo(icon, brand) · src → any URL (passet) · gi → an icons.js symbol ('i-db') · neither → no tile
            cls: 'hub' (the orange protocol node) | 'ai' | 'ok' | 'dash'; at 'pre' = on screen from the first frame
     edges: [{a, b, label?, cls?: 'hot'|'dash'|'ai', flow?: bool, pre?: bool, q?: bool (a "?" at the midpoint), ea?, eb?}]
            ea/eb: which side of node a/b the edge leaves from ('l' 'r' 't' 'b'), default: the facing sides
     ghosts: [{x, y, text}]   struck on x1..xn
     badges: [{at, text, cls?, dx, dy}]   chips: [{x, y, text, cls?, icon?, brand?}]   chipRow?: {x, y, gap?} (chips in one evenly spaced row)
     cast?, bubbles?, sub?, foot?}
   beats: n<id> (a node that is not 'pre') · e1..en (edges that are not pre) · x1..xn · bd1..bdn · k1..kn · a1.., b1.. · sub */
const WIRE = { w: 300, h: 130 };
function wireBox(n) { return { x: n.x, y: n.y, w: n.w || WIRE.w, h: n.h || WIRE.h }; }
/* the point on a node's side an edge leaves from: the side facing the other node unless the edge names one */
function wireAnchor(A, B, side) {
  const ca = { x: A.x + A.w / 2, y: A.y + A.h / 2 }, cb = { x: B.x + B.w / 2, y: B.y + B.h / 2 };
  const dx = cb.x - ca.x, dy = cb.y - ca.y;
  const s = side || (Math.abs(dx) / A.w > Math.abs(dy) / A.h ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'b' : 't'));
  return { s, x: s === 'l' ? A.x : s === 'r' ? A.x + A.w : ca.x, y: s === 't' ? A.y : s === 'b' ? A.y + A.h : ca.y };
}
function wirePath(d, e) {
  const A = wireBox(d.nodes[e.a]), B = wireBox(d.nodes[e.b]);
  const p = wireAnchor(A, B, e.ea), q = wireAnchor(B, A, e.eb);
  // an elbow: out of the side it leaves from, then across, then into the target's side
  const hor = s => s === 'l' || s === 'r';
  let dd;
  if (hor(p.s) && hor(q.s)) { const mx = (p.x + q.x) / 2; dd = `M${p.x} ${p.y} L${mx} ${p.y} L${mx} ${q.y} L${q.x} ${q.y}`; }
  else if (!hor(p.s) && !hor(q.s)) { const my = (p.y + q.y) / 2; dd = `M${p.x} ${p.y} L${p.x} ${my} L${q.x} ${my} L${q.x} ${q.y}`; }
  else if (hor(p.s)) dd = `M${p.x} ${p.y} L${q.x} ${p.y} L${q.x} ${q.y}`;
  else dd = `M${p.x} ${p.y} L${p.x} ${q.y} L${q.x} ${q.y}`;
  return { dd, mid: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 } };
}
/* A label that would not fit its node is set smaller instead of spilling past the frame ("OS commands" did at 300px).
   Widths are estimated from the face's average advance (Inter Display 800 ≈ .56em, JetBrains Mono .60em), the
   way lanes.js sizes its chips: positions are computed, never measured, so a frame never depends on layout timing. */
function wireFit(text, room, size, adv) {
  const need = String(text).replace(/<[^>]*>/g, '').length * size * (adv || .56);
  return need > room ? ` style="font-size:${Math.max(16, Math.floor(size * room / need))}px"` : '';
}
function wireNodeHtml(p, id, n) {
  const b = wireBox(n);
  const ic = n.src || n.icon ? `<span class="wr-ic"><img src="${n.src || logo(n.icon, n.brand)}" alt=""></span>`
    : n.gi ? `<span class="wr-ic gl"><svg viewBox="0 0 24 24"><use href="#${n.gi}"/></svg></span>` : '';
  return `<div class="wr-n ${n.cls || ''}" id="${p}n${id}" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px">
    <div class="wr-tag"><i></i><span class="wr-tt" id="${p}n${id}tt" style="width:0">${n.tag}</span></div><div class="wr-b">${ic}<div class="wr-t"><b${wireFit(n.label, b.w - 40 - (ic ? 74 : 0), 30)}>${n.label}</b>${n.sub ? `<small${wireFit(n.sub, b.w - 40 - (ic ? 74 : 0), 20, .6)}>${n.sub}</small>` : ''}</div></div></div>`;
}
defineTemplate('wire', {
  check: d => req(d, ['eyebrow', 'h1', 'nodes'], 'wire'),
  beats: d => baseBeats(d).concat(
    Object.keys(d.nodes).filter(id => d.nodes[id].at !== 'pre').map(id => 'n' + id),
    (d.edges || []).map((e, i) => e.pre ? null : 'e' + (i + 1)).filter(Boolean),
    seqN('x', (d.ghosts || []).length), seqN('bd', (d.badges || []).length), seqN('k', (d.chips || []).length),
    castBeats(d.cast, d.bubbles), ['sub']),
  html: (d, c) => {
    const p = c.p, G = c.grid, W = G.cw, H = 900;
    const edges = (d.edges || []).map((e, i) => {
      const w = wirePath(d, e);
      return `<svg class="draw wr-e ${e.cls || ''}" id="${p}e${i + 1}" style="left:0;top:0;width:${W}px;height:${H}px" viewBox="0 0 ${W} ${H}"><path d="${w.dd}"/></svg>`
        + (e.label ? `<div class="wr-el ${e.cls === 'hot' ? 'hot' : ''}" id="${p}e${i + 1}l" style="left:${w.mid.x}px;top:${w.mid.y}px">${e.label}</div>` : '')
        + (e.q ? `<div class="wr-q" id="${p}e${i + 1}q" style="left:${w.mid.x}px;top:${w.mid.y}px">?</div>` : '')
        + (e.flow ? `<i class="wr-pk ${e.cls === 'ai' ? 'ai' : ''}" id="${p}pk${i + 1}a"></i><i class="wr-pk ${e.cls === 'ai' ? 'ai' : ''}" id="${p}pk${i + 1}b"></i>` : '');
    }).join('');
    const nodes = Object.keys(d.nodes).map(id => wireNodeHtml(p, id, d.nodes[id])).join('');
    const ghosts = (d.ghosts || []).map((g, i) => `<div class="wr-gh" id="${p}x${i + 1}" style="left:${g.x}px;top:${g.y}px">${g.text}<i class="wr-x" id="${p}x${i + 1}s"></i></div>`).join('');
    const badges = (d.badges || []).map((b, i) => { const n = wireBox(d.nodes[b.at]);
      return `<div class="badge ${b.cls || 'o'}" id="${p}bd${i + 1}" style="left:${n.x + (b.dx || 0)}px;top:${n.y + (b.dy == null ? -70 : b.dy)}px;font-size:24px;padding:10px 18px">${b.text}</div>`; }).join('');
    /* chipRow: {x, y, gap?} lays the chips out in one flex row with an even gap, so their spacing never depends on
       guessed text widths (hand-placed x values left uneven gaps on deno-is-dying s13). Without it each chip keeps its x/y. */
    const cr = d.chipRow;
    const chipEls = (d.chips || []).map((k, i) => {
      const h = chip({ id: p + 'k' + (i + 1), x: cr ? 0 : k.x, y: cr ? 0 : k.y, text: k.text, cls: k.cls || 'o', icon: k.icon, brand: k.brand });
      return cr ? h.replace('position:absolute;', 'position:relative;') : h;
    }).join('');
    const chips = cr ? `<div class="wr-crow" style="position:absolute;left:${cr.x || 0}px;top:${cr.y}px;display:flex;gap:${cr.gap || 22}px">${chipEls}</div>` : chipEls;
    return `${heading(p, d)}<div class="content"><div class="rel">${edges}${nodes}${ghosts}${badges}${chips}${castBlock(p, d.cast, d.bubbles)}
      ${subHtml(p, d.sub, d.subY || 740, W)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    const ids = Object.keys(d.nodes);
    const nP = {}, nS = {};
    ids.forEach((id, i) => {
      const n = d.nodes[id], r = n.at === 'pre' ? { p: 1, s: -9 } : B.at('n' + id, .08 + i * .08, .18 + i * .08, 'pop');
      nP[id] = r.p; nS[id] = r.s; pp(p + 'n' + id, r.p, .8);
      // the header label types itself in as the node lands, ~28 characters a second (a pre node is already typed)
      const len = String(n.tag).length, q = n.at === 'pre' ? 1 : B.on ? seg(c.local, r.s + .12, r.s + .12 + len / 28) : seg(t, r.fa, r.fb + .05);
      st(p + 'n' + id + 'tt', { width: Math.ceil(len * q) + 'ch' });
    });
    /* camera: the canvas leans a little toward whatever just landed (zoom 1.035 about that node, a small pan toward
       it), easing 0.9s from one focus to the next, so the picture moves with the narration instead of sitting still.
       It transforms .rel, whose children vcenter measures by offset, so centring is untouched. */
    if (B.on) {
      const evs = ids.filter(id => d.nodes[id].at !== 'pre' && nS[id] > 0).map(id => ({ s: nS[id], id })).sort((a, b) => a.s - b.s);
      const ctr = id => { const b = wireBox(d.nodes[id]); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; };
      let F = null, z = 1;
      evs.forEach(ev => {
        const q = eio(seg(c.local, ev.s, ev.s + .9)); if (q <= 0) return;
        const T = ctr(ev.id);
        F = F ? { x: lerp(F.x, T.x, q), y: lerp(F.y, T.y, q) } : T; z = lerp(z, 1.035, q);
      });
      const rel = el(p + 'n' + ids[0]) && el(p + 'n' + ids[0]).parentElement;
      // under vfit's scale (core/registry.js, vertical decks), which this transform would otherwise replace
      const vk = rel && rel.dataset.vk ? `scale(${rel.dataset.vk}) ` : '';
      if (rel && F) { rel.style.transformOrigin = '0 0'; rel.style.transform = `${vk}translate(${(F.x * (1 - z)).toFixed(2)}px,${(F.y * (1 - z)).toFixed(2)}px) scale(${z.toFixed(4)})`; }
    }
    const eRec = (d.edges || []).map((e, i) => e.pre ? { p: 1, e: -9 } : B.at('e' + (i + 1), .4 + i * .06, .5 + i * .06, 'draw'));
    const eP = eRec.map(r => r.p);
    /* node life: the status light in the tag switches on as the node lands; a node flashes an ack ring when a line
       reaches it; the protocol hub breathes. All CSS variables, so the hub's own glow and the ack share one shadow. */
    ids.forEach(id => {
      const n = d.nodes[id], e = el(p + 'n' + id); if (!e) return;
      e.style.setProperty('--lit', cl((nP[id] - .6) / .4, 0, 1).toFixed(3));
      let ack = 0;
      (d.edges || []).forEach((ed, i) => { if (ed.b === id && !ed.pre && eRec[i].e > 0) { const q = seg(c.local, eRec[i].e, eRec[i].e + .6); if (q > 0 && q < 1) ack = Math.max(ack, Math.sin(q * Math.PI)); } });
      e.style.setProperty('--ack', ack.toFixed(3));
      if (n.cls === 'hub') e.style.setProperty('--glow', nP[id] >= 1 ? (.5 + .5 * Math.sin((c.local || 0) * Math.PI * 2 / 2.6)).toFixed(3) : '0');
    });
    (d.edges || []).forEach((e, i) => {
      const n = i + 1, pr = eP[i];
      draw(p + 'e' + n, pr); fd(p + 'e' + n + 'l', seg(pr, .6, 1)); pp(p + 'e' + n + 'q', seg(pr, .5, 1), .5);
      if (!e.flow) return;
      const path = el(p + 'e' + n) && el(p + 'e' + n).querySelector('path'); if (!path) return;
      const L = path.getTotalLength(), on = pr >= 1;
      // while the line draws, packet a rides its tip (the request travelling); once drawn, two packets loop
      if (!on) {
        const pt = path.getPointAtLength(L * cl(pr, 0, 1));
        st(p + 'pk' + n + 'a', { opacity: pr > 0 ? 1 : 0, transform: `translate(${(pt.x - 8).toFixed(1)}px,${(pt.y - 8).toFixed(1)}px) scale(1.25)` });
        st(p + 'pk' + n + 'b', { opacity: 0 });
        return;
      }
      ['a', 'b'].forEach((k, j) => {
        const ph = ((c.local || 0) / 1.4 + j * .5) % 1, pt = path.getPointAtLength(L * ph);
        st(p + 'pk' + n + k, { opacity: (Math.sin(ph * Math.PI) * .95).toFixed(3), transform: `translate(${(pt.x - 8).toFixed(1)}px,${(pt.y - 8).toFixed(1)}px)` });
      });
    });
    // ghosts are on screen as the line starts (they are the idea being rejected); the strike lands on its word
    (d.ghosts || []).forEach((g, i) => {
      const r = B.at('x' + (i + 1), .4 + i * .1, .5 + i * .1, 'draw');
      up(p + 'x' + (i + 1), B.on ? seg(c.local, r.s - 1.1, r.s - .7) : seg(t, r.fa - .1, r.fa), 20);
      st(p + 'x' + (i + 1) + 's', { transform: 'scaleX(' + eo(r.p).toFixed(3) + ')' });
      if (B.on) { const j = seg(c.local, r.e - .05, r.e + .35); if (j > 0 && j < 1) st(p + 'x' + (i + 1), { transform: `translateX(${(Math.sin(j * Math.PI * 5) * 9 * (1 - j)).toFixed(2)}px) rotate(${(Math.sin(j * Math.PI * 4) * 1.2 * (1 - j)).toFixed(2)}deg)` }); }
      if (r.p >= 1) dim(p + 'x' + (i + 1), seg(c.local, r.e, r.e + .3), .45);
    });
    B.group('bd', (d.badges || []).length, { a: .6, step: .06, len: .1, kind: 'pop', dim: false }).forEach((r, i) => pp(p + 'bd' + (i + 1), r.p, .7));
    B.group('k', (d.chips || []).length, { a: .7, step: .05, len: .08, kind: 'pop', dim: false }).forEach((r, i) => pp(p + 'k' + (i + 1), r.p, .7));
    castPlay(B, c, p, d.cast, d.bubbles);
    up(p + 'sub', B.p('sub', .9, .98));
    footIn(B, p); holdLife(B, p, d, { alias: Object.assign({ badge: 'bd' }, ...ids.map(id => ({ ['n' + id]: 'n' + id }))) });
  }
});
