/* Project settings. Read by the deck (in the browser) and by the renderer (in Node). */
window.PROJECT = {
  slug: 'ai-in-every-app-overlay',
  title: 'AI shoved into every app (overlay)',
  canvas: 'vertical',         // 'vertical' (1080x1920) | 'horizontal' (1920x1080)
  fps: 60,
  resolution: '2k',             // vertical: '2k' (1440x2560) | '1080p' (1080x1920); --res overrides for one render
  dur: 5,                 // default motion seconds per slide (a hold is added when encoding)
  hold: 1,               // seconds the final frame is held
  captions: { on: false },   // the A-roll editor adds captions; the standalone deck (ai-in-every-app) burns them in
  bg: { drift: 1 },             // ambient background drift amplitude (0 = static)
  // Overlay for the vertical talking-head A-roll: the face sits in the top half, so every slide's block is pinned to the lower half
  // on a fitted dark card (core/overlay.js), with a tighter headline so the block stays compact.
  grid: { gx: 80, ebY: 132, ebSize: 30, h1Y: 186, h1W: 920, h1Size: 62, cx: 80, cy: 370, cw: 920, ch: 940,
    footY: 1740, footW: 920, footSize: 26, subSize: 30 },
  overlay: { align: 'v', bottom: 120, pad: 44, w: 1008, card: true, video: 'aroll.mp4', videoEnd: 142.1 },   // video: the A-roll the reference MP4 is composited onto (npm run assemble)
  brand: { accent: 'v', outro: { eyebrow: 'That\'s the rant', h1: 'Like and <em>follow</em> for more.' } },
  assets: { aws: [], brands: ['windsurf', 'cursor', 'zedindustries', 'ethereum', 'bitcoin', 'solana', 'instagram', 'x', 'tiktok'], urls: {} },
};
