/* Timeline maths shared by the browser (window.TL) and Node (require('../core/timeline')).
   A timeline lists every slide with absolute start/end seconds (== voiceover time). Without one, slides
   run back to back at dur + hold, which reproduces the per-clip behaviour.
   Every function is pure. */
(function (root, factory) {
  const m = factory();
  if (typeof module === 'object' && module.exports) module.exports = m; else root.TL = m;
})(typeof self !== 'undefined' ? self : this, function () {
  const r3 = x => Math.round(x * 1000) / 1000;
  const LEAD = 0.10, PHRASE_LEAD = 0.30, BEAT_LEN = 0.4, BEAT_TAIL = 1.0;   // seconds a graphic leads its word; motion is extended past the last beat by BEAT_TAIL
  /* beats on a timeline entry ({name: [absStart, absEnd]}) → slide-relative {name: {s, e}} (s clamped ≥ 0); null when empty */
  function localBeats(map, start) {
    if (!map) return null; const out = {}; let n = 0;
    for (const k in map) { const v = map[k], st = Array.isArray(v) ? v[0] : v, en = Array.isArray(v) ? v[1] : st + BEAT_LEN;
      const ls = Math.max(0, r3(st - start)); out[k] = { s: ls, e: Math.max(ls + 0.1, r3(en - start)) }; n++; }
    return n ? out : null;
  }
  /* numeric beats authored in slide data ({name: seconds | {at: seconds}}) — the only kind that works without a timeline */
  function numBeats(obj) {
    if (!obj) return null; const out = {}; let n = 0;
    for (const k in obj) { const v = obj[k], at = typeof v === 'number' ? v : (v && typeof v.at === 'number' ? v.at : (v && typeof v.s === 'number' ? v.s : null));
      if (at == null) continue; const st = r3(Math.max(0, at)); out[k] = { s: st, e: r3(v && typeof v.e === 'number' ? Math.max(st + 0.1, v.e) : st + BEAT_LEN) }; n++; }
    return n ? out : null;
  }
  const lastBeat = b => { let m = -1; for (const k in b) m = Math.max(m, b[k].s); return m; };

  /* slides: [{id, slug, dur, audio, template}] in deck order; tl: timeline object or null;
     d: {motion, hold, xf: {type, dur}} defaults. Returns entries in deck order. */
  function layout(slides, tl, d) {
    d = Object.assign({ motion: null, hold: 1, xf: { type: 'push', dur: 0.4 } }, d || {});
    let L;
    if (!tl) {
      let T = 0;
      L = slides.map(s => {
        const motion = s.dur, screen = s.dur + d.hold;
        const e = { id: s.id, slug: s.slug, start: r3(T), end: r3(T + screen), screen: r3(screen), motion, xfType: 'cut', xfDur: 0, audio: s.audio || null, template: s.template,
          beats: numBeats(s.beats), hero: null };
        T += screen; return e;
      });
    } else {
      const byId = {}; (tl.slides || []).forEach(e => { byId[e.id] = e; if (e.slug) byId[e.slug] = e; });
      const xfT = (tl.xf && tl.xf.type) || 'push', xfD = tl.xf && tl.xf.dur != null ? tl.xf.dur : 0.4;
      L = slides.map((s, i) => {
        const e = byId[s.id] || byId[s.slug];
        if (!e) throw new Error('timeline has no entry for slide ' + s.id + ' (' + s.slug + ')');
        const screen = r3(e.end - e.start);
        const want = e.motion != null ? e.motion : (tl.motion != null ? Math.min(tl.motion, s.dur) : s.dur);
        const type = e.xf || xfT;
        const beats = localBeats(e.beats, e.start) || numBeats(s.beats);
        // u = 1 must stay the true end pose: the motion window grows to cover the last beat (never past the screen time)
        const motion = r3(Math.min(screen, Math.max(want, beats ? lastBeat(beats) + BEAT_TAIL : 0)));
        return { id: s.id, slug: s.slug, start: r3(e.start), end: r3(e.end), screen, motion,
          xfType: type, xfDur: type === 'cut' ? 0 : (e.xfDur != null ? e.xfDur : xfD), audio: e.audio || s.audio || null, template: s.template,
          beats, hero: e.hero || null };
      });
    }
    L.forEach((e, i) => { e.xfOut = L[i + 1] ? L[i + 1].xfDur : 0; });   // seconds of exit transition at this slide's end
    return L;
  }
  /* the slides a timeline plays. A timeline normally covers the whole deck (layout throws on a missing slide, which
     catches a stale timeline.json); one marked `subset: true` plays only the slides it lists, in deck order: a
     social cut (scripts/social-cut.js) links a whole deck and keeps the slides its audio still covers */
  function played(slides, tl) { return tl && tl.subset ? slides.filter(s => tl.slides.some(e => e.id === s.id || e.id === s.slug)) : slides; }
  function total(L) { return L.length ? L[L.length - 1].end : 0; }
  /* index of the slide showing at absolute time T (clamped to the deck) */
  function slideAt(L, T) {
    let lo = 0, hi = L.length - 1;
    if (T <= L[0].start) return 0;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (L[mid].start <= T) lo = mid; else hi = mid - 1; }
    return lo;
  }
  function progress(e, T) {
    const local = Math.max(0, T - e.start);
    const u = e.motion > 0 ? Math.min(1, local / e.motion) : 1;
    return { u, local, hold: Math.max(0, local - e.motion) };
  }
  /* exit state of slide i at T: the transition into slide i+1 (its xfType/xfDur) plays over the last xfDur seconds
     of slide i, so `out` grows 0→1 up to the cut and the next slide starts clean on its own frame 0 */
  function transition(L, i, T) {
    const n = L[i + 1];
    if (!n || n.xfType === 'cut' || !(n.xfDur > 0)) return { out: 0, type: 'cut' };
    const x = (T - (L[i].end - n.xfDur)) / n.xfDur;
    if (x <= 0) return { out: 0, type: n.xfType };
    return { out: Math.min(1, x), type: n.xfType };
  }
  /* throws on structural errors, returns warnings */
  function validate(tl, slides) {
    const warn = [];
    if (!tl || !Array.isArray(tl.slides) || !tl.slides.length) throw new Error('timeline: no slides');
    const ids = new Set(slides.map(s => s.id));
    tl.slides.forEach((e, i) => {
      if (!ids.has(e.id)) throw new Error('timeline: unknown slide id ' + e.id);
      if (!(e.end > e.start)) throw new Error('timeline: ' + e.id + ' end must be > start');
      if (i === 0 && e.start !== 0) throw new Error('timeline: first slide must start at 0');
      if (i > 0 && Math.abs(tl.slides[i - 1].end - e.start) > 0.0015) throw new Error('timeline: gap/overlap between ' + tl.slides[i - 1].id + ' and ' + e.id);
    });
    const order = slides.map(s => s.id).filter(id => tl.slides.some(e => e.id === id));
    if (order.join() !== tl.slides.map(e => e.id).join()) throw new Error('timeline: slide order differs from deck order');
    if (tl.slides.length !== slides.length) warn.push('timeline covers ' + tl.slides.length + ' of ' + slides.length + ' slides');
    const L = layout(slides.filter(s => tl.slides.some(e => e.id === s.id)), tl);
    L.forEach(e => {
      if (e.screen < e.xfDur) throw new Error('timeline: ' + e.id + ' is shorter than its transition');
      if (e.screen < 3 && e.template === 'console') warn.push(e.id + ': console slide has only ' + e.screen + 's (click flow will be rushed)');
      if (e.audio && e.motion !== 5) warn.push(e.id + ': carries audio but motion is ' + e.motion + 's (audio beds are authored for 5s)');
      if (e.beats) {
        if (e.audio) warn.push(e.id + ': carries audio and beats (beats are ignored on audio slides)');
        for (const k in e.beats) { const late = e.beats[k].s - (e.screen - e.xfOut - BEAT_LEN - 0.2);
          if (late > 0 && e.beats[k].s < e.screen) warn.push(e.id + ': beat ' + k + ' at ' + e.beats[k].s + 's lands ' + r3(late) + 's too close to the cut (entrance clamped)'); }
      }
    });
    return warn;
  }
  return { layout, played, total, slideAt, progress, transition, validate, localBeats, numBeats, LEAD, PHRASE_LEAD, BEAT_LEN, BEAT_TAIL };
});
