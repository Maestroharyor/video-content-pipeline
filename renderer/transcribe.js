/* Local transcription with whisper.cpp (whisper-cli) → projects/<slug>/vo.json (+ transcript.txt).
   Everything here is Node-only. normalizeWhisper() and transcriptText() are pure and unit-tested. */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { ROOT } = require('./project');

const MODEL_DIR = path.join(ROOT, 'assets', '.cache', 'whisper');
const MODEL_URL = name => `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${name}.bin`;
const MODEL_SIZE = { 'tiny.en': '75MB', 'base.en': '148MB', 'small.en': '488MB', 'medium.en': '1.5GB', 'large-v3-turbo': '1.6GB' };
const VO_NAMES = ['vo', 'voice', 'voiceover'], VO_EXT = ['wav', 'm4a', 'mp3', 'flac', 'ogg', 'aac', 'mp4', 'mov'];

function which(bin) { const r = spawnSync('which', [bin]); return r.status === 0 ? r.stdout.toString().trim() : null; }

/* the voiceover file for a project: explicit path, else projects/<slug>/{vo,voice,voiceover}.<ext>, also under assets/ */
function findVo(dir, explicit) {
  if (explicit) { const p = path.resolve(explicit); if (!fs.existsSync(p)) throw new Error('audio not found: ' + p); return p; }
  for (const sub of ['', 'assets']) for (const n of VO_NAMES) for (const e of VO_EXT) {
    const p = path.join(dir, sub, n + '.' + e); if (fs.existsSync(p)) return p;
  }
  return null;
}
function toWav16k(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-vn', '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', dst], { stdio: 'inherit' });
  return dst;
}
function audioDuration(file) {
  const r = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim();
  return +(+r).toFixed(3);
}
function ensureModel(name, { download = true, log = () => {} } = {}) {
  const file = path.join(MODEL_DIR, `ggml-${name}.bin`);
  if (fs.existsSync(file) && fs.statSync(file).size > 1e6) return file;
  if (!download) throw new Error(`whisper model missing: ${file}\n  curl -L --create-dirs -o "${file}" ${MODEL_URL(name)}`);
  fs.mkdirSync(MODEL_DIR, { recursive: true });
  log(`downloading ggml-${name}.bin (${MODEL_SIZE[name] || '?'}) → ${path.relative(ROOT, file)}`);
  try { execFileSync('curl', ['-L', '--fail', '--progress-bar', '-o', file, MODEL_URL(name)], { stdio: 'inherit' }); }
  catch (e) { fs.rmSync(file, { force: true }); throw new Error('model download failed: ' + MODEL_URL(name)); }
  return file;
}
function runWhisper({ model, wav, outBase, prompt, threads, language = 'en', dtw }) {
  const bin = which('whisper-cli');
  if (!bin) throw new Error('whisper-cli not on PATH (brew install whisper-cpp)');
  const args = ['-m', model, '-f', wav, '-l', language, '-ml', '1', '-sow', '-ojf', '-of', outBase, '-np', '-t', String(threads || 8)];
  if (prompt) args.push('--prompt', prompt);
  if (dtw) args.push('--dtw', dtw);
  execFileSync(bin, args, { stdio: ['ignore', 'ignore', 'inherit'] });
  const json = outBase + '.json';
  if (!fs.existsSync(json)) throw new Error('whisper produced no JSON at ' + json);
  return JSON.parse(fs.readFileSync(json, 'utf8'));
}
const isNoise = t => /^\[.*\]$|^\(.*\)$|^\*.*\*$/.test(t);
const isPunct = t => /^[^\p{L}\p{N}]+$/u.test(t);

/* whisper.cpp JSON (-ml 1 -sow -ojf) → {words:[{w,s,e,p}], segments:[{s,e,text}]} */
function normalizeWhisper(json, meta = {}) {
  const words = [];
  for (const seg of json.transcription || []) {
    const text = (seg.text || '').trim();
    if (!text || isNoise(text)) continue;
    let s = seg.offsets.from / 1000, e = seg.offsets.to / 1000, p = null;
    const toks = (seg.tokens || []).filter(t => !/^\[_/.test(t.text));
    if (toks.length) {
      const dtw = toks.map(t => t.t_dtw).filter(v => v != null && v >= 0);
      if (dtw.length) { s = dtw[0] / 100; e = Math.max(s + 0.04, seg.offsets.to / 1000); }  // t_dtw marks token onsets; the word ends with its segment
      p = +(toks.reduce((a, t) => a + (t.p || 0), 0) / toks.length).toFixed(3);
    }
    if (isPunct(text) && words.length) { words[words.length - 1].w += text; continue; }
    const prev = words[words.length - 1];
    if (prev && s < prev.e) s = prev.e;
    if (e < s + 0.04) e = s + 0.04;
    words.push({ w: text, s: +s.toFixed(3), e: +e.toFixed(3), p });
  }
  // sentences: end on .!? or on a pause > 0.8s
  const segments = []; let cur = null;
  words.forEach((w, i) => {
    if (!cur) cur = { s: w.s, e: w.e, text: w.w }; else { cur.text += ' ' + w.w; cur.e = w.e; }
    const next = words[i + 1];
    if (/[.!?]["')\]]?$/.test(w.w) || !next || next.s - w.e > 0.8) { segments.push(cur); cur = null; }
  });
  const duration = meta.duration != null ? meta.duration : (words.length ? words[words.length - 1].e : 0);
  return { version: 1, audio: meta.audio || null, model: meta.model || null, duration, language: (json.result && json.result.language) || 'en', words, segments };
}
const stamp = s => { const m = Math.floor(s / 60), ss = (s % 60).toFixed(2); return `(${m}:${ss.padStart(5, '0')})`; };
function transcriptText(vo) { return vo.segments.map(g => `${stamp(g.s)} ${g.text}`).join('\n') + '\n'; }

/* full flow for a project dir; returns {vo, files} */
function transcribe({ dir, audio, model = 'medium.en', prompt, threads, download = true, dtw, log = console.log }) {
  const src = findVo(dir, audio);
  if (!src) throw new Error(`no voiceover found in ${dir} (expected vo.wav|m4a|mp3|flac|ogg, or pass --audio <file>)`);
  const work = path.join(dir, '.whisper');
  const wav = toWav16k(src, path.join(work, 'vo16.wav'));
  const modelFile = ensureModel(model, { download, log });
  log(`whisper-cli ${path.basename(modelFile)} on ${path.relative(dir, src)} …`);
  const t0 = Date.now();
  const json = runWhisper({ model: modelFile, wav, outBase: path.join(work, 'vo'), prompt, threads, dtw: dtw ? model : null });
  const vo = normalizeWhisper(json, { audio: path.relative(dir, src), model: path.basename(modelFile), duration: audioDuration(src) });
  const voFile = path.join(dir, 'vo.json'), txtFile = path.join(dir, 'transcript.txt');
  fs.writeFileSync(voFile, JSON.stringify(vo, null, 1).replace(/\n\s+("w"|"s"|"e"|"p")/g, ' $1').replace(/\{\s+/g, '{ ').replace(/\s+\}/g, ' }'));
  fs.writeFileSync(txtFile, transcriptText(vo));
  log(`${vo.words.length} words, ${vo.segments.length} sentences, ${vo.duration}s audio, ${((Date.now() - t0) / 1000).toFixed(1)}s → ${path.relative(ROOT, voFile)}, ${path.relative(ROOT, txtFile)}`);
  return { vo, files: { vo: voFile, transcript: txtFile, audio: src } };
}
module.exports = { findVo, toWav16k, audioDuration, ensureModel, runWhisper, normalizeWhisper, transcriptText, transcribe, MODEL_DIR, MODEL_URL, MODEL_SIZE };
