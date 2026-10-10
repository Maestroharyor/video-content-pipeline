/* Render cache: skip a slide whose inputs have not changed since its outputs were written.
   Key = sha1 of the slide file, every core/** file, project.js, the slide's timeline entry, the asset listing and the render settings. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ROOT } = require('./project');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { if (f.name !== '.cache' && f.name !== 'renders' && f.name !== 'frames' && f.name !== '.whisper') walk(p, out); }
    else out.push(p);
  }
  return out.sort();
}
let coreHash = null;
function hashCore() {
  if (coreHash) return coreHash;
  const h = crypto.createHash('sha1');
  for (const f of walk(path.join(ROOT, 'core'))) if (!f.includes('/skeleton/')) h.update(f).update(fs.readFileSync(f));
  return (coreHash = h.digest('hex'));
}
function assetListing(dir) {
  return walk(dir).map(f => { const s = fs.statSync(f); return `${path.relative(dir, f)}:${s.size}:${Math.floor(s.mtimeMs)}`; }).join('\n');
}
function inputsHash(cfg, slide, extra = {}) {
  const h = crypto.createHash('sha1');
  h.update(hashCore());
  const sf = path.join(cfg.projectDir, 'slides', slide.slug + '.js');
  if (fs.existsSync(sf)) h.update(fs.readFileSync(sf));
  h.update(fs.readFileSync(path.join(cfg.projectDir, 'project.js')));
  h.update(assetListing(path.join(cfg.projectDir, 'assets'))).update(assetListing(path.join(ROOT, 'assets', 'logos'))).update(assetListing(path.join(ROOT, 'assets', 'fonts')));
  h.update(JSON.stringify({ fps: cfg.fps, canvas: cfg.canvas, w: cfg.width, h: cfg.height, scale: cfg.scale, maxSize: cfg.maxSize, vars: cfg.vars || {}, hold: cfg.hold, crf: cfg.crf, preset: cfg.preset, gifScale: cfg.gifScale, ...extra }));
  return h.digest('hex');
}
const file = cfg => path.join(cfg.outputDir, '.cache.json');
function read(cfg) { try { return JSON.parse(fs.readFileSync(file(cfg), 'utf8')); } catch { return {}; } }
function write(cfg, c) { fs.mkdirSync(cfg.outputDir, { recursive: true }); fs.writeFileSync(file(cfg), JSON.stringify(c, null, 1)); }
/* outputs that are still valid for this hash */
function fresh(cfg, slug, hash, wanted) {
  const c = read(cfg)[slug];
  if (!c || c.hash !== hash) return null;
  const have = wanted.filter(f => c.outputs[f] && fs.existsSync(c.outputs[f]));
  return have.length === wanted.length ? c.outputs : null;
}
function record(cfg, slug, hash, outputs) {
  const c = read(cfg);
  c[slug] = { hash, outputs: Object.assign({}, (c[slug] && c[slug].hash === hash ? c[slug].outputs : {}), outputs), at: new Date().toISOString() };
  write(cfg, c);
}
module.exports = { inputsHash, fresh, record, hashCore };
