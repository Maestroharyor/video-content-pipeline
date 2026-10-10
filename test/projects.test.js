/* Every project in projects/ must load cleanly: no JS/console errors, every image decodes, no duplicate ids,
   every slide renders at t = 0 / 0.5 / 1. Also covers the storyboard parser and the scaffolder. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { listProjects, loadProject } = require('../renderer/project');
const { resolve } = require('../renderer/config');
const { openDeck } = require('../renderer/browser');
const ROOT = path.resolve(__dirname, '..');

for (const slug of listProjects()) {
  test(`project ${slug} loads without errors`, async () => {
    const cfg = resolve({ project: slug });
    const { browser, page, errors, slides } = await openDeck(cfg);
    try {
      assert.deepStrictEqual(errors, [], 'load errors');
      assert.ok(slides.length > 0, 'has slides');
      const broken = (await page.evaluate(() => [...document.images].map(i => [i.getAttribute('src'), i.naturalWidth]))).filter(i => !(i[1] > 0));
      assert.deepStrictEqual(broken, [], 'all images decode');
      for (const s of slides) for (const t of [0, .5, 1]) await page.evaluate((id, tt) => window.setFrame(id, tt), s.id, t);
    } finally { await browser.close(); }
  });
}

/* a project with a variant block (e.g. vertical: {...}) renders the same deck on that canvas, beside the base deck */
for (const slug of listProjects()) {
  const P = loadProject(slug).project;
  for (const variant of ['vertical'].filter(v => P[v] && typeof P[v] === 'object' && P[v].canvas)) {
    test(`project ${slug} --variant ${variant} loads without errors`, async () => {
      const cfg = resolve({ project: slug, variant });
      assert.strictEqual(cfg.canvas, P[variant].canvas);
      assert.strictEqual(cfg.outName, `${P.slug}-${variant}`);
      assert.strictEqual(cfg.outputDir, path.join(cfg.projectDir, 'renders', variant));
      assert.strictEqual(cfg.frameDir, path.join(cfg.projectDir, 'frames', variant));
      const { browser, page, errors, slides } = await openDeck(cfg);
      try {
        assert.deepStrictEqual(errors, [], 'load errors');
        const g = await page.evaluate(() => ({ canvas: window.GRID.canvas, cw: window.GRID.cw, variant: window.VARIANT }));
        assert.deepStrictEqual(g, { canvas: P[variant].canvas, cw: (P[variant].grid || {}).cw || g.cw, variant });
        for (const s of slides) for (const t of [0, .5, 1]) await page.evaluate((id, tt) => window.setFrame(id, tt), s.id, t);
      } finally { await browser.close(); }
    });
  }
}

/* a nested project (projects/<video>/social, the one-project layout) runs on top of its video's settings */
test('nested social project inherits its video and loads without errors', async () => {
  const dir = path.join(ROOT, 'projects', 'cloud-vs-devops', 'social');
  if (!fs.existsSync(path.join(dir, 'project.js'))) return;
  const { project } = loadProject(dir);
  assert.strictEqual(project.canvas, 'vertical');
  assert.strictEqual(project.theme, loadProject('cloud-vs-devops').project.theme, 'inherits the video\'s theme');
  assert.ok(!project.vertical, 'the vertical block is applied, not carried');
  const cfg = resolve({ project: dir });
  const { browser, errors } = await openDeck(cfg);
  try { assert.deepStrictEqual(errors, [], 'load errors'); } finally { await browser.close(); }
});

test('loadProject without a variant keeps the base settings; an unknown variant is an error', () => {
  const base = resolve({ project: 'cloud-vs-devops' });
  assert.strictEqual(base.canvas, 'horizontal');
  assert.strictEqual(base.outName, 'cloud-vs-devops');
  assert.strictEqual(base.outputDir, path.join(base.projectDir, 'renders'));
  assert.throws(() => loadProject('cloud-vs-devops', { variant: 'square' }), /no "square" block/);
});

test('script-to-storyboard parses timestamped transcripts and estimates plain prose', () => {
  const ts = '(0:00) So you launched a server. (0:06) And the scary part. (0:09) Here are three resources.';
  const out = JSON.parse(execFileSync('node', [path.join(ROOT, 'scripts', 'script-to-storyboard.js')], { input: ts }).toString());
  assert.strictEqual(out.lines.length, 3);
  assert.deepStrictEqual([out.lines[0].start, out.lines[0].end, out.lines[1].start, out.lines[2].start], [0, 6, 6, 9]);
  assert.strictEqual(out.estimated, false);
  const plain = JSON.parse(execFileSync('node', [path.join(ROOT, 'scripts', 'script-to-storyboard.js')], { input: 'First sentence here. Second one follows! Third?' }).toString());
  assert.strictEqual(plain.lines.length, 3);
  assert.strictEqual(plain.estimated, true);
  assert.ok(plain.total > 0);
});

test('new-project scaffolds a horizontal project that loads', async () => {
  const slug = 'zz-smoke-' + process.pid;
  const dir = path.join(ROOT, 'projects', slug);
  try {
    execFileSync('node', [path.join(ROOT, 'scripts', 'new-project.js'), '--slug', slug, '--title', 'Smoke', '--canvas', 'horizontal']);
    const { project } = loadProject(slug);
    assert.strictEqual(project.canvas, 'horizontal');
    const cfg = resolve({ project: slug });
    assert.deepStrictEqual([cfg.width, cfg.height], [1920, 1080]);
    const { browser, errors, slides } = await openDeck(cfg);
    try { assert.deepStrictEqual(errors, []); assert.strictEqual(slides.length, 1); } finally { await browser.close(); }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
