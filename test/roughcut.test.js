// renderer/roughcut.js: script parsing, take choice and segment planning for `npm run rough-cut` (pure, no ffmpeg)
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const RC = require('../renderer/roughcut');

const FIX = path.join(__dirname, 'fixtures', 'roughcut');
const script = RC.parseScript(fs.readFileSync(path.join(FIX, 'git-undo-script.md'), 'utf8'));
const texts = script.lines.map(l => l.text);

test('script: the usual layout parses to its spoken lines (header, byline, on-screen notes and review notes dropped)', () => {
  assert.deepStrictEqual(script.sections.map(s => s.at), [0, 40, 105, 320, 430]);
  assert.strictEqual(script.sections[1].title, 'Part 1: The three places your code lives');
  assert.ok(!texts.some(t => /@josh|YouTube script|Oct 31/.test(t)), 'header and byline are not spoken');
  assert.ok(!texts.some(t => /ON SCREEN/i.test(t)), 'on-screen directions are not spoken');
  assert.ok(!texts.some(t => /Accuracy fixes|e4f5g6h wasn/.test(t)), 'review notes are not spoken');
  assert.strictEqual(texts[0], 'Have you ever committed something to Git, only to realise a few seconds later that you made a mistake?');
  assert.ok(texts.includes('See you in the next one.'));
});

test('script: commands, diagrams and sub-headings are optional; sentences that start with a command word are not', () => {
  const opt = t => script.lines.find(l => l.text === t).optional;
  for (const t of ['git add .', 'A -- B -- C', 'git reset --soft HEAD~1', '9f2c1ab HEAD@{0}: reset: moving to HEAD~1', '--soft: keep the changes staged']) assert.strictEqual(opt(t), true, t);
  for (const t of ['HEAD is the commit you\'re on.', 'Let\'s get into it.', 'C is your latest commit, and it\'s wrong.']) assert.strictEqual(opt(t), false, t);
  assert.strictEqual(RC.looksLikeCode('git reset moves your branch back to an earlier commit.'), false);
});

test('normWords spells flags and operators the way whisper writes them', () => {
  assert.deepStrictEqual(RC.normWords('git reset --soft HEAD~1'), ['git', 'reset', 'soft', 'head', '1']);
  assert.deepStrictEqual(RC.normWords('Don\'t memorise the names.'), ["don't", 'memorise', 'the', 'names']);
});

// a recording of four script lines: a false start, a retake, a cut-off take, a stutter, an ad-lib and silence noise
const S2 = RC.parseScript('[00:00] Intro\nThe working directory is the files you are editing.\nThe staging area is your cart.\n[00:20] Part 1\nGit keeps a private diary called the reflog.\nSo it is a safety net, not a backup.\n');
const isl = (i, a, text) => ({ i, a, b: a + 2, text });
const I = [
  isl(0, 0, 'The working'),                                            // false start
  isl(1, 3, 'The working directory is the files you are editing.'),
  isl(2, 6, 'The staging area is your car.'),                          // retake, later one wins
  isl(3, 9, 'The staging area is your cart.'),
  isl(4, 12, '[BLANK_AUDIO]'),                                         // no speech
  isl(5, 15, 'Git keeps a private diary called the-'),                 // cut off
  isl(6, 18, 'Git keeps a private diary called the reflog.'),
  isl(7, 21, 'Oh wait, hold on a second there.'),                      // ad-lib, kept and flagged
  isl(8, 24, 'So so it is a safety net, not a backup.'),                // stutter
];

test('takes: the last complete take of each line, retakes, false starts, cut-offs and silence out, doubts flagged', () => {
  const { takes, missing } = RC.chooseTakes(I, S2);
  const keep = takes.filter(t => t.keep).map(t => t.i);
  assert.deepStrictEqual(keep, [1, 3, 6, 7, 8]);
  const by = i => takes.find(t => t.i === i);
  assert.match(by(0).reason, /false start|retake/);
  assert.match(by(2).reason, /retake/);
  assert.strictEqual(by(4).reason, 'no speech');
  assert.strictEqual(by(5).reason, 'cut off');
  assert.strictEqual(by(7).flag, 'ad-lib');
  assert.strictEqual(by(8).flag, 'stutter');
  assert.deepStrictEqual(missing, []);
  assert.deepStrictEqual(RC.sectionStarts(takes, S2), [6]);
});

test('takes: a line nobody said is reported missing', () => {
  const { missing } = RC.chooseTakes(I.filter(o => o.i !== 3 && o.i !== 2), S2);
  assert.deepStrictEqual(missing, [2]);
});

test('takes without a script: a take repeated by the next island is the one that goes', () => {
  const { takes } = RC.chooseTakes([isl(0, 0, 'The staging area is your car.'), isl(1, 3, 'The staging area is your cart.'), isl(2, 6, 'Git keeps a diary.')], null);
  assert.deepStrictEqual(takes.filter(t => t.keep).map(t => t.i), [1, 2]);
});

test('segments: pauses are his own, capped, edges on the frame grid', () => {
  const E = Object.assign({ fps: 60, keep: [1, 3, 6], trim: {}, sections: [6] }, RC.PACING);
  const { segs, edl } = RC.planSegments(I, E);
  segs.forEach(g => { assert.strictEqual(Math.round(g.s * 60), +(g.s * 60).toFixed(6)); assert.strictEqual(Math.round(g.e * 60), +(g.e * 60).toFixed(6)); });
  for (let k = 1; k < edl.length; k++) assert.ok(Math.abs(edl[k].cut[0] - edl[k - 1].cut[1]) < 1e-3, 'the cut is continuous');
  const pause = k => (I.find(o => o.i === segs[k].i).a - segs[k].s) + (segs[k - 1].e - I.find(o => o.i === segs[k - 1].i).b);
  assert.ok(pause(1) <= RC.PACING.maxJoin + 1 / 60 + 1e-6, 'a join between non-adjacent islands is capped');
  assert.ok(pause(2) <= RC.PACING.sectionGap + 1 / 60 + 1e-6, 'a section change gets at most the section gap');
});

test('segments: a per-join pause overrides the caps, never past the raw silence', () => {
  const E = Object.assign({ fps: 60, keep: [1, 3, 6], trim: {}, sections: [6], joins: { 1: 0.12, 3: 9 } }, RC.PACING);
  const { segs } = RC.planSegments(I, E);
  const isl = k => I.find(o => o.i === segs[k].i);
  const pause = k => (isl(k).a - segs[k].s) + (segs[k - 1].e - isl(k - 1).b);
  assert.ok(Math.abs(pause(1) - 0.12) <= 2 / 60, 'the join after island 1 is the one asked for');
  assert.ok(pause(2) <= isl(2).a - isl(1).b + 1e-6, 'a join longer than the raw silence is held to it');
});

// regression: the shared planner reproduces the hand cut of reverse-proxy-lb-gateway exactly (skipped where that
// project's sources are not on this machine: projects/* is git-ignored)
const RP = path.join(__dirname, '..', 'projects', 'reverse-proxy-lb-gateway', 'source');
test('segments: identical to the hand-cut reverse-proxy edit (352 segments)', { skip: !fs.existsSync(path.join(RP, 'edl.json')) }, () => {
  const rd = f => JSON.parse(fs.readFileSync(path.join(RP, f), 'utf8'));
  const { edl } = RC.planSegments(rd('islands.json'), rd('edit.json'));
  assert.deepStrictEqual(edl.map(x => [x.i, x.raw, x.cut]), rd('edl.json').map(x => [x.i, x.raw, x.cut]));
});
