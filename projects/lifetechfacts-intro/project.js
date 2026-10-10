/* Project settings. Read by the deck (in the browser) and by the renderer (in Node). */
window.PROJECT = {
  slug: 'lifetechfacts-intro',
  title: 'LifeTech Facts intro',
  canvas: 'horizontal',         // 'vertical' (1080x1920) | 'horizontal' (1920x1080)
  resolution: '4k',        // output pixels = canvas x scale. horizontal: '4k' (3840x2160) | '1440p' | '1080p'; vertical: '2k' (1440x2560) | '1080p'
  fps: 60,                 // 60 for smooth motion; 30 halves the render time
  dur: 5.6,               // the intro is one 5.6s slide; its choreography is written in seconds (slides/01-intro.js)
  hold: 0,                 // the hold is part of the slide (logo resolved by 4.6s, still to 5.6s)
  captions: { on: false },   // burned-in word-highlight captions from vo.json (needs a voiceover); y: override the band
  bg: { drift: 0 },
  intro: { theme: 'light' },    // 'light' (original look) | 'dark' (matches the slide decks)
  crf: 10,                      // a 5.6s logo sting gets re-encoded by every editor it is dropped into: keep the master near-lossless (still ~2 MB)
  brand: {},                    // overrides for core/brand.js (handles, box, audio, accent, outro)
  assets: { aws: [], brands: [], urls: {} },   // logos this video needs: AWS icon names, simple-icons slugs, or {name: url}; npm run assets -- --project <slug>
};
