/* Single source of geometry. Chosen by PROJECT.canvas, overridable with ?canvas= in the URL.
   Writes CSS custom properties on #stage (base.css positions everything from them) and exposes window.GRID. */
(function () {
  const GRIDS = {
    vertical: { w: 1080, h: 1920, gx: 60, ebY: 132, ebSize: 34, h1Y: 206, h1W: 960, h1Size: 82,
      cx: 60, cy: 455, cw: 960, ch: 1200, footY: 1740, footW: 960, footSize: 34, subSize: 36,
      safe: { l: 58, r: 1022, t: 96, b: 1858 } },
    /* The horizontal safe rectangle stops at 870, not at a symmetric 56px margin: a YouTube caption box
       covers roughly the bottom 18% of the player, so anything below that line is read over whenever a
       viewer has captions on. Burned-in captions (capsY 960) sit under it on purpose. */
    horizontal: { w: 1920, h: 1080, gx: 60, ebY: 84, ebSize: 30, h1Y: 134, h1W: 640, h1Size: 72,
      cx: 760, cy: 84, cw: 1100, ch: 786, footY: 780, footW: 640, footSize: 30, subSize: 30,
      safe: { l: 58, r: 1862, t: 56, b: 870 } },
  };
  const q = new URLSearchParams(location.search);
  /* a variant (renderer --variant, or ?variant= in the preview) lays its block of project.js over the base settings:
     the same deck on another canvas, from one project (renderer/project.js loadProject does the same in Node) */
  const variant = window.VARIANT || q.get('variant');
  if (variant && window.PROJECT && window.PROJECT[variant]) { window.VARIANT = variant; Object.assign(window.PROJECT, window.PROJECT[variant]); }
  const canvas = q.get('canvas') || (window.PROJECT && window.PROJECT.canvas) || 'vertical';
  if (!GRIDS[canvas]) throw new Error('unknown canvas ' + canvas + ' (vertical | horizontal)');
  const G = window.GRID = Object.assign({ canvas }, GRIDS[canvas]);
  /* the phone's safe zone (9:16): Reels, TikTok and Shorts lay their top bar over the first ~220px, the caption and
     description block over everything below ~1500, and the like/comment/share column over the right ~140px. Nothing
     readable goes outside it: scripts/probe.js fails any text or logo that does (PROJECT.probe.mobile = false opts a
     deck out, e.g. one never posted to a phone app) */
  if (canvas === 'vertical') G.mobile = { l: 60, r: 940, t: 220, b: 1500 };
  /* a YouTube thumbnail (PROJECT.thumbs, 16:9): wider players and some feeds crop ~10% off the top and bottom (user,
     2026-10-22), the duration badge is a fixed pixel size so at sidebar size (168x94) it covers about a fifth of the
     width and height in the bottom-right, and the hover icons (Watch later, Add to queue) stack in the top-right.
     scripts/probe.js fails any text or logo outside `box` or inside either corner, and type too small to read small */
  if (canvas === 'horizontal' && window.PROJECT && window.PROJECT.thumbs)
    G.thumb = { box: { l: 96, r: 1824, t: 108, b: 972 }, badge: { l: 1530, t: 850 }, hover: { l: 1730, b: 330 }, hookPx: 120, textPx: 44 };
  G.ts = canvas === 'vertical' ? 1 : .9;      // body type scale (headline/eyebrow/foot/sub have their own sizes per grid)
  /* PROJECT.layout (horizontal): 'top' = heading centred across the top on one line, content centred in a wide column
     under it (the new-project default since 2026-10-10); 'left' = the original heading column left, content right.
     Projects made before the option exist have no layout and keep 'left'. PROJECT.grid still overrides either. */
  const layout = canvas === 'horizontal' && window.PROJECT && window.PROJECT.layout === 'top' ? 'top' : null;
  if (layout === 'top') {
    Object.assign(G, { ebY: 70, h1Y: 108, h1W: 1800, h1Size: 64, cx: 190, cy: 230, cw: 1540, ch: 640 });
    if (window.PROJECT.vcenter == null || window.PROJECT.vcenter === true) window.PROJECT.vcenter = 'both';   // a centred heading wants a centred block
  }
  Object.assign(G, (window.PROJECT && window.PROJECT.grid) || {});   // per-project geometry overrides (e.g. an overlay column, ts)
  // burned-in captions need a band of their own: shrink the content box and (horizontal) lift the footnote
  const capsOn = window.PROJECT && window.PROJECT.captions && window.PROJECT.captions.on;
  G.captions = !!capsOn;
  if (capsOn) {
    // 9:16: a two-line caption box (~156px) from 1340 ends by 1500, the bottom of the phone safe zone (GRID.mobile)
    if (canvas === 'vertical') { G.ch = 840; G.capsY = 1340; }
    else { G.ch = 686; G.footY = 780; G.capsY = 960; }
    const cy = window.PROJECT.captions.y; if (cy != null) G.capsY = cy;
  } else G.capsY = canvas === 'vertical' ? 1340 : 960;
  const stage = document.getElementById('stage');
  const vars = { ts: G.ts, sw: G.w, sh: G.h, gx: G.gx, 'eb-y': G.ebY, 'eb-size': G.ebSize, 'h1-y': G.h1Y, 'h1-w': G.h1W, 'h1-size': G.h1Size,
    cx: G.cx, cy: G.cy, cw: G.cw, ch: G.ch, 'foot-y': G.footY, 'foot-w': G.footW, 'foot-size': G.footSize, 'sub-size': G.subSize, 'caps-y': G.capsY };
  for (const k in vars) stage.style.setProperty('--' + k, k === 'ts' ? String(vars[k]) : vars[k] + 'px');
  stage.classList.add('canvas-' + canvas);
  if (layout) stage.classList.add('layout-' + layout);
  if (window.PROJECT && window.PROJECT.theme) stage.classList.add('theme-' + window.PROJECT.theme);   // e.g. 'mono' → core/styles/mono.css
})();
