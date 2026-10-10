#!/usr/bin/env node
/* Filmstrips: N frames across each slide, tiled into one PNG per slide → renders/strip/<slug>.png.
   With a timeline the samples span the slide's real on-screen window and tiles where an element is entering on a beat get a
   green bar on top (so a good strip shows entrances spread across the line, not bunched in the first tiles).
   The build gate reviews these (motion), not only the posters (end pose).
     npm run strip -- --project <slug> [--slide 07] [--frames 10] [--timed|--no-timed] [--canvas horizontal] [--out dir] */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { resolve } = require('../renderer/config');
const { parseArgs } = require('../renderer/args');
const { openDeck } = require('../renderer/browser');

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = resolve(args);
  const N = args.frames || 10;
  const { browser, page, errors, slides } = await openDeck(cfg, { scale: 1 });   // review tooling works in CSS px / downscaled tiles: 1x is enough
  if (errors.length) { console.error(errors.join('\n')); await browser.close(); process.exit(1); }
  const wanted = !args.slide.length || args.slide.includes('all') ? slides : slides.filter(s => args.slide.some(k => k === s.id || k === s.slug || s.slug.startsWith(k)));
  const outDir = path.join(cfg.outputDir, 'strip'); fs.mkdirSync(outDir, { recursive: true });
  const tmp = path.join(cfg.frameDir, 'strip'); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
  const stage = await page.$('#stage');
  const tileW = cfg.canvas === 'vertical' ? 216 : 384;
  const timed = args.noTimed ? false : (args.timed || slides.some(s => s.start != null));   // with a timeline: sample the slide's real window
  for (const s of wanted) {
    const marks = [];   // tile index → an element is entering (beat) at that sample; drawn as a green bar on the tile
    for (let i = 0; i < N; i++) {
      if (timed && s.start != null) {
        // samples spread over the whole on-screen window, denser early: local = screen * (i/(N-1))^1.3
        const local = s.screen * Math.pow(i / (N - 1), 1.3), u = Math.min(1, local / s.motion);
        await page.evaluate((id, uu, o) => window.setFrame(id, uu, o), s.id, u, { T: s.start + local, local, motion: s.motion, screen: s.screen });
        const b = s.beats || {}; if (Object.keys(b).some(k => local >= b[k].s && local <= b[k].s + .45)) marks.push(i);
      } else {
        // sample the motion densely early (entrances) and sparsely late: t = (i/(N-1))^1.5
        await page.evaluate((id, tt) => window.setFrame(id, tt), s.id, Math.pow(i / (N - 1), 1.5));
      }
      await stage.screenshot({ path: path.join(tmp, `${String(i).padStart(2, '0')}.png`), optimizeForSpeed: true });
    }
    const out = path.join(outDir, s.slug + '.png');
    const tick = marks.length ? marks.map(i => `drawbox=x=0:y=0:w=iw:h=14:color=0x34D399@0.95:t=fill:enable='eq(n\,${i})'`).join(',') + ',' : '';
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(tmp, '%02d.png'), '-vf', `${tick}scale=${tileW}:-1,tile=${N}x1:padding=4:color=0x000000`, '-frames:v', '1', out]);
    console.log('strip', path.relative(cfg.root, out) + (timed && s.start != null ? ` (${s.screen}s window, ${marks.length} beat tile(s))` : ''));
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  await browser.close();
}
main().catch(e => { console.error(e.message || e); process.exit(1); });
