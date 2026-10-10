#!/usr/bin/env node
/* Tiles every poster in renders/poster into one contact sheet (renders/contact-sheet.png) for a quick visual pass. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { resolve } = require('../renderer/config');
const { parseArgs } = require('../renderer/args');
const cfg = resolve(parseArgs(process.argv.slice(2)));
const dir = path.join(cfg.outputDir, 'poster');
/* deck order, not string order: with more than 99 slides "100-…" sorts before "11-…" as plain text and the
   sheet stops showing the sequence the viewer actually sees (same fix as renderer/project.js) */
const byNumber = (a, b) => {
  const na = (a.match(/^(\d+)/) || [])[1], nb = (b.match(/^(\d+)/) || [])[1];
  if (na && nb && +na !== +nb) return +na - +nb;
  return a.localeCompare(b);
};
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.png') && !f.includes('@')).sort(byNumber) : [];
if (!files.length) { console.error('no posters yet: run npm run poster'); process.exit(1); }
const cols = cfg.canvas === 'vertical' ? 6 : 4, W = cfg.canvas === 'vertical' ? 270 : 480, H = cfg.canvas === 'vertical' ? 480 : 270;
// xstack's grid= needs a full grid, so lay the tiles out explicitly
const layout = files.map((_, i) => `${(i % cols) * W}_${Math.floor(i / cols) * H}`).join('|');
const inputs = files.flatMap(f => ['-i', path.join(dir, f)]);
const out = path.join(cfg.outputDir, 'contact-sheet.png');
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex',
  files.length === 1 ? `[0:v]scale=${W}:${H}`   // xstack needs at least two inputs: a one-slide deck (an intro) is just its poster
    : files.map((_, i) => `[${i}:v]scale=${W}:${H}[s${i}]`).join(';') + ';' + files.map((_, i) => `[s${i}]`).join('') + `xstack=inputs=${files.length}:layout=${layout}:fill=black`, out]);
console.log('wrote', path.relative(cfg.root, out), `(${files.length} posters)`);
