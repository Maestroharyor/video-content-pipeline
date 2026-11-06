/* The probe's WCAG maths (renderer/contrast.js): parsing computed colours, compositing, the AA thresholds. */
const test = require('node:test');
const assert = require('node:assert');
const { parseColor, contrastRatio, minContrast } = require('../renderer/contrast');

test('parses rgb, rgba and color-mix output', () => {
  assert.deepStrictEqual(parseColor('rgb(255, 0, 10)'), [255, 0, 10, 1]);
  assert.deepStrictEqual(parseColor('rgba(0, 0, 0, 0.5)'), [0, 0, 0, 0.5]);
  assert.deepStrictEqual(parseColor('color(srgb 1 0.5 0 / 0.25)'), [255, 127.5, 0, 0.25]);
  assert.strictEqual(parseColor('transparent'), null);
});

test('ratios match the WCAG reference values', () => {
  assert.ok(Math.abs(contrastRatio([0, 0, 0, 1], [255, 255, 255, 1]) - 21) < .01);
  assert.ok(Math.abs(contrastRatio([255, 255, 255, 1], [255, 255, 255, 1]) - 1) < .01);
  assert.ok(Math.abs(contrastRatio([118, 118, 118, 1], [255, 255, 255, 1]) - 4.54) < .02);
});

test('translucent text is composited over its background', () => {
  // half-transparent black on white reads as mid grey, far below full black
  const r = contrastRatio([0, 0, 0, .5], [255, 255, 255, 1]);
  assert.ok(r > 3 && r < 5, String(r));
});

test('the case-file stamp that failed review 1: red multiply ink on the dark desk vs on its paper backing', () => {
  const desk = [42, 29, 20, 1], ink = [184, 38, 43, 1], paper = [246, 236, 213, 1], fixed = [168, 30, 35, 1];
  assert.ok(contrastRatio(ink, desk) < minContrast(54, 400));
  assert.ok(contrastRatio(fixed, paper) >= minContrast(54, 400));
});

test('AA thresholds: large text is 3:1, body text 4.5:1', () => {
  assert.strictEqual(minContrast(32, 400), 3);
  assert.strictEqual(minContrast(24, 700), 3);
  assert.strictEqual(minContrast(24, 400), 4.5);
  assert.strictEqual(minContrast(18, 900), 4.5);
});
