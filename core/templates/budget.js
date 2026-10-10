/* budget: the context window as a measured allowance that runs out (projects/ai-context-window).
   Three slides share this one bar and it has to be the SAME bar across all three, because the argument is
   cumulative: five things fill it, a sixth joins them, and then it meets a wall. So the geometry is a module
   constant rather than per-slide data, and a slide only says which segments exist and whether the ceiling is
   armed. Segment widths are given in arbitrary units and normalised, so the copy can change without arithmetic.

   data: {eyebrow, accent, h1, h1size?, foot?, sub?,
     budget: {
       segs: [{b, v, c}],              // label, weight, accent letter (t v g r a b o); the label hangs under the bar
       cap?: bool,                     // the ceiling rule at the right end
       capLabel?: string,
       full?: bool,                    // the segments fill the whole track from the start
       grow?: bool,                    // the segments RUN OUT on the `grow` beat: they scale from the resting
                                       // 82% span to the full track, so the bar meets the ceiling on camera
                                       // instead of a second slide re-authoring the same bar wider
       evict?: bool,                   // the oldest segment slides out to the left on the `evict` beat
       label?: string,
     }}
   beats: bar s1..sn cap hit evict label em foot sub

   `full` is what makes slide 14 work: the same six segments, but scaled so the last one ends exactly at the
   ceiling. Without it the bar would have to be re-authored with different weights and would stop being the
   same object the viewer has been watching. */
/* The bar is the slide, so it takes the content box's full width and enough height for its segment labels to
   be read at phone size. A 132px bar at 1040 wide left the frame two-thirds empty. */
const BG = { x: 10, y: 250, w: 1100, h: 176 };

defineTemplate('budget', {
  check: d => req(d, ['eyebrow', 'h1', 'budget'], 'budget'),
  beats: d => baseBeats(d).concat(['bar', 'cap', 'grow', 'hit', 'evict', 'label', 'sub'], seqN('s', (d.budget.segs || []).length)),
  html: (d, c) => {
    const p = c.p, G = c.grid, k = d.budget, segs = k.segs || [];
    const tot = segs.reduce((n, s) => n + (s.v || 1), 0);
    /* `full` uses the whole track; otherwise the bar stops short so there is visible headroom left to eat */
    const span = (k.full && !k.grow) ? BG.w : Math.round(BG.w * .82);
    const VAR = { t: 'teal', v: 'violet', g: 'green', r: 'rose', a: 'amber', b: 'blue', o: 'orange' };
    /* The labels do not go inside the segments. "System instructions" is 299px of text and its segment is 112px
       wide, so every narrow band clipped its own name. They hang under the bar instead, on two staggered rows
       joined to their segment by a tick, which is the only arrangement where five adjacent labels of different
       lengths never collide with each other. */
    let x = 0; const cells = [], legend = [];
    segs.forEach((s, i) => {
      const w = Math.round(span * (s.v || 1) / tot), left = x; x += w;
      cells.push(`<div class="bg-seg" id="${p}s${i + 1}" style="left:${left}px;width:${w}px;background:var(--${VAR[s.c || 'a']})"></div>`);
      const row = i % 2, ly = BG.h + 26 + row * 58;
      /* The last band's name ran off the right of the frame ("Generated outp"). A label whose left edge sits in
         the final third is right-aligned to the bar instead, so it grows inwards; its tick stays on its own
         band. Everything still reads left to right because the tick, not the text box, marks the segment. */
      const near = left > BG.w * .62;
      const pos = near ? `right:${Math.max(0, BG.w - (left + w))}px` : `left:${left + 4}px`;
      legend.push(`<div class="bg-leg${near ? ' r' : ''}" id="${p}lg${i + 1}" style="${pos};top:${ly}px;--acc:var(--${VAR[s.c || 'a']})">
        <i style="height:${26 + row * 58}px;top:${-(26 + row * 58)}px"></i><b>${s.b}</b></div>`);
    });
    return `${heading(p, d)}<div class="content"><div class="rel">
      <div class="bg-track" id="${p}bar" style="left:${BG.x}px;top:${BG.y}px;width:${BG.w}px;height:${BG.h}px">${cells.join('')}</div>
      <div class="bg-legs" style="left:${BG.x}px;top:${BG.y}px;width:${BG.w}px">${legend.join('')}</div>
      ${k.cap ? `<div class="bg-cap" id="${p}cap" style="left:${BG.x + BG.w}px;top:${BG.y - 30}px;height:${BG.h + 60}px"></div>
        <div class="bg-caplab" id="${p}capl" style="left:${BG.x + BG.w - 320}px;top:${BG.y - 76}px;width:320px;text-align:right">${k.capLabel || 'The limit'}</div>
        <div class="bg-flash" id="${p}hit" style="left:${BG.x}px;top:${BG.y}px;width:${BG.w}px;height:${BG.h}px"></div>` : ''}
      ${k.label ? `<div class="dlab on" id="${p}label" style="left:${BG.x}px;top:${BG.y + BG.h + 158}px;width:${BG.w}px;text-align:center">${k.label}</div>` : ''}
      ${subHtml(p, d.sub, BG.y + BG.h + 216, G.cw)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, k = d.budget, B = beats(c);
    headIn(B, p);
    up(p + 'bar', B.p('bar', .04, .18), 24);
    /* the whole band stack stretches into the ceiling on `grow`; the labels ride it so nothing detaches */
    const span = (k.full && !k.grow) ? BG.w : Math.round(BG.w * .82);
    const gp = k.grow ? eo(B.p('grow', .58, .78, 'bar')) : 0;
    const kx = k.grow ? lerp(1, BG.w / span, gp) : 1;
    /* each segment grows out of its own left edge on the word that names it: the bar fills as the list is read */
    const n = (k.segs || []).length;
    const sg = B.group('s', n, { a: .22, step: .09, len: .14, kind: 'bar', dim: true });
    sg.forEach((r, i) => {
      const e = eo(r.p);
      /* transform-origin is the track's left edge for the stretch, each band's own left edge for its entrance,
         so one scaleX cannot do both: the stretch is applied as a translate plus a width scale on the band. */
      const segEl = el(p + 's' + (i + 1));
      if (segEl && k.grow) {
        const x0 = parseFloat(segEl.dataset.x0 || (segEl.dataset.x0 = String(parseFloat(segEl.style.left) || 0)));
        segEl.style.left = (x0 * kx).toFixed(2) + 'px';
        const w0 = parseFloat(segEl.dataset.w0 || (segEl.dataset.w0 = String(parseFloat(segEl.style.width) || 0)));
        segEl.style.width = (w0 * kx).toFixed(2) + 'px';
      }
      st(p + 's' + (i + 1), { opacity: cl(r.p * 3, 0, 1).toFixed(3), transform: 'scaleX(' + e.toFixed(4) + ')' });
      dim(p + 's' + (i + 1), r.dim);
      const lgEl = el(p + 'lg' + (i + 1));
      if (lgEl && k.grow && !lgEl.classList.contains('r')) {
        const lx0 = parseFloat(lgEl.dataset.x0 || (lgEl.dataset.x0 = String(parseFloat(lgEl.style.left) || 0)));
        lgEl.style.left = (lx0 * kx).toFixed(2) + 'px';
      }
      up(p + 'lg' + (i + 1), seg(r.p, .35, 1), 12);          // the name arrives just behind its own band
      dim(p + 'lg' + (i + 1), r.dim);
    });
    /* the ceiling is drawn before the bar reaches it, so the collision is something the viewer sees coming */
    if (k.cap) {
      const cp = B.p('cap', .56, .70);
      fd(p + 'cap', cp); up(p + 'capl', cp, 12);
      /* the flash is a single pulse on the hit beat, not a loop: the point is the moment of contact */
      const h = B.at('hit', .74, .86, 'pop');
      st(p + 'hit', { opacity: (pulse(h.p) * .32).toFixed(3) });
      /* and the whole bar nudges left as it runs into the wall */
      st(p + 'bar', { left: (BG.x - pulse(h.p) * 7).toFixed(1) + 'px' });
    }
    /* eviction: the oldest segment leaves to the left and the rest slide up to close the gap */
    if (k.evict && n) {
      const ev = eo(B.p('evict', .80, .94));
      const w0 = parseFloat((el(p + 's1') || {}).style ? el(p + 's1').style.width : '0') || 0;
      st(p + 's1', { opacity: String((1 - ev) * cl(sg[0].p * 3, 0, 1)), transform: 'translateX(' + (-ev * (w0 + 40)).toFixed(1) + 'px) scaleX(' + eo(sg[0].p).toFixed(4) + ')' });
      for (let i = 1; i < n; i++) st(p + 's' + (i + 1), Object.assign({}, { transform: 'translateX(' + (-ev * w0).toFixed(1) + 'px) scaleX(' + eo(sg[i].p).toFixed(4) + ')' }));
    }
    up(p + 'label', B.p('label', .82, .92), 16);
    up(p + 'sub', B.p('sub', .86, .96));
    footIn(B, p); holdLife(B, p, d, { alias: { bar: 'bar', cap: 'cap', grow: 'bar', hit: 'bar', evict: 's1', label: 'label' } });
  }
});
