#!/usr/bin/env node
/* Sound-effects track from the timeline: every beat that names a reveal gets a small synthesised sound, written as a
   cue list (assets/sting.json) and built into one full-length wav (assets/sfx.wav) by
   assets/logos/lifetechfacts/build-sting.js. `npm run dual` mixes it under the voiceover when project.js has
   cta: { sfx: 'assets/sfx.wav', sfxAt: 0, gain: .7 }. Re-run after every `npm run timeline`.
     npm run sfx -- --project <slug> [--dry] [--var fx=<variant>]
   Default rules (by beat name, so they follow the template conventions in skills/new-video/references/templates.md).
   The palette (richCue below) comes first: swish on strikes/edges/highlighters, tap on panels/cards/wire nodes,
   chains (k r t c i li ri s m + n) pluck up a pentatonic scale, badges pluck high, bubbles boop, stamps thump with a
   glitch (sd) or a falling tone (stop), a deadline track ticks (ticks, m6, m12), a burst adds a chime. What it does
   not claim falls through to the rules below; PROJECT.sfx.palette = 'pop' skips it entirely:
     rise   soft whoosh 0.3s before each slide enters (not the first, not the outro, not PROJECT.sfx.noRise slides)
     type   key clicks under a terminal command typing (c<n>, tc<n>, w<n>c<n>) and code lines (l<n>, p<i>l<j>, w<n>l<n>),
            ONLY on the slides listed in PROJECT.sfx.type (opt-in). Never under a prompt being typed: prompts pop
     pop    reveals: b/q/a/bd/t/x/k<n>, la ra meter fill, map fills f<slot>, and by default EVERY other element beat
            (a chip, tile, row, card: each point that lands pops). Text beats (em eb h1 foot sub), code lines, stickers
            and fx beats stay quiet (QUIET below). Typing is opt-in per slide (PROJECT.sfx.type); everywhere else c<n> pops like any chip.
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
   pops: 'list' (PROJECT.sfx.pops) narrows the ui palette's landing pop to points being listed (a numbered series on one
            slide: q1 q2 q3, c1 c2) and each slide's hero beat; every other landing is silent (user, 2026-10-21: "pop
            should only be for when listing points or when needed"). Other roles (click, ok, err, strike, ask…) still sound.
   keys     PROJECT.sfx.keys = {'<slide prefix>': {<beat>: <chars>}}: a prompt typing itself (pass cc kind, `parts`) gets
            recorded key clicks from its beat for min(2, chars/18) s, the same pace the slide types at (user, same day:
            "typing sound effect here"); those beats make no other sound.
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
/* The 'ui' palette (default since 2026-10-11, after "item reveals sound like an ATM counting cash"): recorded UI
   sounds from the Kenney packs (assets/audio/sfx, CC0) chosen by what the moment IS, never a pitched scale. Practice it
   follows: a sound on the frame the thing lands, clicks only for a pointer press, a whoosh only for a scene move, sharp
   hits saved for the one key moment, several variants so repeats do not read as a machine, everything under the voice.
   Roles come from the beat's name (below) or PROJECT.sfx.roles = {'<slide prefix>:<beat>' | '<beat>': role}.
   Density: land cues closer than 0.16 s collapse into one, and at most 3 land cues play in any 1 s (a stagger of
   chips is one gesture, not a run of coins). */
const UI = '../../../assets/audio/sfx/';
/* Revision 2 (the user, after hearing it): the drop sample "sounds like cashing" and random variants made the deck
   "inconsistent". So: ONE sound per role, always the same one. Landings are the soft synth pop (one per point, as the
   house rule asks); data moving is a soft synth whoosh; a pointer press is a real recorded mouse click + release
   (Kenney UI Audio, CC0), loud enough to hear under the voice. Recorded samples only where a synth cannot fake it. */
const ROLE = {
  land: [{ s: 'pop', v: .5 }],
  click: [{ s: 'sample', f: UI + 'ku-mouseclick1.wav', v: 1.6 }, { s: 'sample', f: UI + 'ku-mouserelease1.wav', v: 1.2, dt: .08 }],
  ok: [{ s: 'sample', f: UI + 'ki-confirmation_001.wav', v: .7 }],
  err: [{ s: 'sample', f: UI + 'ki-error_004.wav', v: .6 }],
  strike: [{ s: 'swish', d: .3, f: 1300, v: .6 }],
  toggle: [{ s: 'sample', f: UI + 'ki-switch_001.wav', v: .55 }],
  ask: [{ s: 'boop', f: 520, k: 1400, v: .4 }],
  open: [{ s: 'tap', v: .7 }],
  glass: [{ s: 'swish', d: .35, f: 2600, v: .35 }],
  knock: [{ s: 'tap', f: 170, v: .9 }],   // a low wooden knock: a box set down on a shelf (bun-and-elysia)
};
const uiCue = (role, t) => ROLE[role].map(c => { const o = Object.assign({}, c, { t: r3(t + (c.dt || 0)), role }); delete o.dt; return o; });
function uiRole(slug, n) {
  const R = S.roles || {}, k = Object.keys(R).find(x => x === n || (x.includes(':') && slug.startsWith(x.split(':')[0]) && x.split(':')[1] === n));
  if (k) return R[k];
  // a click is a pointer pressing something; nothing else may click (revision 3: cards named c1/c2 used to)
  if (/^(click|cart|order|btn|press)$/.test(n)) return 'click';
  if (/^(burst|ok|done|conf|confirmed|paid|orig|deployed|plus|s5)$/.test(n)) return 'ok';
  if (/^(shake|crash|brk|err|fail|stamp)$/.test(n)) return n === 'stamp' ? null : 'err';
  if (/^(x\d*|strike|st)$/.test(n)) return 'strike';
  if (/^(q\d*|why|ask|who)$/.test(n)) return 'ask';
  if (/^(e\d+|ride|back|resp|hook|charge|copy|miss|hit|route|flow|go|leave|pub|ev)$/.test(n)) return 'glass';
  if (/^(alt|flip|toggle|on|off)$/.test(n)) return 'toggle';
  if (/^(page|win|panel|map|line|sys|cam)$/.test(n)) return 'open';
  return 'land';
}
/* key clicks for a typed prompt: one recorded click per ~2 characters, cycling five Kenney clicks with a fixed
   jitter so the run sounds like hands, not a metronome (deterministic, so a rebuild sounds the same) */
const KEYS = [1, 2, 3, 4, 5].map(k => UI + `ku-click${k}.wav`);
function keyCues(a, chars) {
  const len = Math.min(2, chars / 18), n = Math.max(1, Math.round(chars / 2)), out = [];
  for (let j = 0; j < n; j++) out.push({ s: 'sample', f: KEYS[(j * 3) % 5], t: r3(a + len * j / n + ((j * 37) % 7 - 3) * .006), v: r3(.13 + ((j * 13) % 5) * .012) });
  return out;
}
/* PROJECT.sfx.typed = a JSON file in the project, [[start, length, chars], …] in deck time, one row per code line that
   types itself (measured from the page, since the typing length depends on the rendered text). Lines that overlap are
   merged into one run, then clicked at about 12 keys a second, like the prompt clicks above (user, frontend-one-click
   review 4: "We need typing sound effect where we are typing code"). */
function typedCues(rows) {
  const runs = [];
  rows.slice().sort((x, y) => x[0] - y[0]).forEach(([a, len]) => {
    const z = a + len, last = runs[runs.length - 1];
    if (last && a <= last[1] + .08) last[1] = Math.max(last[1], z); else runs.push([a, z]);
  });
  const out = [];
  runs.forEach(([a, z]) => {
    const n = Math.max(2, Math.round((z - a) * 12));
    for (let j = 0; j < n; j++) out.push({ s: 'sample', f: KEYS[(j * 3) % 5], t: r3(a + (z - a) * j / n + ((j * 37) % 7 - 3) * .006), v: r3((.13 + ((j * 13) % 5) * .012) * (S.typedGain || 1)) });
  });
  return out;
}
if (S.typed) cues.push(...typedCues(JSON.parse(fs.readFileSync(path.join(dir, S.typed), 'utf8'))));
/* PROJECT.sfx.cues = a JSON file of ready cues ([{s, t, …}] in deck time) that a scene placed itself (measured from the page
   like `typed`): react-to-solid's cheat sheet swishes on every card and pops on every recap rule. sfx.typedGain scales the
   typed key clicks (preview review 1: "the cheat sheet should have sound"). */
if (S.cues) cues.push(...JSON.parse(fs.readFileSync(path.join(dir, S.cues), 'utf8')));
/* PROJECT.sfx.clicks = a JSON file in the project, [time, …] in deck time: every frame a scene's pointer presses
   (measured from the page like `typed`). Each gets the click role's mouse click + release, and a role click that
   falls within 0.6 s of one is dropped so a press never sounds twice (user, frontend-one-click review 5: "All click
   demos in the UI should have click sound effects, we have in some and not in others"). */
const CLICKS = S.clicks ? JSON.parse(fs.readFileSync(path.join(dir, S.clicks), 'utf8')) : [];
CLICKS.forEach(t => cues.push(...uiCue('click', t)));
const nearClick = t => CLICKS.some(c => Math.abs(c - t) < .6);
TL.slides.forEach((s, i) => {
  if (/outro/.test(s.slug)) return;
  const keys = Object.entries(S.keys || {}).find(([k]) => s.slug.startsWith(k));
  const series = {};
  Object.keys(s.beats || {}).forEach(n => { const m = n.match(/^([a-z]+)\d+$/); if (m) series[m[1]] = (series[m[1]] || 0) + 1; });
  const listed = n => { const m = n.match(/^([a-z]+)\d+$/); return n === s.hero || !!(m && series[m[1]] > 1); };                                    // the outro carries its own bed
  if (has(S.arrive, s.slug)) cues.push({ s: 'chime', t: r3(s.start + .35), v: .4 });   // a station arrival: the section's first scene
  if (i > 0 && !has(S.noRise, s.slug)) cues.push({ s: 'rise', t: r3(s.start - .3), d: .32, f: 2600, v: S.palette === 'pop' || S.palette === 'rich' ? .55 : .3 });
  Object.entries(s.beats || {}).forEach(([n, [a]]) => {
    const t = r3(a - LEAD);
    if (keys && keys[1][n] != null) { cues.push(...keyCues(a, keys[1][n])); return; }
    /* key clicks are opt-in (user rule, 2026-10-19): only on slides listed in PROJECT.sfx.type, where a terminal command
       really types. A prompt being typed, a card or a chip pops like every other point. */
    if (has(S.type, s.slug) && !has(S.noType, s.slug) && /^(c|tc|w\dc|l|p\dl|w\dl)\d+$/.test(n)) cues.push({ s: 'type', t, d: .7, v: .8 });
    else if (S.palette !== 'pop' && S.palette !== 'rich' && !/^(em|eb|h1|foot|sub|dim|mj\d+)$/.test(n)) { const r = uiRole(s.slug, n); if (r && !(S.pops === 'list' && (r.role || r) === 'land' && !listed(n)) && !((r.role || r) === 'click' && nearClick(t))) cues.push(...uiCue(r.role || r, r3(t + (r.dt || 0)))); }
    else if (S.palette !== 'pop' && !QUIET.test(n) && richCue(n, t)) { /* placed by the rich palette */ }
    else if (/^(b|q|a|bd|t|x|k)\d+$/.test(n) || /^(la|ra|meter|fill)$/.test(n) || /^f(ec2|s3|cdn|lb|db)$/.test(n)) cues.push({ s: 'pop', t, v: .55 });
    else if (/^[lr]i\d+$/.test(n) && has(S.tick, s.slug)) cues.push({ s: 'blip', t: r3(t + .3), f: 1320, k: 30, v: .6 });
    else if (!QUIET.test(n)) cues.push({ s: 'pop', t, v: .5 });         // every other element that lands is a point: it pops
    if (n === 'stamp' || n === 'divx' || (S.thump || []).some(x => s.slug.startsWith(String(x.slide)) && x.beat === n)) cues.push({ s: 'thump', t, v: .8 });
    if (n === 'pager') [0, .32, .64].forEach(o => cues.push({ s: 'blip', t: r3(t + .4 + o), f: 150, k: 5, d: .28, v: 1.4 }));
    if (/^mj\d+$/.test(n)) cues.push({ s: 'boop', t: r3(a - .05), v: .5 });
    if (n === 'burst') cues.push({ s: 'shim', t, v: S.palette === 'pop' || S.palette === 'rich' ? .8 : .45 });
    if (n === 'burst' && S.palette === 'rich') cues.push({ s: 'chime', t, v: .7 });
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
/* --var k=v names a variant of the deck (e.g. --var fx=plus): PROJECT.sfx.variants[v](timeline) adds its cues, and the
   track goes to assets/sfx-<v>.wav (cue list sting-<v>.json), so the main cut's sfx.wav is never touched */
const tag = Object.values(cfg.vars || {}).join('-');
if (tag && S.variants && S.variants[tag]) S.variants[tag](TL).forEach(c => cues.push(c));
let kept = cues.filter(c => c.t >= 0).sort((x, y) => x.t - y.t);
{ // landings: only cues that coincide (< 0.08 s apart) merge, so every point still sounds (consistency over thinning)
  let last = -9; kept = kept.filter(c => { if (c.role !== 'land') return true; if (c.t - last < .08) return false; last = c.t; return true; });
  kept.forEach(c => { delete c.role; });
}
fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
// outro music is mastered near full scale: the default -6 dB peak limit would squash it, so a track that carries it
// is limited at -0.4 dB instead (the effects themselves peak far below either)
const limit = S.outroBed ? .95 : undefined;
const spec = tag ? `sting-${tag}.json` : 'sting.json';
fs.writeFileSync(path.join(dir, 'assets', spec), JSON.stringify({ dur: TL.total, out: tag ? `sfx-${tag}.wav` : 'sfx.wav', fade: 0, limit, cues: kept }, null, 1));
const count = kept.reduce((m, c) => (m[c.s] = (m[c.s] || 0) + 1, m), {});
console.log(`sfx ${cfg.slug}: ${kept.length} cues (${Object.entries(count).map(([k, v]) => k + ' ' + v).join(', ')})`);
if (!dry) execFileSync('node', [path.join(__dirname, '..', 'assets', 'logos', 'lifetechfacts', 'build-sting.js'), cfg.slug, spec], { stdio: 'inherit', cwd: path.join(__dirname, '..') });
