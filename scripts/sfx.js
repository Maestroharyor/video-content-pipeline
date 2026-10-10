#!/usr/bin/env node
/* Sound-effects track from the timeline: every beat that names a reveal gets a small synthesised sound, written as a
   cue list (assets/sting.json) and built into one full-length wav (assets/sfx.wav) by
   assets/logos/lifetechfacts/build-sting.js. `npm run dual` mixes it under the voiceover when project.js has
   cta: { sfx: 'assets/sfx.wav', sfxAt: 0, gain: .7 }. Re-run after every `npm run timeline`.
     npm run sfx -- --project <slug> [--dry]
   Default rules (by beat name, so they follow the template conventions in skills/new-video/references/templates.md).
   The palette (richCue below) comes first: swish on strikes/edges/highlighters, tap on panels/cards/wire nodes,
   chains (k r t c i li ri s m + n) pluck up a pentatonic scale, badges pluck high, bubbles boop, stamps thump with a
   glitch (sd) or a falling tone (stop), a deadline track ticks (ticks, m6, m12), a burst adds a chime. What it does
   not claim falls through to the rules below; PROJECT.sfx.palette = 'pop' skips it entirely:
     rise   soft whoosh 0.3s before each slide enters (not the first, not the outro, not PROJECT.sfx.noRise slides)
     type   key clicks under a terminal command typing (c<n>, tc<n>, w<n>c<n>)
            and under code lines (l<n>, p<i>l<j>, w<n>l<n>) on the slides listed in PROJECT.sfx.type
     pop    reveals: b/q/a/bd/t/x/k<n>, la ra meter fill, map fills f<slot>, and by default EVERY other element beat
            (a chip, tile, row, card: each point that lands pops). Text beats (em eb h1 foot sub), code lines, stickers
            and fx beats stay quiet (QUIET below). Name chips k<n>, not c<n>: c<n> is a terminal command and types.
     blip   tick-box items li<n>/ri<n> on the slides listed in PROJECT.sfx.tick
     thump  stamp, divx, and each {slide, beat} in PROJECT.sfx.thump
     buzz   pager: three low blips
     boop   emoji stickers mj<n> (core/components/fx.js)
     shim   confetti burst
     sample the outro's audio (BRAND.audio: the pop + shimmer bed, or music such as 'outro-music-tropicorp.wav') at the
            outro slide's start, when PROJECT.sfx.outroBed is true: npm run dual never plays a slide's own audio bed,
            so without this a dual render ends silent where assemble would play the bed. Scaled by 1/cta.gain so it
            lands at the level assemble gives it;
            PROJECT.sfx.outroGain (default 1) scales it further, outroDelay (s after the outro starts) and
            outroFadeIn (s) shape its entrance, and the track's peak limit rises to -0.4 dB. When the outro audio is
            music, the pop + shimmer bed (outro.wav) still plays under it for the handle pops; outroFx: false drops it.
   PROJECT.sfx = { noRise: [slug prefixes], tick: [slug prefixes], type: [slug prefixes], noType: [slug prefixes: c<n> there is a card, so it pops], thump: [{slide, beat}], outroBed: bool, extra: [cue…] } tunes them;
   `extra` cues are appended as written ({s, t, v, …}, see build-sting.js for the sounds). Levels are low on purpose:
   sound on reveals, not on every sentence. */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const probeDur = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();
const { resolve } = require('../renderer/config');
const { loadBrand } = require('../renderer/brand');
const { resolveAudio } = require('../renderer/project');
const { parseArgs } = require('../renderer/args');

const argv = process.argv.slice(2), dry = argv.includes('--dry');
const args = parseArgs(argv.filter(a => a !== '--dry')), cfg = resolve(args), P = cfg.project || {}, S = P.sfx || {};
const dir = cfg.projectDir, tlFile = path.join(dir, 'timeline.json');
if (!fs.existsSync(tlFile)) { console.error('no timeline.json: run npm run timeline -- --project ' + cfg.slug + ' first'); process.exit(1); }
const TL = JSON.parse(fs.readFileSync(tlFile, 'utf8'));
const LEAD = TL.lead || .1, r3 = v => Math.round(v * 1000) / 1000, cues = [];
// beats that are text, effects or handled below get no default pop: underline/eyebrow/headline/footnote/subtitle,
// code lines (typed only on PROJECT.sfx.type slides), tick items, stickers, confetti, shakes, stamps, pagers, dims
const QUIET = /^(em|eb|h1|foot|sub|dim|shake|burst|stamp|divx|pager|mj\d+|[lr]i\d+|l\d+|p\dl\d+|w\dl\d+)$/;
const has = (list, slug) => (list || []).some(k => slug.startsWith(String(k)));
/* The default palette gives each kind of moment its own sound, so a deck is not one pop repeated (PROJECT.sfx.palette
   = 'pop' restores the old every-point-pops mapping). Chains climb a pentatonic scale; lines and strikes swish; cards
   and panels land with a soft tap; stamps thump with a glitch or a falling tone; a deadline track ticks like a clock.
   Returns true when it placed the beat's cues. */
const SCALE = [523, 587, 659, 784, 880, 1047, 1175];
function richCue(n, t) {
  const ch = n.match(/^(k|r|t|c|i|li|ri|s|m)(\d+)$/);
  if (/^(strike|st|hl|x\d+)$/.test(n)) cues.push({ s: 'swish', t, d: .3, f: 1300, v: .7 });
  else if (/^e\d+$/.test(n)) cues.push({ s: 'swish', t, d: .4, f: 2600, v: .4 });
  else if (n === 'neq') cues.push({ s: 'swish', t, d: .22, f: 3000, v: .35 });
  else if (n === 'sd') { cues.push({ s: 'thump', t, v: .8 }); cues.push({ s: 'glitch', t, v: .7 }); }
  else if (n === 'stop') { cues.push({ s: 'thump', t, v: .6 }); cues.push({ s: 'drop', t, v: .55 }); }
  else if (n === 'ticks') for (let i = 0; i < 12; i++) cues.push({ s: 'clock', t: r3(t + .1 + i * 1.6 / 13), f: i % 2 ? 2000 : 2600, v: .7 });
  else if (/^m(6|12)$/.test(n)) cues.push({ s: 'clock', t, f: 2600, v: .9 });
  else if (/^(q|win|panel|l|r|hero|chart|code|term|run|ttl)$/.test(n)) cues.push({ s: 'tap', t, v: .8 });
  else if (/^ck\d+$/.test(n)) cues.push({ s: 'blip', t: r3(t + .2), f: 1320, k: 30, v: .6 });
  else if (/^(badge|bd\d*|note)$/.test(n)) cues.push({ s: 'pluck', t, f: 1175, k: 20, v: .55 });
  else if (/^b\d+$/.test(n)) cues.push({ s: 'boop', t, f: 520, k: 1400, v: .4 });
  else if (/^a\d+$/.test(n)) cues.push({ s: 'pop', t, v: .5 });
  else if (ch) cues.push({ s: 'pluck', t, f: SCALE[(+ch[2] - 1) % SCALE.length], v: .55 });
  else if (/^n[a-z]\w*$/.test(n)) cues.push({ s: 'tap', t, f: 170, v: .7 });
  else return false;
  return true;
}
TL.slides.forEach((s, i) => {
  if (/outro/.test(s.slug)) return;                                    // the outro carries its own bed
  if (i > 0 && !has(S.noRise, s.slug)) cues.push({ s: 'rise', t: r3(s.start - .3), d: .32, f: 2600, v: .55 });
  Object.entries(s.beats || {}).forEach(([n, [a]]) => {
    const t = r3(a - LEAD);
    if ((/^(c|tc|w\dc)\d+$/.test(n) && !has(S.noType, s.slug)) || (/^(l|p\dl|w\dl)\d+$/.test(n) && has(S.type, s.slug))) cues.push({ s: 'type', t, d: .7, v: .8 });
    else if (S.palette !== 'pop' && !QUIET.test(n) && richCue(n, t)) { /* placed by the palette */ }
    else if (/^(b|q|a|bd|t|x|k)\d+$/.test(n) || /^(la|ra|meter|fill)$/.test(n) || /^f(ec2|s3|cdn|lb|db)$/.test(n)) cues.push({ s: 'pop', t, v: .55 });
    else if (/^[lr]i\d+$/.test(n) && has(S.tick, s.slug)) cues.push({ s: 'blip', t: r3(t + .3), f: 1320, k: 30, v: .6 });
    else if (!QUIET.test(n)) cues.push({ s: 'pop', t, v: .5 });         // every other element that lands is a point: it pops
    if (n === 'stamp' || n === 'divx' || (S.thump || []).some(x => s.slug.startsWith(String(x.slide)) && x.beat === n)) cues.push({ s: 'thump', t, v: .8 });
    if (n === 'pager') [0, .32, .64].forEach(o => cues.push({ s: 'blip', t: r3(t + .4 + o), f: 150, k: 5, d: .28, v: 1.4 }));
    if (/^mj\d+$/.test(n)) cues.push({ s: 'boop', t: r3(a - .05), v: .5 });
    if (n === 'burst') cues.push({ s: 'shim', t, v: .8 });
    if (n === 'burst' && S.palette !== 'pop') cues.push({ s: 'chime', t, v: .7 });
  });
});
if (S.outroBed) {
  const outro = TL.slides.find(s => /outro/.test(s.slug)), bed = resolveAudio(dir, loadBrand(P).audio);
  if (!outro) console.warn('  ! sfx.outroBed: no outro slide in the timeline');
  else if (!bed) console.warn('  ! sfx.outroBed: brand audio not found: ' + loadBrand(P).audio);
  else {
    // paths relative to the project's assets (build-sting resolves samples there), so sting.json stays portable
    const rel = f => path.relative(path.join(dir, 'assets'), f), g = 1 / ((P.cta && P.cta.gain) || 1);
    // when the deck ends before the music does (a runtime cap), trim it to what is left and fade it out instead of cutting it
    const at = r3(outro.start + (S.outroDelay || 0)), left = r3(TL.total - at), len = probeDur(bed), short = len > left + .05;
    cues.push({ s: 'sample', f: rel(bed), t: at, v: r3((S.outroGain || 1) * g), fadeIn: S.outroFadeIn || undefined,
      d: short ? left : undefined, fadeOut: short ? (S.outroFadeOut || 1.2) : undefined });
    if (short) console.log(`  outro music ${len.toFixed(1)}s trimmed to ${left}s with a ${S.outroFadeOut || 1.2}s fade-out`);
    // music replaces the pop + shimmer bed, which carried the outro's sound effects (a pop per handle, a shimmer on
    // the link box): keep them under the music unless outroFx is false
    const pops = resolveAudio(dir, 'outro.wav');
    if (S.outroFx !== false && pops && path.basename(bed) !== 'outro.wav') cues.push({ s: 'sample', f: rel(pops), t: r3(outro.start), v: r3(g) });
  }
}
(S.extra || []).forEach(c => cues.push(c));
const kept = cues.filter(c => c.t >= 0).sort((x, y) => x.t - y.t);
fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
// outro music is mastered near full scale: the default -6 dB peak limit would squash it, so a track that carries it
// is limited at -0.4 dB instead (the effects themselves peak far below either)
const limit = S.outroBed ? .95 : undefined;
fs.writeFileSync(path.join(dir, 'assets', 'sting.json'), JSON.stringify({ dur: TL.total, out: 'sfx.wav', fade: 0, limit, cues: kept }, null, 1));
const count = kept.reduce((m, c) => (m[c.s] = (m[c.s] || 0) + 1, m), {});
console.log(`sfx ${cfg.slug}: ${kept.length} cues (${Object.entries(count).map(([k, v]) => k + ' ' + v).join(', ')})`);
if (!dry) execFileSync('node', [path.join(__dirname, '..', 'assets', 'logos', 'lifetechfacts', 'build-sting.js'), cfg.slug], { stdio: 'inherit', cwd: path.join(__dirname, '..') });
