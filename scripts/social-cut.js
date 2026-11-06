#!/usr/bin/env node
/* Cut a finished video into vertical social clips, from projects/<slug>/cuts.json.
     npm run social-cut -- --project <slug> --plan                     every cut's spans snapped to speech, with lengths (no render)
     npm run social-cut -- --project <slug> --faces                    find the talking-head windows (mean luma) → cuts.json "faces"
     npm run social-cut -- --project <slug> --cut <name|all> [--preview] [--force]
   Output: renders/social/<cut>/<slug>-<cut>[-preview].mp4 (+ .srt), 1080x1920 at the project's fps, ending on a 4s
   "watch the full video on YouTube" card with the video's own thumbnail.

   cuts.json: { source (the published 16:9 master), deck (the horizontal project whose slides, cue sheet and timeline the
                cut's deck is built from), words (that voiceover force-aligned by scripts/align.py, VO time),
                splice {at, head} | null, thumb, ytTitle, ytUrl,
                faces [[a,b,x?]] (master time; x = the face's centre as a fraction of the width when it is not 0.5),
                screen + screens [[a,b,{code:[x,y,w,h], web:[x,y,w,h], label?}]] (a screencast with no face: `screen` is
                the raw recording, windows are VO time, the rects are its editor and browser regions in source px; each
                window shows the editor over the browser, see PANES, under an optional section label; or `full: [x,y,w,h]`,
                one region at its own aspect), capsY (the caption band's top, default 1560: under the slides, which end by 1480; one line ends ~1658),
                progress (true: a thin bar along the top fills over the cut),
                dry [[a,b]] (VO time, with `screen`: the recording's own audio there, no deck sound effect),
                mute [[a,b]] (VO time: silent and uncaptioned, to hold footage past a line's last word),
                overFace [slide ids] (those slides drawn over the face instead of replaced by it: each is captured on its
                own with alpha, timed to the cut, and laid over the talking head; the slide styles itself for
                #stage.transparent, e.g. the hook's stat cards under the face),
                reveals ("open" default | "all" | "off": a cut whose first moment falls in one of the deck's
                PROJECT.reveals windows opens on the face, so a network's auto cover is the speaker; that window joins
                `faces` and its over slides join overFace, laid out for 9:16 by base.css. "all" does it for every reveal
                window, "off" for none. Splits and the CTA window are never taken: neither fits a 9:16 crop),
                minDeck (seconds, default 2.5: a deck stretch between two face windows is never shorter; the face shot
                before it ends earlier, so no slide flickers between face shots; window edges on an edit cut, never dissolve),
                facePush (default 0.06: each face shot eases in by this fraction over its length; 0 holds it still),
                openFace (seconds, default 10: the opening face shot hands over to the full deck on the slide boundary
                nearest this; 0 keeps the whole window),
                stack (optional: a STACKED cut, for a deck whose slides have no 9:16 layout. No deck is built: `source`
                (the deck-only master) shows through a window that follows the action, over a strip of the speaker
                from the clean A-roll. {face (A-roll on the VO clock), faceX, strip [y0,y1] (fractions of its height),
                deckAspect (4:3), deckY, faceY, faceH, plate}. Passes 1 and 2 become stackSource; pass 3 is the same),
                faceSource (optional: the clean A-roll on the VO clock; the face windows are cropped from it instead of
                from the master, whose face windows may be splits or carry the 16:9 cards),
                audio (optional: another master with the same splice to take the sound from, e.g. the deck-only master
                when the reveal master's CTA sting would play under a span with no subscribe bar on screen),
                cuts: [{name, hook, spans [[from,to]], next? (a parts series: the end card's "Next: …" line),
                        labels? [[a,b,text,y]] (cut seconds: a chip at stage y, e.g. bridging a jump between spans)}] }
   Spans are VO time ("this line .. the next line"), snapped to word edges (renderer/socialcut.js). The master is cut by
   the same spans moved past its spliced intro, so the sting and the end screen never appear in a cut.

   The audio is cut first and the deck is built for it, never cut out of a finished deck (a deck timed to the full
   voiceover jumps, freezes or starts half-built at every edit). Each render is three passes:
     1. deck.mp4: the source deck's slides that the cut keeps, re-timed to the cut (SC.cutTimeline: windows tile the
        cut, every beat re-anchored to the cut's own words), rendered on this project's vertical grid, no captions
     2. source.mp4: deck.mp4 with the master's talking-head windows dissolved in full-bleed (a 9:16 crop centred on the
        face) and the master's audio, 40ms fades at every join
     3. `assemble --over source.mp4`: slides/990-hook.js (the hook band) + burned-in captions from the cut's own words,
        then slides/991-endcard.js with the end-screen sting.
   timeline.json / vo.json / captions.json at the project root are rewritten by every pass. */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawn } = require('child_process');
const { projectDir } = require('../renderer/project');
const { buildCaptions, srt } = require('../renderer/captions');
const { parseCueSheet, buildTimeline, slidesFromRows } = require('../renderer/timeline');
const SC = require('../renderer/socialcut');
const { run: deliver } = require('../renderer/deliver');

const a = process.argv.slice(2), val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const CARD = 4;                // the "watch the full video" end card after the last word
const MAX = 140 - CARD;        // 2:20 is the cap for the whole file, card included
// the cut's footage is built at the project's output size: vertical 1080p 1080x1920, 2k 1440x2560
const OUT = { '1080p': [1080, 1920], '2k': [1440, 2560], '4k': [2160, 3840] };
let W = 1080, H = 1920;
const CAPS_Y = 1560;           // the caption band, low under the frame's content and clear of the speaker's face: a one-line box ends ~1658, below the phone safe zone's 1500 (the user's call, 2026-10-10, to give the slides room); decks end every slide by 1480 (grid safe.b)
let srcCrf = 14;              // the source pass never encodes looser than the project's own crf (PROJECT.crf)
let capsY = CAPS_Y;            // cuts.json "capsY" moves it (and the screen panes' floor) up, into a phone's safe zone
const fmt = t => `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`;
const ffmpeg = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const COLOR = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
const even = x => 2 * Math.round(x / 2);

/* where assemble left its file: a --preview draft goes to renders/previews/ (renderer/config.js previewDir), a master to renders/final/ */
const assembled = (dir, slug, tag) => path.join(dir, 'renders', tag ? 'previews' : 'final', `${slug}${tag}.mp4`);
function loadSpec(dir) {
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'cuts.json'), 'utf8'));
  const words = JSON.parse(fs.readFileSync(path.resolve(dir, spec.words), 'utf8')).words;
  return { spec, words, source: path.resolve(dir, spec.source), deck: path.resolve(dir, spec.deck), audio: spec.audio ? path.resolve(dir, spec.audio) : null };
}
function probe(file) {
  const [w, h, dur] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'csv=p=0:s=,', file])
    .toString().trim().split(/[\n,]/).filter(Boolean).map(Number);
  return { w, h, dur };
}

/* VO spans → snapped VO spans → master spans laid out in cut time. `words` must be force-aligned (scripts/align.py):
   whisper's own word times drift up to ~0.6s, and a cut placed from them clips the word it meant to keep */
function resolveCut(spec, words, cut) {
  const vo = cut.spans.map(([f, t]) => SC.snapSpan(words, f, t));
  const master = vo.flatMap(s => SC.masterSpans(s, spec.splice));
  return { vo, master, laid: SC.layout(master), length: SC.cutLength(master) };
}

function plan(dir) {
  const { spec, words } = loadSpec(dir);
  let bad = 0;
  for (const cut of spec.cuts) {
    const r = resolveCut(spec, words, cut);
    const over = r.length > MAX;
    bad += over;
    console.log(`\n${cut.name}  ${fmt(r.length)} + ${CARD}s card = ${fmt(r.length + CARD)}  (${r.vo.length - 1} edit${r.vo.length === 2 ? '' : 's'})${over ? `  ⚠ OVER ${MAX}s of content` : ''}`);
    for (const s of r.vo) {
      const txt = words.filter(w => w.e > s.from + 0.05 && w.s < s.to - 0.05).map(w => w.w).join(' ');   // whisper's edges are loose, the span's are measured
      console.log(`  ${fmt(s.from)}-${fmt(s.to)}  ${(s.to - s.from).toFixed(1).padStart(5)}s  ${txt.length > 110 ? txt.slice(0, 50) + ' … ' + txt.slice(-55) : txt}`);
    }
  }
  if (bad) process.exitCode = 1;
}

/* mean luma per frame at 30fps over the whole master → talking-head windows (master time) into cuts.json */
function faces(dir) {
  const { spec, source } = loadSpec(dir);
  const FPS = 30, N = 64 * 36;   // every output frame: a window edge found at 5fps could be 0.2s off and show a face in the slide layout
  return new Promise((ok, fail) => {
    const p = spawn('ffmpeg', ['-v', 'error', '-i', source, '-an', '-vf', `fps=${FPS},scale=64:36:flags=area,format=gray`, '-f', 'rawvideo', '-']);
    const means = []; let buf = Buffer.alloc(0);
    p.stdout.on('data', d => {
      buf = Buffer.concat([buf, d]);
      while (buf.length >= N) { let m = 0; for (let k = 0; k < N; k++) m += buf[k]; means.push(m / N); buf = buf.subarray(N); }
    });
    p.on('close', code => {
      if (code) return fail(new Error('ffmpeg luma pass failed'));
      // a crop centre set by hand on an old window (third value) carries over to the new window it overlaps
      const old = spec.faces || [];
      // 95, not the helper's default 70: the talking head reads ~113-135 and the decks ~17-25, and 70 fires half way
      // through the original's deck-to-face fade, so a window would open on a frame that is still half slide
      spec.faces = SC.facesFromLuma(means, FPS, 95).map(([x, y]) => { const o = old.find(w => w[2] != null && w[0] < y && w[1] > x); return o ? [x, y, o[2]] : [x, y]; });
      // only the "faces" key is rewritten: the rest of cuts.json is hand-formatted and stays as it was
      const f = path.join(dir, 'cuts.json'), raw = fs.readFileSync(f, 'utf8');
      const line = `"faces": [${spec.faces.map(w => `[${w.join(', ')}]`).join(', ')}]`;
      fs.writeFileSync(f, /"faces":\s*\[[\s\S]*?\]\s*\]|"faces":\s*\[\s*\]/.test(raw) ? raw.replace(/"faces":\s*\[[\s\S]*?\]\s*\]|"faces":\s*\[\s*\]/, line) : raw.replace(/\n}\s*$/, `,\n  ${line}\n}\n`));
      console.log(`${spec.faces.length} face windows → ${path.relative(process.cwd(), f)}`);
      spec.faces.forEach(([x, y]) => console.log(`  ${fmt(x)}-${fmt(y)}  ${(y - x).toFixed(1)}s`));
      ok();
    });
  });
}

/* 2. the cut's footage + audio: the cut's own deck for the picture, master spans for the face windows and the voice */
/* A screen window's area in stage px (1080x1920): the editor over the browser, edge to edge, 24px apart, the editor at
   most 600 tall and the browser taking the rest, the pair centred between y 300 and the caption band at 1600. The top
   300 keeps the section label (core/social/hook.js) inside the phone's safe zone, which starts at ~220 */
/* the panes fill from y 300 down to just above the caption band. A window with `full` instead shows that one region
   (the whole recording, for a browser view that splitting would only confuse) at its own aspect, centred in the area */
const PANES = { area: { x: 0, y: 300, w: 1080 }, gap: 24, maxH: 600, floor: 20 };
const screenFits = (rect, z) => {
  const A = PANES.area, box = { x: A.x * z, y: A.y * z, w: A.w * z, h: (capsY - PANES.floor - A.y) * z };
  return rect.full ? [SC.paneFit(rect.full, box)] : SC.stackPanes(rect.code, rect.web, box, PANES.gap * z, PANES.maxH * z);
};
/* One screencast pane for one screen window: the recording's pieces (VO time; several when the window runs across an
   edit) cropped to the pane's region, scaled to its fitted size and joined. Silent; the window's fades are added where
   it is overlaid. */
function paneClip(file, pieces, f, fps, out) {
  const ins = [], parts = [];
  pieces.forEach((pc, j) => {
    ins.push('-ss', String(pc.vo), '-t', pc.len.toFixed(3), '-an', '-i', file);
    parts.push(`[${j}:v]fps=${fps},setpts=PTS-STARTPTS,crop=${f.crop.join(':')},scale=${f.w}:${f.h}:flags=lanczos,setsar=1[c${j}]`);
  });
  parts.push(pieces.map((_, j) => `[c${j}]`).join('') + `concat=n=${pieces.length}:v=1:a=0[v]`);
  ffmpeg([...ins, '-filter_complex', parts.join(';'), '-map', '[v]', '-c:v', 'libx264', '-preset', 'fast', '-crf', '12', '-pix_fmt', 'yuv420p', ...COLOR, out]);
}
function buildSource(deck, source, r, faceWins, out, fps, screen, mute, audio, overs, facePush, faceSrc) {
  const inputs = ['-i', deck], parts = [`[0:v]fps=${fps},setpts=PTS-STARTPTS,scale=${W}:${H},setsar=1[dv]`], m = r.laid.length;
  const nIn = () => inputs.filter(x => x === '-i').length;
  r.laid.forEach((s, j) => {
    const i = nIn(), d = (s.to - s.from).toFixed(3);
    inputs.push('-ss', String(s.from), '-t', d, '-i', source);
    // the sound from `audio` when cuts.json names one (same master clock, so the same span)
    const ai = audio ? nIn() : i;
    if (audio) inputs.push('-ss', String(s.from), '-t', d, '-vn', '-i', audio);
    // setsar=1: a chunked master (scripts/dual-render.js) can flag its SAR differently per chunk (0:1 vs 4096:4095 on
    // ai-concepts) and concat refuses mismatched inputs; the pixels are square either way
    parts.push(`[${i}:v]fps=${fps},setpts=PTS-STARTPTS,setsar=1[m${j}]`, `[${ai}:a]asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st=${(d - 0.04).toFixed(3)}:d=0.04[a${j}]`);
  });
  /* cuts.json "faceSource": the speaker from the clean A-roll (VO clock, cut by the VO spans) rather than from the
     master, whose face windows can be splits or carry its own cards */
  let faceIn = 'mv';
  if (faceSrc && faceWins.length) {
    const k0 = nIn();
    r.vo.forEach((s, j) => { inputs.push('-ss', String(s.from), '-t', (s.to - s.from).toFixed(3), '-an', '-i', faceSrc);
      parts.push(`[${k0 + j}:v]fps=${fps},setpts=PTS-STARTPTS,setsar=1[fa${j}]`); });
    faceIn = 'fsrc';
  }
  const S = probe(faceSrc || source), cw = even(S.h * 9 / 16), n = faceWins.length;
  parts.push(r.laid.map((_, j) => `[m${j}][a${j}]`).join('') + `concat=n=${m}:v=1:a=1[mv][ma]`);
  /* the speaker, one overlay per face window: its own 9:16 crop centred on the face, dissolving in and out over 0.25s
     through alpha fades, and switched on only inside its window. A blend over the whole cut evaluated a per-pixel
     expression on every frame and took ~1.5h for the comeback best-of; this touches only the face frames. */
  /* the screencast, for a recording with no face (cuts.json "screens"): the raw recording cut by the same VO spans (its
     clock is VO time, no splice), and per window the editor region and the browser region each fitted into its pane */
  let base = 'dv', aOut = 'ma';
  if (screen && screen.wins.length) {
    const sw = screen.wins, z = W / 1080, vl = SC.layout(r.vo);
    /* each pane is its own clip, cut straight from the recording first (paneClip), then overlaid as an independent
       input. Building the panes inside this graph (the whole recording concatenated, split four ways, trimmed per
       window) deadlocked ffmpeg 9 at the first window's start: overlay held the deck's frames waiting for a pane
       whose frames sat behind the same split (mcp-server-tutorial, 9 Oct). */
    sw.forEach(([a, b, rect], k) => {
      const len = b - a, d = Math.min(0.25, len / 2).toFixed(3);
      const fits = screenFits(rect, z);
      // the window in VO time: one piece per span it covers (a window can run across an edit)
      const pieces = vl.map(s => { const pa = Math.max(a, s.at), pb = Math.min(b, s.at + s.to - s.from); return pb > pa ? { vo: s.from + pa - s.at, len: pb - pa } : null; }).filter(Boolean);
      fits.forEach((f, q) => {
        const pane = q ? 'web' : 'code', clip = path.join(path.dirname(out), `.pane${k}-${pane}.mp4`);
        paneClip(screen.file, pieces, f, fps, clip);
        const i = inputs.filter(x => x === '-i').length, o = `p${k}${pane}`;
        inputs.push('-i', clip);
        parts.push(`[${i}:v]setpts=PTS-STARTPTS,format=yuva420p,fade=t=in:st=0:d=${d}:alpha=1,fade=t=out:st=${(len - d).toFixed(3)}:d=${d}:alpha=1,setpts=PTS+${a}/TB[${o}]`);
        parts.push(`[${base}][${o}]overlay=${f.x}:${f.y}:eof_action=pass:enable='between(t,${a},${b})'[q${k}${pane}]`);
        base = `q${k}${pane}`;
      });
    });
    /* cuts.json "dry": inside these windows the audio is the raw recording's, i.e. the voice without the deck's sound
       effects (the master's voice IS the recording's audio, so the swap is seamless). For an effect timed to a card the
       cut does not show. Audio only: the recording's picture comes from the pane clips above */
    const dry = screen.dry || [];
    if (dry.length) {
      const k0 = inputs.filter(x => x === '-i').length;
      r.vo.forEach((s, j) => {
        const dd = (s.to - s.from).toFixed(3);
        inputs.push('-ss', String(s.from), '-t', dd, '-vn', '-i', screen.file);
        parts.push(`[${k0 + j}:a]asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,afade=t=in:d=0.04,afade=t=out:st=${(dd - 0.04).toFixed(3)}:d=0.04[ra${j}]`);
      });
      const on = dry.map(([x, y]) => `between(t,${x},${y})`).join('+');
      parts.push(r.vo.map((_, j) => `[ra${j}]`).join('') + `concat=n=${r.vo.length}:v=0:a=1[rau]`,
        `[ma]aformat=sample_rates=48000:channel_layouts=stereo,volume=0:enable='${on}'[maq]`, `[rau]volume=0:enable='not(${on})'[raq]`,
        '[maq][raq]amix=inputs=2:duration=first:normalize=0[mx]');
      aOut = 'mx';
    }
  }
  if (!n) parts.push('[mv]nullsink', `[${base}]null[vb]`);
  else {
    /* one more output than there are windows, drained into a nullsink: concat emits the master's picture and sound in
       step, so once the last window's trim has closed its branch nothing reads [mv] and [ma] stops too. With one face
       window early in the cut (mobile-frameworks-2026, 9 Oct) ffmpeg span at 100% CPU forever after it */
    if (faceIn === 'fsrc') parts.push(r.vo.map((_, j) => `[fa${j}]`).join('') + `concat=n=${r.vo.length}:v=1:a=0[fsrc]`, '[mv]nullsink');
    parts.push(`[${faceIn}]split=${n + 1}${faceWins.map((_, k) => `[s${k}]`).join('')}[sk]`, '[sk]nullsink');
    /* a window edge on an edit cuts: the master jumps there anyway, and a dissolve would show the deck's leftover
       slide for a moment (ai-can-clone-apps, preview 1: "frames only show for a split second") */
    const edge = t => r.laid.some(s => Math.abs(s.at - t) < 0.05 || Math.abs(s.at + s.to - s.from - t) < 0.05);
    faceWins.forEach(([a, b, x], k) => {
      const len = b - a, d = Math.min(0.25, len / 2).toFixed(3), fin = a > 0.05 && !edge(a), fout = !edge(b);
      /* cuts.json facePush (default 0.06): the shot eases in by that much over its length (a slow push keeps a long
         talking-head stretch moving; ai-can-clone-apps: "add any other improvements"), centred on the crop */
      const push = facePush > 0 ? `scale=w='${W}*(1+${facePush}*t/${len.toFixed(3)})':h=-2:eval=frame:flags=bicubic,crop=${W}:${H},` : '';
      parts.push(`[s${k}]trim=start=${a}:end=${b},setpts=PTS-STARTPTS,crop=${cw}:ih:${SC.faceCropPx(x, S.w, cw)}:0,scale=${W}:${H}:flags=lanczos,${push}setsar=1,`
        + `format=yuva420p,${fin ? `fade=t=in:st=0:d=${d}:alpha=1,` : ''}${fout ? `fade=t=out:st=${(len - d).toFixed(3)}:d=${d}:alpha=1,` : ''}setpts=PTS+${a}/TB[f${k}]`);   // a cut that opens on the face shows it from frame 0
      parts.push(`[${k ? `o${k - 1}` : base}][f${k}]overlay=eof_action=pass:enable='between(t,${a},${b})'${k === n - 1 ? '[vb]' : `[o${k}]`}`);
    });
  }
  // overFace: each slide's alpha clip over the picture so far, inside its own window of the cut
  let top = 'vb';
  (overs || []).forEach((ov, k) => {
    const i = nIn();
    inputs.push('-i', ov.file);
    parts.push(`[${i}:v]fps=${fps},scale=${W}:${H},setsar=1,format=yuva420p,setpts=PTS-STARTPTS+${ov.start != null ? ov.start : ov.at}/TB[ov${k}]`,
      `[${top}][ov${k}]overlay=eof_action=pass:enable='between(t,${ov.at},${ov.to})'[ox${k}]`);
    top = `ox${k}`;
  });
  parts.push(`[${top}]format=yuv420p[v]`);
  // cuts.json "mute": silence, for footage held past the last word (the result of an edit landing after the line)
  if (mute && mute.length) { parts.push(`[${aOut}]volume=0:enable='${mute.map(([a, b]) => `between(t,${a},${b})`).join('+')}'[mu]`); aOut = 'mu'; }
  ffmpeg([...inputs, '-filter_complex', parts.join(';'), '-map', '[v]', '-map', `[${aOut}]`,
    '-c:v', 'libx264', '-preset', 'fast', '-crf', String(srcCrf), '-pix_fmt', 'yuv420p', ...COLOR, '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', out]);
}

/* The deck's motion in cut time, for the following window: per analysis frame (4 fps, 192x108 grey), how many pixels
   changed in each column since the frame before (null at a span's first frame, where the picture jumps). Small
   changes (the ground's drift, a caret blink) stay under the threshold. Cached per cut on its spans. */
const MOTION = { fps: 4, w: 192, h: 108, thr: 12 };
function motionTrack(source, laid, cache) {
  const key = JSON.stringify({ laid: laid.map(s => [s.from, s.to]), m: MOTION, src: fs.statSync(source).mtimeMs });
  if (fs.existsSync(cache)) { const c = JSON.parse(fs.readFileSync(cache, 'utf8')); if (c.key === key) return c.E; }
  const { fps, w, h, thr } = MOTION, E = [];
  for (const s of laid) {
    const raw = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-ss', String(s.from), '-t', (s.to - s.from).toFixed(3), '-an', '-i', source,
      '-vf', `fps=${fps},scale=${w}:${h},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
    const n = Math.floor(raw.length / (w * h)), want = Math.round((s.to - s.from) * fps);
    for (let k = 0; k < want; k++) {
      const q = Math.min(k, n - 1);
      if (k === 0 || q < 1) { E.push(null); continue; }
      const col = new Array(w).fill(0), a = (q - 1) * w * h, b = q * w * h;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Math.abs(raw[b + y * w + x] - raw[a + y * w + x]) > thr) col[x]++;
      E.push(col);
    }
  }
  fs.writeFileSync(cache, JSON.stringify({ key, E }));
  return E;
}

/* A stacked cut: no deck is built. The finished 16:9 deck master (cuts.json "source", deck only), cut by the cut's
   spans, shows through a window of `deckAspect` (4:3 by default) that follows the action (SC.followCrop: it jumps at an
   edit, glides at a slide boundary and holds still otherwise), at y `deckY`; under it a strip of the speaker from the
   clean A-roll (`face`, on the VO clock) at y `faceY`, `faceH` tall, framed on `faceX` and the band `strip` of the
   frame's height; plate `plate` behind. A cut that opens in one of the deck's face windows opens on the full-frame face
   (a 9:16 crop of the A-roll) for about cuts.json "openFace" seconds, ending on the slide boundary nearest it, then
   dissolves into the stack. The sound is the deck master's (voice + sound effects). */
function stackSource({ spec, dir, deck, r, fps, work, tag, src, t0, revWins, force }) {
  const st = spec.stack, source = path.resolve(dir, spec.source), face = path.resolve(dir, st.face);
  const S = probe(source), F = probe(face), total = r.length;
  const aspect = st.deckAspect || 4 / 3, cw = Math.min(S.w, even(S.h * aspect)), dh = even(W / aspect), deckY = st.deckY != null ? st.deckY : 220;
  const faceY = st.faceY != null ? st.faceY : deckY + dh + 10, faceH = even(st.faceH || 500);
  const [sy0, sy1] = st.strip || [0.1, 0.75], sh = even((sy1 - sy0) * F.h), sw = Math.min(F.w, even(sh * W / faceH));
  const sx = Math.round(Math.min(Math.max((st.faceX || 0.5) * F.w - sw / 2, 0), F.w - sw)), sy = Math.round(sy0 * F.h);
  // slide boundaries (the deck's own timeline, VO time) in cut time: the window re-decides there
  const own = JSON.parse(fs.readFileSync(path.join(deck, 'timeline.json'), 'utf8')).slides;
  const joins = r.laid.slice(1).map(s => s.at);
  const slideCuts = own.map(e => SC.toCut(SC.toMaster(e.start, spec.splice), r.laid)).filter(t => t != null && t > 0.3 && t < total - 0.3 && !joins.some(j => Math.abs(j - t) < 0.3));
  const bounds = [...joins.map(t => [t, 'cut']), ...slideCuts.map(t => [t, 'glide'])];
  const E = motionTrack(source, r.laid, path.join(work, '.motion.json'));
  const keys = SC.followCrop(E, MOTION.fps, total, bounds, { win: cw / S.w });
  const x = SC.cropExpr(keys, S.w - cw);
  // the opening face shot: the reveal window the cut opens in, handed over on the slide boundary nearest openFace
  const openFace = spec.openFace == null ? 10 : spec.openFace, opens = revWins.some(([a, b]) => t0 >= a - 0.05 && t0 < b);
  let openEnd = 0;
  if (opens && openFace) {
    const win = revWins.find(([a, b]) => t0 >= a - 0.05 && t0 < b), endCut = SC.toCut(Math.min(win[1], r.laid[0].to) - 0.001, r.laid) || openFace;
    // the deck panel is the finished master, so the hand-over need not wait for a slide boundary: one within 3s of
    // openFace is taken, otherwise openFace itself (a 25s hook slide held the face for all 25s)
    const cands = slideCuts.filter(t => t > 1 && t <= endCut + 0.01 && Math.abs(t - openFace) <= 3);
    openEnd = cands.length ? cands.reduce((m, t) => (Math.abs(t - openFace) < Math.abs(m - openFace) ? t : m)) : Math.min(openFace, endCut);
  }
  const stamp = JSON.stringify({ laid: r.laid, vo: r.vo, keys, openEnd, st, fps, srcCrf, W, H, src: fs.statSync(source).mtimeMs });
  const stampFile = path.join(work, `.source${tag}.json`);
  if (!force && fs.existsSync(src) && fs.existsSync(stampFile) && fs.readFileSync(stampFile, 'utf8') === stamp) return;
  console.log(`stack ${path.basename(work)}: ${r.laid.length} span(s), ${keys.length} framing key(s), opening face ${openEnd ? openEnd.toFixed(2) + 's' : 'none'}`);
  const inputs = [], parts = [];
  r.laid.forEach((s, j) => {
    const d = (s.to - s.from).toFixed(3);
    inputs.push('-ss', String(s.from), '-t', d, '-i', source);
    parts.push(`[${j}:v]fps=${fps},setpts=PTS-STARTPTS,setsar=1[m${j}]`, `[${j}:a]asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st=${(d - 0.04).toFixed(3)}:d=0.04[a${j}]`);
  });
  const k0 = r.laid.length;
  r.vo.forEach((s, j) => {
    inputs.push('-ss', String(s.from), '-t', (s.to - s.from).toFixed(3), '-an', '-i', face);
    parts.push(`[${k0 + j}:v]fps=${fps},setpts=PTS-STARTPTS,setsar=1[f${j}]`);
  });
  parts.push(r.laid.map((_, j) => `[m${j}][a${j}]`).join('') + `concat=n=${r.laid.length}:v=1:a=1[mv][ma]`);
  parts.push(r.vo.map((_, j) => `[f${j}]`).join('') + `concat=n=${r.vo.length}:v=1:a=0[fv]`);
  parts.push(`[mv]crop=w=${cw}:h=${S.h}:x='${x}':y=0,scale=${W}:${dh}:flags=lanczos,setsar=1[dp]`);
  parts.push(`color=c=${st.plate || '0x0A0F1C'}:s=${W}x${H}:r=${fps}:d=${total.toFixed(3)}[bg]`);
  parts.push(`[fv]split=2[fa][fb]`, `[fa]crop=${sw}:${sh}:${sx}:${sy},scale=${W}:${faceH}:flags=lanczos,setsar=1[fs]`);
  parts.push(`[bg][dp]overlay=0:${deckY}:eof_action=pass[o1]`, `[o1][fs]overlay=0:${faceY}:eof_action=pass[o2]`);
  if (openEnd) {
    const fw = even(F.h * W / H), fx = SC.faceCropPx(st.faceX, F.w, fw), d = 0.3;
    parts.push(`[fb]trim=end=${(openEnd + d).toFixed(3)},setpts=PTS-STARTPTS,crop=${fw}:${F.h}:${fx}:0,scale=${W}:${H}:flags=lanczos,setsar=1,format=yuva420p,fade=t=out:st=${openEnd.toFixed(3)}:d=${d}:alpha=1[ff]`,
      `[o2][ff]overlay=eof_action=pass:enable='lte(t,${(openEnd + d).toFixed(3)})',format=yuv420p[v]`);
  } else parts.push('[fb]nullsink', '[o2]format=yuv420p[v]');
  ffmpeg([...inputs, '-filter_complex', parts.join(';'), '-map', '[v]', '-map', '[ma]', '-t', total.toFixed(3),
    '-c:v', 'libx264', '-preset', 'fast', '-crf', String(srcCrf), '-pix_fmt', 'yuv420p', ...COLOR, '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', src]);
  fs.writeFileSync(stampFile, stamp);
}

/* 1. the deck for this cut: the source deck's slide windows and beats rebuilt on the aligned words (its own timeline.json
   was timed on whisper's, which drift up to 0.6s), then cut down and re-timed to the cut by SC.cutTimeline */
function deckTimeline(deckDir, words, r, cutWords, fps, minKeep) {
  const rows = parseCueSheet(fs.readFileSync(path.join(deckDir, 'cue-sheet.md'), 'utf8'));
  const own = JSON.parse(fs.readFileSync(path.join(deckDir, 'timeline.json'), 'utf8'));
  const base = buildTimeline({ slides: slidesFromRows(rows), rows, vo: { words, duration: words[words.length - 1].e }, fps, xf: own.xf, motion: own.motion, lead: own.lead });
  // what only the slide files know (a per-slide transition, an audio bed's motion) comes from the deck's own timeline
  base.slides.forEach(e => { const o = own.slides.find(x => x.id === e.id); if (o) for (const k of ['xf', 'motion', 'audio']) if (o[k] != null) e[k] = o[k]; });
  // cuts.json "minKeep": seconds a source slide must keep to stay in a cut; raise it when a part opens on the previous
  // slide's closing line, which otherwise shows that slide for a beat before the part's own first slide
  return SC.cutTimeline({ tl: base, rows, laid: SC.layout(r.vo), words: cutWords, total: r.length, minKeep });
}
const assemble = (slug, extra) => execFileSync('node', [path.join(__dirname, '..', 'renderer', 'assemble.js'), '--project', slug, ...extra], { stdio: 'inherit' });
const writeJson = (f, o, pretty) => fs.writeFileSync(f, JSON.stringify(o, null, pretty ? 1 : 0) + '\n');

async function render(dir, cutName, o) {
  const { spec, words, source, deck, audio } = loadSpec(dir);
  capsY = spec.capsY || CAPS_Y;
  const cut = spec.cuts.find(c => c.name === cutName);
  if (!cut) throw new Error(`no cut "${cutName}" (have: ${spec.cuts.map(c => c.name).join(', ')})`);
  if (!fs.existsSync(path.join(deck, 'cue-sheet.md'))) throw new Error(`deck project not found: ${spec.deck} (cuts.json "deck" is the horizontal project)`);
  const P = JSON.parse(execFileSync('node', ['-e', `global.window={};require(${JSON.stringify(path.join(dir, 'project.js'))});console.log(JSON.stringify(window.PROJECT))`]).toString());
  [W, H] = OUT[P.resolution] || OUT['1080p'];
  srcCrf = Math.min(14, P.crf == null ? 14 : P.crf);
  const fps = P.fps || 30, slug = P.slug || path.basename(dir);   // P.slug: a nested projects/<video>/social is named for its video
  const r = resolveCut(spec, words, cut);
  if (r.length > MAX) throw new Error(`${cut.name} is ${fmt(r.length)}, over ${MAX}s`);
  const work = path.join(dir, 'renders', 'social', cut.name);
  fs.mkdirSync(work, { recursive: true });

  /* a cut opens on the face when its master does there: the deck's reveal window (PROJECT.reveals) that holds the
     cut's first moment joins the face windows, with its over slides drawn on the face (1b), so the first frame (the
     cover a network picks) is the speaker. cuts.json "reveals": "all" takes every reveal window, "off" none. */
  const Pd = JSON.parse(execFileSync('node', ['-e', `global.window={};require(${JSON.stringify(path.join(deck, 'project.js'))});console.log(JSON.stringify(window.PROJECT))`]).toString());
  /* a deck with one set of windows per look (PROJECT.revealSets, e.g. ai-can-clone-apps) names the master's look in
     cuts.json "revealSet" */
  if (!Pd.reveals && Pd.revealSets) Pd.reveals = Pd.revealSets[spec.revealSet] || Object.values(Pd.revealSets)[0];
  const t0 = r.master[0].from, rv = spec.reveals || 'open';
  const revWins = rv === 'off' ? [] : SC.revealFaces(Pd.reveals, spec.splice, Pd.cta).filter(([a, b]) => rv === 'all' || (t0 >= a - 0.05 && t0 < b));
  const revVo = (Pd.reveals || []).filter(w => revWins.some(([a]) => Math.abs(a - SC.toMaster(w.at, spec.splice)) < 0.001));
  // a face shot the cut keeps less than a second of would only flash past at an edit
  let faceWins = SC.widenDeckGaps(SC.mapWindows(SC.mergeFaces(spec.faces, revWins), r.laid).filter(([a, b]) => b - a >= 1), spec.minDeck);
  // screen windows are authored in VO time (the recording's own clock), so they map over the VO spans, not the master's
  const screenWins = SC.mapWindows(spec.screens || [], SC.layout(r.vo)).filter(([a, b]) => b - a >= 1);
  const dryWins = SC.mapWindows(spec.dry || [], SC.layout(r.vo));
  const screen = spec.screens ? { file: path.resolve(dir, spec.screen), wins: screenWins, dry: dryWins } : null;
  const muteVo = spec.mute || [], muteWins = SC.mapWindows(muteVo, SC.layout(r.vo));
  // a muted word is neither heard nor captioned
  const cutWords = SC.cutWords(words.filter(w => !muteVo.some(([a, b]) => w.s >= a && w.s < b)), spec.splice, r.laid);
  const vo = { version: 1, audio: null, duration: r.length, language: 'en', words: cutWords };
  writeJson(path.join(dir, 'vo.json'), vo);
  const tag = o.preview ? '-preview' : '';

  /* a stacked cut (cuts.json "stack") is not built from the deck: the finished 16:9 deck master, cut by the same spans,
     shows through a 4:3 window that follows the action, over the speaker from the clean A-roll (stackSource) */
  let src = path.join(work, `source${tag}.mp4`);
  if (spec.stack) stackSource({ spec, dir, deck, r, fps, work, tag, src, t0, revWins, force: o.force });
  else {
    // 1. the deck, built for this cut
    const { tl: deckTl, issues } = deckTimeline(deck, words, r, cutWords, fps, cut.minKeep);
    /* the opening face shot is the cover, not the hook: it holds about cuts.json "openFace" seconds (default 10, 0 = the
       whole window) and hands over to the full-frame deck on the slide boundary nearest that, so no slide changes layout
       mid-build; the deck and the face then alternate on the face windows as usual */
    const openFace = spec.openFace == null ? 10 : spec.openFace;
    if (openFace && faceWins.length && faceWins[0][0] < 0.05) {
      const cuts = deckTl.slides.map(e => e.start).filter(t => t > 1 && t < faceWins[0][1]);
      if (cuts.length) faceWins[0] = [faceWins[0][0], cuts.reduce((m, t) => Math.abs(t - openFace) < Math.abs(m - openFace) ? t : m), ...faceWins[0].slice(2)];
    }
    const deckFile = path.join(work, `deck${tag}.mp4`), deckStamp = path.join(work, `.deck${tag}.json`), dStamp = JSON.stringify(deckTl);
    if (o.force || !fs.existsSync(deckFile) || !fs.existsSync(deckStamp) || fs.readFileSync(deckStamp, 'utf8') !== dStamp) {
      console.log(`deck ${cut.name}: ${deckTl.slides.length} slide(s) re-timed to the cut${issues.length ? `, ${issues.length} beat(s) on the fraction fallback (words cut)` : ''}`);
      writeJson(path.join(dir, 'timeline.json'), deckTl, true);
      assemble(dir, ['--captions', 'off', '--no-audio', ...(o.preview ? ['--preview'] : [])]);
      fs.renameSync(assembled(dir, slug, tag), deckFile);
      fs.writeFileSync(deckStamp, dStamp);
    }

    // 1b. overFace: those slides alone, with alpha, on the cut's timeline (still in timeline.json from step 1)
    writeJson(path.join(dir, 'timeline.json'), deckTl, true);
    const own = JSON.parse(fs.readFileSync(path.join(deck, 'timeline.json'), 'utf8')).slides;
    const overIds = [...new Set([...(spec.overFace || []).map(id => 's' + String(id).replace(/^s/, '')), ...SC.overSlides(revVo, own)])];
    const overs = overIds.map(id => {
      const e = deckTl.slides.find(x => x.id === id);
      if (!e) return null;
      const pieces = SC.clampOvers(e.start, e.end, faceWins);   // only where the face is behind it; elsewhere the deck pass has the slide
      if (!pieces.length) return null;
      const log = execFileSync('node', [path.join(__dirname, '..', 'renderer', 'cli.js'), '--project', dir, '--slide', e.slug, '--format', 'mov',
        // no captions in this layer (pass 3 burns them in once); --force: the clip cache keys on the timeline, not the CSS
        '--transparent', '--timed', '--captions', 'off', '--force', ...(o.preview ? ['--preview'] : [])]).toString();
      // a fresh capture prints its path; a cached one is already where renderer/video.js mov() puts it (renders/webm)
      const m = log.match(/->\s+(\S+\.mov)/);
      const file = m ? path.resolve(path.join(__dirname, '..'), m[1]) : path.join(dir, 'renders', 'webm', `${e.slug}.mov`);
      if (!fs.existsSync(file)) throw new Error(`overFace ${id}: no alpha clip at ${file}`);
      return pieces.map(([at, to]) => ({ file, start: e.start, at, to, m: fs.statSync(file).mtimeMs }));
    }).filter(Boolean).flat();

    // 2. the talking head and the voice over it
    src = path.join(work, `source${tag}.mp4`);
    const facePush = spec.facePush != null ? spec.facePush : 0.06;
    const stamp = JSON.stringify({ faceSrc: spec.faceSource || null, vo: r.vo, laid: r.laid, faceWins, screenWins, dryWins, muteWins, source, audio, overs, deck: fs.statSync(deckFile).mtimeMs, fps, srcCrf, facePush });
    const stampFile = path.join(work, `.source${tag}.json`);
    if (o.force || !fs.existsSync(src) || !fs.existsSync(stampFile) || fs.readFileSync(stampFile, 'utf8') !== stamp) {
      console.log(`source ${cut.name}: ${r.vo.length} span(s), ${faceWins.length} face window(s), ${screenWins.length} screen window(s), ${fmt(r.length)}`);
      buildSource(deckFile, source, r, faceWins, src, fps, screen, muteWins, audio, overs, facePush, spec.faceSource ? path.resolve(dir, spec.faceSource) : null);
      fs.writeFileSync(stampFile, stamp);
    }
  }
  const total = +probe(src).dur.toFixed(3);

  // 3. the text layer: hook band, captions, end card
  const tl = { version: 1, fps, total: +(total + CARD).toFixed(3), vo: path.relative(dir, src), xf: { type: 'cut', dur: 0 }, motion: total, subset: true,
    slides: [{ id: 's990', slug: '990-hook', start: 0, end: total }, { id: 's991', slug: '991-endcard', start: total, end: +(total + CARD).toFixed(3) }],
    social: { hook: cut.hook, ytTitle: spec.ytTitle, ytUrl: spec.ytUrl, total, progress: !!spec.progress, next: cut.next || null,
      // a screen window's `label` sits centred 76px above its editor pane (stage px)
      // plus the cut's own labels [[a, b, text, y]] in cut seconds: a chip bridging a jump between spans
      labels: screenWins.filter(w => w[2].label).map(([a, b, rect]) => [a, b, rect.label, screenFits(rect, 1)[0].y - 76]).concat(cut.labels || []) } };
  writeJson(path.join(dir, 'timeline.json'), tl, true);
  writeJson(path.join(dir, 'vo.json'), { ...vo, audio: path.relative(dir, src), duration: total });
  // every edit is a caption break: one word left before an edit ("workspaces.") never pairs with the next clip's first words
  const caps = buildCaptions(vo, { accent: 't', y: capsY }, { cuts: r.laid.slice(1).map(s => s.at) });
  caps.groups.forEach(g => { g.end = Math.min(g.end, total); });   // a caption's linger never reaches onto the end card
  fs.writeFileSync(path.join(dir, 'captions.json'), JSON.stringify(caps) + '\n');

  assemble(dir, ['--over', src, ...(o.preview ? ['--preview'] : [])]);
  const out = path.join(work, `${slug}-${cut.name}${tag}.mp4`);
  fs.renameSync(assembled(dir, slug, tag), out);
  fs.writeFileSync(out.replace(/\.mp4$/, '.srt'), srt(caps.groups));
  console.log(`→ ${path.relative(process.cwd(), out)}  ${fmt(total + CARD)}`);
  /* the user (2026-11-04): "once you're done with the main render, delete the preview". The cut's draft, its
     deck/source drafts and their cache stamps go once the full cut is written */
  if (!o.preview) for (const f of [`${slug}-${cut.name}-preview.mp4`, `${slug}-${cut.name}-preview.srt`, 'deck-preview.mp4', 'source-preview.mp4', '.deck-preview.json', '.source-preview.json']) {
    const p = path.join(work, f);
    if (fs.existsSync(p)) { fs.rmSync(p); console.log(`  removed preview ${path.relative(process.cwd(), p)}`); }
  }
  if (!o.preview) deliver(dir);
}

async function main() {
  const dir = projectDir(val('--project') || val('-p'));
  if (a.includes('--plan')) return plan(dir);
  if (a.includes('--faces')) return faces(dir);
  const cutArg = val('--cut');
  if (!cutArg) throw new Error('pass --plan, --faces, or --cut <name|all>');
  const { spec } = loadSpec(dir);
  const cuts = cutArg === 'all' ? spec.cuts.map(c => c.name) : cutArg.split(',');
  for (const c of cuts) await render(dir, c, { preview: a.includes('--preview'), force: a.includes('--force') });
}
if (require.main === module) main().catch(e => { console.error(e.message || e); process.exit(1); });
