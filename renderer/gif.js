/* Two-pass palette GIF at cfg.gifScale (540x960 by default). */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { holdFilter, input } = require('./video');

const run = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

function gif(dir, slug, cfg) {
  const out = path.join(cfg.outputDir, 'gif', slug + '.gif');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const w = Math.round(cfg.width * cfg.gifScale), h = Math.round(cfg.height * cfg.gifScale);
  const pal = path.join(os.tmpdir(), 'pal_' + slug + '_' + process.pid + '.png');
  const pre = `${holdFilter(cfg)},fps=${cfg.gifFps},scale=${w}:${h}:flags=lanczos`;
  run([...input(dir, cfg), '-vf', `${pre},palettegen=stats_mode=diff`, pal]);
  run([...input(dir, cfg), '-i', pal, '-lavfi', `[0:v]${pre}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle`,
    '-loop', '0', out]);
  fs.rmSync(pal, { force: true });
  return out;
}
module.exports = { gif };
