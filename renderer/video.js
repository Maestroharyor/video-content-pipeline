/* FFmpeg encoders. Every encoder appends a cloned hold of the final frame (cfg.hold seconds).
   Frames are captured at cfg.scale (renderer/project.js RES), so the PNGs are already cfg.outWidth x cfg.outHeight; the scale filter
   below is then only the RGB → BT.709 conversion (swscale would otherwise use the BT.601 matrix, which players misread on HD/4K). */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const run = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const holdFilter = cfg => `tpad=stop_mode=clone:stop_duration=${cfg.hold}`;
const input = (dir, cfg) => ['-framerate', String(cfg.fps), '-i', path.join(dir, '%04d.png')];

const outSize = cfg => [cfg.outWidth || cfg.width, cfg.outHeight || cfg.height];
/* RGB frames → tagged BT.709 limited-range YUV at the output size (a no-op resize when the capture is already that size).
   setparams stamps primaries/transfer on the frames: the encoder takes them from the graph, not from the -color_* options. */
const toYuv = (cfg, fmt = 'yuv420p', div = 1) => { const [w, h] = outSize(cfg); return `scale=${w / div}:${h / div}:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=${fmt},setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv`; };
const COLOR = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];

/* The size budget. crf stays the quality target; this is only the ceiling that keeps a file of `seconds` under maxSize bytes
   (3% slack for the container and VBV overshoot). Flat slide graphics sit far below it; it exists so long videos cannot blow the budget. */
const MAX_RATE = 80e6, MIN_RATE = 1e6;
function bitrateCeiling(maxSize, seconds, audioBps = 0) {
  const r = (maxSize * 8 * 0.97) / Math.max(1, seconds) - audioBps;
  return Math.max(MIN_RATE, Math.min(MAX_RATE, Math.floor(r)));
}
function x264Args(cfg, seconds, audioBps = 0) {
  const r = bitrateCeiling(cfg.maxSize || 2e9, seconds, audioBps);
  return ['-c:v', 'libx264', '-crf', String(cfg.crf), '-preset', cfg.preset, '-maxrate', String(r), '-bufsize', String(2 * r), ...COLOR];
}
const frameCount = dir => fs.readdirSync(dir).filter(f => f.endsWith('.png')).length;

function mp4(dir, slug, cfg, audio) {
  const out = path.join(cfg.outputDir, 'mp4', slug + '.mp4');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const vf = `${holdFilter(cfg)},${toYuv(cfg)}`;
  const seconds = frameCount(dir) / cfg.fps + cfg.hold;
  if (audio && fs.existsSync(audio)) {
    run([...input(dir, cfg), '-i', audio, '-filter_complex', `[0:v]${vf}[v]`, '-map', '[v]', '-map', '1:a',
      ...x264Args(cfg, seconds, 160e3), '-r', String(cfg.fps),
      '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out]);
  } else {
    run([...input(dir, cfg), '-vf', vf, ...x264Args(cfg, seconds), '-r', String(cfg.fps), '-movflags', '+faststart', out]);
  }
  return out;
}
/* VP9 WebM with alpha (frames must be captured with --transparent) */
function webm(dir, slug, cfg) {
  const out = path.join(cfg.outputDir, 'webm', slug + '.webm');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  run([...input(dir, cfg), '-vf', `${holdFilter(cfg)},${toYuv(cfg, 'yuva420p')}`, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-auto-alt-ref', '0',
    '-b:v', '0', '-crf', '20', '-row-mt', '1', '-tile-columns', '2', '-cpu-used', '3', ...COLOR, '-r', String(cfg.fps), out]);
  return out;
}
/* ProRes 4444 MOV with alpha: the editing-friendly intermediate */
function mov(dir, slug, cfg) {
  const out = path.join(cfg.outputDir, 'webm', slug + '.mov');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  run([...input(dir, cfg), '-vf', `${holdFilter(cfg)},${toYuv(cfg, 'yuva444p10le')}`, '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le',
    ...COLOR, '-r', String(cfg.fps), out]);
  return out;
}
/* One-pass encode of a continuous timeline capture (no hold; the timeline already contains every second).
   o = { out, total, vo?, beds: [{file, at}], preview?, pattern?, over? }. over: A-roll footage the alpha frames are composited onto
   (scaled/cropped to the output size, cut at overEnd when given, last frame held to total). Audio: the voiceover (padded/trimmed to total)
   mixed with every bed delayed to its slide start; without a voiceover the beds alone; without either, silent.
   preview: half the (1x, see config.js) capture through the hardware encoder. */
function assembleMp4(dir, cfg, o) {
  fs.mkdirSync(path.dirname(o.out), { recursive: true });
  // alpha captures mix RGBA and RGB PNGs (Chrome drops the alpha plane on fully opaque frames, e.g. a `full` outro over footage);
  // a mid-stream format change would otherwise re-initialise the graph and reset the overlay's timestamps, so: no reinit, and
  // a scale filter first (it converts changing input formats on the fly).
  // o.range {from, to} in seconds: encode only that stretch of the timeline (frames are numbered from the timeline's start), audio cut to match
  const rg = o.range && (o.range.from || o.range.to != null) ? { from: o.range.from || 0, to: o.range.to != null ? Math.min(o.range.to, o.total) : o.total } : null;
  if (rg && o.over) throw new Error('--from/--to cannot be combined with --over');
  const total = rg ? +(rg.to - rg.from).toFixed(4) : o.total;
  const args = [...(o.over ? ['-reinit_filter', '0'] : []), '-framerate', String(cfg.fps), ...(rg ? ['-start_number', String(Math.ceil(rg.from * cfg.fps - 1e-6))] : []), '-i', path.join(dir, o.pattern || '%05d.png')];
  if (o.over) args.push('-i', o.over);
  const nv = o.over ? 2 : 1;   // video inputs before the audio ones
  const audio = [];
  if (o.vo && fs.existsSync(o.vo)) audio.push({ file: o.vo, at: 0 });
  (o.beds || []).forEach(b => { if (b.file && fs.existsSync(b.file)) audio.push(b); });
  audio.forEach(a => args.push('-i', a.file));
  const filters = [];
  const [W, H] = outSize(cfg);
  if (o.over) {
    // the footage is already YUV: only the slide layer gets the BT.709 conversion, then the composite is halved for a preview
    filters.push(`[1:v]${o.overEnd ? 'trim=end=' + o.overEnd + ',' : ''}scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},fps=${cfg.fps},tpad=stop_mode=clone:stop_duration=${o.total},setpts=PTS-STARTPTS,format=yuv420p[bg]`);
    filters.push(`[0:v]${toYuv(cfg, 'yuva444p')}[fg]`);
    filters.push(`[bg][fg]overlay=0:0:format=auto:eof_action=pass,${o.preview ? 'scale=iw/2:ih/2,' : ''}format=yuv420p,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv[v]`);
  } else filters.push(`[0:v]${toYuv(cfg, 'yuv420p', o.preview ? 2 : 1)}[v]`);
  if (audio.length) {
    const labels = audio.map((a, i) => { const l = `a${i}`; filters.push(`[${i + nv}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(a.at * 1000)}:all=1[${l}]`); return `[${l}]`; });
    const cut = rg ? `atrim=${rg.from}:${rg.to},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.04,afade=t=out:st=${Math.max(0, total - .35).toFixed(3)}:d=0.35` : `atrim=0:${o.total}`;   // a cut-out range gets short fades so it never clicks
    filters.push(`${labels.join('')}amix=inputs=${audio.length}:duration=longest:normalize=0,apad,${cut}[a]`);
  }
  args.push('-filter_complex', filters.join(';'), '-map', '[v]');
  if (audio.length) args.push('-map', '[a]', '-c:a', 'aac', '-b:a', '192k');
  if (o.preview) args.push('-c:v', 'h264_videotoolbox', '-b:v', '6M', ...COLOR);
  else args.push(...x264Args(cfg, total, audio.length ? 192e3 : 0));
  args.push('-r', String(cfg.fps), '-t', String(total), '-movflags', '+faststart', o.out);
  run(args);
  return o.out;
}
module.exports = { mp4, webm, mov, assembleMp4, holdFilter, input, bitrateCeiling, x264Args, toYuv };
