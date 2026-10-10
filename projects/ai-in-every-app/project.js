/* Project settings. Read by the deck (in the browser) and by the renderer (in Node). */
window.PROJECT = {
  slug: 'ai-in-every-app',
  title: 'AI shoved into every app',
  canvas: 'vertical',         // 'vertical' (1080x1920) | 'horizontal' (1920x1080)
  fps: 60,
  resolution: '2k',             // vertical: '2k' (1440x2560) | '1080p' (1080x1920); --res overrides for one render
  dur: 5,                 // default motion seconds per slide (a hold is added when encoding)
  hold: 1,               // seconds the final frame is held
  captions: { on: true },   // burned-in word-highlight captions from vo.json (needs a voiceover); y: override the band
  bg: { drift: 1 },             // ambient background drift amplitude (0 = static)
  brand: { accent: 'v', outro: { eyebrow: 'That\'s the rant', h1: 'Like and <em>follow</em> for more.' } },                    // overrides for core/brand.js (handles, box, audio, accent, outro)
  assets: { aws: [], brands: ['windsurf', 'cursor', 'claudecode', 'zedindustries', 'ethereum', 'bitcoin', 'solana', 'instagram', 'x', 'tiktok'],
    urls: { devin: 'https://devin.ai/favicon.svg' } },   // logos this video needs: AWS icon names, simple-icons slugs, or {name: url}; npm run assets -- --project <slug>
};
