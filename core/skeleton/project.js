/* Project settings. Read by the deck (in the browser) and by the renderer (in Node). */
window.PROJECT = {
  slug: '__SLUG__',
  title: '__TITLE__',
  canvas: '__CANVAS__',         // 'vertical' (1080x1920) | 'horizontal' (1920x1080)
  resolution: '__RES__',        // output pixels = canvas x scale. horizontal: '4k' (3840x2160) | '1440p' | '1080p'; vertical: '2k' (1440x2560) | '1080p'
  fps: __FPS__,                 // 60 for smooth motion; 30 halves the render time
  dur: __DUR__,                 // default motion seconds per slide (a hold is added when encoding)
  hold: __HOLD__,               // seconds the final frame is held
  layout: '__LAYOUT__',   // horizontal: 'top' (heading centred across the top, content under it) | 'left' (heading column left, content right)
  captions: { on: __CAPS__ },   // burned-in word-highlight captions from vo.json (needs a voiceover); y: override the band
  vcenter: true,           // centre each slide's block in the content box…
  vbias: 0.3,              // …biased up: 30% of the spare room above it, 70% below (0.5 = dead centre)
  bg: { drift: 1 },             // ambient background drift amplitude (0 = static)
  brand: {},                    // overrides for core/brand.js (handles, box, audio, accent, outro)
  assets: { aws: [], brands: [], urls: {} },   // logos this video needs: AWS icon names, simple-icons slugs, or {name: url}; npm run assets -- --project <slug>
};
