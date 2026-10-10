#!/usr/bin/env node
/* Builds projects/<slug>/assets/lf-intro-sting.wav (or sting.json's `out`) from projects/<slug>/assets/sting.json: {dur, out?, cues: [{s, t, v?, f?, d?}]}.
   Run from the repo root: node assets/logos/lifetechfacts/build-sting.js <slug>. Cue times (seconds) follow the slide's beat map.
   Sounds: tick (key click) · type (a run of key clicks, d seconds) · blip (sine ping, f Hz) · thump (sub hit) · rise (noise swell of d seconds ending at t + d) ·
           whoosh (the project's Mixkit file) · pop / shim (assets/audio, own recordings) ·
           sample (any wav in this project's assets, or an absolute path, named by f — for sounds a channel supplied rather than ones we synthesise).
   v = volume, 1 = that sound's default level. Peak is held at -6 dB, or spec.limit (linear) when a cue list carries music (alimiter, level=disabled so it does not
   normalise), and the last `fade` seconds fade out (0.5 unless the spec shortens it, which a ringing tail wants). */
const { execFileSync } = require('child_process'), fs = require('fs'), path = require('path');
const slug = process.argv[2]; if (!slug) { console.error('usage: build-sting.js <project-slug>'); process.exit(1); }
const P = path.join('projects', slug, 'assets'), spec = JSON.parse(fs.readFileSync(path.join(P, 'sting.json'), 'utf8')), dur = spec.dur || 4, OUT = path.join(P, spec.out || 'lf-intro-sting.wav');
const fade = spec.fade == null ? .5 : spec.fade;
const lavfi = src => ['-f', 'lavfi', '-i', src], file = f => ['-i', f];
const SOUND = {
  tick: c => ({ in: lavfi(`anoisesrc=c=white:r=48000:d=0.018:a=0.5:seed=${Math.round(c.t * 1000)}`), fx: 'highpass=f=2500,lowpass=f=7000,afade=t=out:st=0.004:d=0.014', v: .5 }),
  blip: c => ({ in: lavfi(`aevalsrc='0.22*sin(2*PI*${c.f || 880}*t)*exp(-${c.k || 22}*t)':s=48000:d=${c.d || .22}`), v: 1 }),
  thump: c => ({ in: lavfi(`aevalsrc='0.55*sin(2*PI*${c.f || 56}*t)*exp(-7*t)':s=48000:d=0.9`), v: 1 }),
  rise: c => ({ in: lavfi(`anoisesrc=c=pink:r=48000:d=${c.d || .6}:a=0.5:seed=7`), fx: `highpass=f=400,lowpass=f=${c.f || 3000},afade=t=in:st=0:d=${c.d || .6}:curve=exp,afade=t=out:st=${(c.d || .6) - .03}:d=0.03`, v: .5 }),
  whoosh: () => ({ in: file(path.join(P, 'mixkit-arrow-whoosh-1491.wav')), v: .7 }),
  // typing: short noise clicks every 78ms for d seconds (a deterministic expression, so every build is identical)
  type: c => ({ in: lavfi(`aevalsrc='0.35*(random(0)*2-1)*lt(mod(t\\,0.078)\\,0.011)':s=48000:d=${c.d || .5}`), fx: 'highpass=f=2000,lowpass=f=8000', v: .5 }),
  pop: () => ({ in: file('assets/audio/pop.wav'), v: .45 }),
  // boop: a short upward pitch bend, the sound of a sticker landing
  boop: c => ({ in: lavfi(`aevalsrc='0.3*sin(2*PI*(${c.f || 420}*t+${c.k || 1800}*t*t))*exp(-16*t)':s=48000:d=0.24`), fx: 'afade=t=in:st=0:d=0.006', v: 1 }),
  shim: () => ({ in: file('assets/audio/shim.wav'), v: .55 }),
  /* the wider palette (scripts/sfx.js maps beats to these by what the element does, so a deck is not all pops) */
  // pluck: a tuned pop with one overtone; chains step it up a pentatonic scale, so a list climbs instead of repeating
  pluck: c => ({ in: lavfi(`aevalsrc='0.26*(sin(2*PI*${c.f || 660}*t)+0.35*sin(4*PI*${c.f || 660}*t))*exp(-${c.k || 26}*t)':s=48000:d=0.3`), fx: 'afade=t=in:st=0:d=0.004', v: 1 }),
  // swish: a short band-passed noise sweep, for strikes, lines drawing and highlighters
  swish: c => ({ in: lavfi(`anoisesrc=c=pink:r=48000:d=${c.d || .26}:a=0.6:seed=${Math.round(c.t * 1000) % 9973}`),
    fx: `highpass=f=${c.f || 1400},lowpass=f=7000,afade=t=in:st=0:d=${((c.d || .26) * .55).toFixed(3)}:curve=exp,afade=t=out:st=${((c.d || .26) * .55).toFixed(3)}:d=${((c.d || .26) * .45).toFixed(3)}`, v: .55 }),
  // tap: a soft card landing, a low body plus a dull click
  tap: c => ({ in: lavfi(`aevalsrc='0.42*sin(2*PI*${c.f || 150}*t)*exp(-22*t)+0.12*(random(0)*2-1)*exp(-120*t)':s=48000:d=0.25`), fx: 'lowpass=f=3500', v: 1 }),
  // chime: two bell partials, for a survivor or a good-news panel
  chime: c => ({ in: lavfi(`aevalsrc='0.16*(sin(2*PI*${c.f || 1046}*t)+0.6*sin(2*PI*${(c.f || 1046) * 1.5}*t)+0.3*sin(2*PI*${(c.f || 1046) * 2.76}*t))*exp(-3.2*t)':s=48000:d=1.3`), fx: 'afade=t=in:st=0:d=0.005', v: 1 }),
  // clock: one tick of a wall clock (call it repeatedly for a countdown)
  clock: c => ({ in: lavfi(`aevalsrc='0.5*(random(0)*2-1)*exp(-260*t)+0.2*sin(2*PI*${c.f || 2400}*t)*exp(-90*t)':s=48000:d=0.06`), fx: 'bandpass=f=2600:width_type=q:w=1.2', v: 1 }),
  // glitch: crushed noise with a stutter, layered on a stamp or a shutdown
  glitch: c => ({ in: lavfi(`anoisesrc=c=white:r=48000:d=0.22:a=0.5:seed=${Math.round(c.t * 1000) % 9973}`),
    fx: 'acrusher=bits=4:samples=24:mix=1,tremolo=f=28:d=0.9,lowpass=f=5000,afade=t=out:st=0.12:d=0.1', v: .5 }),
  // drop: a falling tone, for something that ends or dims out
  drop: c => ({ in: lavfi(`aevalsrc='0.3*sin(2*PI*(${c.f || 620}*t-${(c.f || 620) * .7}*t*t))*exp(-2.6*t)':s=48000:d=0.7`), fx: 'afade=t=in:st=0:d=0.01', v: 1 }),
  // f is relative to the project's assets (sfx.js outroBed writes ../../../assets/audio/…), or absolute
  /* fadeIn: seconds. d + fadeOut: stop the sample after d seconds, fading out over its last fadeOut seconds (an outro
     shorter than its music would otherwise be cut off mid-bar when the track ends at spec.dur) */
  sample: c => {
    const f = path.resolve(P, c.f || ''); if (!fs.existsSync(f)) throw new Error('sample not found: ' + f);
    const fx = [c.fadeIn ? `afade=t=in:st=0:d=${c.fadeIn}` : '', c.d ? `atrim=0:${c.d}` : '', c.d && c.fadeOut ? `afade=t=out:st=${Math.max(0, c.d - c.fadeOut).toFixed(3)}:d=${c.fadeOut}` : ''].filter(Boolean).join(',');
    return { in: file(f), v: 1, fx: fx || undefined };
  },
};
/* Each cue is rendered on its own (a few ms apiece) and summed here, then one ffmpeg pass applies the limiter and
   fade. A single amix over a couple of hundred delayed inputs ran slower than real time (a 206-cue, 9-minute effects
   track sat for 20+ minutes); summing samples is the same mix without that cost. */
const SR = 48000, total = Math.round(dur * SR), sum = new Float32Array(total * 2);
const names = spec.cues;
spec.cues.forEach(c => {
  if (!SOUND[c.s]) throw new Error('unknown sound "' + c.s + '" in ' + slug); const s = SOUND[c.s](c);
  const af = `aresample=${SR},${s.fx ? s.fx + ',' : ''}aformat=channel_layouts=stereo,volume=${(s.v * (c.v == null ? 1 : c.v)).toFixed(3)}`;
  const raw = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...s.in, '-af', af, '-f', 'f32le', '-ac', '2', '-ar', String(SR), 'pipe:1'], { maxBuffer: 1 << 28 });
  const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4), at = Math.round(c.t * SR) * 2;
  for (let i = 0; i < x.length && at + i < sum.length; i++) if (at + i >= 0) sum[at + i] += x[i];
});
const tmp = OUT + '.f32';
fs.writeFileSync(tmp, Buffer.from(sum.buffer));
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', tmp,
  '-af', `alimiter=limit=${spec.limit || 0.5}:level=disabled${fade > 0 ? `,afade=t=out:st=${(dur - fade).toFixed(3)}:d=${fade}` : ''}`, '-ar', String(SR), '-c:a', 'pcm_s16le', OUT], { stdio: 'inherit' });
fs.rmSync(tmp, { force: true });
console.log('sting', slug, names.length + ' cues →', OUT);
