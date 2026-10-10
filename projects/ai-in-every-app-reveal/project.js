/* Project settings. Read by the deck (in the browser) and by the renderer (in Node). */
window.PROJECT = {
  slug: 'ai-in-every-app-reveal',
  title: 'AI shoved into every app (reveal)',
  canvas: 'vertical',         // 1080x1920 CSS stage
  resolution: '1080p',        // 1080x1920: the A-roll is 1080x1920, so 2k would only upscale the footage half
  fps: 30,                    // the A-roll is 30fps and timeline.json is already 30
  dur: 5,                     // fallback motion seconds; every row is beat-timed off the voiceover
  hold: 1,
  captions: { on: true },     // burned in, and kept visible through the reveals (scripts/dual-render.js caps layer)
  bg: { drift: 1 },
  // No `overlay` and no `grid` override: this deck is full frame and opaque, like ai-in-every-app. The lower-half
  // fitted card lives in ai-in-every-app-overlay and is deliberately not used here.
  brand: { accent: 'v', outro: { eyebrow: 'That\'s the rant', h1: 'Like and <em>follow</em> for more.' } },
  assets: { aws: [], brands: ['windsurf', 'cursor', 'claudecode', 'zedindustries', 'ethereum', 'bitcoin', 'solana', 'instagram', 'x', 'tiktok'],
    urls: { devin: 'https://devin.ai/favicon.svg' } },
  // version B: the deck is composited onto this footage and fades out inside a reveal so the face shows.
  source: 'aroll.mp4',
  // The outro's audio bed. dual-render never calls assembleMp4, so slide `audio` beds never reach these masters;
  // cta.sfx is the one hook that mixes a file at an absolute timestamp into both of them (visual fields omitted,
  // as in projects/where-app-stores-data). 141s is slide 18's start.
  cta: { sfx: '../../assets/audio/outro.wav', sfxAt: 141, gain: 1 },
  /* Two cuts of the same deck, picked with `--reveals <name>` (scripts/dual-render.js). Every edge is an exact
     slide boundary from timeline.json, so the deck leaves as a slide ends and returns as the next one starts
     building — a return inside a 0.4s push-exit would show the outgoing slide swimming up out of the footage.
     `in: 0` on the opening window: there is no deck before 0s to fade out.
     A reveal swallows the slide it covers, so those slides appear only in master A. */
  revealSets: {
    tight: [                                                  // 5 windows, ~37s of face (28%)
      { at: 0,       to: 6.36,   in: 0,    out: 0.45 },       // the hook, straight to camera        (s01)
      { at: 23.8,    to: 30.99,  in: 0.45, out: 0.45 },       // "AI pushed into my face"            (s04)
      { at: 90.92,   to: 97.8,   in: 0.45, out: 0.45 },       // "Oh yes, we're going to rebuild..." (s12)
      { at: 116.12,  to: 122.12, in: 0.45, out: 0.45 },       // "this is really unnecessary"        (s15)
      { at: 130.04,  to: 141,    in: 0.45, out: 0.45 },       // the closing thesis                  (s17)
    ],
    loose: [                                                  // 7 windows, ~51s of face (35%)
      { at: 0,       to: 6.36,   in: 0,    out: 0.45 },       // the hook                            (s01)
      { at: 23.8,    to: 30.99,  in: 0.45, out: 0.45 },       // "AI pushed into my face"            (s04)
      { at: 48.12,   to: 55.34,  in: 0.45, out: 0.45 },       // "not what I'm after"                (s07)
      { at: 65,      to: 71.32,  in: 0.45, out: 0.45 },       // "impressing their investors"        (s09)
      { at: 90.92,   to: 97.8,   in: 0.45, out: 0.45 },       // the Web3 impression                 (s12)
      { at: 116.12,  to: 122.12, in: 0.45, out: 0.45 },       // "this is really unnecessary"        (s15)
      { at: 130.04,  to: 141,    in: 0.45, out: 0.45 },       // the closing thesis                  (s17)
    ],
  },
};
