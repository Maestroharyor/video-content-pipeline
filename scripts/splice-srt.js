#!/usr/bin/env node
/* Subtitles for a spliced master. projects/<slug>/captions.srt is the sentence-level track for the deck as it was
   timed, i.e. with no intro and no end screen. scripts/dual-render.js splices a clip in at PROJECT.splice.at and
   appends another, which pushes every later cue, so this rewrites the track against the finished files:

     npm run srt -- --project <slug>

   Reads the master every time and writes renders/final/<slug>.srt and <slug>-reveal.srt, so running it twice is
   the same as running it once. A cue that straddles the splice point is cut short at it rather than stretched
   across the inserted clip. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { resolve } = require('../renderer/config');
const { parseArgs } = require('../renderer/args');

const dur = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();
const toS = t => { const m = t.trim().match(/(\d+):(\d\d):(\d\d)[,.](\d{1,3})/); return +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000; };
const toT = s => { s = Math.max(0, s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, q = Math.floor(s) % 60;
  const ms = Math.round((s - Math.floor(s)) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(q).padStart(2, '0')},${String(ms).padStart(3, '0')}`; };

function parse(text) {
  return text.replace(/\r/g, '').trim().split(/\n\n+/).map(b => {
    const l = b.split('\n'), i = l.findIndex(x => x.includes('-->'));
    if (i < 0) return null;
    const [a, z] = l[i].split('-->');
    return { a: toS(a), z: toS(z), text: l.slice(i + 1).join('\n') };
  }).filter(Boolean);
}

function main() {
  const cfg = resolve(parseArgs(process.argv.slice(2)));
  const src = path.join(cfg.projectDir, 'captions.srt');
  if (!fs.existsSync(src)) throw new Error('no ' + path.relative(cfg.root, src) + ' (the pre-splice subtitle master)');
  const sp = cfg.project.splice || {};
  // ~ as in dual-render: project.js names the splice clips relative to the home folder
  const inProj = f => path.resolve(cfg.projectDir, f.replace(/^~(?=$|[\\/])/, os.homedir()));
  const at = sp.at != null && sp.head ? sp.at : Infinity;
  const shift = sp.head ? dur(inProj(sp.head)) : 0;

  // whisper's last segment overshoots the footage, so cues are clamped to where the voiceover actually ends
  const tl = JSON.parse(fs.readFileSync(path.join(cfg.projectDir, 'timeline.json'), 'utf8'));
  const rows = tl.slides || tl, end = rows[rows.length - 1].end;
  const cues = parse(fs.readFileSync(src, 'utf8'))
    .filter(c => c.a < end)
    .map(c => ({ ...c, z: Math.min(c.z, end) }))
    .map(c => {
      if (c.a >= at) return { ...c, a: c.a + shift, z: c.z + shift };
      return c.z > at ? { ...c, z: at } : c;                   // straddles the join: end it at the cut
    });
  const out = cues.map((c, i) => `${i + 1}\n${toT(c.a)} --> ${toT(c.z)}\n${c.text}`).join('\n\n') + '\n';

  const dir = cfg.finalDir;
  fs.mkdirSync(dir, { recursive: true });
  for (const name of [cfg.slug, cfg.slug + '-reveal']) {
    const f = path.join(dir, name + '.srt');
    fs.writeFileSync(f, out);
    console.log(`${path.relative(cfg.root, f)}: ${cues.length} cues, ${shift ? `+${shift}s after ${at}s` : 'unshifted'}`);
  }
}
if (require.main === module) { try { main(); } catch (e) { console.error(e.message || e); process.exit(1); } }
