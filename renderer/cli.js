#!/usr/bin/env node
/* Render CLI (one clip per slide).
     npm run render -- --project <slug> --slide 04-ec2-spin-up --format gif|mp4|all|webm|mov [--transparent] [--res 4k|1440p|2k|1080p] [--fps 60] [--poster [--t 0.5]] [--keep-frames] [--force] [--timed] [--var key=value]
     npm run render:all -- --project <slug>
   --overlay is accepted as an alias of --slide. "all" (or no --slide) renders every slide.
   --project falls back to $VID_PROJECT, then to the only folder in projects/.
   Unchanged slides are skipped (renders/.cache.json); --force re-renders. --timed gives each clip its timeline window
   (motion + hold as on the assembled video) instead of dur + hold. */
const fs = require('fs');
const path = require('path');
const { resolve } = require('./config');
const { parseArgs } = require('./args');
const { resolveAudio } = require('./project');
const { openDeck } = require('./browser');
const { captureSlide, poster } = require('./capture');
const { mp4, webm, mov } = require('./video');
const { gif } = require('./gif');
const cache = require('./cache');

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = resolve(args);
  // --captions on|off overrides the project, as in assemble (a slide drawn over footage must not carry a caption band)
  if (args.captions) cfg.project.captions = Object.assign({}, cfg.project.captions, { on: args.captions === 'on' });
  const formats = args.format === 'all' ? ['mp4', 'gif'] : args.format.split(',');
  const wantsAlpha = args.transparent || formats.includes('webm') || formats.includes('mov');
  if (wantsAlpha && !args.transparent) args.transparent = true;

  const { browser, page, errors, slides } = await openDeck(cfg, { transparent: args.transparent });
  if (errors.length) { console.error(errors.join('\n')); await browser.close(); process.exit(1); }
  if (args.list) { console.log(`project ${cfg.slug} (${cfg.canvas} ${cfg.width}x${cfg.height} stage → ${cfg.resolution} ${cfg.outWidth}x${cfg.outHeight} @ ${cfg.fps}fps, hold ${cfg.hold}s)`); slides.forEach(s => console.log(`${s.id}  ${s.slug}  ${s.dur}s  ${s.template}${s.audio ? '  audio:' + s.audio : ''}`)); await browser.close(); return; }

  const wanted = !args.slide.length || args.slide.includes('all') ? slides
    : slides.filter(s => args.slide.some(k => k === s.id || k === s.slug || s.slug.startsWith(k)));
  if (!wanted.length) { console.error('no slide matched', args.slide, '\navailable:', slides.map(s => s.slug).join(', ')); await browser.close(); process.exit(1); }

  const t0 = Date.now();
  const outputs = [];
  let skipped = 0;
  for (const s of wanted) {
    if (args.poster) { outputs.push(await poster(page, s, cfg, args.t == null ? 1 : args.t)); console.log('poster', s.slug, args.t == null ? '' : '@' + args.t); continue; }
    const timed = args.timed && s.start != null ? { start: s.start, screen: s.screen, motion: s.motion } : null;
    const key = (args.transparent ? 'alpha:' : '') + (timed ? 'timed:' : '');
    const hash = cache.inputsHash(cfg, s, { timed, transparent: args.transparent, motion: s.motion, beats: s.beats || null, hero: s.hero || null });
    const have = !args.force && cache.fresh(cfg, s.slug, hash, formats.map(f => key + f));
    if (have) { skipped++; console.log(`cached  ${s.slug}`); formats.forEach(f => outputs.push(have[key + f])); continue; }
    process.stdout.write(`capture ${s.slug} (${timed ? timed.screen + 's timed' : s.dur + 's'} @ ${cfg.fps}fps${args.transparent ? ', alpha' : ''}) `);
    const { dir, frames } = await captureSlide(page, s, cfg, { transparent: args.transparent, timed });
    process.stdout.write(`${frames} frames\n`);
    const audio = resolveAudio(cfg.projectDir, s.audio);
    if (s.audio && !audio) console.warn('  ! audio not found for', s.slug, s.audio);
    const made = {};
    const ecfg = timed ? Object.assign({}, cfg, { hold: 0 }) : cfg;   // a timed clip already contains its hold
    for (const f of formats) {
      let out;
      if (f === 'mp4') out = mp4(dir, s.slug, ecfg, audio);
      else if (f === 'gif') out = gif(dir, s.slug, ecfg);
      else if (f === 'webm') out = webm(dir, s.slug, ecfg);
      else if (f === 'mov') out = mov(dir, s.slug, ecfg);
      else { console.error('unknown format', f); continue; }
      made[key + f] = out; outputs.push(out); console.log('  ->', path.relative(cfg.root, out));
    }
    cache.record(cfg, s.slug, hash, made);
    if (!args.keepFrames) fs.rmSync(dir, { recursive: true, force: true });
  }
  await browser.close();
  console.log(`done: ${wanted.length} slide(s)${skipped ? ' (' + skipped + ' cached)' : ''} in ${((Date.now() - t0) / 1000).toFixed(1)}s → ${path.relative(cfg.root, cfg.outputDir)}`);
}
main().catch(e => { console.error(e); process.exit(1); });
