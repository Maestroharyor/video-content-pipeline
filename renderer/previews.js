/* Clearing a project's review drafts once its full master is written.
   The user (2026-11-04): "once you're done with the main render, delete the preview"; widened 2026-11-13 (undo-git-mistakes):
   "Whenever you render 4k, delete all previews". So a finished master removes every preview video of the project, not only
   its own draft: every video and caption file under renders/previews/ (drafts of other looks and cuts, candidate clips such
   as background options) and every dual preview chunk cache under frames/ (frames/dual…-preview, at any depth: variants
   keep theirs in frames/<variant>/). Other files in previews/ (stills, audio tests) are not previews of the video and stay;
   folders left empty go. */
const fs = require('fs');
const path = require('path');

const VIDEO = /\.(mp4|mov|webm|m4v|gif|srt|vtt)$/i;

function walk(dir, visit, depth = 0) {
  if (!fs.existsSync(dir) || depth > 4) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) visit(path.join(dir, e.name), e, depth, () => walk(path.join(dir, e.name), visit, depth + 1));
}
/* removes empty folders under dir (dir itself too when it ends up empty) */
function pruneEmpty(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
  fs.readdirSync(dir).forEach(n => pruneEmpty(path.join(dir, n)));
  if (!fs.readdirSync(dir).length) fs.rmdirSync(dir);
}
/* cfg = renderer/config.js resolve(): previewDir, frameDir, root. Returns the paths it removed. */
function clearPreviews(cfg, log = console.log) {
  const gone = [];
  const rm = p => { fs.rmSync(p, { recursive: true, force: true }); gone.push(p); log(`  removed preview ${path.relative(cfg.root || process.cwd(), p)}`); };
  walk(cfg.previewDir, (p, e, d, down) => { if (e.isDirectory()) down(); else if (VIDEO.test(e.name)) rm(p); });
  pruneEmpty(cfg.previewDir);
  /* the chunk caches live under the project's frames/ (cfg.frameDir may be a variant's subfolder of it) */
  const frames = cfg.projectDir ? path.join(cfg.projectDir, 'frames') : cfg.frameDir;
  walk(frames, (p, e, d, down) => { if (!e.isDirectory()) return; if (/^dual.*-preview$/.test(e.name)) rm(p); else down(); });
  return gone;
}
module.exports = { clearPreviews, VIDEO };
