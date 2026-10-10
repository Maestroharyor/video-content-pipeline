/* Frame-by-frame capture: setFrame(id, t) for each frame, screenshot the stage element. */
const fs = require('fs');
const path = require('path');

/* opts.timed = {start, screen, motion}: capture the slide's timeline window (motion + hold, no transition) instead of dur */
async function captureSlide(page, slide, cfg, opts = {}) {
  const tm = opts.timed;
  const n = Math.max(2, Math.round((tm ? tm.screen : slide.dur) * cfg.fps));
  const dir = path.join(cfg.frameDir, slide.slug + (opts.transparent ? '-alpha' : ''));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const stage = await page.$('#stage');
  for (let f = 0; f < n; f++) {
    if (tm) {
      const local = f / cfg.fps;
      await page.evaluate((id, u, o) => window.setFrame(id, u, o), slide.id, Math.min(1, local / tm.motion), { T: tm.start + local, local, motion: tm.motion, screen: tm.screen });
    } else await page.evaluate((id, t) => window.setFrame(id, t), slide.id, f / (n - 1));
    await stage.screenshot({ path: path.join(dir, String(f).padStart(4, '0') + '.png'), omitBackground: !!opts.transparent, optimizeForSpeed: true });
    if (opts.onFrame) opts.onFrame(f + 1, n);
  }
  return { dir, frames: n };
}

async function poster(page, slide, cfg, t = 1) {
  fs.mkdirSync(path.join(cfg.outputDir, 'poster'), { recursive: true });
  await page.evaluate((id, tt) => window.setFrame(id, tt), slide.id, t);
  const stage = await page.$('#stage');
  const out = path.join(cfg.outputDir, 'poster', slide.slug + (t === 1 ? '' : '@' + t) + '.png');
  await stage.screenshot({ path: out });
  return out;
}
module.exports = { captureSlide, poster };
