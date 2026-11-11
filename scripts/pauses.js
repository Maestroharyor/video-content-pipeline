#!/usr/bin/env node
/* Insert silent pauses into a project's recording (renderer/pauses.js has the why and the time maths).
     npm run pauses -- --project <slug> [--dry]
   From PROJECT.pauses = { from, out, at: [[seconds, length, fill?], …] } (recording time; fill = { audio, words }, files in
   the project: narration that plays from the gap's start instead of silence, words = a vo.json-shaped file whose times
   are seconds into the fill):
   1. the unpaused originals are kept once: vo-unpaused.json, vo-unpaused.wav (re-runs always start from them)
   2. <out>: the footage cut at each pause, the frame before the gap held for its length, the voice from vo-unpaused.wav
      with digital silence in the gap (the deck covers the frame there, so the hold is never seen)
   3. vo.wav and vo.json in paused time; point project.js → source at <out>
   Re-run `npm run timeline` and `npm run sfx` afterwards: every slide after a pause moves. A new `npm run denoise` writes an
   unpaused vo.wav, so run this again after it. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadProject } = require('../renderer/project');
const PZ = require('../renderer/pauses');

const a = process.argv.slice(2), val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const slug = val('--project') || process.env.VID_PROJECT;
if (!slug) throw new Error('usage: npm run pauses -- --project <slug> [--dry]');
const { dir, project: P } = loadProject(slug);
if (!P.pauses || !P.pauses.from || !P.pauses.out) throw new Error('project.js needs pauses: { from, out, at: [[seconds, length], …] }');
const gaps = PZ.normalise(P.pauses.at);
const at = f => path.join(dir, f);

const keep = (src, dst) => { if (!fs.existsSync(at(dst))) fs.copyFileSync(at(src), at(dst)); return at(dst); };
const voJson = keep('vo.json', 'vo-unpaused.json'), voWav = keep('vo.wav', 'vo-unpaused.wav');
const fps = P.fps || 60, frame = s => Math.round(s * fps) / fps;

const parts = PZ.pieces(gaps);
console.log(`pauses: ${gaps.length} gap(s), +${gaps.reduce((s, g) => s + g.dur, 0)}s`);
for (const p of parts) console.log(`  ${p.from.toFixed(3)} → ${p.to == null ? 'end' : p.to.toFixed(3)}${p.pad ? `  + ${p.pad}s held${p.fill ? ` (voice: ${p.fill.audio})` : ''}` : ''}`);
if (a.includes('--dry')) process.exit(0);

/* one input per piece (input seeking is frame-exact when the video is re-encoded), the voice likewise; a fill is one
   more input, appended after all the pieces */
const args = ['-hide_banner', '-loglevel', 'error', '-y'];
const fc = [], fills = [];
const MONO = 'aresample=48000,aformat=sample_fmts=fltp:channel_layouts=mono';
parts.forEach((p, i) => {
  const span = p.to == null ? [] : ['-to', String(frame(p.to))];
  args.push('-ss', String(frame(p.from)), ...span, '-i', path.join(dir, P.pauses.from));
  args.push('-ss', String(frame(p.from)), ...span, '-i', voWav);
  const v = 2 * i, s = 2 * i + 1;
  /* fill.hold 'bounce' (reverse-proxy review 3: a short beat added while the face is on screen, where a held frame reads
     as a freeze): the last pad/2 s before the gap play backwards, then forwards again, so the picture lands exactly
     on the frame it left and moves the whole time; the room tone under it does the same. Only for short pauses taken
     in a silence (the speaker is still between lines). */
  if (p.pad && p.fill && p.fill.hold === 'bounce') {
    const h = p.pad / 2, len = frame(p.to) - frame(p.from), t0 = (len - h).toFixed(4);
    fc.push(`[${v}:v]setpts=PTS-STARTPTS,split=3[vm${i}][vr${i}][vf${i}]`);
    fc.push(`[vr${i}]trim=start=${t0},setpts=PTS-STARTPTS,reverse[vrr${i}]`, `[vf${i}]trim=start=${t0},setpts=PTS-STARTPTS[vff${i}]`);
    fc.push(`[vm${i}][vrr${i}][vff${i}]concat=n=3:v=1:a=0[v${i}]`);
    fc.push(`[${s}:a]${MONO},asetpts=PTS-STARTPTS,asplit=3[am${i}][ar${i}][af${i}]`);
    fc.push(`[ar${i}]atrim=start=${t0},asetpts=PTS-STARTPTS,areverse[arr${i}]`, `[af${i}]atrim=start=${t0},asetpts=PTS-STARTPTS[aff${i}]`);
    fc.push(`[am${i}][arr${i}][aff${i}]concat=n=3:v=0:a=1[a${i}]`);
    return;
  }
  fc.push(`[${v}:v]setpts=PTS-STARTPTS${p.pad ? `,tpad=stop_mode=clone:stop_duration=${p.pad}` : ''}[v${i}]`);
  if (!p.fill) { fc.push(`[${s}:a]${MONO},asetpts=PTS-STARTPTS${p.pad ? `,apad=pad_dur=${p.pad}` : ''}[a${i}]`); return; }
  const f = 2 * parts.length + fills.length;
  fills.push(path.join(dir, p.fill.audio));
  fc.push(`[${s}:a]${MONO},asetpts=PTS-STARTPTS[av${i}]`);
  fc.push(`[${f}:a]${MONO},apad=whole_dur=${p.pad},atrim=0:${p.pad},asetpts=PTS-STARTPTS[af${i}]`);
  fc.push(`[av${i}][af${i}]concat=n=2:v=0:a=1[a${i}]`);
});
fills.forEach(f => args.push('-i', f));
fc.push(parts.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${parts.length}:v=1:a=1[v][a]`);
const out = path.join(dir, P.pauses.out), tmpWav = at('vo-paused.tmp.wav');
args.push('-filter_complex', fc.join(';'), '-map', '[v]', '-map', '[a]',
  '-c:v', 'h264_videotoolbox', '-b:v', '80M', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
  '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', out);
execFileSync('ffmpeg', args, { stdio: 'inherit' });
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', out, '-vn', '-ac', '1', '-ar', '48000', tmpWav], { stdio: 'inherit' });
fs.renameSync(tmpWav, at('vo.wav'));
const fillWords = gaps.map(g => g.fill && g.fill.words ? JSON.parse(fs.readFileSync(at(g.fill.words), 'utf8')).words : []);
fs.writeFileSync(at('vo.json'), JSON.stringify(PZ.shiftVo(JSON.parse(fs.readFileSync(voJson, 'utf8')), gaps, fillWords)));
console.log(`pauses: → ${path.relative(process.cwd(), out)}, vo.wav, vo.json (point project.js → source at '${P.pauses.out}')`);
