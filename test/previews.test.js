/* renderer/previews.js: a finished master clears every preview video of its project, and nothing else */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { clearPreviews } = require('../renderer/previews');

function project() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vid-previews-'));
  const put = (rel, body = 'x') => { const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, body); return p; };
  put('renders/previews/demo-preview.mp4');
  put('renders/previews/demo-reveal-preview.mp4');
  put('renders/previews/demo-preview.srt');
  put('renders/previews/backgrounds/1-lanes.mp4');            // candidate clips in previews/ are previews too
  put('renders/previews/stills/mock.png');                    // a still is not a preview video: kept
  put('renders/final/demo.mp4');                              // the master: never touched
  put('frames/dual-preview/A/0000.mp4');                      // the draft's chunk cache
  put('frames/news/dual-tight-preview/A/0000.mp4');           // a variant's chunk cache
  put('frames/dual/A/0000.mp4');                              // the master's chunk cache: kept
  return { dir, cfg: { root: dir, projectDir: dir, previewDir: path.join(dir, 'renders/previews'), frameDir: path.join(dir, 'frames') } };
}

test('clearPreviews removes every preview video and preview chunk cache, keeps masters and stills', () => {
  const { dir, cfg } = project();
  try {
    const gone = clearPreviews(cfg, () => {});
    const has = rel => fs.existsSync(path.join(dir, rel));
    assert.ok(!has('renders/previews/demo-preview.mp4') && !has('renders/previews/demo-reveal-preview.mp4') && !has('renders/previews/demo-preview.srt'));
    assert.ok(!has('renders/previews/backgrounds'), 'an emptied candidate folder goes');
    assert.ok(has('renders/previews/stills/mock.png'), 'stills stay');
    assert.ok(has('renders/final/demo.mp4'), 'the master stays');
    assert.ok(!has('frames/dual-preview') && !has('frames/news/dual-tight-preview'), 'preview chunk caches go, variants included');
    assert.ok(has('frames/dual/A/0000.mp4'), "the master's chunk cache stays");
    assert.strictEqual(gone.length, 6);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('clearPreviews removes an emptied previews folder and copes with a project that has none', () => {
  const { dir, cfg } = project();
  try {
    fs.rmSync(path.join(dir, 'renders/previews/stills'), { recursive: true });
    clearPreviews(cfg, () => {});
    assert.ok(!fs.existsSync(cfg.previewDir));
    assert.deepStrictEqual(clearPreviews(cfg, () => {}), []);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
