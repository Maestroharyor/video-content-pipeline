/* Project settings. Read by the deck (in the browser) and by the renderer (in Node). */
window.PROJECT = {
  slug: 'lifetechfacts-intro-boot',
  title: 'LifeTech Facts intro (boot)',
  canvas: 'horizontal',         // 'vertical' (1080x1920) | 'horizontal' (1920x1080)
  resolution: '4k',        // output pixels = canvas x scale. horizontal: '4k' (3840x2160) | '1440p' | '1080p'; vertical: '2k' (1440x2560) | '1080p'
  fps: 60,                 // 60 for smooth motion; 30 halves the render time
  dur: 4,                  // one 4.0s slide, choreographed in seconds (slides/01-intro.js); the logo is resolved by ~3s, the rest is a still hold
  hold: 0,                 // the hold is part of the slide
  captions: { on: false },   // burned-in word-highlight captions from vo.json (needs a voiceover); y: override the band
  bg: { drift: 1, a: 'rgba(59,89,152,.22)', b: 'rgba(126,155,224,.10)' },   // dark theme = the deck grid with brand-blue glows
  intro: { theme: 'dark', tagline: 'Tech · Dev · AI' },   // theme 'dark' | 'light' (--var theme=light for one render)
  crf: 10,                      // a logo sting is re-encoded by every editor it is dropped into: keep the master near-lossless (~2 MB)
  brand: {},                    // overrides for core/brand.js (handles, box, audio, accent, outro)
  assets: { aws: [], brands: [], urls: {} },   // logos this video needs: AWS icon names, simple-icons slugs, or {name: url}; npm run assets -- --project <slug>
};
