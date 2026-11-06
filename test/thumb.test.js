/* Thumbnails: the export's format ladder (scripts/thumb-export.js) and the probe's YouTube zones (GRID.thumb). */
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const { LADDER, LIMIT, choose, nameFor } = require('../scripts/thumb-export');
const { SIZES, CROP, OVERLAYS, drawboxes, hOf } = require('../scripts/thumb-check');
const { scaffold, fill } = require('../scripts/thumb-new');

test('every step is a PNG and the best one under 2 MB wins', () => {
  assert.ok(LADDER.every(s => s.ext === 'png'));
  assert.strictEqual(LIMIT, 2000000);
  // lossless 2560 and 2400 too big (a grain texture), 2240 fits → lossless 2240, never a palette step
  const size = s => !s.pal && s.w >= 2400 ? 2.6e6 : 1.9e6;
  const won = choose(LADDER, size);
  assert.deepStrictEqual([won.w, won.pal], [2240, undefined]);
  assert.deepStrictEqual((({ w, pal }) => [w, pal])(choose(LADDER, () => 1e5)), [2560, undefined]);
  // no lossless size down to 1920 fits, the 256-colour 2560 does → it beats a smaller lossless file
  const won2 = choose(LADDER, s => s.pal ? 1.4e6 : s.w >= 1920 ? 2.1e6 : 1.2e6);
  assert.deepStrictEqual([won2.w, won2.pal], [2560, 256]);
  assert.strictEqual(choose(LADDER, () => 3e6), null);
  assert.ok(LADDER.every(s => s.w >= 1280));
});

test('file names come from the switches', () => {
  assert.strictEqual(nameFor('03-board', { v: '2', font: 'koho' }), '03-board-v2');
  assert.strictEqual(nameFor('03-board', { v: '1', face: 'off' }), '03-board');
  assert.strictEqual(nameFor('01-floors', { face: 't39', fade: 'off' }), '01-floors-t39-fade-off');
});

test('probe: text in the timestamp corner and type too small for the feed fail a thumbnail', () => {
  const dir = path.join(__dirname, 'fixtures', 'thumb-zones');
  const r = spawnSync('node', [path.join(__dirname, '..', 'scripts', 'probe.js'), '--project', dir], { encoding: 'utf8' });
  const found = r.stdout.split('\n').filter(l => / THUMB-/.test(l)).map(l => l.match(/THUMB-\w+/)[0] + ' ' + (l.match(/"([^"]+)"/) || [])[1]);
  assert.deepStrictEqual(found.sort(), ['THUMB-BADGE Corner', 'THUMB-SMALL Tiny label']);
  assert.strictEqual(r.status, 1);
});

test('thumb-check draws YouTube\'s overlays inside the zones the probe keeps clear', () => {
  assert.deepStrictEqual(SIZES, [1280, 640, 360, 246, 168, 120]);
  assert.strictEqual(hOf(1280), 720);
  // GRID.thumb (core/grid.js): badge corner x > 1530 & y > 850, hover corner x > 1730 & y < 330, box 96..1824 x 108..972
  const [badge, hover1, hover2] = OVERLAYS;
  assert.ok(badge[0] >= 1530 && badge[1] >= 850);
  for (const h of [hover1, hover2]) assert.ok(h[0] >= 1730 && h[1] + h[3] <= 330);
  assert.deepStrictEqual([Math.round(CROP.x * 1920), Math.round(CROP.y * 1080)], [96, 108]);
  // scaled per size, never below a pixel
  assert.match(drawboxes(1920), /drawbox=x=1680:y=975:w=210:h=78/);
  assert.ok(drawboxes(120).split(',').every(d => !/[wh]=0\b/.test(d)));
});

test('thumb-new scaffolds a thumbs project with the probe contract and the video title', () => {
  assert.strictEqual(fill("slug: '__SLUG__', t: '__TITLE__'", { slug: 'x-thumbs', video: 'x', title: "It's" }), "slug: 'x-thumbs', t: 'It\\'s'");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'thumbs-'));
  const out = path.join(dir, 'demo-thumbs');
  const r = scaffold({ video: 'demo', title: 'Demo video', out });
  assert.strictEqual(r.slug, 'demo-thumbs');
  const pj = fs.readFileSync(path.join(out, 'project.js'), 'utf8');
  assert.match(pj, /slug: 'demo-thumbs'/);
  assert.match(pj, /thumbs: \{ font: 'koho' \}/);
  assert.match(pj, /thumbSkip: \['\.pt-mark', '\.pt-ground', '\.pt-face'\]/);
  assert.match(fs.readFileSync(path.join(out, 'index.html'), 'utf8'), /<script src="kit.js">/);
  for (const f of ['kit.js', 'render.sh', 'slides/01-hook.js', 'assets/SOURCES.md']) assert.ok(fs.existsSync(path.join(out, f)), f);
  for (const d of ['assets/faces', 'research', 'renders/candidates']) assert.ok(fs.statSync(path.join(out, d)).isDirectory(), d);
  assert.throws(() => scaffold({ video: 'demo', out }), /already exists/);
  fs.rmSync(dir, { recursive: true, force: true });
});
