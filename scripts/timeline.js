#!/usr/bin/env node
/* Build projects/<slug>/timeline.json from the cue sheet (and vo.json when present).
     npm run timeline -- --project <slug> [--xf push|fade|cut] [--xf-dur 0.4] [--motion 5] [--tail 6] [--lead 0.10] [--no-anchor]
     npm run timeline -- --project <slug> --words [--slide 04]   print each slide's window, its spoken words with times and its resolved beats (no deck needed)
     npm run timeline -- --project <slug> --dry                  parse + resolve beats only, no deck, nothing written (the Step 2 gate)
     npm run timeline -- --project <slug> --check                rebuild from the cue sheet, validate, report beat issues; nothing written
   Slide starts come from the cue sheet's "VO window" column, snapped to the first word of "Line it covers" in vo.json.
   Element beats come from the "Beats" column (name:"spoken words", name*:"a","b", name:@sec, ^ phrase, ! hero) and land
   `lead` seconds before the word. The last slide ends at max(start + tail, voiceover length). */
const fs = require('fs');
const path = require('path');
const { resolve } = require('../renderer/config');
const { loadTimeline, writeTimeline, parseCueSheet, buildTimeline, validateTimeline, slidesFromRows, checkBeats } = require('../renderer/timeline');
const { findVo } = require('../renderer/transcribe');
const TL = require('../core/timeline');
const a = process.argv.slice(2), val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const WORDS = a.includes('--words'), DRY = a.includes('--dry'), CHECK = a.includes('--check');
const mss = v => { const m = Math.floor(v / 60), s = (v % 60).toFixed(2); return `${m}:${s.padStart(5, '0')}`; };

(async () => {
  const cfg = resolve({ project: val('--project') || val('-p') });
  const cue = path.join(cfg.projectDir, 'cue-sheet.md');
  const rows = parseCueSheet(fs.readFileSync(cue, 'utf8'));
  if (!rows.length) { console.error('cue-sheet.md has no table rows (| # | File | … | VO window | … | Beats | Line it covers |)'); process.exit(1); }
  const voJson = path.join(cfg.projectDir, 'vo.json');
  const vo = !a.includes('--no-anchor') && fs.existsSync(voJson) ? JSON.parse(fs.readFileSync(voJson, 'utf8')) : null;
  const voAudio = findVo(cfg.projectDir);
  let slides, browser = null;
  if (WORDS || DRY) slides = slidesFromRows(rows, cfg.dur);           // cue sheet only: works before any slide file exists
  else {
    const { openDeck } = require('../renderer/browser');
    const r = await openDeck(cfg); browser = r.browser; slides = r.slides; await browser.close();
    if (r.errors.length) { console.error(r.errors.join('\n')); process.exit(1); }
  }
  const issues = [], quiet = WORDS;
  const tl = buildTimeline({ slides, rows, vo, fps: cfg.fps,
    // PROJECT.transition is the deck's own default so a bare `npm run timeline` keeps it; --xf still wins.
    xf: { type: val('--xf') || cfg.transition || 'push', dur: val('--xf-dur') != null ? +val('--xf-dur') : 0.4 },
    motion: val('--motion') != null ? +val('--motion') : cfg.dur, tail: val('--tail') != null ? +val('--tail') : cfg.dur + cfg.hold,
    lead: val('--lead') != null ? +val('--lead') : TL.LEAD,
    voFile: voAudio ? path.relative(cfg.projectDir, voAudio) : null, log: m => { if (!quiet) console.log('  ' + m); }, issues });
  const nBeats = tl.slides.reduce((n, e) => n + Object.keys(e.beats || {}).length, 0);
  if (WORDS) {
    const only = val('--slide'), words = (vo && vo.words) || [];
    const L = TL.layout(slides, tl);
    for (const e of L) {
      if (only && !(e.id === only || e.slug === only || e.slug.startsWith(only) || e.id === 's' + only.padStart(2, '0'))) continue;
      console.log(`\n${e.id}  ${e.slug}  ${mss(e.start)}–${mss(e.end)}  (${e.screen}s on screen, exit at +${(e.screen - e.xfOut).toFixed(2)}s, motion ${e.motion}s)`);
      const ws = words.filter(w => w.s >= e.start && w.s < e.end);
      if (!ws.length) console.log('  (no vo.json words in this window — beats can only use @seconds)');
      let line = '  ', prev = null;
      ws.forEach(w => {
        const gap = prev ? w.s - prev.e : 1, phrase = !prev || gap >= 0.25 || /[,;.!?]$/.test(prev.w);
        const tok = `${phrase ? '¶' : ''}${gap > 0.35 && prev ? '·· ' : ''}+${(w.s - e.start).toFixed(2)} ${w.w}`;
        if (line.length + tok.length > 110) { console.log(line); line = '  '; }
        line += tok + '   '; prev = w;
      });
      if (line.trim()) console.log(line);
      const b = e.beats || {};
      const names = Object.keys(b).sort((x, y) => b[x].s - b[y].s);
      if (names.length) console.log('  beats: ' + names.map(n => `${n}${e.hero === n ? '!' : ''} +${b[n].s.toFixed(2)}`).join(' · '));
      issues.filter(i => i.startsWith(e.id + ':')).forEach(i => console.log('  !! ' + i.slice(e.id.length + 2)));
    }
    console.log(`\n${tl.slides.length} slides · ${nBeats} beats resolved · ${issues.length} issue(s)`);
    return;
  }
  const warn = validateTimeline(tl, slides);
  // house rule: an outro is 5-6 s, never longer (a long end card loses viewers); --tail sets the last row's length
  tl.slides.filter(e => /outro/.test(e.slug) && e.end - e.start > 6.05)
    .forEach(e => warn.push(`${e.id}: outro runs ${(e.end - e.start).toFixed(2)}s; keep it to 5-6 s (give its row a 5-6 s window, or --tail 5.5 when it is the last row)`));
  warn.forEach(w => console.log('warn', w));
  if (DRY || CHECK) {
    const bc = checkBeats(tl, slides);
    const errs = issues.filter(i => /not found|no element|placeholder|could not parse/.test(i)).concat(bc.errors);
    bc.warnings.forEach(w => console.log('warn', w));
    errs.forEach(e => console.log('error', e));
    console.log(`beats: ${tl.slides.length} slides · ${nBeats} resolved · ${errs.length} error(s) · ${bc.warnings.length + warn.length} warning(s)`);
    console.log(`timeline ${errs.length ? 'NOT ok' : 'ok'}: ${tl.slides.length} slides, ${tl.total}s${DRY ? ' (dry run, nothing written)' : ' (check only, nothing written)'}`);
    if (errs.length) process.exit(1);
    return;
  }
  const f = writeTimeline(cfg.projectDir, tl);
  console.log(`${path.relative(cfg.root, f)}: ${tl.slides.length} slides, ${nBeats} beats, total ${tl.total}s${vo ? ', anchored to vo.json' : ''}${voAudio ? ', vo ' + tl.vo : ', no voiceover file'}`);
})().catch(e => { console.error(e.message); process.exit(1); });
