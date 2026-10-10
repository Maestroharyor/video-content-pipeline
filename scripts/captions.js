#!/usr/bin/env node
/* vo.json → captions.json (+ projects/<slug>/captions.srt and renders/final/<slug>.srt).
   captions.srt is the PRE-SPLICE subtitle master: scripts/splice-srt.js rewrites it against a render that has
   an intro or end screen concatenated in, so it has to sit next to the deck and not only in renders/final.
     npm run captions -- --project <slug> [--max-words 5] [--max-chars 22] [--gap 0.6] [--max-dur 2.5] [--accent t] [--y 1450] */
const fs = require('fs');
const path = require('path');
const { loadProject } = require('../renderer/project');
const { buildCaptions, srt } = require('../renderer/captions');
const a = process.argv.slice(2), val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
try {
  const { dir, project } = loadProject(val('--project') || val('-p'));
  const voFile = path.join(dir, 'vo.json');
  if (!fs.existsSync(voFile)) throw new Error('no vo.json in ' + dir + ' (run npm run transcribe first)');
  const vo = JSON.parse(fs.readFileSync(voFile, 'utf8'));
  const pc = project.captions || {};
  const style = { accent: val('--accent') || pc.accent || (project.brand && project.brand.accent) || 't' };
  if (val('--y') != null || pc.y != null) style.y = val('--y') != null ? +val('--y') : pc.y;
  if (pc.size) style.size = pc.size;
  const opts = {}; for (const [k, f] of [['maxWords', '--max-words'], ['maxChars', '--max-chars'], ['gap', '--gap'], ['maxDur', '--max-dur']]) if (val(f) != null) opts[k] = +val(f);
  // a caption never straddles the spliced intro: it would show words before the cut that are spoken after it
  if (project.splice && project.splice.at != null) opts.cuts = [project.splice.at];
  const caps = buildCaptions(vo, style, Object.assign({}, pc.group || {}, opts));
  fs.writeFileSync(path.join(dir, 'captions.json'), JSON.stringify(caps, null, 1).replace(/\n\s+("w"|"s"|"e")/g, ' $1').replace(/\{\s+"w"/g, '{ "w"').replace(/\s+\}/g, ' }') + '\n');
  const body = srt(caps.groups);
  fs.writeFileSync(path.join(dir, 'captions.srt'), body);
  fs.mkdirSync(path.join(dir, 'renders', 'final'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'renders', 'final', project.slug + '.srt'), body);
  console.log(`captions.json: ${caps.groups.length} groups from ${vo.words.length} words; captions.srt + renders/final/${project.slug}.srt`);
} catch (e) { console.error(e.message); process.exit(1); }
