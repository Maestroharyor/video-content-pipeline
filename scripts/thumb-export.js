#!/usr/bin/env node
/* thumb-export: one YouTube thumbnail, always a PNG under 2 MB (user, 2026-11-04: "Render always in png and under 2mb").
   Probes the slide first (GRID.thumb: crop-safe box, timestamp and hover corners, readable sizes) and refuses a
   failing design unless --force; renders its 4K poster; then walks the PNG ladder, best first, keeping the first file
   under 2 MB (2,000,000 bytes, YouTube's cap for uploads from a phone; one file serves desktop too):
     1. lossless at 2560, 2400, 2240, 2080, 1920 px wide (sharpest; a grain texture or soft gradients cost size)
     2. 256 colours, dithered, at 2560 and 2240 (full size, tiny banding in gradients)
     3. lossless at 1760, 1600, 1440, 1280 (YouTube's long-standing recommended width)
     4. 256 colours at 1920 (last resort)
   Every step scales the poster with lanczos.
   usage: npm run thumb -- --project <x>-thumbs --slide 03 [--var v=2 ...] [--name <file>] [--pick] [--force]
     → renders/candidates/<name>.png; --pick also writes renders/<x>-thumbnail.png and refreshes deliver/ */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const LIMIT = 2000000;   // YouTube's custom-thumbnail cap: "2 MB", read as decimal to stay clear of it

/* best first: every step is one ffmpeg encoding, every step a PNG */
const LADDER = [...[2560, 2400, 2240, 2080, 1920].map(w => ({ ext: 'png', w })),
  ...[2560, 2240].map(w => ({ ext: 'png', w, pal: 256 })),
  ...[1760, 1600, 1440, 1280].map(w => ({ ext: 'png', w })),
  { ext: 'png', w: 1920, pal: 256 }];

/* the first step whose file fits; sizeOf(step) encodes and returns its byte count. Pure apart from sizeOf */
function choose(steps, sizeOf, limit = LIMIT) {
  for (const s of steps) { const bytes = sizeOf(s); if (bytes < limit) return { ...s, bytes }; }
  return null;
}

const label = s => `${s.w}x${s.w * 9 / 16} PNG ` + (s.pal ? `${s.pal} colours` : 'lossless');

/* the file name a render gets from its switches: 03-board + v=2 → 03-board-v2, face=t39 → -t39 (font is always koho) */
function nameFor(slug, vars) {
  return slug + Object.entries(vars).filter(([k]) => k !== 'font').map(([k, v]) => k === 'v' ? (v === '1' ? '' : '-v' + v) : k === 'face' ? (v === 'off' ? '' : '-' + v) : `-${k}-${v}`).join('');
}

function encode(src, out, s) {
  const scale = `scale=${s.w}:${s.w * 9 / 16}:flags=lanczos`;
  const a = ['-loglevel', 'error', '-y', '-i', src];
  if (s.pal) a.push('-vf', `${scale},split[a][b];[a]palettegen=max_colors=${s.pal}:stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a`, '-compression_level', '9');
  else a.push('-vf', scale, '-pix_fmt', 'rgb24', '-pred', 'mixed', '-compression_level', '9');
  execFileSync('ffmpeg', [...a, out]);
  return fs.statSync(out).size;
}

function main(argv) {
  const get = k => { const i = argv.indexOf(k); return i < 0 ? null : argv[i + 1]; };
  const has = k => argv.includes(k);
  const project = get('--project'), slide = get('--slide');
  if (!project || !slide) throw new Error('usage: npm run thumb -- --project <x>-thumbs --slide <id> [--var k=v ...] [--name f] [--pick] [--force]');
  const varArgs = argv.flatMap((a, i) => a === '--var' ? ['--var', argv[i + 1]] : []);
  const vars = Object.fromEntries(varArgs.filter((_, i) => i % 2).map(v => [v.slice(0, v.indexOf('=')), v.slice(v.indexOf('=') + 1)]));
  if (!vars.font) varArgs.push('--var', 'font=koho');   // house rule: KoHo only
  const pdir = path.join(ROOT, 'projects', project);
  const file = fs.readdirSync(path.join(pdir, 'slides')).find(f => f.startsWith(slide) || f.replace(/\.js$/, '') === slide);
  if (!file) throw new Error('no slide ' + slide + ' in ' + project);
  const slug = file.replace(/\.js$/, '');

  // 1. the safe zone and the readable sizes, on exactly these switches
  const pr = spawnSync('node', [path.join(ROOT, 'scripts/probe.js'), '--project', project, ...varArgs], { cwd: ROOT, encoding: 'utf8' });
  const issues = (pr.stdout || '').split('\n').filter(l => l.startsWith(slug + ' '));
  if (issues.length) {
    issues.forEach(l => console.log('  ' + l));
    if (!has('--force')) throw new Error(`${slug}: ${issues.length} probe issue(s); fix the layout or pass --force`);
    console.warn(`${slug}: exporting anyway (--force)`);
  }

  // 2. the 4K poster
  const tmp = path.join(pdir, 'renders', '.thumb-tmp');
  fs.rmSync(tmp, { recursive: true, force: true });
  execFileSync('node', [path.join(ROOT, 'renderer/cli.js'), '--project', project, '--slide', slug, '--poster', '--force', ...varArgs, '--out', tmp], { cwd: ROOT, stdio: 'ignore' });
  const src = path.join(tmp, 'poster', fs.readdirSync(path.join(tmp, 'poster')).find(f => f.endsWith('.png')));

  // 3. the ladder
  const outDir = path.join(pdir, 'renders', 'candidates');
  fs.mkdirSync(outDir, { recursive: true });
  const name = get('--name') || nameFor(slug, vars);
  const at = s => path.join(tmp, `try-${s.w}${s.pal ? '-p' + s.pal : ''}.png`);
  const won = choose(LADDER, s => encode(src, at(s), s));
  if (!won) throw new Error(`${name}: no PNG on the ladder fits under 2 MB`);
  for (const e of ['png', 'jpg']) fs.rmSync(path.join(outDir, `${name}.${e}`), { force: true });
  const out = path.join(outDir, `${name}.${won.ext}`);
  fs.copyFileSync(at(won), out);
  console.log(`thumb ${path.relative(ROOT, out)}  ${label(won)}  ${(won.bytes / 1e6).toFixed(2)} MB`);

  // 4. the pick: the one file deliver/ links
  if (has('--pick')) {
    const base = project.replace(/-thumbs$/, '');
    for (const e of ['png', 'jpg']) fs.rmSync(path.join(pdir, 'renders', `${base}-thumbnail.${e}`), { force: true });
    const pick = path.join(pdir, 'renders', `${base}-thumbnail.${won.ext}`);
    fs.copyFileSync(out, pick);
    console.log('pick  ' + path.relative(ROOT, pick));
    for (const e of ['png', 'jpg']) fs.rmSync(path.join(pdir, 'renders', `${base}-thumbnail-4k.${e}`), { force: true });   // the dropped desktop twin (2026-11-04)
    require('../renderer/deliver').run(base);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (e) { console.error(e.message || e); process.exit(1); }
}
module.exports = { LADDER, LIMIT, choose, nameFor, label };
