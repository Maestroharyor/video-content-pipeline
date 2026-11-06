#!/usr/bin/env node
/* thumb-check: is the thumbnail readable on every screen YouTube shows it on? Writes three review sheets per image
   into <project>/research/visibility/ (user, 2026-11-04: "ensure it is visible in all screen sizes"):
     <name>-large.png   1280 (TV, big player) over 640 (desktop home) + the edge crop, YouTube's overlays drawn on
     <name>-small.png   360 (search, mobile feed) · 246 (mobile up-next) · 168 (desktop sidebar) · 120 (smallest lists),
                        each with the overlays, scaled 2x nearest so the real pixels can be judged
     <name>-shelf.png   the image at 168 px in the middle of the niche's winners (research/thumbs, npm run yt-research):
                        does it stand out on the shelf it will sit on?
   The overlays are drawn where YouTube puts them: the duration badge bottom-right, the hover icons (watch later, queue)
   top-right, the red watch-progress bar along the bottom. They sit inside GRID.thumb's badge and hover zones
   (core/grid.js), which the probe keeps clear of words; this shows what the viewer actually sees.
   The edge crop is GRID.thumb's box: 5% off each side, 10% off top and bottom.
   usage: npm run thumb-check -- --project <x>-thumbs [--file <image>] [--pick] [--all]
          (default --pick: renders/<x>-thumbnail.*; --all: every file in renders/candidates/) */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SIZES = [1280, 640, 360, 246, 168, 120];   // px wide, the places a 16:9 thumbnail is drawn
const CROP = { x: .05, y: .10 };                 // GRID.thumb box: l 96 / 1920, t 108 / 1080

/* YouTube's overlays in 1920x1080 stage px: [x, y, w, h, colour]. Pure: scaled per size by drawboxes() */
const OVERLAYS = [
  [1680, 975, 210, 78, 'black@0.85'],   // duration badge
  [1794, 24, 96, 96, 'black@0.8'],      // hover: watch later
  [1794, 132, 96, 96, 'black@0.8'],     // hover: add to queue
  [0, 1062, 1140, 18, 'red@1'],         // watch progress (a part-watched video)
];
/* the ffmpeg drawbox chain for an image w px wide (16:9) */
function drawboxes(w) {
  const k = w / 1920, r = v => Math.max(1, Math.round(v * k));
  return OVERLAYS.map(([x, y, bw, bh, c]) => `drawbox=x=${r(x)}:y=${r(y)}:w=${r(bw)}:h=${r(bh)}:color=${c}:t=fill`).join(',');
}
const hOf = w => Math.round(w * 9 / 16);

const ff = (...a) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a]);

function sheets(img, outDir, name, winnersDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(outDir, '.tmp-'));
  try {
    const at = w => path.join(tmp, `s${w}.png`);
    for (const w of SIZES) ff('-i', img, '-vf', `scale=${w}:${hOf(w)}:flags=area,${drawboxes(w)}`, at(w));
    const crop = path.join(tmp, 'crop.png');
    ff('-i', img, '-vf', `crop=iw*${1 - 2 * CROP.x}:ih*${1 - 2 * CROP.y}:iw*${CROP.x}:ih*${CROP.y},scale=640:-2`, crop);
    const large = path.join(outDir, `${name}-large.png`);
    ff('-i', at(1280), '-i', at(640), '-i', crop, '-filter_complex', '[2]scale=640:360[c];[1][c]hstack[r];[0][r]vstack', large);
    const small = path.join(outDir, `${name}-small.png`);
    const H = hOf(360);
    ff('-i', at(360), '-i', at(246), '-i', at(168), '-i', at(120), '-filter_complex',
      `[1]pad=246:${H}:0:0:0x222222[b];[2]pad=168:${H}:0:0:0x222222[c];[3]pad=120:${H}:0:0:0x222222[d];[0][b][c][d]hstack=4,scale=iw*2:-1:flags=neighbor`, small);
    const out = [large, small];
    // the shelf: 11 winners around the candidate, all at 168 px, the candidate in the middle of the 4x3 grid
    const win = winnersDir && fs.existsSync(winnersDir) ? fs.readdirSync(winnersDir).filter(f => /\.(jpg|png|webp)$/.test(f)).sort().slice(0, 11) : [];
    if (win.length >= 3) {
      const tiles = [...win.slice(0, 5).map(f => path.join(winnersDir, f)), img, ...win.slice(5).map(f => path.join(winnersDir, f))];
      const n = tiles.length, cols = 4;
      const inputs = tiles.flatMap(t => ['-i', t]);
      const chain = tiles.map((_, i) => `[${i}]scale=168:94:flags=area,setsar=1[t${i}]`).join(';')
        + ';' + tiles.map((_, i) => `[t${i}]`).join('') + `xstack=inputs=${n}:layout=${tiles.map((_, i) => `${(i % cols) * 174}_${Math.floor(i / cols) * 100}`).join('|')}:fill=0x0f0f0f,scale=iw*2:-1:flags=neighbor`;
      const shelf = path.join(outDir, `${name}-shelf.png`);
      ff(...inputs, '-filter_complex', chain, shelf);
      out.push(shelf);
    }
    return out;
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

function main(argv) {
  const get = k => { const i = argv.indexOf(k); return i < 0 ? null : argv[i + 1]; };
  const project = get('--project');
  if (!project) throw new Error('usage: npm run thumb-check -- --project <x>-thumbs [--file <image>] [--pick] [--all]');
  const pdir = path.isAbsolute(project) ? project : path.join(ROOT, 'projects', project);
  const renders = path.join(pdir, 'renders'), cand = path.join(renders, 'candidates');
  const base = path.basename(pdir).replace(/-thumbs$/, '');
  let files;
  if (get('--file')) files = [path.resolve(get('--file'))];
  else if (argv.includes('--all')) files = (fs.existsSync(cand) ? fs.readdirSync(cand) : []).filter(f => /\.(jpg|png)$/.test(f) && !/^0-/.test(f)).map(f => path.join(cand, f));
  else files = (fs.existsSync(renders) ? fs.readdirSync(renders) : []).filter(f => new RegExp(`^${base}-thumbnail\\.(jpg|png)$`).test(f)).map(f => path.join(renders, f));
  if (!files.length) throw new Error('nothing to check: pass --file, or --all with renders/candidates/, or pick one first (npm run thumb --pick)');
  const outDir = path.join(pdir, 'research', 'visibility');
  for (const f of files) {
    const name = path.basename(f).replace(/\.(jpg|png)$/, '');
    const made = sheets(f, outDir, name, path.join(pdir, 'research', 'thumbs'));
    console.log(`check ${path.relative(ROOT, f)} → ${made.map(m => path.relative(ROOT, m)).join('  ')}`);
  }
}

if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (e) { console.error(e.message || e); process.exit(1); }
}
module.exports = { SIZES, CROP, OVERLAYS, drawboxes, hOf };
