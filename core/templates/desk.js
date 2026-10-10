/* desk: the workspace scene this whole deck is built on (projects/ai-context-window).
   The script never leaves one image — a desk, a notebook on it, pages that bury it — so this is not a diagram that
   gets redrawn per slide but one object in a fixed place that 16 slides put into different states. Everything is
   authored against the content box, so the headline column keeps the left third and the desk owns the right.

   data: {eyebrow, accent, h1, h1size?, foot?, sub?,
     desk: {
       w?: 'half' | 'full' | 'wide',   // resting width of the surface; `wide` also enables the `wide` beat (it grows)
       edges?: bool,                   // the two ends of the desk, which is what "that desk has a limit" means
       measure?: string,               // a dimension line across the surface with this label
       label?: string, label2?: string,// the mono caption under the front edge (label2 replaces it on the `label` beat)
       strike?: bool,                  // cross the caption out (the "not infinite" slides)
       notebook?: {title, pages: [{b}]},
       reach?: bool,                   // the dashed radius: on the desk means within reach
       pile?: number,                  // loose pages covering the surface (the burial)
       sweep?: bool,                   // a search band crossing the pile
       hit?: bool,                     // the one line it is looking for, lit late and small
       sticky?: string,                // one fact placed on the desk
       counter?: {from, to, fmt?},     // a big number on the desk edge
       tick?: bool,
       who?: {src, label?},            // the recurring figure, sat at the near-left corner of the desk
       marks?: {items: [{icon, brand?, label}]},   // a row of real product marks under the desk
     }}
   beats: desk wide edge measure label nb p1..pn reach glow pile sweep hit sticky counter tick strike who marks em foot

   The pile is deterministic on purpose (a hashed pseudo-random, not Math.random): frame() has to be a pure
   function of its arguments or two captures of the same frame disagree, and a re-render a week later has to
   produce the same video. */
/* The surface has to be tall enough to hold the five-row notebook with a margin: a 300px plane under a 382px
   notebook had the paper hanging off the front edge, which read as a bug rather than as a desk. 400 is the
   five-row height (52 + 5*60 + 16 = 368) plus 16px of desk showing above and below. */
const DK = { y: 130, h: 400, front: 18, W: { half: 620, full: 900, wide: 1090 } };
/* stable pseudo-random in [0,1) from an integer — the scatter of the pile has to be identical on every render */
const dkR = (i, s) => { const v = Math.sin((i + 1) * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); };

defineTemplate('desk', {
  check: d => req(d, ['eyebrow', 'h1', 'desk'], 'desk'),
  beats: d => baseBeats(d).concat(['desk', 'wide', 'edge', 'measure', 'label', 'nb', 'reach', 'glow', 'pile',
    'sweep', 'hit', 'sticky', 'counter', 'tick', 'strike', 'who', 'marks', 'sub'],
    seqN('p', ((d.desk.notebook || {}).pages || []).length)),
  html: (d, c) => {
    const p = c.p, G = c.grid, k = d.desk;
    const w0 = DK.W[k.w || 'full'], x0 = Math.round((G.cw - w0) / 2);
    const nb = k.notebook, pages = (nb && nb.pages) || [];
    /* the notebook is sized to its rows so a five-page list and a bare cover both sit centred on the surface */
    const nbH = nb ? 52 + pages.length * 60 + 16 : 0, nbW = 486;
    const nbX = Math.round(x0 + w0 / 2 - nbW / 2), nbY = DK.y + Math.round((DK.h - nbH) / 2);
    const pile = k.pile ? Array.from({ length: k.pile }, (_, i) => {
      const pw = 84 + Math.round(dkR(i, 1) * 96), ph = 54 + Math.round(dkR(i, 2) * 40);
      const px = Math.round(x0 - 20 + dkR(i, 3) * (w0 - pw + 40));
      const py = Math.round(DK.y - 34 + dkR(i, 4) * (DK.h - ph + 52));
      const rot = (dkR(i, 5) * 34 - 17).toFixed(1);
      return `<div class="dk-pg${i === k.pile - 1 ? ' line' : ''}" id="${p}pg${i + 1}" style="left:${px}px;top:${py}px;width:${pw}px;height:${ph}px;--rot:${rot}deg"></div>`;
    }).join('') : '';
    /* The figure sits at the near-left corner, straddling the front edge, which is what "at a desk" looks like.
       x0 + 24 clears the notebook (which is centred on the surface) at every authored width. */
    const who = k.who ? avatar({ id: p + 'who', x: x0 + 24, y: DK.y + DK.h - 56, size: 132, src: k.who.src, label: k.who.label }) : '';
    /* Marks go UNDER the desk, at .sm, because the row has to clear the 870 safe line: at .lg the captions ran
       to y 876 on the horizontal canvas. 36px below the front edge is the gap the rest of the deck uses. */
    const mi = (k.marks && k.marks.items) || [], mkW = 168, mkX = fRow(mi.length, mkW, 26, G.cw);
    const marks = mi.length ? `<div class="dk-marks" id="${p}marks" style="left:0;top:${DK.y + DK.h + 36}px;width:${G.cw}px;height:132px">`
      + mi.map((m, i) => logoStack({ id: p + 'mk' + (i + 1), x: mkX(i), y: 0, icon: m.icon, brand: m.brand, src: m.src, label: m.label || '', size: 'sm', w: mkW })).join('')
      + `</div>` : '';
    return `${heading(p, d)}<div class="content"><div class="rel">
      <div class="dk-surf" id="${p}desk" style="left:${x0}px;top:${DK.y}px;width:${w0}px;height:${DK.h}px">
        <div class="dk-plane"></div><div class="dk-front" style="top:${DK.h}px"></div>
      </div>
      ${k.edges ? `<div class="dk-edge" id="${p}edgeL" style="left:${x0 - 5}px;top:${DK.y - 26}px;height:${DK.h + DK.front + 52}px"></div>
        <div class="dk-edge" id="${p}edgeR" style="left:${x0 + w0}px;top:${DK.y - 26}px;height:${DK.h + DK.front + 52}px"></div>` : ''}
      ${k.measure ? `<div class="dk-meas" id="${p}measure" style="left:${x0}px;top:${DK.y - 54}px;width:${w0}px"><i></i><i class="r"></i></div>
        <div class="dlab on" id="${p}measurel" style="left:${x0}px;top:${DK.y - 96}px;width:${w0}px;text-align:center">${k.measure}</div>` : ''}
      ${nb ? `<div class="dk-note" id="${p}nb" style="left:${nbX}px;top:${nbY}px;width:${nbW}px;height:${nbH}px">
        <span class="nh">${nb.title || 'Notebook'}</span>
        ${pages.map((pg, i) => `<div class="dk-page" id="${p}p${i + 1}" style="top:${52 + i * 60}px;width:${nbW - 36}px"><b>${pg.b}</b></div>`).join('')}
      </div>` : ''}
      ${k.reach ? `<div class="dk-reach" id="${p}reach" style="left:${nbX - 120}px;top:${nbY - 74}px;width:${nbW + 240}px;height:${nbH + 148}px"></div>` : ''}
      ${pile}
      ${k.sweep ? `<div class="dk-sweep" id="${p}sweep" style="left:${x0}px;top:${DK.y - 40}px;height:${DK.h + 76}px"></div>` : ''}
      ${k.hit ? `<div class="dk-hit" id="${p}hit" style="left:${x0 + Math.round(w0 * .58)}px;top:${DK.y + Math.round(DK.h * .46)}px;width:126px"></div>` : ''}
      ${k.sticky ? `<div class="dk-sticky" id="${p}sticky" style="left:${x0 + Math.round(w0 / 2) - 130}px;top:${DK.y + 78}px;width:260px;height:150px">${k.sticky}</div>` : ''}
      ${k.counter ? `<div class="dk-num" id="${p}counter" style="left:${x0}px;top:${DK.y + DK.h + 44}px;width:${w0}px;text-align:center">0</div>` : ''}
      ${k.tick ? `<div class="dk-tick" id="${p}tick" style="left:${x0 + w0 - 116}px;top:${DK.y - 96}px"><svg viewBox="0 0 24 24"><path d="m4 12.5 5.2 5.2L20 6.6"/></svg></div>` : ''}
      ${k.label ? `<div class="dlab on" id="${p}label" style="left:${x0}px;top:${DK.y + DK.h + (k.counter ? 158 : 44)}px;width:${w0}px;text-align:center">${k.label}</div>` : ''}
      ${who}${marks}
      ${k.strike ? `<svg class="strike" id="${p}st" style="left:0;top:0;width:0;height:0" viewBox="0 0 1 1"></svg>` : ''}
      ${subHtml(p, d.sub, DK.y + DK.h + 96, G.cw)}</div></div>`;
  },
  place: (d, c) => { if (d.desk.strike) d._struck = strikeText(c.p + 'st', c.p + 'label') && document.fonts.status === 'loaded'; },
  setup: (root, d, c) => { TEMPLATES.desk.place(d, c); },
  frame: (u, c) => {
    const p = c.p, d = c.data, k = d.desk, G = c.grid, B = beats(c);
    const mkN = ((k.marks || {}).items || []).length;
    if (k.strike && !d._struck) TEMPLATES.desk.place(d, c);
    headIn(B, p);
    /* the surface: it is placed, not faded — it rises the last 30px and settles */
    up(p + 'desk', B.p('desk', .04, .20), 30);
    /* `wide` grows the surface from its resting width; the ends and the caption ride along so nothing detaches */
    const w0 = DK.W[k.w || 'full'], grow = k.w === 'wide' ? eo(B.p('wide', .30, .48)) : 0;
    const wNow = Math.round(lerp(w0 * .58, w0, k.w === 'wide' ? grow : 1));
    const xNow = Math.round((G.cw - wNow) / 2);
    if (k.w === 'wide') {
      st(p + 'desk', { left: xNow + 'px', width: wNow + 'px' });
      st(p + 'edgeL', { left: (xNow - 5) + 'px' }); st(p + 'edgeR', { left: (xNow + wNow) + 'px' });
    }
    if (k.edges) { const e = B.p('edge', .24, .40); fd(p + 'edgeL', e); fd(p + 'edgeR', e); }
    if (k.measure) { const m = B.p('measure', .30, .44, 'draw'); fd(p + 'measure', m); up(p + 'measurel', m, 14); }
    /* the notebook and its pages: container on the phrase, one page per spoken item */
    up(p + 'nb', B.p('nb', .20, .38), 40);
    const pages = ((k.notebook || {}).pages || []).length;
    const pg = B.group('p', pages, { a: .34, step: .07, len: .13, kind: 'enter', dim: true });
    pg.forEach((r, i) => { sx(p + 'p' + (i + 1), r.p, -26); dim(p + 'p' + (i + 1), r.dim); });
    /* "as long as those notes are on your desk you can look at them": the radius, then the pages light inside it */
    if (k.reach) { const r = B.p('reach', .40, .56); pp(p + 'reach', r, .86); }
    if (k.reach) { const g = B.p('glow', .58, .72, 'pop'); pg.forEach((_, i) => cls(p + 'p' + (i + 1), 'hot', g > .5)); }
    /* the burial: pages land one after another across the beat, each landing where it will stay */
    if (k.pile) {
      const a = B.at('pile', .26, .70, 'bar');
      for (let i = 0; i < k.pile; i++) {
        const q = seg(a.p, i / k.pile * .82, i / k.pile * .82 + .18), e = bk(q);
        st(p + 'pg' + (i + 1), { opacity: cl(q * 2.4, 0, 1).toFixed(3),
          transform: 'translateY(' + ((1 - e) * -46).toFixed(1) + 'px) rotate(var(--rot)) scale(' + (.88 + .12 * e).toFixed(3) + ')' });
      }
    }
    /* the search band crosses the pile and keeps crossing during the hold: this slide is about not finding things */
    if (k.sweep) {
      const s = B.at('sweep', .50, .66), live = s.p > 0 ? 1 : 0;
      const t = c.hold > 0 ? ((c.local - s.s) / 2.6) % 1 : cl((c.local - s.s) / 2.6, 0, 1);
      fd(p + 'sweep', live * cl(s.p * 2, 0, 1));
      st(p + 'sweep', { transform: 'translateX(' + ((wNow - 150) * eio(cl(t, 0, 1))).toFixed(1) + 'px)' });
    }
    if (k.hit) { const h = B.p('hit', .74, .86, 'pop'); pp(p + 'hit', h, .3); }
    if (k.sticky) up(p + 'sticky', B.p('sticky', .40, .58), 36);
    if (k.who) pp(p + 'who', B.p('who', .18, .36, 'pop'), .72);
    /* the marks land left to right inside one beat, the same internal stagger the pile uses */
    if (mkN) {
      const a = B.at('marks', .44, .70, 'bar');
      for (let i = 0; i < mkN; i++) pp(p + 'mk' + (i + 1), seg(a.p, (i / mkN) * .62, (i / mkN) * .62 + .38), .72);
    }
    if (k.counter) { const t = B.at('counter', .46, .62, 'tick'); tick(p + 'counter', t.p, k.counter.from, k.counter.to, k.counter.fmt ? new Function('v', 'return ' + k.counter.fmt) : undefined); fd(p + 'counter', cl(t.p * 4, 0, 1)); }
    if (k.tick) pp(p + 'tick', B.p('tick', .56, .70, 'pop'), .5);
    /* the caption: label2 replaces label on the beat, which is how "your desk" becomes "context" */
    let lrec = null;
    if (k.label) {
      lrec = B.at('label', .56, .70);
      up(p + 'label', cl(lrec.p * 2.4, 0, 1), 16);
      if (k.label2) txt(p + 'label', lrec.p > .5 ? k.label2 : k.label);
    }
    /* The stroke chains off the caption it crosses out, never off the clock. It was possible for the strike's
       own beat to resolve before the caption had finished arriving, so the frame showed a rule being drawn
       through text that was still fading up — the crossing-out landed before there was anything to cross out.
       Chaining guarantees the words are readable first, whatever the cue sheet asks for. */
    draw(p + 'st', B.p('strike', .74, .86, 'draw', lrec ? { after: lrec, delay: .38 } : {}));
    up(p + 'sub', B.p('sub', .80, .92));
    footIn(B, p); holdLife(B, p, d, { alias: { desk: 'desk', edge: 'edgeR', nb: 'nb', pile: 'pg' + k.pile, sweep: 'sweep', label: 'label' } });
  }
});
