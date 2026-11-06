/* Render configuration = project settings + CLI overrides.
     resolve({ project, canvas, res, scale, fps, hold, width, height, crf, preset, maxSize, preview, vars, outputDir, frameDir })
   width/height are the CSS stage (layout, grid, probe); outWidth/outHeight = stage × scale are the pixels that get encoded. */
const path = require('path');
const { ROOT, CANVAS, RES, RES_DEFAULT, loadProject, syncIndex } = require('./project');

const DEFAULTS = { fps: 60, hold: 1, dur: 5, gifScale: 0.5, crf: 16, preset: 'slow', maxSize: 2e9, previewFps: 30, gifMaxFps: 30 };

/* '2G' | '800M' | '1.5g' | bytes → bytes */
function parseSize(v) {
  if (typeof v === 'number') return v;
  const m = /^([\d.]+)\s*([kmg])?b?$/i.exec(String(v).trim());
  if (!m || !(+m[1] > 0)) throw new Error('bad size ' + v + ' (use e.g. 2G, 800M)');
  return Math.round(+m[1] * ({ k: 1e3, m: 1e6, g: 1e9 }[(m[2] || '').toLowerCase()] || 1));
}
const even = n => 2 * Math.round(n / 2);   // yuv420p needs even dimensions

function resolve(o = {}) {
  const { dir, project } = loadProject(o.project, { variant: o.variant });
  syncIndex(dir);
  const canvas = o.canvas || project.canvas;
  const size = CANVAS[canvas]; if (!size) throw new Error('unknown canvas ' + canvas);
  const resolution = String(o.res || project.resolution || RES_DEFAULT[canvas]).toLowerCase();
  if (!RES[resolution]) throw new Error('unknown resolution ' + resolution + ' (use ' + Object.keys(RES).join(' | ') + ')');
  // --preview is the fast draft: 1x capture (halved again by the encoder) at 30fps unless --fps says otherwise
  const scale = o.scale || (o.preview ? 1 : RES[resolution]);
  const width = o.width || size.width, height = o.height || size.height;
  const pick = (a, b, d) => a != null ? a : (b != null ? b : d);
  const cfg = Object.assign({}, DEFAULTS, {
    project, projectDir: dir, slug: project.slug, canvas, resolution, scale,
    width, height, outWidth: even(width * scale), outHeight: even(height * scale),
    fps: o.fps || (o.preview ? DEFAULTS.previewFps : project.fps || DEFAULTS.fps), hold: pick(o.hold, project.hold, DEFAULTS.hold),
    dur: project.dur != null ? project.dur : DEFAULTS.dur,
    transition: project.transition || null,   // the deck's default slide transition; scripts/timeline.js uses it unless --xf is given
    crf: pick(o.crf, project.crf, DEFAULTS.crf), preset: o.preset || project.preset || DEFAULTS.preset,
    maxSize: parseSize(pick(o.maxSize, project.maxSize, DEFAULTS.maxSize)),
    deck: path.join(dir, 'index.html'),
    // a variant renders beside the base deck, never over it: renders/<variant>/, frames/<variant>/, <slug>-<variant>.mp4
    variant: o.variant || null, outName: project.slug + (o.variant ? '-' + o.variant : ''),
    outputDir: o.outputDir || path.join(dir, 'renders', ...(o.variant ? [o.variant] : [])),
    // every review draft of a video, base deck and variants alike, in one flat folder: renders/previews/<outName>…-preview.mp4
    previewDir: path.join(dir, 'renders', 'previews'),
    // the finished masters (dual + its .srt) of every look land in one renders/final/, named by slug like the base deck's
    finalDir: path.join(dir, 'renders', 'final'),
    frameDir: o.frameDir || path.join(dir, 'frames', ...(o.variant ? [o.variant] : [])),
    root: ROOT,
  });
  // --var key=value (repeatable) → window.VARS in the deck: per-render switches a slide may read (e.g. an intro's theme)
  cfg.vars = {}; (o.vars || []).forEach(v => { const i = String(v).indexOf('='); if (i < 1) throw new Error('--var needs key=value, got ' + v); cfg.vars[v.slice(0, i)] = v.slice(i + 1); });
  cfg.gifFps = Math.min(cfg.fps, DEFAULTS.gifMaxFps);   // GIF frame delays are centiseconds: 60fps is not representable
  return cfg;
}
module.exports = { resolve, parseSize, DEFAULTS, CANVAS };
