#!/usr/bin/env node
/* Render one capture into two finished videos:
     A  renders/final/<slug>.mp4          the deck, full frame, for the whole runtime
     B  renders/final/<slug>-reveal.mp4   the same deck composited onto the source footage, fading out inside
                                          PROJECT.reveals so the speaker's face shows, then fading back

     npm run dual -- --project <slug> [--chunk 20] [--jobs N] [--preset fast] [--only a|b] [--resume]
                     [--source file] [--captions off] [--reveals <set>] [--preview]

   --preview is the review draft that comes BEFORE the master: half size at 30fps, minutes instead of hours, and
   unlike `npm run assemble --preview` it still splices the intro and the end screen, so what you watch is the
   shape of the finished video. It writes <slug>-preview.mp4 into its own work dir; the master's name and chunks
   are untouched, so the two never overwrite each other.

   PROJECT.revealSets = {name: [...]} holds several cuts of the same deck (how much of the speaker's face the
   video shows); --reveals <name> picks one, and that name keys both the chunk work dirs and B's filename, so
   two cuts never share a chunk file and --resume stays correct per cut. PROJECT.reveals is the single unnamed
   cut and still works unchanged.

   Why this exists instead of `npm run assemble --over`: at 3840x2160 the whole timeline is ~29,300 PNGs (~90 GB), and
   assemble's --over mode cannot be combined with --from/--to, so it cannot be chunked. This walks the timeline in
   chunks, encodes BOTH versions from the same PNGs, deletes them, and concatenates the chunks with stream copy —
   peak disk stays a few GB, each version is encoded exactly once, and B costs almost nothing extra:

   A reveal is cut into three chunks so every alpha ramp is self-contained (chained ffmpeg `fade` filters multiply,
   which would blank the overlay everywhere before the first reveal):
     [at-in, at)  mode 'out'   deck fades to transparent      [at, to) mode 'none'  footage only, no deck at all
     [to, to+out) mode 'in'    deck fades back in             everything else mode 'full'
   A reveal with `over: true` keeps the deck on inside [at, to) instead (mode 'over'): captured on alpha and laid over
   the footage at full opacity, for slides that draw only a card (projects/nue-js-runtime). Adding `split: {x, zoom}`
   makes it a side-by-side window: the face third on the left, the deck's own plate on the right two thirds
   (projects/mobile-frameworks-2026).
   In a 'full' chunk the deck is opaque and covers the frame, so B is byte-identical to A and simply reuses A's chunk.

   Burned-in captions live on the stage (#caps), so the ramp fades them out with everything else and a 'none'
   chunk has no deck at all. When the deck carries captions, every non-'full' chunk therefore gets a second,
   caption-only alpha capture (renderer/browser.js `capsOnly`) composited back on top at full opacity, so the
   captions stay readable over the face. Inside a ramp the deck's own fading copy sits directly behind an
   identical opaque one, so there is nothing to see. 'full' chunks are untouched. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { resolve } = require('../renderer/config');
const { parseArgs } = require('../renderer/args');
const { defaultInject, openDeck } = require('../renderer/browser');
const { defaultJobs } = require('../renderer/pool');
const { captureTimeline } = require('../renderer/assemble');
const { loadTimeline, validateTimeline } = require('../renderer/timeline');
const { bitrateCeiling, toYuv } = require('../renderer/video');
const TL = require('../core/timeline');

const run = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const COLOR = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
const probeDur = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();
const r3 = x => Math.round(x * 1000) / 1000;
// a leading ~ lets project.js name clips outside the repo without baking in one machine's home folder
const untilde = f => f.replace(/^~(?=$|[\\/])/, os.homedir());
/* one stream's fields, as an object */
function probeStream(f, kind, fields) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', kind, '-show_entries', 'stream=' + fields.join(','), '-of', 'default=nw=1:nk=0', f]).toString();
  const o = {}; out.trim().split('\n').forEach(l => { const i = l.indexOf('='); if (i > 0) o[l.slice(0, i)] = l.slice(i + 1); });
  return o;
}

/* version B's effects track goes silent wherever the deck is gone (mode 'none': the face alone), so a pop or a
   whoosh never plays over a frame with nothing on it. Returns an ffmpeg `enable` expression in the part's own time
   (a = the part's start in deck seconds), or null when no such chunk falls inside [a, b). */
function muteExpr(chunks, a, b) {
  const r = chunks.filter(c => c.mode === 'none' && c.t1 > a && c.t0 < b)
    .map(c => `between(t,${r3(Math.max(0, c.t0 - a))},${r3(Math.min(b, c.t1) - a)})`);
  return r.length ? r.join('+') : null;
}

/* every chunk boundary, with reveal ramps kept whole */
function plan(total, chunk, reveals, fps, forced) {
  // ?? not ||: `out: 0` is how a reveal says "run the footage straight into the splice", and || turned it into .45
  const spans = reveals.map(r => ({ a: r.at - (r.in ?? .45), b: r.to + (r.out ?? .45), at: r.at, to: r.to, over: !!r.over, split: r.split || null }));
  spans.sort((x, y) => x.a - y.a);
  spans.forEach((s, i) => { if (i && s.a < spans[i - 1].b) throw new Error(`reveals overlap near ${s.at}s`); });
  const cuts = new Set([0, total]);
  // a splice point or a CTA window has to land on a chunk boundary, or it would fall inside an encoded chunk
  (forced || []).forEach(v => { if (v > 0 && v < total) cuts.add(r3(v)); });
  for (let t = chunk; t < total; t += chunk) if (!spans.some(s => t > s.a && t < s.b)) cuts.add(r3(t));
  spans.forEach(s => { [s.a, s.at, s.to, s.b].forEach(v => { if (v > 0 && v < total) cuts.add(r3(v)); }); });
  const bs = [...cuts].sort((x, y) => x - y);
  const out = [];
  for (let i = 0; i < bs.length - 1; i++) {
    const a = bs[i], b = bs[i + 1], mid = (a + b) / 2;
    const s = spans.find(v => mid > v.a && mid < v.b);
    const mode = !s ? 'full' : mid < s.at ? 'out' : mid < s.to ? (s.over ? 'over' : 'none') : 'in';
    const f0 = Math.round(a * fps), f1 = Math.round(b * fps);
    if (f1 > f0) out.push({ i: out.length, t0: a, t1: b, f0, f1, n: f1 - f0, mode, split: mode === 'over' && s.split ? s.split : null });
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = resolve(args);
  const P = cfg.project;
  // a relative PROJECT.source is relative to the project, not to wherever npm was run from
  const source = args.source ? path.resolve(untilde(args.source))
    : P.source ? path.resolve(cfg.projectDir, untilde(P.source)) : null;
  if (!source || !fs.existsSync(source)) throw new Error('source footage not found (project.js → source, or --source): ' + source);
  const tl = loadTimeline(cfg.projectDir);
  if (!tl) throw new Error('no timeline.json — run: npm run timeline -- --project ' + cfg.slug);

  /* Which cut of the deck this run builds. With revealSets, the set name is always carried into the output
     name: `<slug>-reveal.mp4` alone would not say which cut it is. */
  const sets = P.revealSets || null;
  if (args.reveals && !sets) throw new Error('--reveals needs PROJECT.revealSets in project.js');
  const setName = sets ? (args.reveals || Object.keys(sets)[0]) : null;
  if (setName && !sets[setName]) throw new Error(`unknown reveal set "${setName}"; project.js has: ${Object.keys(sets).join(', ')}`);
  const reveals = setName ? sets[setName] : (P.reveals || []);
  const setTag = setName ? '-' + setName : '';
  if (setName) console.log(`  reveals: set "${setName}" — ${reveals.length} window(s)${args.reveals ? '' : ' (default; --reveals picks another)'}`);

  const inject = defaultInject(cfg);
  inject.TIMELINE = tl;
  /* Captions follow the project (defaultInject only adds them when PROJECT.captions.on), and `--captions off`
     drops them for a run. This used to delete them unconditionally, which was invisible on the deck it was
     written for (dns-resolution renders with captions off and splices its .srt separately) but silently shipped
     a captions-on deck with an empty caption band. */
  if (args.captions === 'off') delete inject.CAPTIONS;
  if (inject.CAPTIONS) console.log(`  captions: burning ${inject.CAPTIONS.groups ? inject.CAPTIONS.groups.length : ''} caption group(s) into both masters`);
  const probe = await openDeck(cfg, { inject });
  await probe.browser.close();
  if (probe.errors.length) throw new Error(probe.errors.join('\n'));
  validateTimeline(tl, probe.slides).forEach(w => console.warn('  warn', w));
  const L = TL.layout(probe.slides, tl, { hold: cfg.hold });
  /* The ramp fades the whole captured frame, plate included, so a ramp that brings the deck back inside a slide's
     push-exit renders it at plateAlpha x (1-out)^3: the outgoing slide swims up out of the footage and is then
     replaced by the next one. Reveal edges and slide windows are both snapped to voice lines, so they collide
     unless the return is put on the boundary itself. Leaving is fine to overlap: both are on their way out. */
  reveals.forEach(r => L.forEach(e => {
    if (e.xfOut > 0 && r.to < e.end && r.to + (r.out ?? .45) > e.end - e.xfOut)
      console.warn(`  warn reveal returning at ${r.to}s lands inside ${e.id}'s exit (${r3(e.end - e.xfOut)}-${e.end}s):` +
        ` move it to a slide boundary, or that slide fades up just before it is replaced`);
  }));
  const total = r3(TL.total(L));
  const srcDur = probeDur(source);
  if (Math.abs(total - srcDur) > 0.05) console.warn(`  ! deck is ${total}s but the footage is ${r3(srcDur)}s — version B will not line up`);

  const fps = cfg.fps, [W, H] = [cfg.outWidth, cfg.outHeight];
  /* PROJECT.splice = {at, head, tail}: a clip spliced in at `at` seconds and/or appended at the end.
     PROJECT.cta = {file, at, to, sfx?, sfxAt?, gain?, sting?, stingGain?}: a transparent clip composited over
     version B inside that window, plus an optional sound effect mixed into BOTH masters at sfxAt (default at), and
     an optional `sting` mixed into version B only at `at` (the clip's own sound, when version A shows no clip
     there). (Version A draws the same thing on a slide, so it needs nothing here). Both need their edges on a
     chunk boundary. */
  const inProj = f => path.resolve(cfg.projectDir, untilde(f));
  const sp = P.splice || null, cta = P.cta || null;
  const forced = [];
  if (sp && sp.at != null) forced.push(r3(sp.at));
  if (cta) { forced.push(r3(cta.at), r3(cta.to)); }
  let chunks = plan(total, args.chunk || 20, reveals, fps, forced);
  // --limit N renders only the first N chunks, into <slug>-part.mp4: a cheap end-to-end check before the full run
  const limit = args.limit ? +args.limit : 0;
  if (limit) chunks = chunks.slice(0, limit);
  const partial = !!limit;
  const only = args.only ? String(args.only).toLowerCase() : null;
  const preset = args.preset || cfg.preset;
  const rate = bitrateCeiling(cfg.maxSize, total, 192e3);
  const x264 = ['-c:v', 'libx264', '-crf', String(cfg.crf), '-preset', preset, '-maxrate', String(rate), '-bufsize', String(2 * rate),
    '-g', String(2 * fps), '-keyint_min', String(2 * fps), '-sc_threshold', '0', '-x264-params', 'open-gop=0', ...COLOR, '-r', String(fps), '-an'];

  /* keyed by the set: two cuts have different chunk boundaries, so chunk 7 of one is not chunk 7 of the other.
     Also keyed by --preview: a draft's chunks are 1920x1080 at 30fps, and a later --resume at full resolution
     would concatenate them into the master without noticing the size change. */
  /* args.preview, not cfg.preview: renderer/config.js consumes `preview` to pick the 1x scale and 30fps but
     never copies the flag onto the cfg it returns, so cfg.preview is always undefined here. Reading it meant
     previewTag was always '' — a draft was captured at preview size and then written to the master's filename
     and the master's chunk dir, which is exactly what the comment above and at the concat step forbid.
     assemble.js and video.js were never affected: they read the flag from their own args/options. */
  const previewTag = args.preview ? '-preview' : '';
  const work = path.join(cfg.frameDir, 'dual' + setTag + previewTag);
  const dirA = path.join(work, 'A'), dirB = path.join(work, 'B'), frames = path.join(work, 'frames');
  const framesCaps = path.join(work, 'caps');
  const wantCaps = !!inject.CAPTIONS;
  [work, dirA, dirB].forEach(d => fs.mkdirSync(d, { recursive: true }));
  const pad = n => String(n).padStart(4, '0');

  console.log(`dual ${cfg.slug}: ${W}x${H} @ ${fps}fps, crf ${cfg.crf} ${preset}, ceiling ${(rate / 1e6).toFixed(1)} Mbps`);
  console.log(`dual ${cfg.slug}: ${total}s = ${Math.round(total * fps)} frames in ${chunks.length} chunk(s); ` +
    `${chunks.filter(c => c.mode !== 'full').length} reveal chunk(s) get their own B encode, the rest reuse A`);

  const t0 = Date.now();
  for (const c of chunks) {
    const fa = path.join(dirA, pad(c.i) + '.mp4'), fb = path.join(dirB, pad(c.i) + '.mp4');
    /* --only b never encodes A outside 'full' chunks, so it must not capture deck frames for them either: a reveal's
       'none' window (a 12-minute screen recording under one placeholder slide) cost ~20 minutes of capture for nothing. */
    const needA = !(args.resume && fs.existsSync(fa)) && (only !== 'b' || c.mode === 'full');
    const isCta = !!(cta && c.t0 >= cta.at && c.t1 <= cta.to);
    const needB = (c.mode !== 'full' || isCta) && !(args.resume && fs.existsSync(fb));
    if (!needA && !needB) { console.log(`  chunk ${c.i + 1}/${chunks.length} ${c.mode} — cached`); continue; }

    // 'none' chunks show only footage: no deck frames are needed for B, but A still needs them
    const needFrames = needA || (needB && c.mode !== 'none' && c.mode !== 'over' && !isCta);   // 'over' captures its own alpha frames
    if (needFrames) {
      fs.rmSync(frames, { recursive: true, force: true });
      await captureTimeline(cfg, L, { dir: frames, jobs: args.jobs || defaultJobs(), inject, from: c.t0, to: c.t1 });
    }
    /* The deck's captions fade out with the deck, and a 'none' chunk has no deck at all, so B re-adds them
       from their own alpha capture. Only where the deck is not opaque, and only when it carries captions. */
    const needCaps = wantCaps && needB && c.mode !== 'full' && c.mode !== 'over' && only !== 'a';
    if (needCaps) {
      fs.rmSync(framesCaps, { recursive: true, force: true });
      await captureTimeline(cfg, L, { dir: framesCaps, jobs: args.jobs || defaultJobs(), inject, from: c.t0, to: c.t1, transparent: true, capsOnly: true });
    }
    const seq = ['-framerate', String(fps), '-start_number', String(c.f0), '-i', path.join(frames, '%05d.png')];
    const capSeq = needCaps ? ['-framerate', String(fps), '-start_number', String(c.f0), '-i', path.join(framesCaps, '%05d.png')] : [];
    // a 'full' chunk's B is a copy of A, so --only b still has to encode A there
    if (needA && (only !== 'b' || c.mode === 'full')) run([...seq, '-frames:v', String(c.n), '-vf', toYuv(cfg), ...x264, fa]);
    if (needB && only !== 'a') {
      /* Seek by frame index, not by the chunk's nominal seconds. A boundary like 483.24s is 28994.4 frames, so
         `-ss 483.24` lands past frame 28994 and the chunk comes out one frame short of the c.n the deck side
         produced. c.f0/c.n are the authority: every chunk covers exactly the frames between its two boundaries. */
      const ss = r3(c.f0 / fps), dur = r3(c.n / fps);
      /* PROJECT.sourceFit 'contain' letterboxes footage that is not 16:9 instead of cropping it: a 3916x2160 screen
         recording loses ~38px per side to the default cover crop, which cuts into an editor's activity bar
         (projects/tailwind-motion). The default stays 'cover', so every existing project renders as before. */
      const fit = P.sourceFit === 'contain'
        ? `scale=${W}:${H}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`
        : `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H}`;
      const bg = `[${c.mode === 'none' ? 0 : 1}:v]${fit},fps=${fps},setpts=PTS-STARTPTS[bg]`;
      const tail = `format=yuv420p,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv[v]`;
      const onCta = cta && c.t0 >= cta.at && c.t1 <= cta.to;
      if (onCta && c.mode !== 'none') throw new Error(`cta window ${cta.at}-${cta.to}s overlaps a deck chunk (mode ${c.mode}); it must sit inside a reveal`);
      /* The caption layer goes on last, at full opacity. It is the branch's final input, so its index is just
         however many inputs came before it. capsOver() closes the graph: without captions the branch's last
         filter runs straight into `tail`; with them it is labelled, and the captions are overlaid on it. */
      const capsOver = ci => needCaps
        ? `[dk];[${ci}:v]${toYuv(cfg, 'yuva444p')}[cp];[dk][cp]overlay=0:0:format=auto:eof_action=pass,${tail}`
        : `,${tail}`;
      if (onCta) {
        // footage, then the transparent CTA clip on top, seeked to this chunk's offset into it
        run(['-ss', String(ss), '-t', String(dur), '-i', source, '-ss', String(r3((c.f0 - Math.round(cta.at * fps)) / fps)), '-t', String(dur), '-i', inProj(cta.file), ...capSeq,
          '-filter_complex', `${bg};[1:v]scale=${W}:${H}:flags=lanczos,setpts=PTS-STARTPTS[ct];[bg][ct]overlay=0:0:format=auto:eof_action=pass` + capsOver(2),
          '-map', '[v]', '-frames:v', String(c.n), ...x264, fb]);
      } else if (c.mode === 'over') {
        /* `over: true` windows: the deck stays on, captured on alpha (stage background and plate cleared, captions
           included), and laid over the footage at full opacity. Slides inside them draw only what should cover the
           footage (a card), so the rest of the frame is the A-roll. A's opaque frames are replaced by this capture. */
        fs.rmSync(frames, { recursive: true, force: true });
        await captureTimeline(cfg, L, { dir: frames, jobs: args.jobs || defaultJobs(), inject, from: c.t0, to: c.t1, transparent: true });
        /* `split: {x, zoom}`: a side-by-side window. The footage is cropped to a third of the frame around the face
           (x = the face's centre as a fraction of the width) and laid on the left third; the rest is a flat plate
           colour, never more footage, or any gap in the deck's plate shows a second copy of the speaker. The deck
           draws the right two thirds. */
        const sp = c.split, third = Math.round(W / 3 / 2) * 2;
        const cw = sp && Math.round(third / (sp.zoom || 1) / 2) * 2, chh = sp && Math.round(H / (sp.zoom || 1) / 2) * 2;
        const cx = sp && Math.max(0, Math.min(W - cw, Math.round(W * sp.x - cw / 2))), cy = sp && Math.max(0, Math.min(H - chh, Math.round(H * (sp.y || 0))));
        /* split.clean: footage before this second is unusable (a transition baked into the edit), so the face panel
           holds the first clean frame until then instead of showing it; the deck's timing is untouched. */
        const hold = sp && sp.clean > ss ? r3(Math.min(sp.clean - ss, dur)) : 0;
        const base = sp
          ? `[1:v]${fit},fps=${fps},setpts=PTS-STARTPTS,${hold ? `tpad=start_duration=${hold}:start_mode=clone,` : ''}` +
            `crop=${cw}:${chh}:${cx}:${cy},scale=${third}:${H}:flags=lanczos,pad=${W}:${H}:0:0:color=0x050913[bg]`
          : bg;
        run(['-reinit_filter', '0', ...seq, '-ss', String(hold ? r3(ss + hold) : ss), '-t', String(dur), '-i', source,
          '-filter_complex', `${base};[0:v]${toYuv(cfg, 'yuva444p')}[fg];[bg][fg]overlay=0:0:format=auto:eof_action=pass,${tail}`,
          '-map', '[v]', '-frames:v', String(c.n), ...x264, fb]);
      } else if (c.mode === 'none') {
        run(['-ss', String(ss), '-t', String(dur), '-i', source, ...capSeq,
          '-filter_complex', needCaps ? `${bg};[1:v]${toYuv(cfg, 'yuva444p')}[cp];[bg][cp]overlay=0:0:format=auto:eof_action=pass,${tail}` : `${bg};[bg]${tail}`,
          '-map', '[v]', '-frames:v', String(c.n), ...x264, fb]);
      } else {
        const fade = c.mode === 'out' ? `fade=t=out:st=0:d=${dur}:alpha=1` : `fade=t=in:st=0:d=${dur}:alpha=1`;
        run(['-reinit_filter', '0', ...seq, '-ss', String(ss), '-t', String(dur), '-i', source, ...capSeq,
          '-filter_complex', `${bg};[0:v]${toYuv(cfg, 'yuva444p')},${fade}[fg];[bg][fg]overlay=0:0:format=auto:eof_action=pass` + capsOver(2),
          '-map', '[v]', '-frames:v', String(c.n), ...x264, fb]);
      }
    }
    if (c.mode === 'full' && !(cta && c.t0 >= cta.at && c.t1 <= cta.to) && only !== 'a') fs.copyFileSync(fa, fb);   // opaque deck: B is A
    fs.rmSync(frames, { recursive: true, force: true });
    fs.rmSync(framesCaps, { recursive: true, force: true });
    const done = c.i + 1, el = (Date.now() - t0) / 1000;
    console.log(`  chunk ${done}/${chunks.length} ${c.mode} ${c.t0}-${c.t1}s (${c.n}f) — ${el.toFixed(0)}s elapsed, eta ${(el / done * (chunks.length - done)).toFixed(0)}s`);
  }

  const outDir = path.join(cfg.outputDir, 'final');
  fs.mkdirSync(outDir, { recursive: true });
  /* Splicing. The chunks and the two LifeTech Facts clips are all h264 High/5.2, 3840x2160, yuv420p, 60/1, bt709,
     so the video side stream-copies through the concat demuxer. Audio does not: the clips carry 48k AAC while the
     deck renders carry the camera's rate, stream-copied from the source, and concat will not copy across a rate
     change. So the two clips are re-muxed to the source's rate once, and each part's voiceover slice is cut with
     atrim rather than -ss + copy — an AAC frame is ~23ms, so a copied cut cannot land exactly on the splice. */
  const aRate = probeStream(source, 'a:0', ['sample_rate']).sample_rate || '44100';
  const normalise = (src, tagName) => {
    if (!fs.existsSync(src)) throw new Error('splice clip not found: ' + src);
    const v = probeStream(src, 'v:0', ['width', 'height', 'pix_fmt', 'r_frame_rate']);
    const same = +v.width === W && +v.height === H && v.pix_fmt === 'yuv420p' && v.r_frame_rate === fps + '/1';
    const o = path.join(work, tagName + '.mp4');
    if (!same) console.log(`  ! ${path.basename(src)} is ${v.width}x${v.height} ${v.pix_fmt} @ ${v.r_frame_rate} — re-encoding it to match`);
    run(['-i', src, ...(same ? ['-c:v', 'copy'] : ['-vf', `scale=${W}:${H}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,${toYuv(cfg).split(',').slice(1).join(',')}`, ...x264.filter(a => a !== '-an')]),
      '-c:a', 'aac', '-b:a', '192k', '-ar', String(aRate), '-ac', '2', '-movflags', '+faststart', o]);
    return o;
  };
  /* A sound effect laid over the voiceover at an absolute timestamp. This is the only place it can go: nothing
     here calls assembleMp4, so slide `audio` beds never reach these masters — and the CTA slide must not declare
     one anyway, because renderer/timeline.js drops every beat on a slide that has one. The per-part audio step
     below already re-encodes, so mixing costs nothing extra, and both masters get it from the same file. */
  const sfx = !partial && cta && cta.sfx ? inProj(cta.sfx) : null;
  if (sfx && !fs.existsSync(sfx)) throw new Error('cta.sfx not found: ' + sfx);
  const sfxAt = sfx ? r3(cta.sfxAt != null ? cta.sfxAt : cta.at) : null;
  const sfxGain = cta && cta.gain != null ? cta.gain : 1;
  const sfxDur = sfx ? probeDur(sfx) : 0;
  const sting = !partial && cta && cta.sting ? inProj(cta.sting) : null;
  if (sting && !fs.existsSync(sting)) throw new Error('cta.sting not found: ' + sting);
  const stingGain = cta && cta.stingGain != null ? cta.stingGain : 1;   // a full-length effects track spans the splice, so every part it overlaps gets its slice
  const head = !partial && sp && sp.head ? normalise(inProj(sp.head), 'head') : null;
  const tailClip = !partial && sp && sp.tail ? normalise(inProj(sp.tail), 'tail') : null;
  const cutAt = !partial && sp && sp.at != null ? r3(sp.at) : null;

  /* previewTag in the filename too: --preview is a review draft, and a draft must never occupy the master's name.
     Without it the half-size pass writes renders/final/<slug>.mp4 and the deliverable looks finished at 960x540. */
  for (const [tag, dir, name] of [['A', dirA, cfg.slug + previewTag + (partial ? '-part' : '')],
    ['B', dirB, cfg.slug + '-reveal' + setTag + previewTag + (partial ? '-part' : '')]]) {
    if (only && only !== tag.toLowerCase()) continue;
    const groups = cutAt == null ? [chunks] : [chunks.filter(c => c.t1 <= cutAt), chunks.filter(c => c.t0 >= cutAt)];
    if (groups.some(g => !g.length)) throw new Error(`splice.at ${cutAt}s is not a chunk boundary`);
    const parts = [], scratch = [];
    if (cutAt == null && head) parts.push(head);
    groups.forEach((g, gi) => {
      const list = path.join(work, `concat-${tag}-${gi}.txt`);
      fs.writeFileSync(list, g.map(c => `file '${path.join(dir, pad(c.i) + '.mp4')}'`).join('\n') + '\n');
      const silent = path.join(work, `${tag}-${gi}-v.mp4`);
      run(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent]);
      const a = r3(g[0].f0 / fps), b = r3(g[g.length - 1].f1 / fps), part = path.join(work, `${tag}-${gi}.mp4`);
      const onSfx = sfx != null && sfxAt < b && sfxAt + sfxDur > a;
      const sfxSkip = onSfx ? Math.max(0, r3(a - sfxAt)) : 0, sfxDelay = onSfx ? Math.max(0, Math.round((sfxAt - a) * 1000)) : 0;
      /* apad: the footage can be shorter than the deck (a deck that ends on an outro card outlives the
         recording), and amix's duration=first would then cut a bed short too. Padding to the part's own
         length is a no-op when the audio already reaches the end. */
      const vo = `[1:a]atrim=${a}:${b},asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo,apad=whole_dur=${r3(b - a)}`;
      // duration=first keeps the part exactly as long as it was, so the frame-exact concat is untouched
      const mute = tag === 'B' ? muteExpr(g, a, b) : null;
      const onSting = tag === 'B' && sting != null && cta.at >= a && cta.at < b;
      const mixIn = ['[vo]'], chains = [vo + '[vo]'];
      if (onSfx) {
        chains.push(`[2:a]atrim=start=${sfxSkip},asetpts=PTS-STARTPTS,aresample=${aRate},aformat=channel_layouts=stereo,volume=${sfxGain},adelay=${sfxDelay}:all=1` +
          `${mute ? `,volume=0:enable='${mute}'` : ''}[sx]`);
        mixIn.push('[sx]');
      }
      if (onSting) {
        chains.push(`[${onSfx ? 3 : 2}:a]aresample=${aRate},aformat=channel_layouts=stereo,volume=${stingGain},adelay=${Math.round((cta.at - a) * 1000)}:all=1[st]`);
        mixIn.push('[st]');
      }
      const af = mixIn.length > 1 ? `${chains.join(';')};${mixIn.join('')}amix=inputs=${mixIn.length}:duration=first:normalize=0[a]` : `${vo}[a]`;
      run(['-i', silent, '-i', source, ...(onSfx ? ['-i', sfx] : []), ...(onSting ? ['-i', sting] : []), '-filter_complex', af,
        '-map', '0:v:0', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', String(aRate), part]);
      if (onSfx) console.log(`  + ${path.basename(sfx)} mixed at ${sfxAt}s (part ${tag}-${gi}, gain ${sfxGain}${mute ? ', muted under the face' : ''})`);
      if (onSting) console.log(`  + ${path.basename(sting)} mixed at ${cta.at}s (part B-${gi}, gain ${stingGain})`);
      fs.rmSync(silent, { force: true });
      parts.push(part); scratch.push(part);
      if (gi === 0 && cutAt != null && head) parts.push(head);
    });
    if (tailClip) parts.push(tailClip);
    const out = path.join(outDir, name + '.mp4');
    const fl = path.join(work, 'final-' + tag + '.txt');
    fs.writeFileSync(fl, parts.map(f => `file '${f}'`).join('\n') + '\n');
    run(['-f', 'concat', '-safe', '0', '-i', fl, '-c', 'copy', '-movflags', '+faststart', out]);
    scratch.forEach(f => fs.rmSync(f, { force: true }));
    const MB = (fs.statSync(out).size / 1e6).toFixed(0);
    console.log(`done ${tag} → ${path.relative(cfg.root, out)}  ${MB} MB  ${r3(probeDur(out))}s${parts.length > 1 ? ` (${parts.length} parts)` : ''}`);
  }
  console.log(`total ${((Date.now() - t0) / 1000 / 60).toFixed(1)} min`);
}
if (require.main === module) main().catch(e => { console.error(e.message || e); process.exit(1); });
module.exports = { plan, muteExpr };
