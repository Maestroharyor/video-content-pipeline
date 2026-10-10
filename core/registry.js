/* Slide registry.
   defineTemplate(name, {check?, html(data, ctx), setup?(root, data, ctx), frame(t, ctx), beats?(data) → [element beat names]})
   defineSlide({slug, template?, id?, dur?, audio?, data, html?, setup?, frame?})
   The registry builds the DOM once, then exposes:
     window.setFrame(idOrSlug, t[, opts])  t = motion progress 0..1 (the per-clip contract; opts carry timeline info)
     window.setTime(T)                    absolute seconds on the deck timeline (assembly: transitions, bg drift, captions)
   Registration order = deck order. Ids default to s<NN> from the slug's leading number.
   Transitions: a slide exits (push: rise + fade, or fade) over the last xfDur seconds of its window; the next slide then
   starts on its own first frame. ctx.out is that exit progress in case a slide wants to react.
   Timing: `dur` is MOTION seconds. With a timeline (window.TIMELINE, injected by the renderer) a slide owns
   [start, end) seconds of screen time; frame() receives u = min(1, local / motion) so short windows compress the
   choreography and long windows hold the end pose. ctx carries the raw clock for ambient/idle motion, plus
   ctx.beats ({name: {s, e}} slide-relative seconds resolved from the spoken words, see core/templates/_shared.js beats()),
   ctx.hero (the beat name marked ! in the cue sheet) and ctx.exit (seconds at which the exit transition starts). */
(function () {
  const slides = [], byKey = {}, TEMPLATES = {};
  const P = window.PROJECT || {};
  const HOLD = P.hold != null ? P.hold : 1;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const eo = p => 1 - Math.pow(1 - p, 3);
  let L = null, LI = null;
  const FXL = () => window.SLIDE_FX || [];          // core/components/fx.js: emoji, burst, shake, drift layered on any slide                          // timeline layout (core/timeline.js) and its index by slide id

  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  // objects merge all the way down (a wire slide's v.nodes.code = {x, y} moves the node and keeps its label), arrays replace
  function vMerge(d, v) {
    const out = Object.assign({}, d);
    Object.keys(v).forEach(k => { out[k] = isObj(v[k]) && isObj(d[k]) ? vMerge(d[k], v[k]) : v[k]; });
    return out;
  }
  window.defineTemplate = function (name, def) {
    if (!def.html || !def.frame) throw new Error('template ' + name + ' needs html and frame');
    TEMPLATES[name] = def;
  };
  window.defineSlide = function (def) {
    if (!def.slug) throw new Error('slide needs a slug');
    if (!def.id) { const m = def.slug.match(/^(\d+)/); def.id = 's' + (m ? m[1].padStart(2, '0') : String(slides.length + 1).padStart(2, '0')); }
    if (byKey[def.id] || byKey[def.slug]) throw new Error('duplicate slide id/slug: ' + def.id + ' / ' + def.slug);
    /* data.v: what changes when the same deck is rendered on the vertical canvas (a -vertical project symlinking this
       deck's slides): sticker and bubble positions, camera framings. Objects merge one level down, arrays replace, so
       the beat names (item counts) stay the same and the one timeline serves both canvases. */
    if (def.data && def.data.v && window.GRID && window.GRID.canvas === 'vertical') def.data = vMerge(def.data, def.data.v);
    if (def.template) {
      const T = TEMPLATES[def.template];
      if (!T) throw new Error('slide ' + def.slug + ': unknown template "' + def.template + '" (have: ' + Object.keys(TEMPLATES).join(', ') + ')');
      if (T.check) T.check(def.data || {}, def);
      def.html = def.html || T.html; def.setup = def.setup || T.setup; def.frame = def.frame || T.frame;
      if (T.defaults) def.data = Object.assign({}, typeof T.defaults === 'function' ? T.defaults(def) : T.defaults, def.data || {});
      if (T.audio && def.audio === undefined) def.audio = T.audio(def);
    }
    if (!def.html || !def.frame) throw new Error('slide ' + def.slug + ' needs html and frame (or a template)');
    if (def.dur == null) def.dur = P.dur != null ? P.dur : 5;
    def.data = def.data || {};
    def.ctx = { id: def.id, p: def.id + '-', data: def.data, grid: window.GRID, slug: def.slug,
      t: 0, T: 0, local: 0, dur: def.dur, motion: def.dur, screen: def.dur + HOLD, hold: 0, out: 0, beats: null, hero: null, exit: def.dur + HOLD };
    slides.push(def); byKey[def.id] = def; byKey[def.slug] = def;
  };
  function build() {
    const stage = document.getElementById('stage');
    for (const s of slides) {
      const root = document.createElement('div');
      root.className = 'slide'; root.id = s.id;
      root.innerHTML = s.html(s.data, s.ctx) + FXL().map(f => f.html(s.data, s.ctx)).join('');
      stage.appendChild(root);
    }
    /* PROJECT.vcenter: templates stack their content from the top of the content box, so a short slide (one quote,
       two lanes) leaves the lower half of a horizontal frame empty. This centres the slide's content block in the
       box and moves the eyebrow and headline down by the same amount, so the heading stays level with the content.
       Measured from layout offsets (entrance transforms do not move them) and redone once, on the first frame after
       the webfonts report loaded, because a fallback-font measurement wraps text differently. */
    if (P.vcenter) for (const s of slides) {
      const f0 = s.frame;
      s.frame = function (t, ctx) { vcenter(s); return f0.apply(this, arguments); };
    }
    function vcenter(s) {
      if (s._vc === 'locked') return;
      const root = document.getElementById(s.id), content = root && root.querySelector('.content'), rel = content && content.querySelector('.rel');
      if (!rel || !root.classList.contains('on') && s._vc) return;
      if (rel.dataset.fit === 'self') return;   // a vertical map frames itself below the heading (mapFit)
      const G = window.GRID;
      /* PROJECT.vcenter === 'top': the heading stays where the grid puts it and the content starts a fixed gap
         (G.topGap, 48) under the headline's last line, however many lines it wraps to; vfit still fits the block
         into what is left above safe.b. Short slides then leave their spare room at the bottom, not over the heading. */
      const h1el = root.querySelector('.h1'), top = P.vcenter === 'top' && h1el
        ? Math.round(G.h1Y + h1el.offsetHeight + (G.topGap != null ? G.topGap : 48)) : G.cy;
      // a vertical slide with a footnote stops the block above it: safe.b alone let tall code panes run under the foot
      const foot = P.vfit && G.canvas === 'vertical' && root.querySelector('.foot');
      const box = Math.min(G.safe ? G.safe.b : G.cy + G.ch, foot && foot.textContent.trim() ? G.footY - 32 : Infinity) - top;
      let used = 0, wide = 0;
      rel.querySelectorAll(':scope > *').forEach(e => { if (e.offsetHeight) { used = Math.max(used, e.offsetTop + e.offsetHeight); wide = Math.max(wide, e.offsetLeft + e.offsetWidth); } });
      if (!used) return;
      /* PROJECT.vfit (vertical decks): templates lay out in the grid's narrower cw, then the block scales up to fill
         vfit.w (the real column) within the band, capped at vfit.max, so type reads at phone size */
      if (P.vfit && G.canvas === 'vertical') {
        // an svg (a link arrow) has no offsetWidth, so the loop above skipped it; it still has to fit
        rel.querySelectorAll(':scope > svg').forEach(e => { wide = Math.max(wide, parseFloat(e.style.left || 0) + parseFloat(e.style.width || 0)); });
        // pad: room for PROJECT.drift, the slow push-in that grows a long-held scene by a few percent about its centre
        const k = Math.min(P.vfit.max || 1.5, P.vfit.w / wide, box / used) * (1 - (P.vfit.pad || 0));
        rel.style.transform = `scale(${k.toFixed(4)})`; rel.style.transformOrigin = '0 0';
        rel.dataset.vk = k.toFixed(4);   // a template that moves .rel itself (wire's camera) keeps this scale under its own
        used *= k; wide *= k;
        content.style.left = Math.round(G.cx + ((P.vfit.w || G.cw) - wide) / 2) + 'px';
      }
      if (P.vcenter === 'top') { content.style.top = top + 'px'; s._vc = document.fonts.status === 'loaded' ? 'locked' : 'draft'; return; }
      /* PROJECT.vbias: the share of the spare room that goes ABOVE the block (0.5 = dead centre, the old behaviour and
         the default for projects that predate it). New projects get 0.3 from the skeleton: content sits nearer eye
         level, a little above the frame's centre, instead of floating mid-frame. */
      const shift = Math.max(0, Math.round((box - used) * (P.vbias != null ? P.vbias : .5)));
      content.style.top = (G.cy + shift) + 'px';
      // P.vcenter === 'both' also centres a block narrower than the column (a heading centred over it expects that)
      if (P.vcenter === 'both') content.style.left = (G.cx + Math.max(0, Math.round((G.cw - wide) / 2))) + 'px';
      const eb = root.querySelector('.eyebrow'), h1 = root.querySelector('.h1');
      if (eb) eb.style.top = (G.ebY + shift) + 'px';
      if (h1) h1.style.top = (G.h1Y + shift) + 'px';
      s._vc = document.fonts.status === 'loaded' ? 'locked' : 'draft';
    }
    // setup passes may measure, so run with the slide displayed
    for (const s of slides) {
      const root = document.getElementById(s.id);
      root.classList.add('on');
      if (s.setup) s.setup(root, s.data, s.ctx);
      s.frame(0, s.ctx);
      root.classList.remove('on');
    }
    // duplicate element ids silently break animations: fail loudly
    const seen = {}, dup = [];
    document.querySelectorAll('[id]').forEach(e => { if (seen[e.id]) dup.push(e.id); seen[e.id] = 1; });
    if (dup.length) throw new Error('duplicate element ids: ' + dup.join(', '));
    window.SLIDES = slides.map(s => {
      const T = s.template && TEMPLATES[s.template];
      /* xfWant, not xf: the layout below overwrites `xf` with the RESOLVED transition type, so the author's
         defineSlide({ xf: 'cut' }) has to travel under its own name or the renderer would read back whatever
         the deck default happened to be and pin every slide to it. */
      return { id: s.id, slug: s.slug, dur: s.dur, audio: s.audio || null, template: s.template || 'custom',
        xfWant: s.xf || null,
        fxAt: (s.data.emoji || []).filter(m => m.at != null).map(m => m.at),   // stickers timed in seconds (audio-bed slides), for review tools
        beats: s.data.beats || null, beatNames: fxBeats(s, T && T.beats ? T.beats(s.data) : (s.beatNames || null)) };
    });
    if (window.TL) {
      window.SLIDES = window.TL.played(window.SLIDES, window.TIMELINE || null);
      L = window.TL.layout(window.SLIDES, window.TIMELINE || null, { hold: HOLD, motion: P.motion });
      LI = {}; L.forEach(e => { LI[e.id] = e; });
      window.SLIDES.forEach((s, i) => Object.assign(s, { start: L[i].start, end: L[i].end, screen: L[i].screen, motion: L[i].motion, xf: L[i].xfType, xfDur: L[i].xfDur,
        beats: L[i].beats, hero: L[i].hero || null }));
      window.LAYOUT = L;
    }
    window.DECK_READY = true;
  }
  // fx beats join the template's list; a custom slide without a list stays unchecked
  function fxBeats(s, names) {
    const fx = [].concat(...FXL().map(f => f.beats(s.data)));
    return names ? names.concat(fx) : null;
  }
  /* generic exit applied to the slide root over its last transition seconds */
  function exitTransform(root, type, out) {
    const e = eo(out);
    if (type === 'fade') root.style.opacity = String(1 - e);
    else if (type === 'push') { root.style.opacity = String(1 - e); root.style.transform = 'translateY(' + (-48 * e).toFixed(2) + 'px) scale(' + (1 - .02 * e).toFixed(4) + ')'; }
  }
  /* the one place a frame is produced: slide s at motion progress u; o carries the timeline clock and exit state */
  function renderAt(s, u, o) {
    document.querySelectorAll('.slide.on').forEach(e => { if (e.id !== s.id) { e.classList.remove('on'); e.style.cssText = ''; } });
    const root = document.getElementById(s.id);
    root.style.cssText = ''; root.classList.add('on');
    const c = s.ctx, e = LI && LI[s.id];   // the layout entry: per-clip and timeline renders must see the same motion/screen/beats
    c.t = u; c.motion = o.motion != null ? o.motion : e ? e.motion : s.dur; c.screen = o.screen != null ? o.screen : e ? e.screen : s.dur + HOLD;
    const r6 = x => Math.round(x * 1e6) / 1e6;   // microsecond clock: start + u*motion and u*motion must agree bit for bit (clip ≡ timeline)
    c.local = r6(o.local != null ? o.local : u * c.motion); c.T = r6(o.T != null ? o.T : c.local);
    c.hold = Math.max(0, c.local - c.motion); c.out = o.out || 0;
    c.beats = e ? e.beats : null; c.hero = e ? e.hero || null : null; c.exit = c.screen - (e ? e.xfOut || 0 : 0);
    s.frame(u, c);
    FXL().forEach(f => f.frame(c, root));
    if (c.out > 0) exitTransform(root, o.xfType, c.out);
    if (window.bgFrame) window.bgFrame(c.T);
    if (window.capsFrame) window.capsFrame(c.T);
  }
  window.setFrame = function (key, t, opts) {
    const s = byKey[key]; if (!s) throw new Error('no slide ' + key);
    renderAt(s, cl(t, 0, 1), opts || {});
  };
  window.setTime = function (T) {
    if (!L) throw new Error('setTime needs core/timeline.js');
    const i = window.TL.slideAt(L, T), e = L[i], s = byKey[e.id];
    const pg = window.TL.progress(e, T), tr = window.TL.transition(L, i, T);
    renderAt(s, pg.u, { T, local: pg.local, motion: e.motion, screen: e.screen, out: tr.out, xfType: tr.type });
    return { id: s.id, u: pg.u, out: tr.out };
  };
  window.slideFor = key => byKey[key];
  window.TEMPLATES = TEMPLATES;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
