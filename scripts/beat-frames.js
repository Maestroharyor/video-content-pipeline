#!/usr/bin/env node
/* Frames at named beats, for reviewing short-lived moments a filmstrip samples past (an emoji sticker is on screen for
   ~3s; a confetti burst for 1.2s; a shake for .5s). One PNG per matching beat, plus a contact sheet.
     npm run beat-frames -- --project <slug> [--match mj,burst,shake] [--off 0.7] [--slide 20]
   --match: beat-name prefixes (default mj,burst,shake); --off: seconds after the beat (default 0.7: a sticker has landed).
   Slides whose beats the timeline ignores (an outro with an audio bed) are sampled at each sticker's `at` instead.
   Output: renders/beats/<NN>-<beat>.png and renders/beats/sheet.png. */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { resolve } = require('../renderer/config');
const { parseArgs } = require('../renderer/args');
const { openDeck } = require('../renderer/browser');

const argv = process.argv.slice(2), take = k => { const i = argv.indexOf(k); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const match = (take('--match') || 'mj,burst,shake').split(','), off = +(take('--off') || .7);
(async () => {
  const args = parseArgs(argv), cfg = resolve(args);
  const { browser, page, errors, slides } = await openDeck(cfg, { scale: 1 });
  if (errors.length) { console.error(errors.join('\n')); await browser.close(); process.exit(1); }
  const out = path.join(cfg.outputDir, 'beats'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const stage = await page.$('#stage'), shots = [];
  const wanted = !args.slide.length ? slides : slides.filter(s => args.slide.some(k => k === s.id || s.slug.startsWith(k)));
  for (const s of wanted) {
    const at = [];
    Object.entries(s.beats || {}).forEach(([k, b]) => { if (match.some(m => k.startsWith(m))) at.push([k, b.s + off]); });
    // stickers timed with `at` (audio-bed slides): read them from the slide data in the page
    if (!Object.keys(s.beats || {}).length) (s.fxAt || []).forEach((t, i) => at.push(['mj' + (i + 1), t + off]));
    for (const [k, local] of at) {
      const u = Math.min(1, local / s.motion);
      await page.evaluate((id, uu, o) => window.setFrame(id, uu, o), s.id, u, { T: s.start + local, local, motion: s.motion, screen: s.screen });
      const f = path.join(out, `${s.slug.slice(0, 2)}-${k}.png`);
      await stage.screenshot({ path: f, optimizeForSpeed: true }); shots.push(f);
    }
  }
  await browser.close();
  if (!shots.length) { console.log('no matching beats'); process.exit(0); }
  const cols = 3, rows = Math.ceil(shots.length / cols), pad = rows * cols - shots.length;
  const ins = shots.flatMap(f => ['-i', f]), fl = shots.map((_, i) => `[${i}]scale=640:360[t${i}]`);
  for (let i = 0; i < pad; i++) fl.push(`color=black:640x360:d=1[p${i}]`);
  const tiles = shots.map((_, i) => `[t${i}]`).concat(Array.from({ length: pad }, (_, i) => `[p${i}]`));
  const rowsF = []; for (let r = 0; r < rows; r++) { fl.push(`${tiles.slice(r * cols, r * cols + cols).join('')}hstack=${cols}[r${r}]`); rowsF.push(`[r${r}]`); }
  fl.push(rows > 1 ? `${rowsF.join('')}vstack=${rows}[o]` : `[r0]copy[o]`);
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...ins, '-filter_complex', fl.join(';'), '-map', '[o]', '-frames:v', '1', path.join(out, 'sheet.png')]);
  console.log(`beat-frames ${cfg.slug}: ${shots.length} frame(s) → ${path.relative(process.cwd(), out)}/ (sheet.png)`);
  process.exit(0);
})();
