const { test } = require('node:test');
const assert = require('node:assert');
const SC = require('../renderer/socialcut');

const words = [
  { w: 'One', s: 1.0, e: 1.3 }, { w: 'line.', s: 1.3, e: 3.5 },     // sentence-final word stretched over the pause
  { w: 'Two', s: 4.0, e: 4.2 }, { w: 'lines.', s: 4.2, e: 4.6 },
  { w: 'Three.', s: 10.0, e: 10.4 },
];
const splice = { at: 5, head: 4 };

test('snapSpan opens just before the first word and closes shortly after the last, never into a neighbour', () => {
  assert.deepStrictEqual(SC.snapSpan(words, 1.0, 4.0), { from: 0.92, to: 2.45 });   // 1.3 + 0.9 cap + 0.25
  assert.deepStrictEqual(SC.snapSpan(words, 4.0, 10.0), { from: 3.92, to: 4.85 });
  assert.strictEqual(SC.snapSpan(words, 10.0, 10.5).to, 10.5);                        // `to` is a ceiling (end screen after it)
  assert.throws(() => SC.snapSpan(words, 5, 9), /no words/);
  // a short gap: the start sits mid-gap, not on the previous word's end
  assert.strictEqual(SC.snapSpan([{ w: 'So', s: 1, e: 1.2 }, { w: 'that', s: 1.3, e: 1.5 }], 1.3, 2).from, 1.25);
});

test('a splice shifts later times and a span crossing it skips the intro', () => {
  assert.strictEqual(SC.toMaster(4.9, splice), 4.9);
  assert.strictEqual(SC.toMaster(5, splice), 9);
  assert.deepStrictEqual(SC.masterSpans({ from: 3, to: 7 }, splice), [{ from: 3, to: 5 }, { from: 9, to: 11 }]);
  assert.deepStrictEqual(SC.masterSpans({ from: 6, to: 7 }, splice), [{ from: 10, to: 11 }]);
  assert.deepStrictEqual(SC.masterSpans({ from: 6, to: 7 }, null), [{ from: 6, to: 7 }]);
  // ending exactly on the splice point must not pull the intro in (mobile-frameworks-2026's hook span)
  assert.deepStrictEqual(SC.masterSpans({ from: 3, to: 5 }, splice), [{ from: 3, to: 5 }]);
});

test('layout lays spans end to end and toCut / toCutOrNext map master time into it', () => {
  const laid = SC.layout([{ from: 10, to: 12 }, { from: 20, to: 23 }]);
  assert.deepStrictEqual(laid.map(s => s.at), [0, 2]);
  assert.strictEqual(SC.cutLength(laid), 5);
  assert.strictEqual(SC.toCut(21, laid), 3);
  assert.strictEqual(SC.toCut(15, laid), null);
  assert.strictEqual(SC.toCutOrNext(15, laid), 2);
  assert.strictEqual(SC.toCutOrNext(30, laid), null);
});

test('mapWindows keeps only what survives and merges pieces that meet at a join', () => {
  const laid = SC.layout([{ from: 10, to: 12 }, { from: 20, to: 23 }]);
  assert.deepStrictEqual(SC.mapWindows([[11, 21]], laid), [[1, 3]]);   // tail of span 1 + head of span 2, contiguous in the cut
  assert.deepStrictEqual(SC.mapWindows([[13, 19]], laid), []);
  assert.deepStrictEqual(SC.mapWindows([[22, 30]], laid), [[4, 5]]);
  assert.deepStrictEqual(SC.mapWindows([[11, 12, 0.6], [20, 21]], laid), [[1, 2, 0.6], [2, 3]]);   // different crop centres stay apart
});

test('mapWindows carries a screen window\'s rects across a join as one window', () => {
  const laid = SC.layout([{ from: 10, to: 12 }, { from: 20, to: 23 }]);
  const rect = { code: [0, 0, 1600, 900], web: [1960, 0, 1956, 1100] };
  assert.deepStrictEqual(SC.mapWindows([[11, 21, rect]], laid), [[1, 3, rect]]);
});

test('paneFit keeps the region\'s aspect, even sizes, centred inside its pane', () => {
  const box = { x: 0, y: 147, w: 1440, h: 960 };
  const f = SC.paneFit([290, 240, 1400, 960], box);   // taller than the box: height-limited
  assert.deepStrictEqual(f.crop, [1400, 960, 290, 240]);
  assert.strictEqual(f.h, 960);
  assert.strictEqual(f.w % 2, 0);
  assert.ok(Math.abs(f.w / f.h - 1400 / 960) < 0.01);
  assert.strictEqual(f.x, (1440 - f.w) / 2);
  const g = SC.paneFit([90, 1500, 1500, 540], box);    // wide: width-limited, centred vertically
  assert.strictEqual(g.w, 1440);
  assert.ok(g.y > box.y && g.y + g.h <= box.y + box.h);
});

test('stackPanes stacks the editor over the browser as one centred group', () => {
  const [a, b] = SC.stackPanes([90, 1500, 1500, 540], [2000, 600, 1880, 760], { x: 0, y: 147, w: 1440, h: 1960 }, 32, 960);
  assert.strictEqual(b.y, a.y + a.h + 32);
  const top = a.y - 147, bottom = 147 + 1960 - (b.y + b.h);
  assert.ok(Math.abs(top - bottom) <= 1);
});

test('faceCropPx centres the 9:16 crop on the face, clamped inside the frame', () => {
  assert.strictEqual(SC.faceCropPx(undefined, 3840, 1216), 1312);
  assert.strictEqual(SC.faceCropPx(0.61, 3840, 1216), 1734);
  assert.strictEqual(SC.faceCropPx(0.99, 3840, 1216), 2624);
});

test('cutWords re-times the surviving words into the cut and clips them to their span', () => {
  const laid = SC.layout(SC.masterSpans({ from: 3.9, to: 4.5 }, splice).concat(SC.masterSpans({ from: 10, to: 10.3 }, splice)));
  const out = SC.cutWords(words, splice, laid);
  assert.deepStrictEqual(out.map(w => [w.w, w.s, w.e]), [['Two', 0.1, 0.3], ['lines.', 0.3, 0.6], ['Three.', 0.6, 0.9]]);
});

test('facesFromLuma finds bright runs and drops short flashes', () => {
  const m = [10, 10, 120, 120, 120, 10, 200, 10, 130, 130, 130];
  assert.deepStrictEqual(SC.facesFromLuma(m, 5, 70, 0.6), [[0.4, 1], [1.6, 2.2]]);
  // two runs a single dark frame apart (motion blur) are one window
  assert.deepStrictEqual(SC.facesFromLuma([120, 120, 120, 120, 10, 120, 120, 120, 120], 10, 70, 0.3, 0.25), [[0, 0.9]]);
});

test('cutTimeline tiles the kept slides over the cut and re-anchors their beats to the cut words', () => {
  const tl = { fps: 30, lead: 0.1, xf: { type: 'push', dur: 0.4 }, motion: 5, slides: [
    { id: 's01', slug: '01-a', start: 0, end: 10 }, { id: 's02', slug: '02-b', start: 10, end: 20 },
    { id: 's03', slug: '03-c', start: 20, end: 30 }, { id: 's04', slug: '04-d', start: 30, end: 40 }] };
  const rows = [{ file: '03-c', beats: [{ name: 'k1', words: 'kept word', nth: 1, at: null, phrase: false, off: 0, hero: true },
    { name: 'k2', words: 'gone', nth: 1, at: null, phrase: false, off: 0, hero: false }] }];
  // spans: 2..9.5 (in s01), 19.8..26 (s02 by 0.2s, then s03), 35..40 (s04)
  const laid = SC.layout([{ from: 2, to: 9.5 }, { from: 19.8, to: 26 }, { from: 35, to: 40 }]);
  const words = [{ w: 'kept', s: 9, e: 9.3 }, { w: 'word', s: 9.3, e: 9.6 }];
  const { tl: out, issues } = SC.cutTimeline({ tl, rows, laid, words, total: 18.7 });
  assert.deepStrictEqual(out.slides.map(e => [e.id, e.start, e.end]), [['s01', 0, 7.7], ['s03', 7.7, 13.7], ['s04', 13.7, 18.7]]);
  assert.deepStrictEqual(out.slides[1].beats, { k1: [8.9, 9.6] });   // 0.1s lead, found in the cut words
  assert.strictEqual(out.slides[1].hero, 'k1');
  assert.ok(issues.some(t => /k2 "gone" not found/.test(t)));         // its words were cut: fraction fallback
  // one slide across a join keeps one window
  const one = SC.cutTimeline({ tl, rows: [], laid: SC.layout([{ from: 1, to: 4 }, { from: 6, to: 9 }]), words: [], total: 6 }).tl;
  assert.deepStrictEqual(one.slides.map(e => [e.id, e.start, e.end]), [['s01', 0, 6]]);
});

test('cutTimeline places a beat whose words were cut by when it was said, not on the fraction schedule', () => {
  // s03 runs 20..30 in VO time; the cut keeps 22..26 of it. Beats said at 21 (before), 24 (kept) and 28 (after).
  const tl = { fps: 30, lead: 0.1, slides: [{ id: 's03', slug: '03-c', start: 20, end: 30,
    beats: { before: [21, 21.5], kept: [24, 24.5], after: [28, 28.5] } }] };
  const it = name => ({ name, words: name + 'word', nth: 1, at: null, phrase: false, off: 0, hero: false });
  const rows = [{ file: '03-c', beats: [it('before'), it('kept'), it('after')] }];
  const laid = SC.layout([{ from: 22, to: 26 }]);
  const words = [{ w: 'keptword', s: 24, e: 24.4 }].map(w => ({ ...w, s: w.s - 22, e: w.e - 22 }));
  const { tl: out, issues } = SC.cutTimeline({ tl, rows, laid, words, total: 4 });
  const b = out.slides[0].beats;
  assert.deepStrictEqual(b.before, [0, 0.1]);          // said before the kept part: already there
  assert.deepStrictEqual(b.kept, [1.9, 2.4]);          // found in the cut's own words
  assert.ok(b.after[0] > 4);                           // said after it: never shown
  assert.ok(!issues.some(t => /fraction fallback/.test(t)));
  // c2 has no beat of its own and trails c1, which was cut after the kept part: it stays out too
  const tl2 = { fps: 30, lead: 0.1, slides: [{ id: 's03', slug: '03-c', start: 20, end: 30, beats: { c1: [28, 28.5] } }] };
  const b2 = SC.cutTimeline({ tl: tl2, rows: [{ file: '03-c', beats: [it('c1')] }], laid, words, total: 4 }).tl.slides[0].beats;
  assert.ok(b2.c1[0] > 4 && b2.c2[0] > 4 && !b2.c10);
});

test('revealFaces turns a deck\'s face reveals into master windows, skipping splits and the CTA window', () => {
  const reveals = [
    { at: 0, to: 5, over: true },                    // the hook, cards over the face, ending on the splice
    { at: 6, to: 8, in: 0, out: 0.4 },               // a plain face beat after the intro
    { at: 9, to: 12, over: true, split: { x: .5 } }, // a split: the deck stays
    { at: 13, to: 15, in: 0, out: 0 },               // the subscribe bar
  ];
  assert.deepStrictEqual(SC.revealFaces(reveals, splice, { at: 13, to: 15 }), [[0, 5, true], [10, 12, false]]);
});

test('mergeFaces unions both lists and gives every window the camera\'s crop centre', () => {
  assert.deepStrictEqual(SC.mergeFaces([[4, 6, 0.46], [20, 22, 0.46]], [[0, 5], [30, 31]]), [[0, 6, 0.46], [20, 22, 0.46], [30, 31, 0.46]]);
  assert.deepStrictEqual(SC.mergeFaces([], [[0, 5]]), [[0, 5, 0.5]]);
});

test('overSlides picks the slides an over window covers; clampOvers keeps an overlay inside the face', () => {
  const slides = [{ id: 's01', start: 0, end: 4 }, { id: 's02', start: 4, end: 9 }, { id: 's03', start: 9, end: 14 }];
  assert.deepStrictEqual(SC.overSlides([{ at: 0, to: 8.7, over: true }, { at: 9, to: 14, over: true, split: {} }], slides), ['s01', 's02']);
  assert.deepStrictEqual(SC.clampOvers(4, 9, [[0, 8.7, 0.5], [20, 30]]), [[4, 8.7]]);
});
