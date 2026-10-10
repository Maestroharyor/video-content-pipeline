#!/usr/bin/env node
/* Render the whole timeline as one continuous frame sequence and encode the finished video.
     npm run assemble -- --project <slug> [--jobs 4] [--captions on|off] [--xf push|fade|cut --xf-dur 0.4] [--audio vo.m4a | --no-audio]
                         [--preview] [--from S --to S] [--keep-frames] [--resume] [--force] [--var key=value]
                         [--over aroll.mp4 [--over-end S]]   (or PROJECT.overlay.video / .videoEnd: capture with alpha and composite onto that
                         footage; the frame at S is held to the end — phones often write a few black frames when the recording stops)
   --from S --to S renders just that stretch of the timeline as its own finished clip (audio cut to match, short fades), e.g. a 2s cut of an intro.
   Needs projects/<slug>/timeline.json (npm run timeline). Output: renders/final/<slug>.mp4 (+ .srt when captions exist). */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { resolve } = require('./config');
const { parseArgs } = require('./args');
const { resolveAudio } = require('./project');
const { defaultInject } = require('./browser');
const { withPool, frameRanges, defaultJobs } = require('./pool');
const { assembleMp4, bitrateCeiling } = require('./video');
const { loadTimeline, validateTimeline } = require('./timeline');
const { findVo } = require('./transcribe');
const { buildCaptions, srt } = require('./captions');
const TL = require('../core/timeline');

/* o.transparent = capture on alpha; o.capsOnly = alpha capture of the caption band alone (dual-render's reveal layer) */
async function captureTimeline(cfg, L, o) {
  const N = Math.round(TL.total(L) * cfg.fps);
  const from = Math.max(0, Math.round((o.from || 0) * cfg.fps)), to = o.to != null ? Math.min(N, Math.round(o.to * cfg.fps)) : N;
  fs.mkdirSync(o.dir, { recursive: true });
  const manifest = path.join(o.dir, '.manifest.json');
  // frames are only reusable at the same sampling: a manifest from another resolution or fps is discarded, never mixed in
  const spec = `${cfg.width}x${cfg.height}@${cfg.scale || 1}x${cfg.fps}`;
  let done = {};
  if (o.resume) { try { const m = JSON.parse(fs.readFileSync(manifest, 'utf8')); if (m.spec === spec) done = m.done || {}; else console.warn('  ! --resume ignored: frames on disk are not ' + spec); } catch {} }
  if (!o.resume || !Object.keys(done).length) { fs.rmSync(o.dir, { recursive: true, force: true }); fs.mkdirSync(o.dir, { recursive: true }); }
  const todo = []; for (let f = from; f < to; f++) if (!(done[f] && fs.existsSync(path.join(o.dir, String(f).padStart(5, '0') + '.png')))) todo.push(f);
  const save = () => fs.writeFileSync(manifest, JSON.stringify({ spec, done }));
  let count = 0; const t0 = Date.now();
  const tick = () => { count++; if (count % 30 === 0 || count === todo.length) { const dt = (Date.now() - t0) / 1000, rate = count / dt; process.stdout.write(`\r  frames ${count}/${todo.length}  ${rate.toFixed(1)} f/s  eta ${Math.max(0, (todo.length - count) / rate).toFixed(0)}s   `); } };
  if (todo.length) {
    const ranges = frameRanges(todo.length, o.jobs);
    await withPool(cfg, ranges.length, { inject: o.inject, transparent: !!o.transparent, capsOnly: !!o.capsOnly }, async (page, i) => {
      const stage = await page.$('#stage');
      const [a, b] = ranges[i];
      for (let k = a; k < b; k++) {
        const f = todo[k];
        await page.evaluate(T => window.setTime(T), f / cfg.fps);
        await stage.screenshot({ path: path.join(o.dir, String(f).padStart(5, '0') + '.png'), omitBackground: !!o.transparent, optimizeForSpeed: true });
        done[f] = 1; tick();
        if (count % 300 === 0) save();   // a long 4K capture that gets interrupted continues with --resume instead of starting over
      }
    });
    process.stdout.write('\n');
    save();
  }
  return { dir: o.dir, frames: N, from, to };
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = resolve(args);
  const tl = loadTimeline(cfg.projectDir);
  if (!tl) throw new Error(`no timeline.json in ${path.relative(cfg.root, cfg.projectDir)} — run: npm run timeline -- --project ${cfg.slug}`);
  if (args.xf) tl.xf = { type: args.xf, dur: args.xfDur != null ? args.xfDur : (tl.xf && tl.xf.dur) || 0.4 };
  else if (args.xfDur != null) tl.xf = Object.assign({ type: 'push' }, tl.xf, { dur: args.xfDur });
  const inject = defaultInject(cfg);
  inject.TIMELINE = tl;
  // captions: on by default when the project says so and vo.json exists; build captions.json if it is missing
  const wantCaps = args.captions ? args.captions === 'on' : !!(cfg.project.captions && cfg.project.captions.on);
  const voJson = path.join(cfg.projectDir, 'vo.json');
  if (wantCaps && fs.existsSync(voJson)) {
    const capsFile = path.join(cfg.projectDir, 'captions.json');
    if (!fs.existsSync(capsFile) || args.force) execFileSync('node', [path.join(cfg.root, 'scripts', 'captions.js'), '--project', cfg.projectDir], { stdio: 'inherit' });
    inject.CAPTIONS = JSON.parse(fs.readFileSync(capsFile, 'utf8'));
  } else delete inject.CAPTIONS;
  if (wantCaps && !fs.existsSync(voJson)) console.warn('  ! captions requested but no vo.json (npm run transcribe) — rendering without');
  // the slide list comes from the deck itself (audio beds included)
  const { openDeck } = require('./browser');
  const probe = await openDeck(cfg, { inject });
  await probe.browser.close();
  if (probe.errors.length) throw new Error(probe.errors.join('\n'));
  const slides = TL.played(probe.slides, tl);
  validateTimeline(tl, slides).forEach(w => console.warn('  warn', w));
  const L = TL.layout(slides, tl, { hold: cfg.hold });
  const total = TL.total(L);
  const jobs = args.jobs || defaultJobs();
  // overlay decks: composite the (alpha) timeline onto the A-roll footage instead of the deck background
  const over = args.over ? path.resolve(args.over) : (cfg.project.overlay && cfg.project.overlay.video ? path.resolve(cfg.projectDir, cfg.project.overlay.video) : null);
  if (over && !fs.existsSync(over)) throw new Error('A-roll footage not found: ' + over);
  const overEnd = args.overEnd != null ? args.overEnd : (cfg.project.overlay && cfg.project.overlay.videoEnd) || null;
  console.log(`assemble ${cfg.slug}: ${cfg.outWidth}x${cfg.outHeight} (${args.preview ? 'preview' : cfg.resolution}), crf ${cfg.crf} ${cfg.preset}, budget ${(cfg.maxSize / 1e9).toFixed(2)} GB → ceiling ${(bitrateCeiling(cfg.maxSize, total, 192e3) / 1e6).toFixed(1)} Mbps`);
  console.log(`assemble ${cfg.slug}: ${L.length} slides, ${total}s @ ${cfg.fps}fps =${Math.round(total * cfg.fps)} frames, ${jobs} page(s), transitions ${tl.xf ? tl.xf.type + ' ' + tl.xf.dur + 's' : 'push'}${inject.CAPTIONS ? ', captions' : ''}${over ? ', over ' + path.basename(over) : ''}`);
  const t0 = Date.now();
  const dir = path.join(cfg.frameDir, over ? 'assemble-alpha' : 'assemble');
  await captureTimeline(cfg, L, { dir, jobs, inject, from: args.from, to: args.to, resume: args.resume, transparent: !!over });
  const capT = (Date.now() - t0) / 1000;
  const vo = args.noAudio ? null : (args.audio ? path.resolve(args.audio) : (tl.vo ? path.join(cfg.projectDir, tl.vo) : findVo(cfg.projectDir)));
  if (vo && !fs.existsSync(vo)) console.warn('  ! voiceover not found:', vo);
  const beds = L.filter(e => e.audio).map(e => ({ file: resolveAudio(cfg.projectDir, e.audio), at: e.start, id: e.id }));
  beds.filter(b => !b.file).forEach(b => console.warn('  ! audio bed not found for', b.id));
  const out = path.join(cfg.outputDir, 'final', cfg.outName + (args.preview ? '-preview' : '') + '.mp4');
  assembleMp4(dir, cfg, { out, total, vo: vo && fs.existsSync(vo) ? vo : null, beds: beds.filter(b => b.file), preview: args.preview, over, overEnd, range: { from: args.from, to: args.to } });
  if (inject.CAPTIONS) fs.writeFileSync(path.join(cfg.outputDir, 'final', cfg.outName + '.srt'), srt(inject.CAPTIONS.groups));
  if (!args.keepFrames) fs.rmSync(dir, { recursive: true, force: true });
  const bytes = fs.statSync(out).size;
  if (bytes > cfg.maxSize) console.warn(`  ! ${(bytes / 1e9).toFixed(2)} GB is over the ${(cfg.maxSize / 1e9).toFixed(2)} GB budget (raise --max-size or --crf)`);
  console.log(`done → ${path.relative(cfg.root, out)}  ${(bytes / 1e6).toFixed(0)} MB  (capture ${capT.toFixed(0)}s, total ${((Date.now() - t0) / 1000).toFixed(0)}s${vo && fs.existsSync(vo) ? ', voiceover ' + path.basename(vo) : ', no voiceover'}${beds.length ? ', ' + beds.length + ' bed(s)' : ''})`);
}
if (require.main === module) main().catch(e => { console.error(e.message || e); process.exit(1); });
module.exports = { captureTimeline };
