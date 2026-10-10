/* Helpers shared by templates. Every template prefixes ids with ctx.p and sizes to ctx.grid.
   Timing has two modes (both pure functions of (u, ctx)):
   - fraction mode: no beats on the slide → every entrance is a fixed fraction of the motion window (ENTER.* / seg(t, a, b)), as before;
   - beat mode: ctx.beats holds slide-relative seconds resolved from the spoken words (cue-sheet Beats column) → an element
     with a beat enters at that second (BEAT.enter long), un-beated elements keep their fraction schedule but never start
     before the previous focal beat + BEAT.dwell, followers of a group trail by BEAT.stagger, earlier siblings dim when a
     later beat fires. u = 1 is the end pose in both modes (the layout extends `motion` past the last beat). */
const ENTER = { head: .02, first: .14, step: .06, len: .16, badge: .70, sub: .82, foot: .88 };
const BEAT = { enter: .40, pop: .30, bar: .60, draw: .50, tick: .80, stagger: .08, spread: .48, dwell: .90, settle: .20, dim: .30, dimTo: .5, ringPeriod: 2, sweepEvery: 6 };
const BEAT_ALIAS = { badge: 'bd', strike: 'st', counter: 'cnt', chart: 'ch', foot: 'ft', flow: 'con' };   // beat name → element id suffix when they differ
/* per-frame beat resolver: const B = beats(c) at the top of frame(). Templates call B.p()/B.group() in visual order. */
function beats(c) {
  const M = c.beats, on = !!(M && Object.keys(M).length);
  const base = Math.min(c.motion, c.dur || c.motion);                                   // the fraction schedule keeps the authored motion length
  const lim = Math.min(c.motion, (c.exit != null ? c.exit : c.screen) - BEAT.settle);   // every entrance finishes by here
  let focal = 0;                                                                        // start of the last focal beat (dwell chaining)
  /* → {p, s, e, fa, fb, beat}: p = progress 0..1 for the fx helper; s/e seconds; fa/fb the fraction window (fallback schedule) */
  function at(name, a, b, kind, o) {
    o = o || {}; const bt = M && M[name]; let len = o.len || BEAT[kind || 'enter'], s = null;
    if (bt) { s = bt.s; if (kind === 'tick') len = cl(bt.e - bt.s, .3, BEAT.tick); }
    else if (on && o.after) s = o.after.s + (o.delay != null ? o.delay : BEAT.stagger);
    else if (on && o.chain !== false) s = Math.max(a * base, focal + BEAT.dwell);
    if (s == null) return { p: seg(c.t, a, b), s: a * c.motion, e: b * c.motion, fa: a, fb: b, beat: false };   // fraction mode: unchanged behaviour
    // a beat past the slide's whole screen time never enters: a social cut puts a beat there when its line was cut
    // (renderer/socialcut.js cutTimeline); clamping it would land the element in the slide's last second
    if (bt && bt.s >= c.screen) return { p: 0, s: bt.s, e: bt.s + len, fa: a, fb: b, beat: true };
    s = cl(s, 0, Math.max(0, lim - len)); const e = s + len;
    if (bt && o.focal !== false) focal = Math.max(focal, s);
    return { p: seg(c.local, s, e), s, e, fa: a, fb: b, beat: !!bt };
  }
  function p(name, a, b, kind, o) { return at(name, a, b, kind, o).p; }
  /* stagger group prefix1..prefixN with fraction fallback a + i*step (len each): explicit beats lead, followers trail by
     BEAT.stagger (whole spread capped at BEAT.spread); rec.dim = de-emphasis progress once a LATER item with a beat fires */
  function group(prefix, n, o) {
    const step = Math.min(BEAT.stagger, n > 1 ? BEAT.spread / (n - 1) : BEAT.stagger), recs = []; let prev = null;
    for (let i = 0; i < n; i++) {
      const name = prefix + (i + 1), fa = o.a + i * o.step;
      const r = at(name, fa, fa + o.len, o.kind, prev && !(M && M[name]) ? { after: prev, delay: step } : {});
      recs.push(r); prev = r;
    }
    recs.forEach((r, i) => { const nx = recs.slice(i + 1).find(x => x.beat); r.dim = on && o.dim && nx ? seg(c.local, nx.s, nx.s + BEAT.dim) : 0; });
    return recs;
  }
  function mark(s) { focal = Math.max(focal, s); }
  return { on, c, M, at, p, group, mark };
}
/* eyebrow + headline. B: a beats() resolver (or the old numeric t). Beat mode: eyebrow 0–.35s, headline wipe .10–.90s;
   an `em` beat draws the accent underline on its word instead of with the headline. */
function headIn(B, p, o) {
  o = o || {};
  if (typeof B === 'number' || !B.on) { const t = typeof B === 'number' ? B : B.c.t, a = o.a || ENTER.head; up(p + 'eb', seg(t, a, a + .12)); h1In(p + 'h1', seg(t, a + .03, a + .24)); }
  else { const c = B.c; up(p + 'eb', seg(c.local, 0, .35)); h1In(p + 'h1', seg(c.local, .10, .90)); }
  const emb = typeof B !== 'number' && B.M && B.M.em;
  if (emb) { const h = el(p + 'h1'); if (h) h.style.setProperty('--ul', eo(seg(B.c.local, emb.s, emb.s + BEAT.draw)).toFixed(3)); }
}
function footIn(B, p) { up(p + 'ft', typeof B === 'number' ? seg(B, .88, .98) : B.p('foot', .88, .98, 'enter', { focal: false })); }
/* life during the hold: a light sweep across the headline every BEAT.sweepEvery seconds and a pulse ring on the hero beat's element */
function holdLife(B, p, d, o) {
  if (typeof B === 'number') return;
  const c = B.c, hold = c.hold > 0 ? c.hold : -1; o = o || {};
  const ph = hold >= 0 ? (hold % BEAT.sweepEvery) / BEAT.sweepEvery : 0;
  sweep(p + 'h1', hold >= 0 && d && d.sweep !== false ? seg(ph, .05, .20) : 0);
  const hero = c.hero && ((o.alias && o.alias[c.hero]) || BEAT_ALIAS[c.hero] || c.hero);
  if (hero && (!d || d.ring !== false)) ring(p + hero, hold, { period: BEAT.ringPeriod, color: d && d.accent && typeof ACCENT_VAR !== 'undefined' && ACCENT_VAR[d.accent] ? 'var(' + ACCENT_VAR[d.accent] + ')' : undefined });
}
/* Park a strike-through on the text it actually crosses out. It used to be a fixed line across a fixed box
   (top:70px, a shallow diagonal), which had no relationship to the quote at all: once the panel grew to 228px the
   line clipped the top of the first line on one end and ran through the label on the other. Measured in the DOM
   instead, the way anatomy measures its address parts, and for the same reason — a measurement taken before the
   webfont swaps lands in the wrong place, so callers re-run this on the first frame after fonts report loaded.
   One path per rendered line: a two-line quote gets two strokes, not one diagonal across both. Returns true when
   it measured something real. */
function strikeText(svgId, qtId) {
  const svg = el(svgId), q = el(qtId);
  if (!svg || !q) return false;
  const host = svg.offsetParent || svg.parentElement;
  if (!host) return false;
  const hr = host.getBoundingClientRect();
  if (!hr.width) return false;
  const k = host.offsetWidth / hr.width;                       // the preview scales the stage; capture does not
  /* Measure against the panel's own box, not the container's. The panel slides in under a transform, so a live
     rect read during setup is 70px off; the difference between two live rects cancels the transform, and the
     panel's offsetLeft/offsetTop give where it will finally sit. */
  let box = q;
  while (box.parentElement && box.parentElement !== host) box = box.parentElement;
  const br = box.getBoundingClientRect();
  if (!br.width) return false;
  const rg = document.createRange(); rg.selectNodeContents(q);
  // one rect per inline fragment, so merge the fragments that share a line into a single run
  const lines = [];
  Array.from(rg.getClientRects()).forEach(r => {
    if (r.width < 2 || r.height < 2) return;
    const ln = lines.find(l => Math.abs(l.t - r.top) < r.height * .5);
    if (ln) { ln.l = Math.min(ln.l, r.left); ln.r = Math.max(ln.r, r.right); ln.b = Math.max(ln.b, r.bottom); ln.t = Math.min(ln.t, r.top); }
    else lines.push({ t: r.top, b: r.bottom, l: r.left, r: r.right });
  });
  if (!lines.length) return false;
  const PAD = 18, OVER = 8;                                    // the stroke overhangs the ink a little, as a pen would
  const X = v => box.offsetLeft + (v - br.left) * k, Y = v => box.offsetTop + (v - br.top) * k;
  const x0 = Math.min(...lines.map(l => X(l.l))) - PAD, x1 = Math.max(...lines.map(l => X(l.r))) + PAD;
  const y0 = Math.min(...lines.map(l => Y(l.t))) - PAD, y1 = Math.max(...lines.map(l => Y(l.b))) + PAD;
  const W = x1 - x0, H = y1 - y0, f = v => Math.round(v * 10) / 10;
  svg.setAttribute('viewBox', `0 0 ${f(W)} ${f(H)}`);
  svg.style.left = f(x0) + 'px'; svg.style.top = f(y0) + 'px';
  svg.style.width = f(W) + 'px'; svg.style.height = f(H) + 'px';
  svg.innerHTML = lines.map(l => {
    const a = X(l.l) - x0 - OVER, b = X(l.r) - x0 + OVER;
    const y = Y(l.t) - y0 + (Y(l.b) - Y(l.t)) * .56;           // through the ink, not the middle of the line box
    return `<path d="M${f(a)} ${f(y + 4)} Q${f((a + b) / 2)} ${f(y - 3)} ${f(b)} ${f(y - 1)}"/>`;
  }).join('');
  return true;
}
function req(d, keys, tpl) { keys.forEach(k => { if (d[k] == null) throw new Error('template "' + tpl + '": data.' + k + ' is required'); }); }
/* badge list → html; items: [{text, cls, x, y, size, font, id?}] */
function badges(p, list, y0) {
  return (list || []).map((b, i) => `<div class="badge ${b.cls || 'n'}" id="${p}bd${i + 1}" style="left:${b.x != null ? b.x : 0}px;top:${b.y != null ? b.y : y0}px;font-size:${b.size || 30}px${b.font ? ';font:' + b.font : ''}${b.pad ? ';padding:' + b.pad : ''}">${b.text}</div>`).join('');
}
function badgesIn(B, p, n, a) {
  if (typeof B === 'number') { stagger(p + 'bd', n, B, a || ENTER.badge, ENTER.step, .10, pp, .84); return; }
  B.group('bd', n, { a: a || ENTER.badge, step: ENTER.step, len: .10, kind: 'pop' }).forEach((r, i) => pp(p + 'bd' + (i + 1), r.p, .84));
}
/* a .sub paragraph */
function subHtml(p, text, y, w) { return text ? `<div class="sub" id="${p}sub" style="left:0;top:${y}px;width:${w}px">${text}</div>` : ''; }
/* the beat names every template exposes (eyebrow/headline/underline/footnote) */
function baseBeats(d) { return ['em', 'foot']; }
const seqN = (prefix, n) => Array.from({ length: n }, (_, i) => prefix + (i + 1));
