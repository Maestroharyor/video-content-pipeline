const { test } = require('node:test');
const assert = require('node:assert');
const PZ = require('../renderer/pauses');

const gaps = PZ.normalise([[10, 3], [4, 2]]);

test('normalise sorts gaps and rejects bad ones', () => {
  assert.deepStrictEqual(gaps, [{ at: 4, dur: 2 }, { at: 10, dur: 3 }]);
  assert.throws(() => PZ.normalise([[5, 0]]), /bad pause/);
  assert.throws(() => PZ.normalise([[5, 1], [5, 2]]), /two pauses/);
});

test('shiftTime adds every gap at or before t', () => {
  assert.strictEqual(PZ.shiftTime(3.9, gaps), 3.9);
  assert.strictEqual(PZ.shiftTime(4, gaps), 6);          // a word on the gap moves after it
  assert.strictEqual(PZ.shiftTime(9, gaps), 11);
  assert.strictEqual(PZ.shiftTime(12, gaps), 17);
});

test('shiftVo keeps word lengths, stretches a straddling segment, extends the duration', () => {
  const vo = { duration: 20, words: [{ w: 'a', s: 3, e: 3.5 }, { w: 'b', s: 4.2, e: 4.6 }],
    segments: [{ s: 3, e: 4.6, text: 'a b' }, { s: 11, e: 12, text: 'c' }] };
  const out = PZ.shiftVo(vo, gaps);
  assert.strictEqual(out.duration, 25);
  assert.deepStrictEqual(out.words.map(w => [w.s, w.e]), [[3, 3.5], [6.2, 6.6]]);
  assert.deepStrictEqual(out.segments.map(g => [g.s, g.e]), [[3, 6.6], [16, 17]]);
  assert.strictEqual(vo.words[1].s, 4.2);                // input untouched
});

test('pieces cover the recording with each gap padded onto the piece before it', () => {
  assert.deepStrictEqual(PZ.pieces(gaps), [{ from: 0, to: 4, pad: 2 }, { from: 4, to: 10, pad: 3 }, { from: 10, to: null, pad: 0 }]);
});

test('a filled gap carries its fill into pieces and its words into vo.json at the gap start', () => {
  const g = PZ.normalise([[10, 3, { audio: 'x.wav' }], [4, 2]]);
  assert.deepStrictEqual(PZ.pieces(g)[1], { from: 4, to: 10, pad: 3, fill: { audio: 'x.wav' } });
  assert.strictEqual(PZ.gapStart(g[1], g), 12);
  const out = PZ.shiftVo({ words: [{ w: 'a', s: 3, e: 3.5 }, { w: 'z', s: 10, e: 10.4 }] }, g, [[], [{ w: 'fill', s: 0.5, e: 0.9 }]]);
  assert.deepStrictEqual(out.words.map(w => [w.w, w.s, w.e]), [['a', 3, 3.5], ['fill', 12.5, 12.9], ['z', 15, 15.4]]);
});
