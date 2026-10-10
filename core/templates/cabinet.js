/* cabinet: memory, as the thing standing next to the desk (projects/ai-context-window).
   Context is the notebook on the desk; memory is the filing cabinet beside it. The two have to share a frame for
   the distinction to land, so this template draws the same desk the `desk` template does, in the same place, and
   puts the cabinet to its right. A note can travel between them along a drawn arc, which is what "store it
   somewhere and retrieve it later" means.

   data: {eyebrow, accent, h1, h1size?, foot?, sub?,
     cab: {
       desk?: bool,                    // the desk on the left (on by default: the point is the pair)
       open?: bool,                    // the top drawer slides out on the `drawer` beat
       folders?: [{b}],                // what is filed in it, up to five
       note?: string,                  // a note that starts on the desk
       arc?: 'store' | 'both',         // store = desk -> drawer; both = out again as well
       label?: string,
     }}
   beats: cab drawer f1..fn note store fetch label em foot sub

   The drawer geometry is the fiddly part: a drawer that slides out has to stay inside the content box and the
   folders have to stand IN the open drawer, not float over the cabinet, so the folder row is positioned from the
   drawer's own travelled offset rather than from the cabinet. */
/* The cabinet was 404px wide and the four folder labels ("Company information") clipped at 68px of usable
   width. Widening the body to 560 and letting a label wrap to two lines at 18px is what makes the names
   readable; the desk shrinks to match, because on these slides the desk is the reference object, not the
   subject. */
const CB = { dx: 6, dy: 320, dw: 372, dh: 236,               // the desk, kept smaller: the cabinet is the subject here
  cx: 400, cy: 122, cw: 640, ch: 496,                        // the cabinet body
  /* 122px folders could not hold "Company information" on two lines, so the labels broke mid-word. The body is
     wider and the folders are 138, which fits the longest word in the set ("conversations", ~99px at 16px) with
     room to spare. pull is 70 because the folders are children of the drawer and travel with it: at 96 the
     fourth one crossed the 1862 safe edge. */
  /* folderH 136 in a 162px drawer seated at -8 puts the folder at 18..154, so it sits INSIDE the drawer with
     its tab proud of the lip, the way an open drawer actually looks. At +16 it hung 16px below the bottom. */
  drawerH: 162, pull: 70, folderW: 138, folderH: 136 };

defineTemplate('cabinet', {
  check: d => req(d, ['eyebrow', 'h1', 'cab'], 'cabinet'),
  beats: d => baseBeats(d).concat(['desk', 'cab', 'drawer', 'note', 'store', 'fetch', 'label', 'sub'],
    seqN('f', (d.cab.folders || []).length)),
  html: (d, c) => {
    const p = c.p, G = c.grid, k = d.cab, showDesk = k.desk !== false;
    const fol = (k.folders || []).slice(0, 5);
    /* the folders stand in the top drawer, spread across its inner width */
    const gap = fol.length > 1 ? Math.round((CB.cw - 56 - fol.length * CB.folderW) / (fol.length - 1)) : 0;
    const folders = fol.map((f, i) => `<div class="cb-folder" id="${p}f${i + 1}" style="left:${28 + i * (CB.folderW + Math.max(gap, 10))}px;top:${CB.drawerH - CB.folderH - 8}px;width:${CB.folderW}px;height:${CB.folderH}px"><b>${f.b}</b></div>`).join('');
    /* three drawers; the top one is the one that opens and is the only one that carries folders */
    const drawers = [0, 1, 2].map(i => `<div class="cb-drawer${i === 0 && k.open ? ' open' : ''}" id="${p}dr${i + 1}" style="top:${18 + i * (CB.drawerH + 14)}px;width:${CB.cw - 28}px;height:${CB.drawerH}px">${i === 0 ? `<div class="hdl"></div>${folders}` : '<div class="hdl"></div>'}</div>`).join('');
    /* the arc from the middle of the desk into the open drawer, drawn as a dashed path so it reads as a route */
    /* The store arc used to end at the cabinet's CENTRE, which put its arrowhead underneath the cabinet body —
       the body is painted after the arcs, so the head was drawn and then covered, and the pair still read as
       undirected. It now stops just short of the open drawer's left face (the drawer pulls left by CB.pull), so
       the head lands in open background pointing INTO the drawer. The return arc already ended at the desk, in
       the clear, which is why only one of the two ever looked right. */
    const ax = CB.dx + CB.dw / 2, ay = CB.dy + 30, bx = CB.cx + CB.cw / 2, by = CB.cy + CB.drawerH / 2;
    const sx2 = CB.cx - CB.pull - 16, sy2 = CB.cy + 18 + CB.drawerH / 2;
    /* Both arcs carry an arrowhead. Without one the pair read as two decorative curves and the direction of
       travel — out to the cabinet, then back to the desk — was only inferable from the animation, which is no
       use on a paused frame or a thumbnail. The head is attached in frame() once the stroke has arrived
       (arrowAt), so it does not sit waiting at the destination while the line is still on its way. */
    const arc = k.arc ? `<svg class="cb-arc" id="${p}arc" style="left:0;top:0;width:${G.cw}px;height:${G.ch}px" viewBox="0 0 ${G.cw} ${G.ch}"><defs>${arrowMarker(p + 'ah', { size: 17 })}</defs><path d="M${ax} ${ay} Q${ax + 46} ${ay - 232} ${sx2} ${sy2}"/></svg>` : '';
    const arc2 = k.arc === 'both' ? `<svg class="cb-arc" id="${p}arc2" style="left:0;top:0;width:${G.cw}px;height:${G.ch}px" viewBox="0 0 ${G.cw} ${G.ch}"><defs>${arrowMarker(p + 'ah2', { size: 17 })}</defs><path d="M${bx} ${by + 40} Q${(ax + bx) / 2} ${ay + 250} ${ax} ${ay + 96}"/></svg>` : '';
    return `${heading(p, d)}<div class="content"><div class="rel">
      ${showDesk ? `<div class="dk-surf" id="${p}desk" style="left:${CB.dx}px;top:${CB.dy}px;width:${CB.dw}px;height:${CB.dh}px">
        <div class="dk-plane"></div><div class="dk-front" style="top:${CB.dh}px"></div></div>
        <div class="dlab" id="${p}dlab" style="left:${CB.dx}px;top:${CB.dy + CB.dh + 44}px;width:${CB.dw}px;text-align:center">Context</div>` : ''}
      ${k.note ? `<div class="dk-sticky" id="${p}note" style="left:${CB.dx + Math.round(CB.dw / 2) - 116}px;top:${CB.dy + 62}px;width:232px;height:134px">${k.note}</div>` : ''}
      ${arc}${arc2}
      <div class="cb-body" id="${p}cab" style="left:${CB.cx}px;top:${CB.cy}px;width:${CB.cw}px;height:${CB.ch}px">${drawers}</div>
      ${k.label ? `<div class="dlab on" id="${p}label" style="left:${CB.cx}px;top:${CB.cy + CB.ch + 44}px;width:${CB.cw}px;text-align:center">${k.label}</div>` : ''}
      ${subHtml(p, d.sub, CB.cy + CB.ch + 96, G.cw)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, k = d.cab, B = beats(c);
    headIn(B, p);
    if (k.desk !== false) { const dp = B.p('desk', .02, .18); up(p + 'desk', dp, 26); up(p + 'dlab', dp, 12); }
    /* the cabinet arrives from the right, the way a thing is wheeled into place */
    sx(p + 'cab', B.p('cab', .14, .32), 120);
    /* the drawer pulls out; the folders travel with it because they are its children */
    const dr = k.open ? eo(B.p('drawer', .34, .50)) : 0;
    st(p + 'dr1', { transform: 'translateX(' + (dr * CB.pull).toFixed(1) + 'px)' });
    const fg = B.group('f', (k.folders || []).length, { a: .46, step: .07, len: .13, kind: 'enter', dim: true });
    fg.forEach((r, i) => { up(p + 'f' + (i + 1), r.p, -34); dim(p + 'f' + (i + 1), r.dim); });
    /* store: the note leaves the desk along the arc and drops into the drawer. fetch: it comes back out. */
    const stp = k.arc ? eo(B.p('store', .52, .70)) : 0;
    const ftp = k.arc === 'both' ? eo(B.p('fetch', .74, .90)) : 0;
    if (k.note) {
      const gone = cl(stp * 1.6 - ftp * 1.6, 0, 1);
      up(p + 'note', B.p('note', .22, .38), 28);
      st(p + 'note', { opacity: String((1 - gone) * cl(B.p('note', .22, .38) * 2, 0, 1)),
        transform: 'translate(' + (stp * 300).toFixed(1) + 'px,' + (stp * -110 + ftp * 140).toFixed(1) + 'px) scale(' + (1 - .3 * stp).toFixed(3) + ')' });
    }
    const aq = k.arc ? B.p('store', .52, .70, 'draw') : 0, aq2 = k.arc === 'both' ? B.p('fetch', .74, .90, 'draw') : 0;
    draw(p + 'arc', aq); arrowAt(p + 'arc', p + 'ah', aq);
    draw(p + 'arc2', aq2); arrowAt(p + 'arc2', p + 'ah2', aq2);
    up(p + 'label', B.p('label', .76, .88), 16);
    up(p + 'sub', B.p('sub', .82, .94));
    footIn(B, p); holdLife(B, p, d, { alias: { cab: 'cab', drawer: 'dr1', note: 'note', store: 'cab', fetch: 'note', label: 'label' } });
  }
});
