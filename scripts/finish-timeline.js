#!/usr/bin/env node
/* Post-step for this deck's timeline.json, run after `npm run timeline`:
     1. clamp the last slide to the source footage runtime (the builder extends the final row to fit the outro's
        motion + hold, which would leave the deck running past the audio and past the footage in version B);
     2. cross-fade the joins between consecutive slides that share a full-frame template — hop/anatomy/tree keep the
        same diagram on screen, and a push transition would slide the whole thing off and back on every few seconds.
   npm run timeline:finish -- --project <slug> [--end 488.333] */
const fs = require('fs');
const path = require('path');
const { parseCueSheet } = require('../renderer/timeline');
const { projectDir } = require('../renderer/project');
const FULL = new Set(['hop', 'anatomy', 'tree']);
const a = process.argv.slice(2), get = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };

const dir = projectDir(get('--project'));
const tlFile = path.join(dir, 'timeline.json');
const tl = JSON.parse(fs.readFileSync(tlFile, 'utf8'));
const rows = parseCueSheet(fs.readFileSync(path.join(dir, 'cue-sheet.md'), 'utf8'));
const end = +get('--end', rows.length ? rows[rows.length - 1].window.end : 0);
if (!(end > 0)) throw new Error('no end time (pass --end seconds)');

const last = tl.slides[tl.slides.length - 1], was = last.end;
if (last.start >= end) throw new Error(`last slide starts at ${last.start}s, after the clamp at ${end}s`);
last.end = end;

let faded = 0;
tl.slides.forEach((e, i) => {
  if (!i) return;
  const t = rows[i] && rows[i].template, p = rows[i - 1] && rows[i - 1].template;
  if (t && t === p && FULL.has(t)) { e.xf = 'fade'; e.xfDur = 0.3; faded++; }
});
fs.writeFileSync(tlFile, JSON.stringify(tl, null, 2) + '\n');
console.log(`timeline:finish ${path.basename(dir)}: last slide ${was}s → ${end}s, ${faded} join(s) cross-faded`);
