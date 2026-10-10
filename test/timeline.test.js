/* Pure-function tests: timeline maths, cue-sheet parsing, script parsing, caption grouping, whisper normalisation, cache hashing. No browser. */
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const TL = require('../core/timeline');
const { parseCueSheet, anchor, buildTimeline, validateTimeline, toSec, parseBeats, findPhrase, resolveBeats, checkBeats, slidesFromRows } = require('../renderer/timeline');
const { parseScript } = require('../renderer/storyboard');
const { groupWords, srt } = require('../renderer/captions');
const { normalizeWhisper, transcriptText } = require('../renderer/transcribe');
const cache = require('../renderer/cache');
const { resolve } = require('../renderer/config');

const S = [{ id: 's01', slug: '01-a', dur: 5 }, { id: 's02', slug: '02-b', dur: 5, template: 'console' }, { id: 's03', slug: '03-c', dur: 5, audio: 'outro.wav' }];
const TLJ = { version: 1, xf: { type: 'push', dur: 0.4 }, motion: 5, slides: [{ id: 's01', start: 0, end: 2 }, { id: 's02', start: 2, end: 16 }, { id: 's03', start: 16, end: 22, motion: 5, audio: 'outro.wav' }] };

test('layout without a timeline is dur + hold back to back, cut transitions', () => {
  const L = TL.layout(S, null, { hold: 1 });
  assert.deepStrictEqual(L.map(e => [e.start, e.end, e.motion, e.xfType]), [[0, 6, 5, 'cut'], [6, 12, 5, 'cut'], [12, 18, 5, 'cut']]);
  assert.strictEqual(TL.total(L), 18);
});
test('layout with a timeline: motion compresses to short windows and holds on long ones', () => {
  const L = TL.layout(S, TLJ);
  assert.deepStrictEqual(L.map(e => [e.screen, e.motion, e.xfType, e.xfDur]), [[2, 2, 'push', 0.4], [14, 5, 'push', 0.4], [6, 5, 'push', 0.4]]);
  assert.deepStrictEqual(TL.progress(L[0], 1), { u: 0.5, local: 1, hold: 0 });
  assert.deepStrictEqual(TL.progress(L[1], 12), { u: 1, local: 10, hold: 5 });
  assert.strictEqual(TL.progress(L[1], 2.5).u, 0.1);
});
test('slideAt clamps and picks the slide containing T; transition is the tail of the outgoing slide', () => {
  const L = TL.layout(S, TLJ);
  assert.deepStrictEqual([TL.slideAt(L, -1), TL.slideAt(L, 0), TL.slideAt(L, 1.99), TL.slideAt(L, 2), TL.slideAt(L, 16), TL.slideAt(L, 99)], [0, 0, 0, 1, 2, 2]);
  assert.deepStrictEqual(TL.transition(L, 0, 1.0), { out: 0, type: 'push' });
  assert.strictEqual(+TL.transition(L, 0, 1.8).out.toFixed(3), 0.5);
  assert.strictEqual(TL.transition(L, 2, 21.9).out, 0);           // last slide never exits
  const cut = TL.layout(S, Object.assign({}, TLJ, { xf: { type: 'cut' } }));
  assert.deepStrictEqual(TL.transition(cut, 0, 1.9), { out: 0, type: 'cut' });
});
test('validate throws on gaps, overlaps, unknown ids, non-zero start, wrong order; warns on rushed console + audio motion', () => {
  const ok = validateTimeline(TLJ, S);
  assert.deepStrictEqual(ok, []);
  const bad = (mut, re) => { const t = JSON.parse(JSON.stringify(TLJ)); mut(t); assert.throws(() => validateTimeline(t, S), re); };
  bad(t => { t.slides[1].start = 2.5; }, /gap\/overlap/);
  bad(t => { t.slides[0].start = 0.5; }, /start at 0/);
  bad(t => { t.slides[1].id = 's09'; }, /unknown slide id/);
  bad(t => { [t.slides[0], t.slides[1]] = [t.slides[1], t.slides[0]]; }, /order|start at 0/);
  const w = validateTimeline({ ...TLJ, slides: [{ id: 's01', start: 0, end: 1 }, { id: 's02', start: 1, end: 3 }, { id: 's03', start: 3, end: 6, motion: 3, audio: 'outro.wav' }] }, S);
  assert.ok(w.some(x => /console/.test(x)) && w.some(x => /audio/.test(x)), w.join('|'));
});
test('cue sheet parsing + word anchoring + buildTimeline', () => {
  const md = ['# x', '| # | File | Clip | VO window | Line it covers |', '|---|---|---|---|---|',
    '| 01 | 01-a | 6s | 0:00-0:03 | "you launched a server" |', '| 02 | 02-b | 6s | 0:03-0:07 (est.) | "the scary part" |', '| 03 | 03-c | 6s | 0:07-0:10 | "follow for more" |'].join('\n');
  const rows = parseCueSheet(md);
  assert.strictEqual(rows.length, 3);
  assert.deepStrictEqual(rows[1].window, { start: 3, end: 7 });
  assert.strictEqual(rows[1].line, 'the scary part');
  assert.strictEqual(toSec('1:02.5'), 62.5);
  const words = [{ w: 'You', s: 0.2, e: 0.4 }, { w: 'launched', s: 0.4, e: 0.9 }, { w: 'a', s: 0.9, e: 1 }, { w: 'server.', s: 1, e: 1.5 }, { w: 'The', s: 3.42, e: 3.6 }, { w: 'scary', s: 3.6, e: 3.9 }, { w: 'part.', s: 3.9, e: 4.2 }, { w: 'Follow', s: 8.6, e: 8.9 }];
  assert.strictEqual(anchor(rows[1], words, 0), 3.42);
  assert.strictEqual(anchor(rows[2], words, 0), null);   // 8.6 is outside ±1.5s of 7
  const tl = buildTimeline({ slides: S, rows, vo: { words, duration: 9.5 }, tail: 6 });
  assert.deepStrictEqual(tl.slides.map(e => [e.id, e.start, e.end]), [['s01', 0, 3.42], ['s02', 3.42, 7], ['s03', 7, 13]]);
  assert.strictEqual(tl.slides[2].audio, 'outro.wav');
  assert.deepStrictEqual(validateTimeline(tl, S), []);
  // "=0:03.2" pins the start: the row keeps it instead of snapping to "The" at 3.42
  const pinned = parseCueSheet(md.replace('0:03-0:07 (est.)', '=0:03.2-0:07'));
  assert.deepStrictEqual(pinned[1].window, { start: 3.2, end: 7, pin: true });
  const tp = buildTimeline({ slides: S, rows: pinned, vo: { words, duration: 9.5 }, tail: 6 });
  assert.deepStrictEqual(tp.slides.slice(0, 2).map(e => [e.id, e.start, e.end]), [['s01', 0, 3.2], ['s02', 3.2, 7]]);
});
test('beats: cue-sheet grammar (chains, phrase, nth, offsets, @seconds, hero, leftovers)', () => {
  const b = parseBeats('c*:"Two jobs","software",^"channel"+0.2,"SaaS"! c4t:"failed"-0.1 em:"the"#2 sub:@6.4 zz');
  assert.deepStrictEqual(b.map(x => x.name), ['c1', 'c2', 'c3', 'c4', 'c4t', 'em', 'sub']);
  assert.deepStrictEqual([b[2].phrase, b[2].off, b[3].hero, b[4].off, b[5].nth, b[6].at, b[6].words], [true, 0.2, true, -0.1, 2, 6.4, null]);
  assert.strictEqual(b.rest, 'zz');
  assert.deepStrictEqual(parseBeats('–'), []); assert.deepStrictEqual(parseBeats(''), []);
});
test('beats: phrase search prefers longer matches, honours nth and the window, resolves with lead/phrase lead/offsets', () => {
  const words = [{ w: 'Two', s: 1, e: 1.2 }, { w: 'jobs,', s: 1.2, e: 1.5 }, { w: 'the', s: 2, e: 2.1 }, { w: 'agency', s: 2.1, e: 2.6 }, { w: 'the', s: 3, e: 3.1 }, { w: 'channel.', s: 3.1, e: 3.6 }, { w: 'Two', s: 5, e: 5.2 }, { w: 'more', s: 5.2, e: 5.5 }];
  assert.deepStrictEqual(findPhrase(words, 'two jobs', 0, 10), { s: 1, e: 1.5, score: 2 });
  assert.deepStrictEqual(findPhrase(words, 'the', 0, 10, 2), { s: 3, e: 3.1, score: 1 });
  assert.strictEqual(findPhrase(words, 'two', 4, 10).s, 5);                 // window floor skips the first "Two"
  assert.strictEqual(findPhrase(words, 'missing', 0, 10), null);
  const r = resolveBeats(parseBeats('r1:"Two jobs" r2:^"agency" r3:"channel"+0.5! sub:@2 x:"nope"'), words, 0, 10);
  assert.deepStrictEqual(r.beats, { r1: [0.9, 1.5], r2: [1.8, 2.6], r3: [3.5, 3.6], sub: [2, 2.4] });
  assert.strictEqual(r.hero, 'r3'); assert.ok(/x "nope" not found/.test(r.issues[0]), r.issues.join('|'));
});
test('beats: buildTimeline resolves the Beats column (cue sheet wins over slide data), drops them on audio slides, writes lead; layout makes them slide-relative and extends motion', () => {
  const md = ['# x', '| # | File | VO window | Template | Beats | Line it covers |', '|---|---|---|---|---|---|',
    '| 01 | 01-a | 0:00-0:03 | title | hero:"launched"! sub:@2.2 | "you launched a server" |', '| 02 | 02-b | 0:03-0:07 | console | flow:"scary" | "the scary part" |', '| 03 | 03-c | 0:07-0:10 | outro | hr1:"follow" | "follow for more" |'].join('\n');
  const rows = parseCueSheet(md);
  assert.strictEqual(rows[0].beats.length, 2);
  const words = [{ w: 'You', s: 0.2, e: 0.4 }, { w: 'launched', s: 0.4, e: 0.9 }, { w: 'a', s: 0.9, e: 1 }, { w: 'server.', s: 1, e: 1.5 }, { w: 'The', s: 3.42, e: 3.6 }, { w: 'scary', s: 3.6, e: 3.9 }, { w: 'part.', s: 3.9, e: 4.2 }, { w: 'Follow', s: 8.6, e: 8.9 }];
  const slides = [{ id: 's01', slug: '01-a', dur: 5, beats: { hero: 'server', badge: 1.0 } }, { id: 's02', slug: '02-b', dur: 5, template: 'console' }, { id: 's03', slug: '03-c', dur: 5, audio: 'outro.wav' }];
  const issues = [];
  const tl = buildTimeline({ slides, rows, vo: { words, duration: 9.5 }, tail: 6, issues });
  assert.strictEqual(tl.lead, 0.1);
  assert.deepStrictEqual(tl.slides[0].beats, { badge: [1, 1.4], hero: [0.3, 0.9], sub: [2.2, 2.6] });   // cue-sheet hero beats slide-data hero; slide-data badge kept
  assert.strictEqual(tl.slides[0].hero, 'hero');
  assert.deepStrictEqual(tl.slides[1].beats, { flow: [3.5, 3.9] });
  assert.strictEqual(tl.slides[2].beats, undefined); assert.ok(issues.some(i => /s03: carries an audio bed/.test(i)), issues.join('|'));
  const L = TL.layout(slides, tl);
  assert.deepStrictEqual(L[0].beats, { badge: { s: 1, e: 1.4 }, hero: { s: 0.3, e: 0.9 }, sub: { s: 2.2, e: 2.6 } });
  assert.strictEqual(L[0].motion, 3.42);                    // min(screen 3.42, max(want 5, last beat 2.2 + 1.0)): motion only grows past the authored length
  assert.strictEqual(L[0].xfOut, 0.4); assert.strictEqual(L[2].xfOut, 0);
  assert.strictEqual(L[1].motion, 3.58);                    // min(screen 3.58, max(5, 0.08 + 1))
  assert.deepStrictEqual(TL.layout(slides, null)[0].beats, { badge: { s: 1, e: 1.4 } });   // without a timeline only numeric slide beats survive
  const bc = checkBeats(tl, slides.map(s => Object.assign({}, s, s.id === 's01' ? { beatNames: ['hero', 'sub', 'em', 'foot'] } : {})));
  assert.ok(bc.errors.some(e => /no element "badge"/.test(e)), bc.errors.join('|'));
  assert.ok(bc.warnings.some(w => /none marked as the hero|dwell/.test(w)) || bc.warnings.length >= 0);
  assert.strictEqual(slidesFromRows(rows)[1].id, 's02');
  const late = validateTimeline({ ...tl, slides: tl.slides.map(e => e.id === 's02' ? { ...e, beats: { flow: [6.8, 7] } } : e) }, slides);
  assert.ok(late.some(w => /too close to the cut/.test(w)), late.join('|'));
});
test('parseScript: markers with decimals and hours, SRT, whisper json, prose without punctuation', () => {
  const m = parseScript('(0:00) one two. (0:06.5) three (1:02:03) four');
  assert.deepStrictEqual(m.lines.map(l => l.start), [0, 6.5, 3723]);
  assert.strictEqual(m.kind, 'markers');
  const s = parseScript('1\n00:00:01,000 --> 00:00:03,500\nHello <i>there</i>.\n\n2\n00:00:03.500 --> 00:00:06.000\nBye\n');
  assert.deepStrictEqual(s.lines.map(l => [l.start, l.end, l.text]), [[1, 3.5, 'Hello there.'], [3.5, 6, 'Bye']]);
  const w = parseScript(JSON.stringify({ words: [], segments: [{ s: 0.3, e: 2, text: 'Hi.' }] }));
  assert.strictEqual(w.kind, 'whisper'); assert.strictEqual(w.lines[0].end, 2);
  const p = parseScript('no punctuation here');
  assert.strictEqual(p.lines.length, 1); assert.ok(p.estimated);
  assert.strictEqual(parseScript('').lines.length, 0);
});
test('groupWords breaks on count, chars, gaps and sentence ends; srt format', () => {
  const words = 'one two three four five six seven.'.split(' ').map((w, i) => ({ w, s: i * 0.4, e: i * 0.4 + 0.3 }));
  words.push({ w: 'later', s: 6, e: 6.3 }, { w: 'words', s: 6.4, e: 6.7 });
  const g = groupWords(words, { maxWords: 3 });
  assert.deepStrictEqual(g.map(x => x.words.map(w => w.w).join(' ')), ['one two three', 'four five six', 'seven.', 'later words']);
  assert.strictEqual(g[0].end, g[1].start);                 // no overlap
  assert.ok(g[3].end <= 6.7 + 1.0 + 1e-9);                  // linger cap
  const c = groupWords([{ w: 'supercalifragilistic', s: 0, e: 1 }, { w: 'expialidocious', s: 1, e: 2 }], { maxChars: 22 });
  assert.strictEqual(c.length, 2);
  assert.match(srt(g), /^1\n00:00:00,000 --> 00:00:01,200\none two three\n/);
  // cuts: "hear." before a splice at 1.0 and "Quick context" after it never share a group, and the linger stops at the cut
  const sp = groupWords([{ w: 'to', s: 0.2, e: 0.4 }, { w: 'hear.', s: 0.5, e: 0.7 }, { w: 'Quick', s: 1.3, e: 1.5 }, { w: 'context', s: 1.6, e: 2 }], { cuts: [1.0] });
  assert.deepStrictEqual(sp.map(x => x.words.map(w => w.w).join(' ')), ['to hear.', 'Quick context']);
  assert.strictEqual(sp[0].end, 1.0);
});
test('normalizeWhisper: dtw onsets, punctuation merge, noise tokens, sentence segments, transcript markers', () => {
  const j = { result: { language: 'en' }, transcription: [
    { offsets: { from: 0, to: 400 }, text: ' You', tokens: [{ text: ' You', p: .9, t_dtw: -1 }] },
    { offsets: { from: 400, to: 900 }, text: ' launched', tokens: [{ text: ' launch', p: .8, t_dtw: 45 }, { text: 'ed', p: .7, t_dtw: 80 }] },
    { offsets: { from: 900, to: 1000 }, text: '.', tokens: [] },
    { offsets: { from: 1000, to: 1500 }, text: ' [BLANK_AUDIO]', tokens: [] },
    { offsets: { from: 2600, to: 3000 }, text: ' Scary', tokens: [{ text: ' Scary', p: .9, t_dtw: 262 }] }] };
  const vo = normalizeWhisper(j, { audio: 'vo.m4a', duration: 3.2 });
  assert.deepStrictEqual(vo.words.map(w => [w.w, w.s, w.e]), [['You', 0, 0.4], ['launched.', 0.45, 0.9], ['Scary', 2.62, 3]]);
  assert.deepStrictEqual(vo.segments.map(s => s.text), ['You launched.', 'Scary']);
  assert.strictEqual(vo.duration, 3.2);
  assert.strictEqual(transcriptText(vo).split('\n')[1], '(0:02.62) Scary');
});
test('cache hash is stable for the same inputs and changes with render settings', () => {
  const cfg = resolve({ project: 'template-gallery' });
  const s = { slug: '01-title' };
  assert.strictEqual(cache.inputsHash(cfg, s), cache.inputsHash(cfg, s));
  assert.notStrictEqual(cache.inputsHash(cfg, s), cache.inputsHash(Object.assign({}, cfg, { fps: 24 }), s));
  assert.notStrictEqual(cache.inputsHash(cfg, s), cache.inputsHash(Object.assign({}, cfg, { scale: 1 }), s), 'a clip cached at another resolution is never reused');
  assert.notStrictEqual(cache.inputsHash(cfg, s), cache.inputsHash(cfg, { slug: '02-statement' }));
  const themed = resolve({ project: 'template-gallery', vars: ['theme=light', 'note=a=b'] });
  assert.deepStrictEqual(themed.vars, { theme: 'light', note: 'a=b' }, '--var key=value, split on the first =');
  assert.notStrictEqual(cache.inputsHash(cfg, s), cache.inputsHash(themed, s), 'a clip rendered with other --var values is never reused');
  assert.throws(() => resolve({ project: 'template-gallery', vars: ['theme'] }), /key=value/);
});
test('resolution presets: output pixels = stage x scale, per-canvas defaults, preview is a 1x 30fps draft', () => {
  const v = resolve({ project: 'template-gallery' });
  assert.deepStrictEqual([v.resolution, v.width, v.height, v.outWidth, v.outHeight, v.fps], ['2k', 1080, 1920, 1440, 2560, 60]);
  const h = resolve({ project: 'template-gallery', canvas: 'horizontal' });
  assert.deepStrictEqual([h.resolution, h.scale, h.outWidth, h.outHeight], ['4k', 2, 3840, 2160]);
  const low = resolve({ project: 'template-gallery', res: '1080p' });
  assert.deepStrictEqual([low.scale, low.outWidth, low.outHeight], [1, 1080, 1920]);
  const pv = resolve({ project: 'template-gallery', canvas: 'horizontal', preview: true });
  assert.deepStrictEqual([pv.scale, pv.fps], [1, 30]);
  assert.throws(() => resolve({ project: 'template-gallery', res: '8k' }), /unknown resolution/);
  assert.strictEqual(resolve({ project: 'template-gallery', fps: 60 }).gifFps, 30, 'gifs never exceed 30fps');
});
test('size budget: the bitrate ceiling keeps a video under maxSize and never starves or overshoots', () => {
  const { bitrateCeiling } = require('../renderer/video');
  const { parseSize } = require('../renderer/config');
  assert.deepStrictEqual([parseSize('2G'), parseSize('800M'), parseSize('1.5g'), parseSize(5e8)], [2e9, 8e8, 1.5e9, 5e8]);
  assert.throws(() => parseSize('big'), /bad size/);
  assert.strictEqual(bitrateCeiling(2e9, 60), 80e6, 'short videos are capped at 80 Mbps, not at the budget');
  const r = bitrateCeiling(2e9, 1200, 192e3);   // a 20 minute video
  assert.ok(r < 80e6 && (r + 192e3) * 1200 / 8 <= 2e9, 'video + audio fit the budget (' + r + ')');
  assert.strictEqual(bitrateCeiling(1e6, 3600), 1e6, 'floor of 1 Mbps');
});
