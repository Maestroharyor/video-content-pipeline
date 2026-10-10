/* Build / load / validate projects/<slug>/timeline.json (Node side). The maths live in core/timeline.js. */
const fs = require('fs');
const path = require('path');
const TL = require('../core/timeline');

const r3 = x => Math.round(x * 1000) / 1000;
const toSec = s => { const m = String(s).trim().match(/^(?:(\d+):)?(\d+):(\d\d(?:\.\d+)?)$/); return m ? (+m[1] || 0) * 3600 + +m[2] * 60 + parseFloat(m[3]) : NaN; };

function loadTimeline(dir) {
  const f = path.join(dir, 'timeline.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}
function writeTimeline(dir, tl) {
  const f = path.join(dir, 'timeline.json');
  const body = JSON.stringify(tl, null, 2).replace(/\{\n\s+"id"([^}]*?)\n\s+\}/g, m => m.replace(/\n\s+/g, ' ').replace(/ \}$/, ' }'));
  fs.writeFileSync(f, body + '\n');
  return f;
}
/* rows of the cue-sheet table: {n, file, window:{start,end}, template, line} — columns found by header name */
function parseCueSheet(md) {
  const lines = md.split('\n');
  const hi = lines.findIndex(l => /^\|\s*#\s*\|/.test(l));
  if (hi < 0) return [];
  const cols = lines[hi].split('|').slice(1, -1).map(c => c.trim().toLowerCase());
  const idx = name => cols.findIndex(c => c.startsWith(name));
  const iFile = idx('file'), iWin = idx('vo window'), iTpl = idx('template'), iLine = idx('line'), iBeats = idx('beats');
  const rows = [];
  for (let i = hi + 2; i < lines.length && /^\|/.test(lines[i]); i++) {
    const c = lines[i].split('|').slice(1, -1).map(x => x.trim());
    const win = (c[iWin] || '').replace(/\s*\(est\.?\)/i, '').split(/\s*[-–]\s*/);
    // "=0:23.30-…" pins the start: no snap to the line's first word (a cut that must land in a pause, before a splice)
    const pin = /^=/.test(win[0] || '');
    rows.push({ n: c[0], file: c[iFile], window: { start: toSec((win[0] || '').replace(/^=/, '')), end: toSec(win[1]), ...(pin && { pin: true }) }, template: iTpl >= 0 ? c[iTpl] : null,
      line: iLine >= 0 ? (c[iLine] || '').replace(/^"|"$/g, '') : '', beats: iBeats >= 0 ? parseBeats(c[iBeats]) : [], beatsCell: iBeats >= 0 ? (c[iBeats] || '') : '' });
  }
  return rows.filter(r => r.file);
}
const norm = w => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
/* Beats cell grammar (one item per element):  name:"spoken words"[#n][±off][!]   name*:"a","b","c" (chain r1,r2,r3)
   name:@seconds (slide-relative, no lead)   ^"words" = phrase/container anchor (leads by PHRASE_LEAD instead of LEAD)
   ! = the hero beat. Returns [{name, words, nth, at, phrase, off, hero}]; unparsable text is kept in .rest */
const ANCHOR = '(?:\\^?"[^"]*"(?:#\\d+)?|@\\d*\\.?\\d+)(?:[+-]\\d*\\.?\\d+)?!?';
function parseBeats(cell) {
  const out = []; const src = (cell || '').trim();
  if (!src || src === '–' || src === '-' || src === '—') return out;
  const re = new RegExp('([A-Za-z?][\\w.]*)(\\*?):(' + ANCHOR + '(?:\\s*,\\s*' + ANCHOR + ')*)', 'g');
  let m, rest = src;
  while ((m = re.exec(src))) {
    rest = rest.replace(m[0], '');
    const chain = m[2] === '*', ar = /(\^?)(?:"([^"]*)"(?:#(\d+))?|@(\d*\.?\d+))([+-]\d*\.?\d+)?(!?)/g; let k, i = 0;
    while ((k = ar.exec(m[3]))) {
      out.push({ name: chain ? m[1] + (++i) : m[1], words: k[2] != null ? k[2] : null, nth: k[3] ? +k[3] : 1, at: k[4] != null ? +k[4] : null,
        phrase: k[1] === '^', off: k[5] ? +k[5] : 0, hero: k[6] === '!' });
      if (!chain) break;
    }
  }
  rest = rest.replace(/[\s,]+/g, ' ').trim();
  if (rest) out.rest = rest;
  return out;
}
/* beats authored in slide data ({name: 'words' | seconds | {w, at, off, phrase, hero, nth}}) → the same item shape */
function dataBeats(obj) {
  const out = []; if (!obj) return out;
  for (const name in obj) {
    const v = obj[name];
    /* [start, end] pairs are a RESOLVED timeline's beats, which reach here when the deck was opened with an
       existing timeline.json injected. They carry no anchor, so keeping them only invents an unresolvable item
       under a beat name the slide may no longer have — a phantom error that survives until the timeline is
       rebuilt. The cue sheet is the only author of beats; drop anything that cannot anchor itself. */
    if (Array.isArray(v)) continue;
    if (typeof v === 'number') out.push({ name, words: null, nth: 1, at: v, phrase: false, off: 0, hero: false });
    else if (typeof v === 'string') out.push({ name, words: v, nth: 1, at: null, phrase: false, off: 0, hero: false });
    else if (v && typeof v === 'object' && (v.w || v.words || typeof v.at === 'number')) out.push({ name, words: v.w || v.words || null, nth: v.nth || 1, at: typeof v.at === 'number' ? v.at : null, phrase: !!v.phrase, off: v.off || 0, hero: !!v.hero });
  }
  return out;
}
/* the n-th best-scoring occurrence of a 1–4 word phrase whose first word starts inside [lo, hi) → {s, e, score} | null */
function findPhrase(words, phrase, lo, hi, nth = 1) {
  const toks = String(phrase || '').replace(/\.\.\./g, ' ').split(/\s+/).map(norm).filter(Boolean).slice(0, 4);
  if (!toks.length || !words || !words.length) return null;
  const hits = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w.s < lo) continue; if (w.s >= hi) break;
    if (norm(w.w) !== toks[0]) continue;
    let score = 1;
    for (let k = 1; k < toks.length; k++) { if (words[i + k] && norm(words[i + k].w) === toks[k]) score++; else break; }
    hits.push({ s: w.s, e: words[i + score - 1].e, score });
  }
  if (!hits.length) return null;
  const best = Math.max(...hits.map(h => h.score)), top = hits.filter(h => h.score === best);
  return top[Math.min(Math.max(1, nth), top.length) - 1];
}
/* resolve one slide's beat items against the words inside its window → {beats: {name: [absStart, absEnd]}, hero, issues: [text]} */
function resolveBeats(items, words, start, end, { lead = TL.LEAD, phraseLead = TL.PHRASE_LEAD } = {}) {
  const beats = {}, issues = []; let hero = null;
  for (const it of items) {
    if (/^\?/.test(it.name)) { issues.push(`beat target "${it.name}" is still a draft placeholder`); continue; }
    let st, en;
    if (it.at != null) { st = start + it.at; en = st + TL.BEAT_LEN; }
    else {
      const f = findPhrase(words, it.words, start, end, it.nth);
      if (!f) { issues.push(`beat ${it.name} "${it.words}" not found in ${start.toFixed(2)}–${end.toFixed(2)}s (fraction fallback)`); continue; }
      st = f.s - (it.phrase ? phraseLead : lead); en = f.e;
    }
    st = Math.max(start, st + (it.off || 0)); en = Math.max(en, st + 0.1);
    beats[it.name] = [r3(st), r3(en)];
    if (it.hero) hero = it.name;
  }
  return { beats, hero, issues };
}
/* placeholder slides for cue-sheet-only runs (--words/--dry before any slide file exists): ids derive from the slug number like the registry */
function slidesFromRows(rows, dur = 5) {
  return rows.map((r, i) => { const slug = r.file.replace(/\.js$/, ''), m = slug.match(/^(\d+)/);
    return { id: 's' + (m ? m[1].padStart(2, '0') : String(i + 1).padStart(2, '0')), slug, dur, audio: null, template: r.template || null, beats: null, beatNames: null }; });
}
/* snap a row's start to the first word of its line in vo.json; searches ±win seconds around the cue start, never before floor */
function anchor(row, words, floor = 0, win = 1.5) {
  const toks = row.line.replace(/\.\.\./g, ' ').split(/\s+/).map(norm).filter(Boolean).slice(0, 3);
  if (!toks.length || !words || !words.length) return null;
  const lo = Math.max(floor, row.window.start - win), hi = row.window.start + win;
  let best = null;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w.s < lo) continue; if (w.s > hi) break;
    if (norm(w.w) !== toks[0]) continue;
    let score = 1;
    for (let k = 1; k < toks.length; k++) if (words[i + k] && norm(words[i + k].w) === toks[k]) score++;
    const d = Math.abs(w.s - row.window.start);
    if (!best || score > best.score || (score === best.score && d < best.d)) best = { s: w.s, score, d };
  }
  return best ? best.s : null;
}
/* rows (cue sheet) + slides (window.SLIDES) + optional vo → timeline object */
function buildTimeline({ slides, rows, vo, fps = 30, xf = { type: 'push', dur: 0.4 }, motion = 5, tail = 6, voFile = null, lead = TL.LEAD, log = () => {}, issues = [] }) {
  const bySlug = {}; slides.forEach(s => { bySlug[s.slug] = s; bySlug[s.id] = s; });
  const used = rows.map(r => bySlug[r.file] || bySlug[r.file.replace(/\.js$/, '')]).filter(Boolean);
  if (!used.length) throw new Error('no cue-sheet row matches a slide (File column must hold the slide slug)');
  const words = vo && vo.words;
  const out = [], rowOf = {};
  let floor = 0;
  rows.forEach((r, i) => {
    const s = bySlug[r.file] || bySlug[r.file.replace(/\.js$/, '')]; if (!s) { log(`skip row ${r.n}: no slide ${r.file}`); return; }
    rowOf[s.id] = r;
    let start = i === 0 ? 0 : r.window.start;
    if (i > 0 && words && !r.window.pin) {
      const a = anchor(r, words, floor + 0.5);
      if (a != null) { if (Math.abs(a - start) > 0.01) log(`${s.id} start ${start.toFixed(2)} → ${a.toFixed(2)} (first word "${r.line.split(/\s+/)[0]}")`); start = a; }
      else log(`${s.id}: no word anchor found near ${start.toFixed(2)}s, keeping the cue-sheet time`);
    }
    if (!(start >= floor)) throw new Error(`${s.id}: start ${start} is before the previous slide`);
    const e = { id: s.id, slug: s.slug, start: r3(start), end: null };
    /* A slide may override the deck's transition with defineSlide({ xf: 'cut' }). core/timeline.js has always
       honoured a per-entry xf (`const type = e.xf || xfT`); nothing wrote one until now. It is how two adjacent
       slides that hold the same standing object avoid a cross-fade: identical geometry either side of a cut
       reads as the object never moving, where a fade dips it through 40% opacity and looks like a rebuild. */
    if (s.xfWant) e.xf = s.xfWant;
    if (s.audio) { e.motion = 5; e.audio = s.audio; }
    out.push(e); floor = start;
  });
  out.forEach((e, i) => {
    if (i < out.length - 1) e.end = out[i + 1].start;
    else { const row = rows[rows.length - 1]; const voEnd = vo && vo.duration ? vo.duration : 0; e.end = r3(Math.max(e.start + tail, voEnd, isNaN(row.window.end) ? 0 : row.window.end)); }
    if (!(e.end > e.start)) throw new Error(`${e.id}: empty window (${e.start} → ${e.end})`);
  });
  // beats: slide data first, the cue sheet wins per name; resolved against the words inside the slide's window
  out.forEach(e => {
    const r = rowOf[e.id], s = bySlug[e.id];
    const byName = {}; dataBeats(s.beats).concat(r.beats || []).forEach(it => { byName[it.name] = it; });
    const items = Object.values(byName);
    const note = t => { issues.push(`${e.id}: ${t}`); log(`${e.id}: ${t}`); };
    if (r.beats && r.beats.rest) note(`could not parse "${r.beats.rest}" in the Beats cell`);
    if (!items.length) return;
    if (s.audio) { note('carries an audio bed, beats ignored (motion stays 5s)'); return; }
    if (!words && items.some(it => it.at == null)) note('word beats need vo.json (only @seconds beats resolved)');
    const res = resolveBeats(items.filter(it => it.at != null || words), words || [], e.start, e.end, { lead });
    res.issues.forEach(note);
    if (Object.keys(res.beats).length) { e.beats = res.beats; if (res.hero) e.hero = res.hero; }
  });
  return { version: 1, fps, total: out[out.length - 1].end, vo: voFile, words: vo ? 'vo.json' : null, xf, motion, lead, slides: out };
}
/* beat sanity for `npm run timeline --check`: {errors, warnings}. slides may carry beatNames (from the deck) to validate names. */
function checkBeats(tl, slides, { minGap = 0.35, dwell = 0.9 } = {}) {
  const errors = [], warnings = [];
  const L = TL.layout(slides.filter(s => tl.slides.some(e => e.id === s.id)), tl);
  const byId = {}; slides.forEach(s => { byId[s.id] = s; });
  L.forEach(e => {
    if (!e.beats) return;
    const s = byId[e.id], names = Object.keys(e.beats), exit = e.screen - e.xfOut;
    if (s && s.beatNames) names.forEach(n => { if (!s.beatNames.includes(n) && !s.beatNames.includes(n.replace(/\d+$/, '*'))) errors.push(`${e.id}: ${s.template || 'slide'} has no element "${n}" (beat names: ${s.beatNames.join(' ')})`); });
    names.forEach(n => {
      const b = e.beats[n];
      if (b.s + TL.BEAT_LEN > exit) errors.push(`${e.id}: ${n} enters at ${b.s}s but the exit starts at ${r3(exit)}s`);
      else if (exit - (b.s + TL.BEAT_LEN) < dwell) warnings.push(`${e.id}: ${n} settles ${r3(exit - (b.s + TL.BEAT_LEN))}s before the exit (dwell floor ${dwell}s)`);
    });
    // chains (r1, r2, …) must run in speech order and not bunch up
    const chains = {};
    names.forEach(n => { const m = n.match(/^([A-Za-z.]+?)(\d+)$/); if (m) (chains[m[1]] = chains[m[1]] || []).push([+m[2], e.beats[n].s, n]); });
    Object.values(chains).forEach(ch => { ch.sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < ch.length; i++) {
        if (ch[i][1] < ch[i - 1][1]) warnings.push(`${e.id}: ${ch[i][2]} (${ch[i][1]}s) is before ${ch[i - 1][2]} (${ch[i - 1][1]}s) — speech order`);
        else if (ch[i][1] - ch[i - 1][1] < minGap) warnings.push(`${e.id}: ${ch[i - 1][2]} → ${ch[i][2]} only ${r3(ch[i][1] - ch[i - 1][1])}s apart (< ${minGap}s)`);
      } });
    if (names.length >= 2 && !e.hero) warnings.push(`${e.id}: ${names.length} beats, none marked as the hero (!)`);
  });
  return { errors, warnings };
}
function validateTimeline(tl, slides) { return TL.validate(tl, slides); }
module.exports = { loadTimeline, writeTimeline, parseCueSheet, anchor, buildTimeline, validateTimeline, toSec, parseBeats, dataBeats, findPhrase, resolveBeats, slidesFromRows, checkBeats, norm };
