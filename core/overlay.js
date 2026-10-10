/* Overlay fit (opt-in via PROJECT.overlay = {pad, align: 'v' | 'vh', w?, card: true | false | 'frame', top? | bottom? | within?: [top, bottom]}).
   A slide defined with `full: true` opts out: it keeps its full-frame layout and gets an opaque deck backdrop (bg + grid + glows),
   so it covers the footage completely (outros).
   For decks that are composited over camera footage: every slide's END POSE is measured once (the union of its visible
   elements at the end of its motion), the whole block is centred on the stage (vertically, or both ways) and a fitted dark
   card (or a dashed frame) is drawn behind it so type reads over any footage.
   Ordering contract: measuring happens BEFORE the requested frame is rendered, so the DOM the renderer screenshots is
   always the requested (t, opts) — never the measuring pose. window.OVERLAY.warm() measures every slide up front (the
   renderer calls it once fonts are loaded) so nothing is measured mid-capture. The measurement is a pure function of the
   DOM, so frames stay deterministic. Wraps setFrame/setTime; the card fades in over the first 12% of the motion. */
(function () {
  const O = window.OVERLAY_OPTS || (window.PROJECT && window.PROJECT.overlay); if (!O) return;
  const PAD = O.pad != null ? O.pad : 48, BOTH = O.align === 'vh', CARD = O.card === undefined ? true : O.card, W = O.w || 0;   // W: fixed card width (else fitted)
  const style = document.createElement('style');
  style.textContent = '.ovl-card{position:absolute;z-index:0;border-radius:36px;background:rgba(10,14,24,.86);border:2px solid #2E3D5C;' +
    'box-shadow:0 30px 80px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.05);pointer-events:none}' +
    '.slide>:not(.ovl-card):not(.ovl-full){z-index:1}' +
    '.ovl-full{position:absolute;inset:0;z-index:0;background:var(--bg0);overflow:hidden;pointer-events:none}' +
    '.ovl-full .grid{position:absolute;inset:-90px;opacity:.16;background-image:linear-gradient(#233049 1px,transparent 1px),linear-gradient(90deg,#233049 1px,transparent 1px);background-size:90px 90px}' +
    '.ovl-full .glow{position:absolute;inset:-12%}.ovl-full .glow.a{background:radial-gradient(60% 46% at 50% 30%,rgba(255,153,0,.08),transparent 70%)}' +
    '.ovl-full .glow.b{background:radial-gradient(70% 50% at 50% 100%,rgba(139,92,246,.12),transparent 70%)}' +
    '.ovl-full .vig{position:absolute;inset:0;background:radial-gradient(120% 100% at 50% 45%,transparent 58%,rgba(0,0,0,.42))}';
  document.head.appendChild(style);
  const SKIP = 'content,rel,ovl-card,ln,li,bgfx,ring'.split(',');
  const fits = {};   // slide id -> {top,left,width,height,dx,dy,fontsLoaded,locked}
  const origSetFrame = window.setFrame, origSetTime = window.setTime;
  function entryOf(id) { const L = window.LAYOUT; if (!L) return null; for (const e of L) if (e.id === id) return e; return null; }
  function measure(id) {
    const G = window.GRID, stage = document.getElementById('stage'), root = document.getElementById(id);
    const sr = stage.getBoundingClientRect(), k = G.w / sr.width;   // preview may scale the stage
    let l = 1e9, t = 1e9, r = -1e9, b = -1e9;
    root.querySelectorAll('*').forEach(e => {
      if (SKIP.some(c => e.classList.contains(c))) return;
      if (e.closest('.ovl-card') || e.closest('.ring')) return;
      const cs = getComputedStyle(e); if (cs.opacity === '0' || cs.display === 'none' || cs.visibility === 'hidden') return;
      const rc = e.getBoundingClientRect(); if (rc.width < 2 || rc.height < 2) return;
      l = Math.min(l, (rc.left - sr.left) * k); t = Math.min(t, (rc.top - sr.top) * k);
      r = Math.max(r, (rc.right - sr.left) * k); b = Math.max(b, (rc.bottom - sr.top) * k);
    });
    if (r < l) { l = G.cx; t = G.cy; r = G.cx + G.cw; b = G.cy + 100; }
    return { left: l, top: t, width: r - l, height: b - t, fontsLoaded: document.fonts.status === 'loaded' };
  }
  /* measure the end pose of slide `id` once (again only if fonts finished loading after the first pass and the fit is not locked) */
  function ensure(id) {
    const f = fits[id];
    if (f && (f.locked || f.fontsLoaded || document.fonts.status !== 'loaded')) return f;
    const root = document.getElementById(id);
    const def = window.slideFor ? window.slideFor(id) : null;
    if (def && def.full) {   // full-frame slide: no fit, no card, an opaque deck backdrop instead
      if (!root.querySelector('.ovl-full')) { const bg = document.createElement('div'); bg.className = 'ovl-full'; bg.innerHTML = '<div class="grid"></div><div class="glow a"></div><div class="glow b"></div><div class="vig"></div>'; root.insertBefore(bg, root.firstChild); }
      return (fits[id] = { full: true, dx: 0, dy: 0, top: 0, left: 0, width: window.GRID.w, height: window.GRID.h, fontsLoaded: true, locked: true });
    }
    const old = root.querySelector('.ovl-card'); if (old) old.remove();
    const e = entryOf(id);
    origSetFrame(id, 1, e ? { T: e.start + e.motion, local: e.motion, motion: e.motion, screen: e.screen } : {});   // end of the motion, hold 0, unshifted
    const m = fits[id] = measure(id);
    const G = window.GRID;
    // vertical placement: O.top pins the block top, O.bottom leaves that many px under it (talking-head decks keep the face clear),
    // O.within [t, b] centres it inside that band (a vertical social cut keeps its caption band clear), else centred on the frame
    m.dy = O.top != null ? Math.round(O.top - m.top) : O.bottom != null ? Math.round(G.h - O.bottom - m.height - m.top)
      : O.within ? Math.round((O.within[0] + O.within[1] - m.height) / 2 - m.top) : Math.round((G.h - m.height) / 2 - m.top);
    // fixed width: the card spans the grid column (gx .. gx+cw) and, centred, the block keeps its left alignment inside it
    const cw = W || m.width + 2 * PAD, cl = W ? G.gx - PAD : m.left - PAD;
    m.dx = BOTH ? Math.round((G.w - cw) / 2 - cl) : 0;
    if (CARD) {
      const card = document.createElement('div'); card.className = 'ovl-card' + (CARD === 'frame' ? ' frame' : ''); card.id = id + '-ovl';
      if (CARD === 'frame') card.innerHTML = '<i></i><i></i><i></i><i></i>';   // corner markers
      card.style.cssText = `left:${Math.round(cl)}px;top:${Math.round(m.top - PAD)}px;width:${Math.round(cw)}px;height:${Math.round(m.height + 2 * PAD)}px`;
      root.insertBefore(card, root.firstChild);
    }
    return m;
  }
  function apply(id, t) {
    const m = fits[id], root = document.getElementById(id);
    root.style.top = m.dy + 'px'; root.style.left = m.dx + 'px';
    const card = root.querySelector('.ovl-card');
    if (card) { const p = Math.max(0, Math.min(1, t / .12)), e = 1 - Math.pow(1 - p, 3); card.style.opacity = String(e); card.style.transform = 'scale(' + (.96 + .04 * e) + ')'; }
  }
  window.setFrame = function (key, t, opts) {
    const s = window.slideFor(key); if (!s) throw new Error('no slide ' + key);
    ensure(s.id); origSetFrame(key, t, opts); apply(s.id, Math.max(0, Math.min(1, t)));
  };
  window.setTime = function (T) {
    const L = window.LAYOUT; if (L) ensure(L[window.TL.slideAt(L, T)].id);
    const r = origSetTime(T); apply(r.id, r.u); return r;
  };
  window.OVERLAY = {
    warm() { (window.SLIDES || []).forEach(s => { ensure(s.id); fits[s.id].locked = true; }); return Object.keys(fits).length; },
    remeasure(id) { if (fits[id]) fits[id].locked = false; delete fits[id]; return ensure(id); },
    fits,
  };
})();
