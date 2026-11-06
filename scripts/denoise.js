#!/usr/bin/env node
/* Remove steady background noise (a fan, AC hum, room tone) from a project's voiceover with DeepFilterNet, without
   changing the voice: every speech band drops by the same ~2 dB, which a loudness match puts back.
     npm run denoise -- --project <slug> [--atten 100] [--passes 1|2] [--expand] [--lufs -14|match] [--no-footage]
   1. the untouched recording is kept as vo-original.<ext> (re-runs always start from it, never from a cleaned file)
   2. deep-filter (assets/.cache/deepfilter, fetched once from the official GitHub release, checksum verified) runs
      at 48 kHz mono with delay compensation (-D), so lip-sync holds; --atten caps the reduction in dB (100 = full,
      the setting picked on why-fastapi-is-fast; 24 keeps a little room air). --passes 2 runs it again on its own
      output: a take with a loud floor and few pauses (mise-version-manager: -50 dB between words) only drops ~8 dB in
      one pass, and the levelling below then lifts the remainder back into earshot on headphones
   2b. --expand: a gentle downward expander (3:1, at most -24 dB, slow release) before the levelling, so what is left
      in the pauses is not raised with the voice; never a hard gate (that leaves digital silence inside words)
   3. the result is levelled to --lufs (default -14, the phone apps' playback loudness; `match` keeps the original's)
      → vo.wav
   4. PROJECT.source (the footage npm run dual takes its voice from) gets a copy with the clean track:
      <name>-clean.mp4, video stream copied. Point project.js → source at it.
   Captions, vo.json and timeline.json are untouched: the words and their times do not move. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { ROOT, projectDir, loadProject } = require('../renderer/project');
const { findVo } = require('../renderer/transcribe');

const DF = { version: 'v0.5.6', file: 'deep-filter-0.5.6-aarch64-apple-darwin',
  sha256: '4601e7f4e4c03e59a4c5b5000216ef3add3e808799cfccd95e14e83ea4611081' };
const BIN = path.join(ROOT, 'assets', '.cache', 'deepfilter', 'deep-filter');

const a = process.argv.slice(2), val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const ff = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

function ensureBinary() {
  if (!fs.existsSync(BIN)) {
    if (process.platform !== 'darwin' || process.arch !== 'arm64') throw new Error(`no deep-filter build wired for ${process.platform}/${process.arch}: add one from https://github.com/Rikorose/DeepFilterNet/releases/tag/${DF.version}`);
    fs.mkdirSync(path.dirname(BIN), { recursive: true });
    execFileSync('curl', ['-sL', '-o', BIN, `https://github.com/Rikorose/DeepFilterNet/releases/download/${DF.version}/${DF.file}`], { stdio: 'inherit' });
  }
  const sum = crypto.createHash('sha256').update(fs.readFileSync(BIN)).digest('hex');
  if (sum !== DF.sha256) { fs.unlinkSync(BIN); throw new Error('deep-filter checksum mismatch; removed the download: ' + sum); }
  fs.chmodSync(BIN, 0o755);
  return BIN;
}

/* the untouched recording: vo-original.* when a previous run kept one, else the project's voiceover, kept now */
function originalVo(dir) {
  const kept = fs.readdirSync(dir).find(f => /^vo-original\./.test(f));
  if (kept) return path.join(dir, kept);
  const vo = findVo(dir);
  if (!vo) throw new Error('no voiceover in ' + dir + ' (vo.wav, vo.m4a, …)');
  const keep = path.join(dir, 'vo-original' + path.extname(vo));
  fs.copyFileSync(vo, keep);
  return keep;
}

function integratedLufs(file) {
  const r = require('child_process').spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'loudnorm=print_format=summary', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /Input Integrated:\s+(-?[\d.]+)/.exec(r.stderr);
  if (!m) throw new Error('could not measure loudness of ' + file);
  return parseFloat(m[1]);
}

/* deep-filter names its output after its input, so the two live in separate folders → {in48, out} */
function denoise(src, work, atten, passes) {
  const inDir = path.join(work, 'in');
  fs.mkdirSync(inDir, { recursive: true });
  const in48 = path.join(inDir, 'vo.wav');
  ff(['-i', src, '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', in48]);   // DeepFilterNet works at 48 kHz
  let cur = in48;
  for (let k = 1; k <= passes; k++) {
    const outDir = path.join(work, k === 1 ? 'out' : 'out' + k);
    execFileSync(ensureBinary(), ['-D', '-a', String(atten), '-o', outDir, cur], { stdio: 'inherit' });
    cur = path.join(outDir, 'vo.wav');
    if (!fs.existsSync(cur)) throw new Error('deep-filter wrote nothing to ' + outDir);
  }
  return { in48, out: cur };
}

function matchLoudness(ref, cleaned, dst) {
  const gain = (integratedLufs(ref) - integratedLufs(cleaned)).toFixed(2);
  ff(['-i', cleaned, '-af', `volume=${gain}dB,alimiter=limit=0.89:level=disabled`, '-ar', '48000', '-c:a', 'pcm_s24le', dst]);
  return gain;
}

/* a voiceover levelled to a delivery loudness (-14 LUFS: what Shorts, Reels and TikTok play at): a gentle compressor
   evens the phrases so the loudness pass does not lean on the limiter, then two-pass loudnorm (measure, then apply
   linearly with the measured values) lands it on target with true peaks under -1.5 dBTP */
const LEVEL_PRE = 'acompressor=threshold=-24dB:ratio=2.5:attack=8:release=120:makeup=1';
const EXPAND = 'agate=threshold=0.008:ratio=3:range=0.06:attack=4:release=180:knee=4';
function levelTo(cleaned, dst, lufs, expand) {
  const pre = (expand ? EXPAND + ',' : '') + LEVEL_PRE;
  const target = `I=${lufs}:TP=-1.5:LRA=9`;
  const r = require('child_process').spawnSync('ffmpeg', ['-hide_banner', '-i', cleaned, '-af', `${pre},loudnorm=${target}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
  const m = JSON.parse(r.stderr.slice(r.stderr.lastIndexOf('{'), r.stderr.lastIndexOf('}') + 1));
  const measured = `measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}`;
  ff(['-i', cleaned, '-af', `${pre},loudnorm=${target}:${measured}:linear=true`, '-ar', '48000', '-c:a', 'pcm_s24le', dst]);
  return integratedLufs(dst).toFixed(1);
}

/* the footage with its audio swapped for the clean track, in the footage's own rate and channel count; the clean
   track can end a few ms early, so it is padded and -shortest stops at the video's last frame */
function cleanFootage(footage, vo) {
  const info = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=sample_rate,channels', '-of', 'csv=p=0', footage], { encoding: 'utf8' }).trim().split(',');
  const dst = path.join(path.dirname(footage), path.basename(footage, path.extname(footage)) + '-clean.mp4');
  ff(['-i', footage, '-i', vo, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-af', 'apad', '-c:a', 'aac', '-b:a', '256k',
    '-ar', info[0] || '48000', '-ac', info[1] || '2', '-shortest', '-movflags', '+faststart', dst]);
  return dst;
}

try {
  const dir = projectDir(val('--project') || val('-p'));
  const atten = +(val('--atten') || 100);
  const work = path.join(dir, '.whisper', 'denoise');
  fs.rmSync(work, { recursive: true, force: true });
  fs.mkdirSync(work, { recursive: true });
  const orig = originalVo(dir);
  const passes = +(val('--passes') || 1), expand = a.includes('--expand');
  const { in48, out } = denoise(orig, work, atten, passes);
  const vo = path.join(dir, 'vo.wav');
  const lufs = val('--lufs') || '-14';
  const level = lufs === 'match' ? `${matchLoudness(in48, out, vo)} dB to match the original` : `levelled to ${levelTo(out, vo, +lufs, expand)} LUFS`;
  console.log(`denoise: ${path.relative(ROOT, orig)} → vo.wav (DeepFilterNet ${DF.version}, atten ${atten} dB, ${passes} pass(es)${expand ? ', expander' : ''}, ${level})`);
  const P = loadProject(dir).project;
  // the footage as recorded: when source already points at a -clean copy, start again from the file it came from
  const src = P && P.source ? path.resolve(dir, P.source).replace(/-clean\.mp4$/, '.mp4') : null;
  if (src && fs.existsSync(src) && !a.includes('--no-footage')) {
    const clean = cleanFootage(src, vo);
    console.log(`denoise: footage with the clean track → ${path.relative(ROOT, clean)} (project.js → source: '${path.basename(clean)}')`);
  }
} catch (e) { console.error(e.message); process.exit(1); }
