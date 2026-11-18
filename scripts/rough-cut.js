#!/usr/bin/env node
/* Rough cut of a raw (uncut) recording against its script: retakes, false starts, stutters and long pauses out.
     npm run rough-cut -- --project <slug> --raw <file> [--script <file> | --no-script]   islands + match, then stop for review
     npm run rough-cut -- --project <slug> --stage cut [--audio-only]                      after the take list is approved
     options: --stage islands|match|cut · --model medium.en · --force (redo a stage whose output exists)
   Writes projects/<slug>/source/:
     islands.json  speech islands of the raw (silencedetect -38 dB / 0.18 s), each with its words (one whisper pass over the
                   raw; islands whisper was unsure of re-transcribed alone)
     edit.json     the cut: raw file, kept islands, pacing caps (house rule: his own pauses, 0.6 s max, joins 0.3-0.55,
                   0.85 before a section), editable by hand; `match` never overwrites it without --force
     takes.md      the approval sheet: every script line, the take kept, the takes dropped and why, flags, missing lines
     edl.json      (cut) raw → cut time map
   and, on `cut`, ../aroll.mp4 (picture + voice; frame-exact, hevc_videotoolbox on macOS) and ../vo.wav (48 kHz mono).
   House rule: raw footage is never cut before the user has approved takes.md (skills/new-video Step 1a).
   The logic lives in renderer/roughcut.js; the cut is the engine of projects/reverse-proxy-lb-gateway/source/edit.js. */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { loadProject } = require('../renderer/project');
const T = require('../renderer/transcribe');
const RC = require('../renderer/roughcut');

const a = process.argv.slice(2), val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; }, has = k => a.includes(k);
const slug = val('--project') || process.env.VID_PROJECT;
if (!slug) throw new Error('usage: npm run rough-cut -- --project <slug> --raw <file> [--script <file> | --no-script] [--stage islands|match|cut]');
const { dir } = loadProject(slug);
const src = path.join(dir, 'source'), work = path.join(dir, 'frames', 'roughcut');
fs.mkdirSync(src, { recursive: true }); fs.mkdirSync(work, { recursive: true });
const F = { islands: path.join(src, 'islands.json'), edit: path.join(src, 'edit.json'), takes: path.join(src, 'takes.md'), edl: path.join(src, 'edl.json') };
const stage = val('--stage'), force = has('--force'), model = val('--model') || 'medium.en';
const untilde = p => p && p.replace(/^~(?=\/)/, process.env.HOME);
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const r3 = x => +x.toFixed(3);
const log = (...m) => console.log(...m);

// ---------- islands ----------
function islands(raw) {
  if (fs.existsSync(F.islands) && !force) { log(`islands: ${path.relative(dir, F.islands)} exists (--force to redo)`); return read(F.islands); }
  const wav = T.toWav16k(raw, path.join(work, 'raw16.wav'));
  const dur = T.audioDuration(wav);
  // speech = everything that is not silence (-38 dB for 0.18 s, the threshold both hand cuts used)
  const sd = spawnSync('ffmpeg', ['-hide_banner', '-i', wav, '-af', 'silencedetect=noise=-38dB:d=0.18', '-f', 'null', '-']).stderr.toString();
  const sil = []; let s0 = null;
  for (const l of sd.split('\n')) {
    const m1 = /silence_start: ([\d.]+)/.exec(l), m2 = /silence_end: ([\d.]+)/.exec(l);
    if (m1) s0 = +m1[1];
    if (m2 && s0 != null) { sil.push([s0, +m2[1]]); s0 = null; }
  }
  if (s0 != null) sil.push([s0, dur]);
  const I = []; let t = 0;
  for (const [x, y] of sil) { if (x - t >= 0.12) I.push({ a: r3(t), b: r3(x) }); t = y; }
  if (dur - t >= 0.12) I.push({ a: r3(t), b: r3(dur) });
  log(`islands: ${I.length} speech islands in ${dur.toFixed(1)} s of raw`);
  // one whisper pass over the raw, words given to the island their middle falls in
  const mf = T.ensureModel(model, { log });
  log(`whisper ${model} over the raw (word timings) …`);
  const vo = T.normalizeWhisper(T.runWhisper({ model: mf, wav, outBase: path.join(work, 'raw') }), { duration: dur });
  I.forEach((o, k) => { o.i = k; o.words = vo.words.filter(w => (w.s + w.e) / 2 >= o.a - 0.05 && (w.s + w.e) / 2 < o.b + 0.05); });
  // islands whisper was unsure of (no words, or low average confidence) are transcribed alone, as both hand cuts did
  const doubt = I.filter(o => !o.words.length || o.words.reduce((m, w) => m + (w.p || 0), 0) / o.words.length < 0.55);
  log(`re-transcribing ${doubt.length} doubtful island(s) one by one …`);
  doubt.forEach(o => {
    const f = path.join(work, `isl-${o.i}.wav`);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(Math.max(0, o.a - 0.15)), '-to', String(o.b + 0.15), '-i', wav, '-c:a', 'pcm_s16le', f]);
    const v = T.normalizeWhisper(T.runWhisper({ model: mf, wav: f, outBase: f.replace(/\.wav$/, '') }));
    if (v.words.length) o.words = v.words.map(w => ({ w: w.w, s: r3(w.s + Math.max(0, o.a - 0.15)), e: r3(w.e + Math.max(0, o.a - 0.15)), p: w.p }));
    fs.rmSync(f, { force: true }); fs.rmSync(f.replace(/\.wav$/, '.json'), { force: true });
  });
  I.forEach(o => { o.text = o.words.map(w => w.w).join(' ').trim(); });
  fs.writeFileSync(F.islands, '[\n' + I.map(o => JSON.stringify({ i: o.i, a: o.a, b: o.b, text: o.text, words: o.words })).join(',\n') + '\n]\n');
  log(`→ ${path.relative(dir, F.islands)}`);
  return I;
}

// ---------- script ----------
function scriptText(file) {
  const f = untilde(file);
  if (!fs.existsSync(f)) throw new Error('script not found: ' + f);
  // teleprompter exports: rtf/docx/doc/odt to plain text with macOS textutil; txt/md read as they are
  if (/\.(rtf|rtfd|docx?|odt|html?)$/i.test(f)) {
    if (process.platform !== 'darwin') throw new Error('convert the script to .txt first (textutil is macOS only)');
    return execFileSync('textutil', ['-convert', 'txt', '-stdout', f]).toString();
  }
  return fs.readFileSync(f, 'utf8');
}

// ---------- match ----------
function match(I, raw) {
  if (fs.existsSync(F.edit) && !force) throw new Error(`${path.relative(dir, F.edit)} exists and may hold your approved edits; --force to rebuild it from the script`);
  const sfile = val('--script');
  if (!sfile && !has('--no-script')) throw new Error('pass --script <file> or --no-script');
  const script = sfile ? RC.parseScript(scriptText(sfile)) : null;
  if (sfile) fs.copyFileSync(untilde(sfile), path.join(src, 'script' + path.extname(sfile)));
  const { takes, missing } = RC.chooseTakes(I, script);
  const fps = probeFps(raw) || 60;
  const E = Object.assign({ raw, fps, script: sfile ? 'source/script' + path.extname(sfile) : null,
    why: 'Generated by npm run rough-cut: last complete take of each line; retakes, false starts and cut-off takes out. Edit keep/trim after review.',
    keep: takes.filter(t => t.keep).map(t => t.i), trim: {}, sections: RC.sectionStarts(takes, script) }, RC.PACING);
  // number lists on one line, so `keep` reads and edits by hand
  fs.writeFileSync(F.edit, JSON.stringify(E, null, 1).replace(/\[\s+([\d.,\s]+?)\s+\]/g, (m, x) => '[' + x.replace(/\s+/g, ' ') + ']') + '\n');
  fs.writeFileSync(F.takes, takesSheet(I, takes, missing, script, E));
  const plan = RC.planSegments(I, E);
  const rawLen = I.length ? I[I.length - 1].b : 0;
  log(`match: ${E.keep.length} of ${I.length} islands kept, ${takes.filter(t => t.flag).length} flagged, ${missing.length} script line(s) missing`);
  log(`  cut length ≈ ${fmt(plan.length)} (raw ${fmt(rawLen)})`);
  log(`→ ${path.relative(dir, F.edit)}, ${path.relative(dir, F.takes)}`);
  log(`Review takes.md (edit keep/trim in edit.json to override), then: npm run rough-cut -- --project ${slug} --stage cut${hasVideo(raw) ? '' : ' --audio-only'}`);
}
const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;

function takesSheet(I, takes, missing, script, E) {
  const by = new Map(takes.map(t => [t.i, t]));
  const tm = t => `${fmt(t.a)}-${fmt(t.b)}`;
  const esc = s => String(s || '').replace(/\|/g, '\\|');
  const out = [`# Take list: ${slug}`, '',
    `Raw: \`${E.raw}\` · ${I.length} speech islands · ${E.keep.length} kept · cut ≈ ${fmt(RC.planSegments(I, E).length)}`, '',
    'Approve this list before the cut. To change it, edit `keep` (island numbers) or `trim` in `source/edit.json`, then run',
    `\`npm run rough-cut -- --project ${slug} --stage cut\`.`, ''];
  const flagged = takes.filter(t => t.flag && t.keep);
  if (flagged.length || missing.length) {
    out.push('## Needs your eye', '');
    flagged.forEach(t => out.push(`- **${t.i}** (${tm(t)}) ${t.flag}${t.alt != null ? `, alternative take ${t.alt}` : ''}: "${esc(t.text)}"${t.reason ? ` (${t.reason})` : ''}`));
    if (script) missing.forEach(id => out.push(`- **missing** line ${id}: "${esc(script.lines[id - 1].text)}" (no take found)`));
    out.push('');
  }
  if (script) {
    out.push('## By script line', '', '| Line | Script | Kept | Dropped |', '|---|---|---|---|');
    script.lines.forEach(l => {
      const k = takes.filter(t => t.keep && t.lines.includes(l.id)), d = takes.filter(t => !t.keep && t.lines.includes(l.id));
      if (!k.length && !d.length && l.optional) return;
      out.push(`| ${l.id}${l.optional ? ' (opt)' : ''} | ${esc(l.text)} | ${k.map(t => `${t.i} ${tm(t)}${t.flag ? ` **${t.flag}**` : ''}`).join('<br>') || '—'} | ${d.map(t => `${t.i}: ${esc(t.reason)}`).join('<br>')} |`);
    });
    const ad = takes.filter(t => t.flag === 'ad-lib');
    if (ad.length) { out.push('', '## Off-script (ad-libs)', ''); ad.forEach(t => out.push(`- ${t.i} (${tm(t)}) ${t.keep ? 'kept' : 'dropped'}: "${esc(t.text)}"`)); }
  } else {
    out.push('## Islands (no script)', '', '| Island | Time | Words | Kept | Why |', '|---|---|---|---|---|');
    takes.forEach(t => out.push(`| ${t.i} | ${tm(t)} | ${esc(t.text)} | ${t.keep ? 'yes' : 'no'}${t.flag ? ` **${t.flag}**` : ''} | ${esc(t.reason)} |`));
  }
  return out.join('\n') + '\n';
}

// ---------- cut ----------
function probeFps(f) {
  try { const r = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', f]).toString().trim(); if (!r) return null; const [n, d] = r.split('/').map(Number); return Math.round(n / (d || 1)); } catch { return null; }
}
const hasVideo = f => !!probeFps(f);

function cut() {
  const E = read(F.edit), I = read(F.islands);
  const audioOnly = has('--audio-only') || !hasVideo(E.raw);
  const { segs, edl, length } = RC.planSegments(I, E);
  fs.writeFileSync(F.edl, JSON.stringify(edl).replace(/},/g, '},\n'));
  // the voice: decoded once at 48 kHz mono and spliced in memory with 8 ms fades (48000 / 60 = 800 samples a frame, so
  // frame-snapped edges are whole samples and the voice matches the picture to the sample)
  const SR = 48000;
  // 48 kHz float mono is ~11.5 MB a minute: a 2 GB buffer holds ~3 h of raw
  const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', E.raw, '-vn', '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 2 * 1024 ** 3 });
  const s = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.length / 4);
  const gainOf = i => { const r = (E.gain || []).find(r => i >= r.from && i <= r.to); return r ? Math.pow(10, r.db / 20) : 1; };
  const n = segs.reduce((m, g) => m + Math.round((g.e - g.s) * SR), 0), out = new Int16Array(n), fadeN = Math.round((E.fade || 0.008) * SR);
  let w = 0;
  for (const g of segs) {
    const a0 = Math.round(g.s * SR), len = Math.round((g.e - g.s) * SR), k0 = gainOf(g.i);
    for (let j = 0; j < len; j++) { const k = Math.min(1, j / fadeN, (len - 1 - j) / fadeN); out[w++] = Math.max(-32768, Math.min(32767, Math.round((s[a0 + j] || 0) * k * k0 * 32767))); }
  }
  const hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + n * 2, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(1, 22);
  hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 2, 28); hdr.writeUInt16LE(2, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(n * 2, 40);
  const vo = path.join(dir, 'vo.wav');
  fs.writeFileSync(vo, Buffer.concat([hdr, Buffer.from(out.buffer)]));
  log(`voice → ${path.relative(dir, vo)} (${fmt(length)})`);
  if (audioOnly) { log('audio only: no picture cut'); return; }
  // the picture: spans merged where they abut, encoded in chunks of 40 from an accurate seek, frame counts verified
  const spans = [];
  for (const g of segs) { const l = spans[spans.length - 1]; if (l && Math.abs(l.e - g.s) < 1e-6) l.e = g.e; else spans.push({ s: g.s, e: g.e }); }
  const fr = x => Math.round(x * E.fps) / E.fps, h = 0.5 / E.fps, parts = [];
  const venc = process.platform === 'darwin' ? ['-c:v', 'hevc_videotoolbox', '-b:v', '40M', '-tag:v', 'hvc1'] : ['-c:v', 'libx264', '-crf', '16', '-preset', 'medium'];
  for (let c = 0; c * 40 < spans.length; c++) {
    const chunk = spans.slice(c * 40, c * 40 + 40), ss = Math.max(0, fr(chunk[0].s - 1));
    const sel = chunk.map(g => `between(t,${(g.s - ss - h).toFixed(4)},${(g.e - ss - h).toFixed(4)})`).join('+');
    const part = path.join(work, `part${String(c).padStart(3, '0')}.mp4`);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', ss.toFixed(4), '-t', (chunk[chunk.length - 1].e - ss + 0.5).toFixed(4), '-i', E.raw, '-an',
      '-vf', `select='${sel}',setpts=N/FRAME_RATE/TB`, '-r', String(E.fps), ...venc, '-g', String(E.fps), '-pix_fmt', 'yuv420p',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', part], { stdio: 'inherit' });
    const want = chunk.reduce((m, g) => m + Math.round((g.e - g.s) * E.fps), 0);
    const got = +execFileSync('ffprobe', ['-v', 'error', '-count_packets', '-select_streams', 'v', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', part]).toString().trim();
    if (got !== want) throw new Error(`picture chunk ${c}: ${got} frames, expected ${want}`);
    parts.push(part);
    log(`  picture ${c + 1}/${Math.ceil(spans.length / 40)} ok (${got} frames)`);
  }
  const list = path.join(work, 'parts.txt');
  fs.writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'));
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-i', vo, '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', path.join(dir, 'aroll.mp4')], { stdio: 'inherit' });
  parts.forEach(p => fs.rmSync(p, { force: true }));
  const rawLen = I[I.length - 1].b;
  log(`${segs.length} segments, ${fmt(length)} (raw ${fmt(rawLen)}, ${fmt(rawLen - length)} removed) → aroll.mp4, vo.wav, source/edl.json`);
}

// ---------- run ----------
if (stage === 'cut') cut();
else {
  const raw = untilde(val('--raw')) || (fs.existsSync(F.edit) ? read(F.edit).raw : null);
  if (!raw || !fs.existsSync(raw)) throw new Error('raw recording not found: pass --raw <file>');
  const I = islands(path.resolve(raw));
  if (stage !== 'islands') match(I, path.resolve(raw));
}
