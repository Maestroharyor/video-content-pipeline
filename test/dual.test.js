/* Pure-function tests for the dual-master chunk planner: the mode each chunk gets, where its boundaries land,
   and the rules a reveal set has to obey. No browser, no ffmpeg. */
const test = require('node:test');
const assert = require('node:assert');
const { plan, muteExpr } = require('../scripts/dual-render');
const { loadProject } = require('../renderer/project');

const modes = cs => cs.map(c => [c.t0, c.t1, c.mode]);
const frames = cs => cs.reduce((n, c) => n + c.n, 0);

test('a reveal becomes out / none / in, everything else is full', () => {
  const cs = plan(60, 20, [{ at: 20, to: 30, in: 0.45, out: 0.45 }], 30, []);
  assert.deepStrictEqual(modes(cs), [
    [0, 19.55, 'full'],
    [19.55, 20, 'out'],
    [20, 30, 'none'],
    [30, 30.45, 'in'],
    [30.45, 40, 'full'],
    [40, 60, 'full'],
  ]);
});

test('a regular chunk mark inside a reveal is dropped, so the ramps stay whole', () => {
  // the 20s mark falls inside [19.55, 30.45) and must not split the reveal
  assert.ok(!plan(60, 20, [{ at: 19, to: 31 }], 30, []).some(c => c.t0 === 20));
});

test('out: 0 means a hard cut, not the 0.45 default', () => {
  const cs = plan(30, 60, [{ at: 10, to: 20, in: 0.4, out: 0 }], 30, []);
  assert.deepStrictEqual(modes(cs), [[0, 9.6, 'full'], [9.6, 10, 'out'], [10, 20, 'none'], [20, 30, 'full']]);
  assert.ok(!cs.some(c => c.mode === 'in'));
});

test('forced cuts (a splice point, a CTA edge) become chunk boundaries', () => {
  const cs = plan(60, 60, [], 30, [25.5]);
  assert.deepStrictEqual(cs.map(c => [c.t0, c.t1]), [[0, 25.5], [25.5, 60]]);
});

test('reveals whose ramps touch are refused', () => {
  // [10-0.45, 20+0.45] and [20.5-0.45, 25+0.45] overlap at 20.45 > 20.05
  assert.throws(() => plan(60, 20, [{ at: 10, to: 20 }, { at: 20.5, to: 25 }], 30, []), /reveals overlap near 20.5s/);
  assert.doesNotThrow(() => plan(60, 20, [{ at: 10, to: 20 }, { at: 21, to: 25 }], 30, []));
});

test('chunks tile the timeline exactly: no gap, no overlap, no lost frame', () => {
  const total = 147, fps = 30;
  const cs = plan(total, 20, [{ at: 0, to: 6.36, in: 0, out: 0.45 }, { at: 23.8, to: 30.99 }], fps, []);
  assert.strictEqual(cs[0].t0, 0);
  assert.strictEqual(cs[cs.length - 1].t1, total);
  cs.forEach((c, i) => { if (i) assert.strictEqual(c.t0, cs[i - 1].t1, `gap before chunk ${i}`); });
  cs.forEach((c, i) => assert.strictEqual(c.i, i));
  assert.strictEqual(frames(cs), total * fps);
});

test('a reveal opening at 0 with in: 0 has no out ramp and starts on footage', () => {
  const cs = plan(20, 60, [{ at: 0, to: 6.36, in: 0, out: 0.45 }], 30, []);
  assert.deepStrictEqual(modes(cs), [[0, 6.36, 'none'], [6.36, 6.81, 'in'], [6.81, 20, 'full']]);
});

test('ai-in-every-app-reveal: both cuts plan cleanly and every edge is a slide boundary', () => {
  const { project: P } = loadProject('ai-in-every-app-reveal');
  const tl = require('../projects/ai-in-every-app-reveal/timeline.json');
  const bounds = new Set(tl.slides.flatMap(s => [s.start, s.end]));
  for (const [name, set] of Object.entries(P.revealSets)) {
    for (const r of set) {
      assert.ok(bounds.has(r.at), `${name}: at ${r.at}s is not a slide boundary`);
      assert.ok(bounds.has(r.to), `${name}: to ${r.to}s is not a slide boundary`);
      // a return inside a slide's 0.4s push-exit shows that slide swimming up out of the footage
      const exit = tl.slides.find(s => r.to < s.end && r.to + (r.out ?? 0.45) > s.end - 0.4);
      assert.ok(!exit, `${name}: return at ${r.to}s lands in ${exit && exit.id}'s exit`);
    }
    const cs = plan(tl.total, 20, set, tl.fps, []);
    assert.strictEqual(frames(cs), tl.total * tl.fps, `${name}: frame count`);
    assert.strictEqual(cs.filter(c => c.mode === 'none').length, set.length, `${name}: one footage body per window`);
  }
});

test('over: true keeps the deck on inside the window (mode over), with the same ramps either side', () => {
  const cs = plan(60, 20, [{ at: 20, to: 30, in: 0.45, out: 0.45, over: true }], 30, []);
  assert.deepStrictEqual(modes(cs), [
    [0, 19.55, 'full'],
    [19.55, 20, 'out'],
    [20, 30, 'over'],
    [30, 30.45, 'in'],
    [30.45, 40, 'full'],
    [40, 60, 'full'],
  ]);
});

test('the ramps of an over/split window carry its layout, so they dissolve into it instead of over bare footage', () => {
  const sp = { x: .5, zoom: 1.1 };
  const cs = plan(60, 60, [{ at: 20, to: 30, in: .3, out: .3, over: true, split: sp }, { at: 40, to: 50 }], 30, []);
  const ramps = cs.filter(c => c.mode === 'out' || c.mode === 'in').map(c => [c.t0, c.mode, c.win, c.split]);
  assert.deepStrictEqual(ramps, [[19.7, 'out', true, sp], [30, 'in', true, sp], [39.55, 'out', false, null], [50, 'in', false, null]]);
});

test('over and plain reveals mix in one set: each window keeps its own mode', () => {
  const cs = plan(60, 60, [{ at: 0, to: 10, in: 0, out: 0.45, over: true }, { at: 30, to: 40 }], 30, []);
  assert.deepStrictEqual(cs.filter(c => c.mode === 'over' || c.mode === 'none').map(c => [c.t0, c.t1, c.mode]), [[0, 10, 'over'], [30, 40, 'none']]);
});

test('muteExpr silences B\'s effects only where the face is alone, in the part\'s own time', () => {
  const chunks = [{ mode: 'full', t0: 0, t1: 10 }, { mode: 'out', t0: 10, t1: 10.45 }, { mode: 'none', t0: 10.45, t1: 15 },
    { mode: 'over', t0: 15, t1: 20 }, { mode: 'none', t0: 30, t1: 34 }];
  assert.strictEqual(muteExpr(chunks, 0, 25), 'between(t,10.45,15)');
  assert.strictEqual(muteExpr(chunks, 5, 40), 'between(t,5.45,10)+between(t,25,29)');
  assert.strictEqual(muteExpr(chunks.slice(0, 2), 0, 11), null);
});
