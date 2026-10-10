/* Project settings. Read by the deck (in the browser) and by the renderer (in Node). */
window.PROJECT = {
  slug: 'lifetechfacts-endscreen',
  title: 'LifeTech Facts end screen',
  canvas: 'horizontal',         // YouTube end screens only exist on 16:9 videos
  resolution: '4k',        // output pixels = canvas x scale. horizontal: '4k' (3840x2160) | '1440p' | '1080p'
  fps: 60,                 // 60 for smooth motion; 30 halves the render time
  dur: 20,                 // YouTube's maximum end-screen length; built by 1.5s, then an ambient hold that can be trimmed anywhere (slides/01-endscreen.js)
  hold: 0,                 // the hold is part of the slide
  captions: { on: false },
  bg: { drift: 1, a: 'rgba(59,89,152,.22)', b: 'rgba(126,155,224,.10)' },   // the deck grid with brand-blue glows, drifting slowly
  endscreen: { layout: 'one', style: 'orbit', theme: 'dark' },   // layout 'one' (one video + subscribe) | 'two' (two videos + subscribe); style = the intro it matches
                                                                  // (boot orbit beats commit loaded silicon bits blueprint eclipse generate); --var layout=two --var style=commit for one render
  crf: 10,                      // dropped into an editor and re-encoded there: keep the master near-lossless
  brand: {},                    // overrides for core/brand.js (handles, box, audio, accent, outro)
  assets: { aws: [], brands: [], urls: {} },
};
