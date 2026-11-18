#!/usr/bin/env node
/**
 * Machine setup + health check.
 *
 *   ./setup.sh | setup.ps1       # the one-shot bootstrap (installs Node/ffmpeg/whisper, npm install, then runs this)
 *   npm run setup                # check toolchain, install missing ffmpeg / whisper-cli (Homebrew or apt), fetch missing
 *                                # shared assets, link the skills (repo + ~/.claude/skills)
 *   npm run setup -- --no-install  # never run a package manager, only report + link
 *   npm run doctor               # check only, change nothing (exit 1 when something required is missing)
 *
 * The whisper model itself (ggml-medium.en.bin) is downloaded by `npm run transcribe` on first use.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');
const INSTALL = !CHECK && !process.argv.includes('--no-install');
const REPO_LINKS = ['.claude/skills', '.agents/skills', '.opencode/skills'];
/* social-copy lives in the image pipeline (one copy, both pipelines use it). Link it here too when
   the sibling is checked out, so /social-copy works from inside this repo as well. */
const SIBLING_SKILL = path.resolve(ROOT, '..', 'image-content-pipeline', 'skills', 'social-copy');
const WHISPER_MODELS = path.join(ROOT, 'assets', '.cache', 'whisper');

let failed = false;
const ok = (m) => console.log('  ok   ' + m);
const warn = (m) => console.log('  warn ' + m);
const bad = (m) => { failed = true; console.log('  MISSING ' + m); };

function which(bin) {
  try { return execFileSync(process.platform === 'win32' ? 'where' : 'which', [bin], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().split('\n')[0]; }
  catch { return null; }
}
function version(bin, args = ['-version']) {
  try { return execFileSync(bin, args, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('\n')[0].trim(); } catch { return ''; }
}

console.log(`vid setup (${CHECK ? 'check only' : 'apply'}) — ${ROOT}\n`);

/* ---- node ---- */
const [maj, min] = process.versions.node.split('.').map(Number);
if (maj > 22 || (maj === 22 && min >= 12)) ok(`node ${process.versions.node}`);
else bad(`node ${process.versions.node}: need >= 22.12 (nvm install 22 && nvm use)`);

/* ---- package installs (macOS: Homebrew, Debian/Ubuntu: apt) ---- */
const PKG = { ffmpeg: { brew: 'ffmpeg', apt: 'ffmpeg' }, 'whisper-cli': { brew: 'whisper-cpp', apt: null } };
function install(bin) {
  if (!INSTALL) return false;
  const pkg = PKG[bin];
  if (process.platform === 'darwin' && which('brew') && pkg.brew) {
    console.log(`  ...  installing ${pkg.brew} with Homebrew`);
    try { execFileSync('brew', ['install', pkg.brew], { stdio: 'inherit' }); return !!which(bin); } catch { return false; }
  }
  if (process.platform === 'linux' && which('apt-get') && pkg.apt) {
    console.log(`  ...  installing ${pkg.apt} with apt (sudo)`);
    try { execFileSync('sudo', ['apt-get', 'install', '-y', pkg.apt], { stdio: 'inherit' }); return !!which(bin); } catch { return false; }
  }
  return false;
}
const HOWTO = {
  ffmpeg: 'brew install ffmpeg  |  apt install ffmpeg  |  https://ffmpeg.org/download.html',
  'whisper-cli': 'brew install whisper-cpp  |  Linux/Windows: build https://github.com/ggml-org/whisper.cpp and put whisper-cli on PATH',
};

/* ---- ffmpeg ---- */
if (!which('ffmpeg') || !which('ffprobe')) install('ffmpeg');
for (const b of ['ffmpeg', 'ffprobe']) {
  const p = which(b);
  if (p) ok(`${b} ${version(b).replace(/ Copyright.*/, '')}`);
  else bad(`${b} not on PATH (${HOWTO.ffmpeg})`);
}

/* ---- puppeteer chrome ---- */
async function chromeCheck() {
  try {
    const puppeteer = require('puppeteer');
    const exe = await puppeteer.executablePath();
    if (fs.existsSync(exe)) ok('chrome for testing ' + exe);
    else bad('puppeteer Chrome not downloaded (npm install, or: npx puppeteer browsers install chrome)');
  } catch { bad('puppeteer not installed (npm install)'); }
}

(async () => {
await chromeCheck();

/* ---- whisper (optional, needed for `npm run transcribe`) ---- */
if (!which('whisper-cli')) install('whisper-cli');
const whisper = which('whisper-cli');
if (whisper) {
  ok('whisper-cli ' + whisper);
  const models = fs.existsSync(WHISPER_MODELS) ? fs.readdirSync(WHISPER_MODELS).filter(f => /^ggml-.*\.bin$/.test(f)) : [];
  if (models.length) ok('whisper models: ' + models.join(', '));
  else warn(`no whisper model yet: \`npm run transcribe\` downloads ggml-medium.en.bin into ${path.relative(ROOT, WHISPER_MODELS)} on first use (≈1.5GB)`);
} else warn(`whisper-cli not on PATH — only needed for \`npm run transcribe\` (${HOWTO['whisper-cli']})`);

/* ---- shared assets ---- */
const needAssets = ['assets/fonts/InterVariable.woff2', 'assets/fonts/OpenSans-Variable.ttf', 'assets/logos/brands/instagram.svg', 'assets/audio/outro.wav'];
let missing = needAssets.filter(f => !fs.existsSync(path.join(ROOT, f)));
if (missing.length && !CHECK) {
  console.log('  ...  fetching shared assets (npm run assets)');
  try { execFileSync('npm', ['run', 'assets'], { stdio: 'inherit', shell: process.platform === 'win32' }); } catch {}
  missing = needAssets.filter(f => !fs.existsSync(path.join(ROOT, f)));
}
if (!missing.length) ok('shared assets present');
else bad('shared assets missing: ' + missing.join(', ') + '  (npm run assets)');

/* ---- skill symlinks ---- */
function link(target, from, kind) {
  const rel = path.relative(path.dirname(from), target);
  let cur = null;
  try { cur = fs.readlinkSync(from); } catch {}
  const resolved = cur && path.resolve(path.dirname(from), cur);
  if (resolved === target) { ok(`${kind} ${from} -> ${cur}`); return; }
  if (CHECK) { bad(`${kind} link ${from} (run: npm run setup)`); return; }
  fs.mkdirSync(path.dirname(from), { recursive: true });
  try { fs.rmSync(from, { recursive: true, force: true }); } catch {}
  try {
    fs.symlinkSync(kind === 'home' ? target : rel, from, 'dir');
    ok(`${kind} linked ${from} -> ${kind === 'home' ? target : rel}`);
  } catch (e) {
    // symlinks can fail on Windows without developer mode: fall back to a copy
    fs.cpSync(target, from, { recursive: true });
    warn(`${kind} copied instead of linked (${e.code}); re-run npm run setup after editing the skill`);
  }
}
/* every skill folder in skills/ (new-video, new-thumbnail, ...): a new skill is linked by being added there */
const SKILLS = fs.readdirSync(path.join(ROOT, 'skills')).filter(n => fs.existsSync(path.join(ROOT, 'skills', n, 'SKILL.md'))).sort()
  .map(name => ({ name, dir: path.join(ROOT, 'skills', name) }));
if (fs.existsSync(SIBLING_SKILL)) SKILLS.push({ name: 'social-copy', dir: SIBLING_SKILL });
else warn('social-copy not linked: ../image-content-pipeline is not checked out');
for (const s of SKILLS) {
  for (const d of REPO_LINKS) link(s.dir, path.join(ROOT, d, s.name), 'repo');
  link(s.dir, path.join(os.homedir(), '.claude', 'skills', s.name), 'home');
}

console.log('');
if (failed) { console.log('Something required is missing — fix the lines marked MISSING and run `npm run doctor` again.'); process.exit(1); }
console.log(CHECK ? 'All good.' : 'Setup complete. Open a new Claude Code session and type /new-video (or /new-thumbnail).');
})();
